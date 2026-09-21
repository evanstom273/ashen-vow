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

		if (action === 'contextAction') {
			let holdTimer: ReturnType<typeof setTimeout> | null = null;
			let sprinting = false;
			let activePointer: number | null = null;

			const finish = (triggerTap: boolean): void => {
				if (activePointer === null) return;
				if (holdTimer) clearTimeout(holdTimer);
				holdTimer = null;
				const pointerId = activePointer;
				activePointer = null;
				if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
				button.classList.remove('is-pressed', 'is-sprinting');
				if (sprinting) this.onAction('sprintEnd');
				else if (triggerTap) this.onAction('contextAction');
				sprinting = false;
			};

			button.addEventListener('pointerdown', (event) => {
				event.preventDefault();
				activePointer = event.pointerId;
				button.setPointerCapture(event.pointerId);
				button.classList.add('is-pressed');
				holdTimer = setTimeout(() => {
					if (activePointer === null) return;
					sprinting = true;
					button.classList.add('is-sprinting');
					this.onAction('sprintStart');
				}, 260);
			});
			button.addEventListener('pointerup', () => finish(true));
			button.addEventListener('pointercancel', () => finish(false));
			button.addEventListener('lostpointercapture', () => finish(false));
			return;
		}

		if (action === 'activateUtility') {
			let holdTimer: ReturnType<typeof setTimeout> | null = null;
			let activated = false;
			let activePointer: number | null = null;

			const finish = (triggerTap: boolean): void => {
				if (activePointer === null) return;
				if (holdTimer) clearTimeout(holdTimer);
				holdTimer = null;
				const pointerId = activePointer;
				activePointer = null;
				if (button.hasPointerCapture(pointerId)) button.releasePointerCapture(pointerId);
				button.classList.remove('is-pressed', 'is-held');
				if (!activated && triggerTap) this.onAction('cycleUtility');
				activated = false;
			};

			button.addEventListener('pointerdown', (event) => {
				event.preventDefault();
				activePointer = event.pointerId;
				button.setPointerCapture(event.pointerId);
				button.classList.add('is-pressed');
				holdTimer = setTimeout(() => {
					if (activePointer === null) return;
					activated = true;
					button.classList.add('is-held');
					this.onAction('activateUtility');
				}, 260);
			});
			button.addEventListener('pointerup', () => finish(true));
			button.addEventListener('pointercancel', () => finish(false));
			button.addEventListener('lostpointercapture', () => finish(false));
			return;
		}

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
