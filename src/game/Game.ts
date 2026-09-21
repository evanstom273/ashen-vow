import { MAX_DELTA_TIME } from './constants.ts';
import { AudioManager } from './audio/AudioManager.ts';
import { getAreaForFight, getAreaSpawn } from './content/areas.ts';
import { getFightDefinition } from './content/fights.ts';
import { decayShake, spawnBurst, updateParticles } from './effects/particles.ts';
import { GameEventBus } from './events/GameEventBus.ts';
import { SceneController } from './flow/SceneController.ts';
import { InputSystem } from './input/InputSystem.ts';
import { CanvasRenderer } from './render/CanvasRenderer.ts';
import { updateBoss } from './systems/bossUpdate.ts';
import { constrainToArea, type CombatContext } from './systems/combat.ts';
import { updateHazards } from './systems/hazards.ts';
import {
	handlePlayerAction,
	releaseCast,
	updatePlayerHealing,
	updatePlayerMovement,
	updatePlayerRegen,
	updateSorceryCharge,
} from './systems/playerActions.ts';
import { updateBossEffects } from './systems/effectSystem.ts';
import { updateProjectiles } from './systems/projectiles.ts';
import { createInitialGameState, createInitialInputState, resetCombatState } from './state/createState.ts';
import { updateSpellCooldowns } from './state/spellState.ts';
import { markBossDefeated, respawnBoss } from './state/worldState.ts';
import { DomHud } from './ui/DomHud.ts';
import { OverlayController } from './ui/OverlayController.ts';
import { restAtCheckpoint, reviveAtCheckpoint } from './world/checkpoints.ts';
import {
	isNearAeronGate,
	isNearGrace,
	resolveOverworldCollisions,
} from './world/overworldContent.ts';
import type { AreaId, FightId, GameState, InputState, PlayerAction } from './types.ts';

export class Game {
	private readonly state: GameState = createInitialGameState();
	private readonly inputState: InputState = createInitialInputState();
	private readonly audio = new AudioManager();
	private readonly events = new GameEventBus();
	private readonly scenes = new SceneController(this.state, this.events);
	private readonly hud = new DomHud();
	private readonly overlay = new OverlayController();
	private readonly renderer: CanvasRenderer;
	private readonly input: InputSystem;
	private lastFrameTime = 0;
	private sprinting = false;

	constructor(canvas: HTMLCanvasElement) {
		this.renderer = new CanvasRenderer(canvas);
		this.input = new InputSystem(
			this.inputState,
			(action) => this.onAction(action),
			() => this.onCastRelease(),
			() => this.state.mode,
			() => this.enterWorld('grace'),
		);
		this.input.bindKeyboard();
		this.input.bindTouch();

		const beginButton = document.getElementById('begin');
		const secondFightButton = document.getElementById('secondFight');
		const menuButton = document.getElementById('menu');
		const pauseButton = document.getElementById('pause');

		beginButton?.addEventListener('click', () => {
			if (this.state.scene.kind === 'title') this.enterWorld('grace');
			else this.start();
		});
		secondFightButton?.addEventListener('click', () => this.startFight('vael', null, false));
		menuButton?.addEventListener('click', () => this.returnToMenu());
		pauseButton?.addEventListener('click', () => this.togglePause());
		this.overlay.showMainMenu();

		addEventListener('blur', () => {
			if (this.state.scene.kind === 'combat' || this.state.scene.kind === 'world') this.togglePause();
		});

		requestAnimationFrame((now) => this.frame(now));
	}

	private get combatContext(): CombatContext {
		return {
			state: this.state,
			audio: this.audio,
			onPlayerDeath: () => this.end(false),
			onBossDefeated: () => this.end(true),
		};
	}

	private announce(message: string, duration = 2): void {
		this.hud.announceWithTimer(this.state, message, duration);
	}

	private positionPlayer(areaId: AreaId, spawnId: string): void {
		const spawn = getAreaSpawn(areaId, spawnId);
		if (!spawn) return;
		this.state.player.x = spawn.position.x;
		this.state.player.y = spawn.position.y;
		this.state.player.angle = spawn.facing;
		this.state.player.dx = Math.cos(spawn.facing);
		this.state.player.dy = Math.sin(spawn.facing);
		this.state.player.roll = 0;
		this.state.player.heal = 0;
		this.state.player.inv = 0;
	}

	private enterWorld(spawnId: string): void {
		this.sprinting = false;
		if (this.state.player.hp <= 0) reviveAtCheckpoint(this.state);
		this.state.currentAreaId = 'ashen-wilds';
		this.positionPlayer('ashen-wilds', spawnId);
		this.state.shots = [];
		this.state.hazards = [];
		this.state.charging = false;
		this.state.charge = 0;
		this.scenes.transition('world', 'ashen-wilds');
		this.overlay.setGameplayScene('world');
		this.hud.sync(this.state);
		this.updateWorldInteractionPrompt();
		this.lastFrameTime = performance.now();
	}

	private startFight(fightId: FightId, originAreaId: AreaId | null, preserveResources: boolean): void {
		this.state.fightId = fightId;
		this.state.encounterOriginAreaId = originAreaId;
		this.state.currentAreaId = getAreaForFight(fightId).id;
		if (!originAreaId) respawnBoss(this.state.world, fightId);
		this.beginCombatAttempt(preserveResources);
	}

	private beginCombatAttempt(preserveResources: boolean): void {
		this.sprinting = false;
		this.audio.init();
		resetCombatState(this.state, preserveResources);
		this.state.attempts += 1;
		this.scenes.enterCombat(this.state.currentAreaId);
		this.overlay.setGameplayScene('combat');
		this.hud.setInteractionPrompt(null);
		this.hud.sync(this.state);
		this.announce(getFightDefinition(this.state.fightId).introAnnouncement, 2.5);
		this.lastFrameTime = performance.now();
	}

	private returnToMenu(): void {
		this.sprinting = false;
		this.state.charging = false;
		this.state.charge = 0;
		this.state.encounterOriginAreaId = null;
		this.input.clearKeys();
		this.hud.setInteractionPrompt(null);
		this.scenes.returnToTitle();
		this.overlay.showMainMenu();
	}

	start(): void {
		if (this.state.scene.kind === 'pause') {
			const resumeScene = this.state.scene.previousKind === 'world' ? 'world' : 'combat';
			this.scenes.transition(resumeScene, this.state.currentAreaId);
			this.overlay.setGameplayScene(resumeScene);
			this.updateWorldInteractionPrompt();
			this.lastFrameTime = performance.now();
			return;
		}

		if ((this.state.scene.kind === 'dead' || this.state.scene.kind === 'victory') && this.state.encounterOriginAreaId === 'ashen-wilds') {
			const wasDead = this.state.scene.kind === 'dead';
			if (wasDead) reviveAtCheckpoint(this.state);
			const spawnId = wasDead ? 'grace' : 'aeron-return';
			this.state.encounterOriginAreaId = null;
			this.enterWorld(spawnId);
			return;
		}

		this.startFight(this.state.fightId, null, false);
	}

	private togglePause(): void {
		if (!['combat', 'world', 'pause'].includes(this.state.scene.kind)) return;

		if (this.state.scene.kind === 'pause') {
			this.start();
			return;
		}

		const inWorld = this.state.scene.kind === 'world';
		this.sprinting = false;
		this.scenes.transition('pause', this.state.currentAreaId);
		this.input.clearKeys();
		this.state.charging = false;
		this.state.charge = 0;
		this.hud.setInteractionPrompt(null);
		this.overlay.showPauseScreen(inWorld);
	}

	private end(win: boolean): void {
		this.sprinting = false;
		this.state.charging = false;
		const returnToWorld = this.state.encounterOriginAreaId === 'ashen-wilds';
		if (win) {
			markBossDefeated(this.state.world, this.state.fightId);
			this.events.emit({ type: 'bossDefeated', fightId: this.state.fightId });
			this.scenes.transition('victory', this.state.currentAreaId);
		} else {
			this.events.emit({ type: 'playerDied', fightId: this.state.fightId });
			this.scenes.transition('dead', this.state.currentAreaId);
		}

		window.setTimeout(() => {
			if (this.state.scene.kind !== 'dead' && this.state.scene.kind !== 'victory') return;
			if (win) {
				this.overlay.showVictoryScreen(this.state.attempts, this.state.fightId, returnToWorld);
			} else {
				const percentTaken = Math.round((1 - this.state.boss.hp / this.state.boss.baseMax) * 100);
				this.overlay.showDeathScreen(this.state.attempts, percentTaken, this.state.fightId, returnToWorld);
			}
		}, 1000);
	}

	private restAtGrace(): void {
		restAtCheckpoint(this.state, 'ashen-wilds-grace');
		this.events.emit({ type: 'checkpointRested', checkpointId: 'ashen-wilds-grace' });
		spawnBurst(this.state, this.state.player.x, this.state.player.y, '#e9cb75', 38, 90);
		this.audio.init();
		this.audio.play(520, 0.55, 'sine', 0.035);
		this.announce('GRACE RESTORED · BOSSES RETURN', 2.4);
		this.hud.sync(this.state);
	}

	private updateWorldInteractionPrompt(): void {
		if (this.state.scene.kind !== 'world') {
			this.hud.setInteractionPrompt(null);
			this.hud.setContextAction('roll');
			return;
		}
		if (isNearGrace(this.state.player)) {
			this.hud.setInteractionPrompt('TAP CENTER / F / A · REST AT GRACE');
			this.hud.setContextAction('grace');
			return;
		}
		if (isNearAeronGate(this.state.player)) {
			if (this.state.world.bosses.aeron.alive) {
				this.hud.setInteractionPrompt('TAP CENTER / F / A · ENTER THE FORT');
				this.hud.setContextAction('gate');
			} else {
				this.hud.setInteractionPrompt('THE HOLLOW KING IS SLAIN · REST AT GRACE TO RESTORE');
				this.hud.setContextAction('blocked');
			}
			return;
		}
		this.hud.setInteractionPrompt(null);
		this.hud.setContextAction('roll');
	}

	private performWorldInteraction(): boolean {
		if (this.state.scene.kind !== 'world') return false;
		if (isNearGrace(this.state.player)) {
			this.sprinting = false;
			this.restAtGrace();
			return true;
		}
		if (isNearAeronGate(this.state.player)) {
			this.sprinting = false;
			if (this.state.world.bosses.aeron.alive) {
				this.startFight('aeron', 'ashen-wilds', true);
			} else {
				this.announce('THE HOLLOW KING IS SLAIN · REST AT GRACE TO RESTORE', 2.2);
			}
			return true;
		}
		return false;
	}

	private onAction(action: PlayerAction): void {
		if (action === 'sprintStart') {
			if (this.state.scene.kind === 'world' && (isNearGrace(this.state.player) || isNearAeronGate(this.state.player))) return;
			if (this.state.scene.kind === 'world' || this.state.scene.kind === 'combat') this.sprinting = true;
			return;
		}
		if (action === 'sprintEnd') {
			this.sprinting = false;
			return;
		}
		if (action === 'interact') {
			this.performWorldInteraction();
			return;
		}
		if (action === 'contextAction') {
			if (this.performWorldInteraction()) return;
			action = 'dodge';
		}

		handlePlayerAction(
			{
				...this.combatContext,
				onPause: () => this.togglePause(),
				getMovementInput: () => this.input.getMovementInput(),
			},
			action,
		);
	}

	private onCastRelease(): void {
		releaseCast(this.combatContext);
	}

	private updateWorld(dt: number): void {
		this.hud.tickNotice(this.state, dt);
		updatePlayerRegen(this.state, dt);
		updatePlayerHealing(this.combatContext, dt);
		updateSpellCooldowns(this.state, dt);

		const movement = this.input.getMovementInput();
		const moving = Math.hypot(movement.x, movement.y) > 0.12;
		const sprinting = this.sprinting && moving && this.state.player.sp > 0;
		if (sprinting) {
			this.state.player.sp = Math.max(0, this.state.player.sp - 12 * dt);
			this.state.player.regen = Math.max(this.state.player.regen, 0.28);
			if (this.state.player.sp <= 0) this.sprinting = false;
		}
		updatePlayerMovement(this.state, movement, dt, 0.45 * (sprinting ? 1.65 : 1));
		constrainToArea(this.state.player, 'ashen-wilds');
		resolveOverworldCollisions(this.state.player);

		this.updateWorldInteractionPrompt();
		this.hud.sync(this.state);
	}

	private updateCombat(dt: number): void {
		this.hud.tickNotice(this.state, dt);
		updatePlayerRegen(this.state, dt);
		updatePlayerHealing(this.combatContext, dt);
		updateSorceryCharge(this.state, dt);
		updateSpellCooldowns(this.state, dt);

		const movement = this.input.getMovementInput();
		const moving = Math.hypot(movement.x, movement.y) > 0.12;
		const sprinting = this.sprinting && moving && this.state.player.sp > 0;
		if (sprinting) {
			this.state.player.sp = Math.max(0, this.state.player.sp - 14 * dt);
			this.state.player.regen = Math.max(this.state.player.regen, 0.3);
			if (this.state.player.sp <= 0) this.sprinting = false;
		}
		updatePlayerMovement(this.state, movement, dt, sprinting ? 1.42 : 1);
		constrainToArea(this.state.player, this.state.currentAreaId);

		updateBoss(
			{
				...this.combatContext,
				announce: (message, duration) => this.announce(message, duration),
			},
			dt,
		);
		updateBossEffects(this.combatContext, dt);
		updateProjectiles(this.combatContext, dt);
		updateHazards(this.combatContext, dt);
		this.hud.sync(this.state);
	}

	private update(dt: number): void {
		this.input.pollGamepad();
		this.state.time += dt;
		updateParticles(this.state, dt);
		decayShake(this.state, dt);

		if (this.state.scene.kind === 'world') {
			this.updateWorld(dt);
			return;
		}
		if (this.state.scene.kind === 'combat') this.updateCombat(dt);
	}

	private frame(now: number): void {
		const dt = Math.min(MAX_DELTA_TIME, (now - this.lastFrameTime) / 1000 || 0);
		this.lastFrameTime = now;

		if (this.state.scene.kind !== 'pause') {
			this.update(dt);
		} else {
			this.input.pollGamepad();
		}

		this.renderer.render(this.state, this.state.mode);
		requestAnimationFrame((timestamp) => this.frame(timestamp));
	}
}
