import type { StickInput } from '../types.ts';

const DEAD_ZONE = 0.12;

export class TouchJoystick {
	private readonly base: HTMLElement;
	private readonly knob: HTMLElement;
	private readonly onChange: (stick: StickInput) => void;
	private activePointerId: number | null = null;
	private maxRadius = 0;

	constructor(base: HTMLElement, knob: HTMLElement, onChange: (stick: StickInput) => void) {
		this.base = base;
		this.knob = knob;
		this.onChange = onChange;
		this.bind();
	}

	reset(): void {
		this.activePointerId = null;
		this.base.classList.remove('is-active');
		this.knob.style.transform = 'translate(0px, 0px)';
		this.onChange({ x: 0, y: 0 });
	}

	private bind(): void {
		this.base.addEventListener('pointerdown', (event) => this.onPointerDown(event));
		this.base.addEventListener('pointermove', (event) => this.onPointerMove(event));
		this.base.addEventListener('pointerup', (event) => this.onPointerUp(event));
		this.base.addEventListener('pointercancel', (event) => this.onPointerUp(event));
	}

	private onPointerDown(event: PointerEvent): void {
		event.preventDefault();
		this.base.setPointerCapture(event.pointerId);
		this.activePointerId = event.pointerId;
		this.base.classList.add('is-active');
		this.measure();
		this.updateStick(event.clientX, event.clientY);
	}

	private onPointerMove(event: PointerEvent): void {
		if (this.activePointerId !== event.pointerId) return;
		event.preventDefault();
		this.updateStick(event.clientX, event.clientY);
	}

	private onPointerUp(event: PointerEvent): void {
		if (this.activePointerId !== event.pointerId) return;
		if (this.base.hasPointerCapture(event.pointerId)) {
			this.base.releasePointerCapture(event.pointerId);
		}
		this.reset();
	}

	private measure(): void {
		const rect = this.base.getBoundingClientRect();
		const knobRect = this.knob.getBoundingClientRect();
		this.maxRadius = Math.max(24, rect.width / 2 - knobRect.width / 2 - 4);
	}

	private updateStick(clientX: number, clientY: number): void {
		const rect = this.base.getBoundingClientRect();
		const centerX = rect.left + rect.width / 2;
		const centerY = rect.top + rect.height / 2;
		let dx = clientX - centerX;
		let dy = clientY - centerY;
		const distance = Math.hypot(dx, dy);

		if (distance > this.maxRadius) {
			dx = (dx / distance) * this.maxRadius;
			dy = (dy / distance) * this.maxRadius;
		}

		this.knob.style.transform = `translate(${dx}px, ${dy}px)`;

		const rawX = dx / this.maxRadius;
		const rawY = dy / this.maxRadius;
		const magnitude = Math.hypot(rawX, rawY);

		if (magnitude < DEAD_ZONE) {
			this.onChange({ x: 0, y: 0 });
			return;
		}

		const scaled = (magnitude - DEAD_ZONE) / (1 - DEAD_ZONE);
		this.onChange({
			x: (rawX / magnitude) * scaled,
			y: (rawY / magnitude) * scaled,
		});
	}
}
