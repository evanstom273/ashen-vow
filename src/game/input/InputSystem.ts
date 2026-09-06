import type { GameMode, InputState, PlayerAction, StickInput } from '../types.ts';
import { SlotControls } from './SlotControls.ts';

export type ActionHandler = (action: PlayerAction) => void;
export type CastReleaseHandler = () => void;
export type StartHandler = () => void;

const GAMEPAD_ACTION_MAP: Record<string, PlayerAction> = {
	'4': 'cycleSpell',
	'1': 'dodge',
	'2': 'useConsumable',
	'7': 'castStart',
	'11': 'toggleLockOn',
	'9': 'pause',
};

export class InputSystem {
	private readonly input: InputState;
	private readonly onAction: ActionHandler;
	private readonly onCastRelease: CastReleaseHandler;
	private readonly getMode: () => GameMode;
	private readonly onStartFromMenu: StartHandler;
	private slotControls: SlotControls | null = null;

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
			if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
				event.preventDefault();
			}

			const action = this.mapKeyboardDown(key);
			if (!action) return;

			const actionKey = this.actionStorageKey(action);
			if (!this.input.keys[actionKey]) {
				this.onAction(action);
			}
			this.input.keys[actionKey] = true;
		});

		addEventListener('keyup', (event) => {
			const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
			const action = this.mapKeyboardUp(key);
			if (action) {
				this.input.keys[this.actionStorageKey(action)] = false;
			}
			if (key === 'k') {
				this.onCastRelease();
			}
		});

		addEventListener('blur', () => {
			this.input.keys = {};
			this.slotControls?.reset();
			this.input.touchStick = { x: 0, y: 0 };
		});
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
		if (!gamepad) return this.input.stick;

		this.input.stick.x = Math.abs(gamepad.axes[0]) > 0.18 ? gamepad.axes[0] : 0;
		this.input.stick.y = Math.abs(gamepad.axes[1]) > 0.18 ? gamepad.axes[1] : 0;

		for (const [index, action] of Object.entries(GAMEPAD_ACTION_MAP)) {
			const down = gamepad.buttons[Number(index)]?.pressed ?? false;
			const wasDown = this.input.padPrev[index] ?? false;
			if (down && !wasDown) {
				if (index === '9') {
					const mode = this.getMode();
					if (mode === 'title' || mode === 'dead' || mode === 'win') {
						this.onStartFromMenu();
					} else {
						this.onAction(action);
					}
				} else {
					this.onAction(action);
				}
			}
			if (!down && wasDown && action === 'castStart') {
				this.onCastRelease();
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
		this.slotControls?.reset();
	}

	private mapKeyboardDown(key: string): PlayerAction | null {
		if (key === 'Escape') return 'pause';
		if (key === ' ') return 'dodge';
		if (key === 'q' || key === '1') return 'cycleSpell';
		if (key === 'r') return 'toggleLockOn';
		if (key === 'k') return 'castStart';
		if (key === 'e') return 'useConsumable';
		return null;
	}

	private mapKeyboardUp(key: string): PlayerAction | null {
		if (key === 'k') return 'castStart';
		return null;
	}

	private actionStorageKey(action: PlayerAction): string {
		return action;
	}
}
