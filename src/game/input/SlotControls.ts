import type { PlayerAction, StickInput } from '../types.ts';
import { TouchJoystick } from './TouchJoystick.ts';

export type ActionHandler = (action: PlayerAction) => void;
export type CastReleaseHandler = () => void;

export class SlotControls {
	private readonly joystick: TouchJoystick | null;
	private readonly onAction: ActionHandler;
	private readonly onCastRelease: CastReleaseHandler;

	constructor(
		touchRoot: HTMLElement | null,
		slotRoot: HTMLElement | null,
		onStickChange: (stick: StickInput) => void,
		onAction: ActionHandler,
		onCastRelease: CastReleaseHandler,
	) {
		this.onAction = onAction;
		this.onCastRelease = onCastRelease;

		const stickBase = touchRoot?.querySelector<HTMLElement>('.move-stick') ?? null;
		const stickKnob = touchRoot?.querySelector<HTMLElement>('.move-stick-knob') ?? null;
		this.joystick = stickBase && stickKnob
			? new TouchJoystick(stickBase, stickKnob, onStickChange)
			: null;

		const roots = [touchRoot, slotRoot].filter((root): root is HTMLElement => root !== null);
		for (const root of roots) {
			root.querySelectorAll<HTMLButtonElement>('[data-action]').forEach((button) => {
				this.bindSlotButton(button);
			});
		}
	}

	reset(): void {
		this.joystick?.reset();
	}

	private bindSlotButton(button: HTMLButtonElement): void {
		const action = button.dataset.action as PlayerAction | undefined;
		if (!action || button.disabled) return;

		if (action === 'castStart') {
			button.addEventListener('pointerdown', (event) => {
				event.preventDefault();
				button.setPointerCapture(event.pointerId);
				button.classList.add('is-pressed');
				this.onAction('castStart');
			});
			const release = (event: PointerEvent): void => {
				if (button.hasPointerCapture(event.pointerId)) {
					button.releasePointerCapture(event.pointerId);
				}
				button.classList.remove('is-pressed');
				this.onCastRelease();
			};
			button.addEventListener('pointerup', release);
			button.addEventListener('pointercancel', release);
			button.addEventListener('lostpointercapture', () => {
				button.classList.remove('is-pressed');
			});
			return;
		}

		button.addEventListener('pointerdown', (event) => {
			event.preventDefault();
			button.setPointerCapture(event.pointerId);
			button.classList.add('is-pressed');
			this.onAction(action);
		});
		button.addEventListener('pointerup', (event) => {
			if (button.hasPointerCapture(event.pointerId)) {
				button.releasePointerCapture(event.pointerId);
			}
			button.classList.remove('is-pressed');
		});
		button.addEventListener('pointercancel', () => {
			button.classList.remove('is-pressed');
		});
		button.addEventListener('lostpointercapture', () => {
			button.classList.remove('is-pressed');
		});
	}
}
