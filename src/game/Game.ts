import { MAX_DELTA_TIME } from './constants.ts';
import { AudioManager } from './audio/AudioManager.ts';
import { decayShake, updateParticles } from './effects/particles.ts';
import { InputSystem } from './input/InputSystem.ts';
import type { GameRenderer } from './render/GameRenderer.ts';
import { transformMovementForCamera, getForwardFromGameState } from './render/three/worldMapping.ts';
import { activateBossLockOn } from './systems/lockOn.ts';
import { updateBoss } from './systems/bossUpdate.ts';
import { constrainToArena, type CombatContext } from './systems/combat.ts';
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
import { DomHud } from './ui/DomHud.ts';
import { OverlayController } from './ui/OverlayController.ts';
import type { GameState, InputState, PlayerAction } from './types.ts';

export class Game {
	private readonly state: GameState = createInitialGameState();
	private readonly inputState: InputState = createInitialInputState();
	private readonly audio = new AudioManager();
	private readonly hud = new DomHud();
	private readonly overlay = new OverlayController();
	private readonly renderer: GameRenderer;
	private readonly input: InputSystem;
	private lastFrameTime = 0;

	private readonly cameraRelativeMovement: boolean;

	constructor(_canvas: HTMLCanvasElement, renderer: GameRenderer, cameraRelativeMovement = true) {
		this.renderer = renderer;
		this.cameraRelativeMovement = cameraRelativeMovement;
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
		const pauseButton = document.getElementById('pause');
		beginButton?.addEventListener('click', () => this.start());
		pauseButton?.addEventListener('click', () => this.togglePause());

		addEventListener('blur', () => {
			if (this.state.mode === 'play') {
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

	start(): void {
		if (this.state.mode === 'pause') {
			this.state.mode = 'play';
			this.overlay.setPlaying(true);
			this.lastFrameTime = performance.now();
			return;
		}

		this.audio.init();
		resetCombatState(this.state);
		this.state.attempts += 1;
		this.state.mode = 'play';
		this.overlay.setPlaying(true);
		activateBossLockOn(this.state);
		this.announce('THE LAST WATCH', 2.5);
	}

	private togglePause(): void {
		if (this.state.mode !== 'play' && this.state.mode !== 'pause') return;

		if (this.state.mode === 'pause') {
			this.start();
			return;
		}

		this.state.mode = 'pause';
		this.input.clearKeys();
		this.state.charging = false;
		this.state.charge = 0;
		this.overlay.showPauseScreen();
	}

	private end(win: boolean): void {
		this.state.mode = win ? 'win' : 'dead';
		this.state.charging = false;

		window.setTimeout(() => {
			if (this.state.mode !== 'dead' && this.state.mode !== 'win') return;

			if (win) {
				this.overlay.showVictoryScreen(this.state.attempts);
			} else {
				const percentTaken = Math.round((1 - this.state.boss.hp / this.state.boss.baseMax) * 100);
				this.overlay.showDeathScreen(this.state.attempts, percentTaken);
			}
		}, 1000);
	}

	private getMovementInput() {
		const raw = this.input.getMovementInput();
		if (!this.cameraRelativeMovement) return raw;
		const forward = getForwardFromGameState(this.state);
		return transformMovementForCamera(raw, forward.forwardX, forward.forwardZ);
	}

	private onAction(action: PlayerAction): void {
		handlePlayerAction(
			{
				...this.combatContext,
				onPause: () => this.togglePause(),
				getMovementInput: () => this.getMovementInput(),
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

		if (this.state.mode !== 'play') return;

		this.hud.tickNotice(this.state, dt);
		updatePlayerRegen(this.state, dt);
		updatePlayerHealing(this.combatContext, dt);
		updateSorceryCharge(this.state, dt);
		updateSpellCooldowns(this.state, dt);

		const movement = this.getMovementInput();
		updatePlayerMovement(this.state, movement, dt);
		constrainToArena(this.state.player);

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

		if (this.state.mode !== 'pause') {
			this.update(dt);
		} else {
			this.input.pollGamepad();
		}

		this.renderer.render(this.state, this.state.mode);
		requestAnimationFrame((timestamp) => this.frame(timestamp));
	}
}
