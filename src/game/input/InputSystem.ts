import type { ActionKey, GameMode, InputState, StickInput } from '../types.ts';
import { TouchControls } from './TouchControls.ts';

export type ActionHandler = (key: ActionKey) => void;
export type CastHandler = () => void;
export type StartHandler = () => void;

const GAMEPAD_BUTTON_MAP: Record<string, ActionKey> = {
	'1': ' ',
	'2': 'e',
	'5': 'j',
	'7': 'k',
	'9': 'Escape',
};

export class InputSystem {
	private readonly input: InputState;
	private readonly onAction: ActionHandler;
	private readonly onCast: CastHandler;
	private readonly getMode: () => GameMode;
	private readonly onStartFromMenu: StartHandler;
	private touchControls: TouchControls | null = null;

	constructor(
		input: InputState,
		onAction: ActionHandler,
		onCast: CastHandler,
		getMode: () => GameMode,
		onStartFromMenu: StartHandler,
	) {
		this.input = input;
		this.onAction = onAction;
		this.onCast = onCast;
		this.getMode = getMode;
		this.onStartFromMenu = onStartFromMenu;
	}

	bindKeyboard(): void {
		addEventListener('keydown', (event) => {
			const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
			if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
				event.preventDefault();
			}
			if (!this.input.keys[key]) {
				this.onAction(key as ActionKey);
			}
			this.input.keys[key] = true;
		});

		addEventListener('keyup', (event) => {
			const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
			this.input.keys[key] = false;
			if (key === 'k') {
				this.onCast();
			}
		});

		addEventListener('blur', () => {
			this.input.keys = {};
			this.touchControls?.reset();
			this.input.touchStick = { x: 0, y: 0 };
		});
	}

	bindTouch(): void {
		const root = document.getElementById('touch');
		if (!root) return;

		this.touchControls = new TouchControls(
			root,
			(stick) => {
				this.input.touchStick = stick;
			},
			(key) => this.onAction(key),
			() => this.onCast(),
		);
	}

	pollGamepad(): StickInput {
		const pads = navigator.getGamepads?.();
		const gamepad = pads && Array.from(pads).find(Boolean);
		this.input.stick = { x: 0, y: 0 };
		if (!gamepad) return this.input.stick;

		this.input.stick.x = Math.abs(gamepad.axes[0]) > 0.18 ? gamepad.axes[0] : 0;
		this.input.stick.y = Math.abs(gamepad.axes[1]) > 0.18 ? gamepad.axes[1] : 0;

		for (const [index, actionKey] of Object.entries(GAMEPAD_BUTTON_MAP)) {
			const down = gamepad.buttons[Number(index)]?.pressed ?? false;
			const wasDown = this.input.padPrev[index] ?? false;
			if (down && !wasDown) {
				if (index === '9') {
					const mode = this.getMode();
					if (mode === 'title' || mode === 'dead' || mode === 'win') {
						this.onStartFromMenu();
					} else {
						this.onAction(actionKey);
					}
				} else {
					this.onAction(actionKey);
				}
			}
			if (!down && wasDown && actionKey === 'k') {
				this.onCast();
			}
			this.input.padPrev[index] = down;
		}

		return this.input.stick;
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
		this.touchControls?.reset();
	}
}
