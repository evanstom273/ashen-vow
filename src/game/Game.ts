import { MAX_DELTA_TIME } from './constants.ts';
import { AudioManager } from './audio/AudioManager.ts';
import { getAreaForFight } from './content/areas.ts';
import { getFightDefinition } from './content/fights.ts';
import { decayShake, updateParticles } from './effects/particles.ts';
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
import type { FightId, GameState, InputState, PlayerAction } from './types.ts';

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

	constructor(canvas: HTMLCanvasElement) {
		this.renderer = new CanvasRenderer(canvas);
		this.input = new InputSystem(
			this.inputState,
			(action) => this.onAction(action),
			() => this.onCastRelease(),
			() => this.state.mode,
			() => this.start(),
		);
		this.input.bindKeyboard();
		this.input.bindTouch();

		const beginButton = document.getElementById('begin');
		const secondFightButton = document.getElementById('secondFight');
		const menuButton = document.getElementById('menu');
		const pauseButton = document.getElementById('pause');
		beginButton?.addEventListener('click', () => {
			if (this.state.scene.kind === 'title') this.startFight('aeron');
			else this.start();
		});
		secondFightButton?.addEventListener('click', () => this.startFight('vael'));
		menuButton?.addEventListener('click', () => this.returnToMenu());
		pauseButton?.addEventListener('click', () => this.togglePause());
		this.overlay.showMainMenu();

		addEventListener('blur', () => {
			if (this.state.scene.kind === 'combat') this.togglePause();
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

	private startFight(fightId: FightId): void {
		this.state.fightId = fightId;
		this.state.currentAreaId = getAreaForFight(fightId).id;
		respawnBoss(this.state.world, fightId);
		this.beginCombatAttempt();
	}

	private beginCombatAttempt(): void {
		this.audio.init();
		resetCombatState(this.state);
		this.state.attempts += 1;
		this.scenes.enterCombat(this.state.currentAreaId);
		this.overlay.setPlaying(true);
		this.hud.sync(this.state);
		this.announce(getFightDefinition(this.state.fightId).introAnnouncement, 2.5);
		this.lastFrameTime = performance.now();
	}

	private returnToMenu(): void {
		this.state.charging = false;
		this.state.charge = 0;
		this.input.clearKeys();
		this.scenes.returnToTitle();
		this.overlay.showMainMenu();
	}

	start(): void {
		if (this.state.scene.kind === 'pause') {
			const resumeScene = this.state.scene.previousKind === 'world' ? 'world' : 'combat';
			this.scenes.transition(resumeScene, this.state.currentAreaId);
			this.overlay.setPlaying(true);
			this.lastFrameTime = performance.now();
			return;
		}

		respawnBoss(this.state.world, this.state.fightId);
		this.beginCombatAttempt();
	}

	private togglePause(): void {
		if (this.state.scene.kind !== 'combat' && this.state.scene.kind !== 'pause') return;

		if (this.state.scene.kind === 'pause') {
			this.start();
			return;
		}

		this.scenes.transition('pause', this.state.currentAreaId);
		this.input.clearKeys();
		this.state.charging = false;
		this.state.charge = 0;
		this.overlay.showPauseScreen();
	}

	private end(win: boolean): void {
		this.state.charging = false;
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
				this.overlay.showVictoryScreen(this.state.attempts, this.state.fightId);
			} else {
				const percentTaken = Math.round((1 - this.state.boss.hp / this.state.boss.baseMax) * 100);
				this.overlay.showDeathScreen(this.state.attempts, percentTaken, this.state.fightId);
			}
		}, 1000);
	}

	private onAction(action: PlayerAction): void {
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

	private update(dt: number): void {
		this.input.pollGamepad();
		this.state.time += dt;
		updateParticles(this.state, dt);
		decayShake(this.state, dt);

		if (this.state.scene.kind !== 'combat') return;

		this.hud.tickNotice(this.state, dt);
		updatePlayerRegen(this.state, dt);
		updatePlayerHealing(this.combatContext, dt);
		updateSorceryCharge(this.state, dt);
		updateSpellCooldowns(this.state, dt);

		const movement = this.input.getMovementInput();
		updatePlayerMovement(this.state, movement, dt);
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
