import type { GameMode, InputState, PlayerAction, StickInput } from '../types.ts';
import { SlotControls } from './SlotControls.ts';

export type ActionHandler = (action: PlayerAction) => void;
export type CastReleaseHandler = () => void;
export type StartHandler = () => void;

const MOVEMENT_KEYS = new Set(['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
const DODGE_SPRINT_HOLD_MS = 180;
const PAD = {
	A: 0,
	B: 1,
	X: 2,
	Y: 3,
	RB: 5,
	START: 9,
	DPAD_UP: 12,
	DPAD_DOWN: 13,
} as const;

export class InputSystem {
	private readonly input: InputState;
	private readonly onAction: ActionHandler;
	private readonly onCastRelease: CastReleaseHandler;
	private readonly getMode: () => GameMode;
	private readonly onStartFromMenu: StartHandler;
	private slotControls: SlotControls | null = null;
	private rightMouseTimer: number | null = null;
	private rightMouseDown = false;
	private rightMouseSprinting = false;
	private leftMouseDown = false;
	private gamepadDodgeStartedAt = 0;
	private gamepadSprinting = false;

	constructor(
		input: InputState,
		onAction: ActionHandler,
		onCastRelease: CastReleaseHandler,
		getMode: () => GameMode,
		onStartFromMenu: StartHandler,
	) {
		this.input = input;
		this.onAction = onAction;
		this.onCastRelease = onCastRelease;
		this.getMode = getMode;
		this.onStartFromMenu = onStartFromMenu;
	}

	bindKeyboard(): void {
		addEventListener('keydown', (event) => {
			const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
			if ([' ', ...MOVEMENT_KEYS].includes(key)) event.preventDefault();

			if (MOVEMENT_KEYS.has(key)) {
				this.input.keys[key] = true;
				return;
			}

			if (event.repeat) return;
			const action = this.mapKeyboardDown(key);
			if (action) this.onAction(action);
		});

		addEventListener('keyup', (event) => {
			const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
			if (MOVEMENT_KEYS.has(key)) {
				this.input.keys[key] = false;
				return;
			}
			if (key === 'k') this.onCastRelease();
		});

		addEventListener('blur', () => {
			this.input.keys = {};
			this.slotControls?.reset();
			this.input.touchStick = { x: 0, y: 0 };
			this.resetMouseState();
		});
	}

	bindMouse(target: HTMLElement): void {
		target.addEventListener('contextmenu', (event) => event.preventDefault());

		target.addEventListener('pointerdown', (event) => {
			if (event.pointerType === 'touch') return;
			if (event.button !== 0 && event.button !== 2) return;
			event.preventDefault();
			target.setPointerCapture?.(event.pointerId);

			if (event.button === 0) {
				if (this.leftMouseDown) return;
				this.leftMouseDown = true;
				this.onAction('castStart');
				return;
			}

			if (this.rightMouseDown) return;
			this.rightMouseDown = true;
			this.rightMouseSprinting = false;
			this.clearRightMouseTimer();
			this.rightMouseTimer = window.setTimeout(() => {
				this.rightMouseTimer = null;
				if (!this.rightMouseDown) return;
				this.rightMouseSprinting = true;
				this.onAction('sprintStart');
			}, DODGE_SPRINT_HOLD_MS);
		});

		target.addEventListener('pointerup', (event) => {
			if (event.pointerType === 'touch') return;
			if (event.button !== 0 && event.button !== 2) return;
			event.preventDefault();

			if (event.button === 0) {
				if (!this.leftMouseDown) return;
				this.leftMouseDown = false;
				this.onCastRelease();
				return;
			}

			if (!this.rightMouseDown) return;
			this.rightMouseDown = false;
			this.clearRightMouseTimer();
			if (this.rightMouseSprinting) {
				this.rightMouseSprinting = false;
				this.onAction('sprintEnd');
			} else {
				this.onAction('dodge');
			}
		});

		target.addEventListener('pointercancel', () => this.resetMouseState());
	}

	bindTouch(): void {
		const touchRoot = document.getElementById('touch');
		const slotRoot = document.getElementById('actionSlots');
		if (!touchRoot && !slotRoot) return;

		this.slotControls = new SlotControls(
			touchRoot,
			slotRoot,
			(stick) => {
				this.input.touchStick = stick;
			},
			(action) => this.onAction(action),
			() => this.onCastRelease(),
		);
	}

	pollGamepad(): StickInput {
		const pads = navigator.getGamepads?.();
		const gamepad = pads && Array.from(pads).find(Boolean);
		this.input.stick = { x: 0, y: 0 };
		if (!gamepad) {
			this.resetGamepadState();
			return this.input.stick;
		}

		this.input.stick.x = Math.abs(gamepad.axes[0] ?? 0) > 0.18 ? (gamepad.axes[0] ?? 0) : 0;
		this.input.stick.y = Math.abs(gamepad.axes[1] ?? 0) > 0.18 ? (gamepad.axes[1] ?? 0) : 0;

		const pressed = (index: number) => gamepad.buttons[index]?.pressed ?? false;
		const wasPressed = (index: number) => this.input.padPrev[String(index)] ?? false;
		const edgeDown = (index: number) => pressed(index) && !wasPressed(index);
		const edgeUp = (index: number) => !pressed(index) && wasPressed(index);

		const mode = this.getMode();
		if ((mode === 'title' || mode === 'dead' || mode === 'win') && (edgeDown(PAD.A) || edgeDown(PAD.START))) {
			this.onStartFromMenu();
		} else {
			if (edgeDown(PAD.START)) this.onAction('pause');
			if (edgeDown(PAD.Y)) this.onAction('interact');
			if (edgeDown(PAD.X)) this.onAction('activateUtility');
			if (edgeDown(PAD.DPAD_UP)) this.onAction('cycleSpell');
			if (edgeDown(PAD.DPAD_DOWN)) this.onAction('cycleUtility');

			if (edgeDown(PAD.RB)) this.onAction('castStart');
			if (edgeUp(PAD.RB)) this.onCastRelease();

			if (edgeDown(PAD.B)) {
				this.gamepadDodgeStartedAt = performance.now();
				this.gamepadSprinting = false;
			}
			if (pressed(PAD.B) && wasPressed(PAD.B) && !this.gamepadSprinting) {
				if (performance.now() - this.gamepadDodgeStartedAt >= DODGE_SPRINT_HOLD_MS) {
					this.gamepadSprinting = true;
					this.onAction('sprintStart');
				}
			}
			if (edgeUp(PAD.B)) {
				if (this.gamepadSprinting) {
					this.gamepadSprinting = false;
					this.onAction('sprintEnd');
				} else {
					this.onAction('dodge');
				}
			}
		}

		for (let i = 0; i < gamepad.buttons.length; i++) {
			this.input.padPrev[String(i)] = gamepad.buttons[i]?.pressed ?? false;
		}
		return this.input.stick;
	}

	private resetGamepadState(): void {
		if (this.gamepadSprinting) this.onAction('sprintEnd');
		this.gamepadSprinting = false;
		this.gamepadDodgeStartedAt = 0;
		this.input.padPrev = {};
	}

	getMovementInput(): StickInput {
		const { keys, stick, touchStick } = this.input;
		return {
			x: (keys.d || keys.ArrowRight ? 1 : 0) - (keys.a || keys.ArrowLeft ? 1 : 0) + stick.x + touchStick.x,
			y: (keys.s || keys.ArrowDown ? 1 : 0) - (keys.w || keys.ArrowUp ? 1 : 0) + stick.y + touchStick.y,
		};
	}

	clearKeys(): void {
		this.input.keys = {};
		this.input.touchStick = { x: 0, y: 0 };
		this.slotControls?.reset();
		this.resetMouseState();
		this.resetGamepadState();
		this.resetGamepadState();
	}

	private mapKeyboardDown(key: string): PlayerAction | null {
		if (key === 'Escape') return 'pause';
		if (key === 'f') return 'interact';
		if (key === ' ') return 'dodge';
		if (key === 'q' || key === '1') return 'cycleSpell';
		if (key === 'k') return 'castStart';
		if (key === 'e') return 'activateUtility';
		if (key === 'c') return 'cycleUtility';
		return null;
	}

	private clearRightMouseTimer(): void {
		if (this.rightMouseTimer === null) return;
		window.clearTimeout(this.rightMouseTimer);
		this.rightMouseTimer = null;
	}

	private resetMouseState(): void {
		this.clearRightMouseTimer();
		if (this.leftMouseDown) this.onCastRelease();
		if (this.rightMouseSprinting) this.onAction('sprintEnd');
		this.leftMouseDown = false;
		this.rightMouseDown = false;
		this.rightMouseSprinting = false;
	}
}
