import { MAX_DELTA_TIME } from './constants.ts';
import { AudioManager } from './audio/AudioManager.ts';
import { getAreaForFight, getAreaSpawn } from './content/areas.ts';
import { getFightDefinition } from './content/fights.ts';
import { PLAYER_TUNING } from './content/playerDefaults.ts';
import { getTravelFormDefinition } from './content/travelForms.ts';
import { decayShake, spawnBurst, updateParticles } from './effects/particles.ts';
import { GameEventBus } from './events/GameEventBus.ts';
import { SceneController } from './flow/SceneController.ts';
import { InputSystem } from './input/InputSystem.ts';
import { CanvasRenderer } from './render/CanvasRenderer.ts';
import { getArenaExitPosition } from './render/drawArena.ts';
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
import type { AreaId, FightId, GameState, InputState, PlayerAction, TravelFormId } from './types.ts';

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

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
	private transitioning = false;
	private bossIntroActive = false;
	private graceMenuOpen = false;

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
		const closeGraceMenu = document.getElementById('closeGraceMenu');

		beginButton?.addEventListener('click', () => {
			if (this.state.scene.kind === 'title') this.enterWorld('grace');
			else this.start();
		});
		secondFightButton?.addEventListener('click', () => void this.transitionToFight('vael', null, false));
		menuButton?.addEventListener('click', () => this.returnToMenu());
		pauseButton?.addEventListener('click', () => this.togglePause());
		closeGraceMenu?.addEventListener('click', () => this.closeGraceMenu());
		document.querySelectorAll<HTMLButtonElement>('[data-form]').forEach((button) => {
			button.addEventListener('click', () => {
				const form = button.dataset.form as TravelFormId | undefined;
				if (form) this.selectTravelForm(form);
			});
		});
		this.overlay.showMainMenu();

		addEventListener('blur', () => {
			if ((this.state.scene.kind === 'combat' || this.state.scene.kind === 'world') && !this.transitioning && !this.graceMenuOpen) {
				this.togglePause();
			}
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
		this.state.player.moving = false;
	}

	private resetTravelMotion(): void {
		this.sprinting = false;
		this.state.player.sprinting = false;
		this.state.player.moving = false;
	}

	private enterWorld(spawnId: string): void {
		document.body.classList.remove('post-fight');
		this.resetTravelMotion();
		this.bossIntroActive = false;
		this.overlay.hideBossIntro();
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

	private prepareCombat(fightId: FightId, originAreaId: AreaId | null, preserveResources: boolean): void {
		document.body.classList.remove('post-fight');
		this.resetTravelMotion();
		this.audio.init();
		this.state.fightId = fightId;
		this.state.encounterOriginAreaId = originAreaId;
		this.state.currentAreaId = getAreaForFight(fightId).id;
		if (!originAreaId) respawnBoss(this.state.world, fightId);

		const selectedForm = this.state.player.selectedTravelForm;
		resetCombatState(this.state, preserveResources);
		this.state.player.selectedTravelForm = selectedForm;
		this.state.player.transformed = false;
		this.state.player.transformTarget = false;
		this.state.player.transformProgress = 0;
		this.state.attempts += 1;
		this.scenes.enterCombat(this.state.currentAreaId);
		this.overlay.setGameplayScene('combat');
		this.hud.setInteractionPrompt(null);
		this.hud.setContextAction('roll');
		this.hud.sync(this.state);
		this.lastFrameTime = performance.now();
	}

	private async transitionToFight(fightId: FightId, originAreaId: AreaId | null, preserveResources: boolean): Promise<void> {
		if (this.transitioning) return;
		this.transitioning = true;
		this.closeGraceMenu();
		this.input.clearKeys();
		this.resetTravelMotion();
		this.state.charging = false;

		const viewport = this.renderer.getViewport();
		const from = this.state.scene.kind === 'title'
			? { x: viewport.w / 2, y: viewport.h / 2 }
			: this.renderer.getActorScreenPosition(this.state);
		const area = getAreaForFight(fightId);
		await this.overlay.closeIris(from.x, from.y, area.displayName);

		this.prepareCombat(fightId, originAreaId, preserveResources);
		await wait(120);
		const to = this.renderer.getActorScreenPosition(this.state);
		await this.overlay.openIris(to.x, to.y);

		this.bossIntroActive = true;
		this.overlay.showBossIntro(fightId);
		await wait(2800);
		if (this.state.scene.kind === 'combat') {
			this.overlay.hideBossIntro();
			this.bossIntroActive = false;
			this.announce(getFightDefinition(fightId).introAnnouncement, 2.2);
		}
		this.transitioning = false;
		this.lastFrameTime = performance.now();
	}

	private async transitionToWorld(spawnId: string): Promise<void> {
		if (this.transitioning) return;
		this.transitioning = true;
		this.input.clearKeys();
		const viewport = this.renderer.getViewport();
		const from = (this.state.scene.kind === 'dead' || this.state.scene.kind === 'victory')
			? { x: viewport.w / 2, y: viewport.h / 2 }
			: this.renderer.getActorScreenPosition(this.state);
		this.scenes.transition('transition', this.state.currentAreaId);
		await this.overlay.closeIris(from.x, from.y, 'THE ASHEN WILDS');
		this.enterWorld(spawnId);
		await wait(100);
		const to = this.renderer.getActorScreenPosition(this.state);
		await this.overlay.openIris(to.x, to.y);
		this.transitioning = false;
		this.lastFrameTime = performance.now();
	}

	private returnToMenu(): void {
		this.resetTravelMotion();
		this.state.charging = false;
		this.state.charge = 0;
		this.state.encounterOriginAreaId = null;
		this.input.clearKeys();
		this.hud.setInteractionPrompt(null);
		this.overlay.hideBossIntro();
		this.overlay.hideGraceMenu();
		this.graceMenuOpen = false;
		this.scenes.returnToTitle();
		this.overlay.showMainMenu();
	}

	start(): void {
		if (this.transitioning) return;
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
			void this.transitionToWorld(spawnId);
			return;
		}

		void this.transitionToFight(this.state.fightId, null, false);
	}

	private togglePause(): void {
		if (this.transitioning || this.bossIntroActive || this.graceMenuOpen) return;
		if (!['combat', 'world', 'pause'].includes(this.state.scene.kind)) return;

		if (this.state.scene.kind === 'pause') {
			this.start();
			return;
		}

		const inWorld = this.state.scene.kind === 'world';
		this.resetTravelMotion();
		this.scenes.transition('pause', this.state.currentAreaId);
		this.input.clearKeys();
		this.state.charging = false;
		this.state.charge = 0;
		this.hud.setInteractionPrompt(null);
		this.overlay.showPauseScreen(inWorld);
	}

	private end(win: boolean): void {
		this.resetTravelMotion();
		this.state.charging = false;
		this.overlay.hideBossIntro();
		this.bossIntroActive = false;

		if (win) {
			markBossDefeated(this.state.world, this.state.fightId);
			this.events.emit({ type: 'bossDefeated', fightId: this.state.fightId });
			this.state.postFight = true;
			this.state.bossDeathProgress = 0;
			this.state.arenaExitActive = false;
			this.state.shots = [];
			this.state.hazards = [];
			this.state.boss.moving = false;
			document.body.classList.add('post-fight');
			this.hud.setInteractionPrompt(null);
			this.hud.setContextAction('roll');
			spawnBurst(this.state, this.state.boss.x, this.state.boss.y, getFightDefinition(this.state.fightId).visuals.phaseBurst, 52, 120);
			this.audio.play(52, 0.8, 'sawtooth', 0.035);
			return;
		}

		this.events.emit({ type: 'playerDied', fightId: this.state.fightId });
		this.scenes.transition('dead', this.state.currentAreaId);
		const returnToWorld = this.state.encounterOriginAreaId === 'ashen-wilds';
		window.setTimeout(() => {
			if (this.state.scene.kind !== 'dead') return;
			const percentTaken = Math.round((1 - this.state.boss.hp / this.state.boss.baseMax) * 100);
			this.overlay.showDeathScreen(this.state.attempts, percentTaken, this.state.fightId, returnToWorld);
		}, 1000);
	}

	private restAtGrace(): void {
		this.resetTravelMotion();
		this.state.player.transformTarget = false;
		this.state.player.transformed = false;
		this.state.player.transformProgress = 0;
		restAtCheckpoint(this.state, 'ashen-wilds-grace');
		this.events.emit({ type: 'checkpointRested', checkpointId: 'ashen-wilds-grace' });
		spawnBurst(this.state, this.state.player.x, this.state.player.y, '#e9cb75', 38, 90);
		this.audio.init();
		this.audio.play(520, 0.55, 'sine', 0.035);
		this.announce('GRACE RESTORED · BOSSES RETURN', 2.4);
		this.graceMenuOpen = true;
		this.input.clearKeys();
		this.overlay.showGraceMenu(this.state.player.selectedTravelForm);
		this.hud.sync(this.state);
	}

	private closeGraceMenu(): void {
		this.graceMenuOpen = false;
		this.overlay.hideGraceMenu();
		this.lastFrameTime = performance.now();
	}

	private selectTravelForm(form: TravelFormId): void {
		this.state.player.selectedTravelForm = form;
		this.overlay.showGraceMenu(form);
		this.hud.sync(this.state);
		this.audio.init();
		this.audio.play(360, 0.12, 'sine', 0.025);
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
		if (this.state.scene.kind === 'combat' && this.state.postFight && this.state.arenaExitActive) {
			const exit = getArenaExitPosition(this.state.currentAreaId);
			if (Math.hypot(this.state.player.x - exit.x, this.state.player.y - exit.y) <= 92) {
				this.hud.setInteractionPrompt(null);
				this.hud.setContextAction('roll');
				const spawnId = this.state.encounterOriginAreaId === 'ashen-wilds' ? 'aeron-return' : 'grace';
				this.state.encounterOriginAreaId = null;
				void this.transitionToWorld(spawnId);
				return true;
			}
		}
		if (this.state.scene.kind !== 'world') return false;
		if (isNearGrace(this.state.player)) {
			this.restAtGrace();
			return true;
		}
		if (isNearAeronGate(this.state.player)) {
			this.resetTravelMotion();
			if (this.state.world.bosses.aeron.alive) {
				void this.transitionToFight('aeron', 'ashen-wilds', true);
			} else {
				this.announce('THE HOLLOW KING IS SLAIN · REST AT GRACE TO RESTORE', 2.2);
			}
			return true;
		}
		return false;
	}

	private cycleUtility(): void {
		this.state.utilityItem = this.state.utilityItem === 'flask' ? 'transform' : 'flask';
		this.audio.init();
		this.audio.play(410, 0.07, 'sine', 0.02);
		this.hud.sync(this.state);
	}

	private canUseTravelForm(): boolean {
		if (this.state.scene.kind === 'world') return true;
		if (this.state.scene.kind === 'combat') return getFightDefinition(this.state.fightId).allowTravelForm;
		return false;
	}

	private toggleTravelForm(): void {
		const { player } = this.state;
		if (!this.canUseTravelForm()) {
			this.announce('THIS FORM CANNOT TAKE ROOT HERE', 1.8);
			return;
		}
		if (player.roll > 0 || player.heal > 0 || this.state.charging || (player.transformProgress > 0 && player.transformProgress < 1)) return;
		this.resetTravelMotion();
		player.transformTarget = !player.transformed;
		const form = getTravelFormDefinition(player.selectedTravelForm);
		spawnBurst(this.state, player.x, player.y, form.accent, 42, 125);
		this.audio.init();
		this.audio.play(player.transformTarget ? 230 : 310, 0.42, 'triangle', 0.035);
	}

	private activateUtility(): void {
		if (this.state.utilityItem === 'transform') {
			this.toggleTravelForm();
			return;
		}
		handlePlayerAction(
			{
				...this.combatContext,
				onPause: () => this.togglePause(),
				getMovementInput: () => this.input.getMovementInput(),
			},
			'useConsumable',
		);
	}

	private onAction(action: PlayerAction): void {
		if (this.transitioning || this.bossIntroActive || this.graceMenuOpen) return;
		if (action === 'cycleUtility') {
			this.cycleUtility();
			return;
		}
		if (action === 'activateUtility') {
			this.activateUtility();
			return;
		}
		if (action === 'sprintStart') {
			if (this.state.scene.kind === 'world' && (isNearGrace(this.state.player) || isNearAeronGate(this.state.player))) return;
			if (this.state.scene.kind === 'world' || this.state.scene.kind === 'combat') {
				this.sprinting = true;
				this.state.player.sprinting = true;
			}
			return;
		}
		if (action === 'sprintEnd') {
			this.resetTravelMotion();
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
		if (this.transitioning || this.bossIntroActive || this.graceMenuOpen) return;
		releaseCast(this.combatContext);
	}

	private updateTransformation(dt: number): boolean {
		const { player } = this.state;
		const target = player.transformTarget ? 1 : 0;
		if (Math.abs(player.transformProgress - target) < 0.001) {
			player.transformProgress = target;
			player.transformed = target === 1;
			return false;
		}
		const direction = target > player.transformProgress ? 1 : -1;
		player.transformProgress = Math.max(0, Math.min(1, player.transformProgress + direction * dt / 0.9));
		player.transformed = player.transformProgress >= 0.98 && player.transformTarget;
		const form = getTravelFormDefinition(player.selectedTravelForm);
		if (Math.random() < 0.45) spawnBurst(this.state, player.x, player.y, form.accentSoft, 1, 40);
		return true;
	}

	private movementScale(sprinting: boolean): number {
		const { player } = this.state;
		const form = getTravelFormDefinition(player.selectedTravelForm);
		const humanSpeed = sprinting ? PLAYER_TUNING.movement.sprintSpeed : PLAYER_TUNING.movement.normalSpeed;
		const beastSpeed = sprinting ? form.sprintSpeed : form.walkSpeed;
		const morph = player.transformProgress * player.transformProgress * (3 - 2 * player.transformProgress);
		const speed = humanSpeed + (beastSpeed - humanSpeed) * morph;
		return speed / PLAYER_TUNING.movement.normalSpeed;
	}

	private applySprintDrain(dt: number, amount: number, moving: boolean): boolean {
		const sprinting = this.sprinting && moving && this.state.player.sp > 0;
		if (sprinting) {
			this.state.player.sp = Math.max(0, this.state.player.sp - amount * dt);
			this.state.player.regen = Math.max(this.state.player.regen, 0.3);
			if (this.state.player.sp <= 0) this.resetTravelMotion();
		}
		this.state.player.sprinting = sprinting;
		return sprinting;
	}

	private updateWorld(dt: number): void {
		this.hud.tickNotice(this.state, dt);
		updatePlayerRegen(this.state, dt);
		updatePlayerHealing(this.combatContext, dt);
		updateSpellCooldowns(this.state, dt);

		const shifting = this.updateTransformation(dt);
		const movement = this.graceMenuOpen || shifting ? { x: 0, y: 0 } : this.input.getMovementInput();
		const moving = Math.hypot(movement.x, movement.y) > 0.12;
		const sprinting = this.applySprintDrain(dt, 12, moving);
		updatePlayerMovement(this.state, movement, dt, this.movementScale(sprinting));
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
		this.updateTransformation(dt);

		if (this.state.postFight) {
			this.updatePostFight(dt);
			return;
		}

		if (this.bossIntroActive) {
			this.state.player.moving = false;
			this.state.boss.moving = false;
			this.hud.sync(this.state);
			return;
		}

		const movement = this.input.getMovementInput();
		const moving = Math.hypot(movement.x, movement.y) > 0.12;
		const sprinting = this.applySprintDrain(dt, 14, moving);
		updatePlayerMovement(this.state, movement, dt, this.movementScale(sprinting));
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

	private updatePostFight(dt: number): void {
		const movement = this.input.getMovementInput();
		const moving = Math.hypot(movement.x, movement.y) > 0.12;
		const sprinting = this.applySprintDrain(dt, 10, moving);
		updatePlayerMovement(this.state, movement, dt, this.movementScale(sprinting));
		constrainToArea(this.state.player, this.state.currentAreaId);

		if (this.state.bossDeathProgress < 1) {
			const previous = this.state.bossDeathProgress;
			this.state.bossDeathProgress = Math.min(1, previous + dt / 1.85);
			if (Math.random() < 0.35) {
				spawnBurst(
					this.state,
					this.state.boss.x + (Math.random() - 0.5) * 36,
					this.state.boss.y + (Math.random() - 0.5) * 44,
					getFightDefinition(this.state.fightId).visuals.phaseBurst,
					1,
					48,
				);
			}
			if (this.state.bossDeathProgress >= 1) {
				this.state.arenaExitActive = true;
				this.announce('VOW FULFILLED · RETURN WHEN READY', 3);
				this.audio.play(430, 0.65, 'sine', 0.025);
			}
		}

		if (this.state.arenaExitActive) {
			const exit = getArenaExitPosition(this.state.currentAreaId);
			const nearExit = Math.hypot(this.state.player.x - exit.x, this.state.player.y - exit.y) <= 92;
			this.hud.setInteractionPrompt(nearExit ? 'TAP CENTER / F / A · LEAVE ARENA' : null);
			this.hud.setContextAction(nearExit ? 'exit' : 'roll');
		} else {
			this.hud.setInteractionPrompt(null);
			this.hud.setContextAction('roll');
		}

		this.hud.sync(this.state);
	}

	private update(dt: number): void {
		this.input.pollGamepad();
		if (this.state.hitStop > 0) {
			this.state.hitStop = Math.max(0, this.state.hitStop - dt);
			return;
		}
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
