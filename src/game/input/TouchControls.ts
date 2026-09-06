import type { ActionKey, StickInput } from '../types.ts';
import { TouchJoystick } from './TouchJoystick.ts';

export type ActionHandler = (key: ActionKey) => void;
export type CastHandler = () => void;

export class TouchControls {
	private readonly joystick: TouchJoystick | null;
	private readonly onAction: ActionHandler;
	private readonly onCast: CastHandler;

	constructor(
		root: HTMLElement,
		onStickChange: (stick: StickInput) => void,
		onAction: ActionHandler,
		onCast: CastHandler,
	) {
		this.onAction = onAction;
		this.onCast = onCast;

		const stickBase = root.querySelector<HTMLElement>('.move-stick');
		const stickKnob = root.querySelector<HTMLElement>('.move-stick-knob');
		this.joystick = stickBase && stickKnob
			? new TouchJoystick(stickBase, stickKnob, onStickChange)
			: null;

		root.querySelectorAll<HTMLButtonElement>('[data-key]').forEach((button) => {
			this.bindActionButton(button);
		});
	}

	reset(): void {
		this.joystick?.reset();
	}

	private bindActionButton(button: HTMLButtonElement): void {
		const press = (event: PointerEvent): void => {
			event.preventDefault();
			button.setPointerCapture(event.pointerId);
			button.classList.add('is-pressed');
			const key = button.dataset.key;
			if (!key) return;
			this.onAction(key as ActionKey);
		};

		const release = (event: PointerEvent): void => {
			if (button.hasPointerCapture(event.pointerId)) {
				button.releasePointerCapture(event.pointerId);
			}
			button.classList.remove('is-pressed');
			const key = button.dataset.key;
			if (!key) return;
			if (key === 'k') {
				this.onCast();
			}
		};

		button.addEventListener('pointerdown', press);
		button.addEventListener('pointerup', release);
		button.addEventListener('pointercancel', release);
		button.addEventListener('lostpointercapture', () => {
			button.classList.remove('is-pressed');
		});
	}
}
