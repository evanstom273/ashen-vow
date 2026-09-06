function $(id: string): HTMLElement {
	const element = document.getElementById(id);
	if (!element) {
		throw new Error(`Missing DOM element: #${id}`);
	}
	return element;
}

export class OverlayController {
	private readonly eyebrowEl = $('eyebrow');
	private readonly titleEl = $('title');
	private readonly descriptionEl = $('description');
	private readonly beginEl = $('begin');
	private readonly tipEl = $('tip');

	setPlaying(isPlaying: boolean): void {
		document.body.classList.toggle('playing', isPlaying);
	}

	showPauseScreen(): void {
		this.eyebrowEl.textContent = 'A MOMENT BETWEEN BLOWS';
		this.titleEl.textContent = 'PAUSED';
		this.descriptionEl.textContent = 'Take a breath. The sanctum can wait.';
		this.beginEl.textContent = 'RETURN TO THE FIGHT';
		this.tipEl.textContent = 'Esc or the pause button to resume.';
		this.setPlaying(false);
	}

	showDeathScreen(attempts: number, bossHpPercentTaken: number): void {
		this.eyebrowEl.textContent = 'THE SANCTUM REMEMBERS';
		this.titleEl.textContent = 'YOU DIED';
		this.descriptionEl.innerHTML = 'Read the wind-up. Dodge through the blow.<br>Even a king must pause to breathe.';
		this.beginEl.textContent = 'RISE AGAIN';
		this.tipEl.textContent = `Attempt ${attempts} · ${bossHpPercentTaken}% of the king’s health taken.`;
		this.setPlaying(false);
	}

	showVictoryScreen(attempts: number): void {
		this.eyebrowEl.textContent = 'THE WATCH IS ENDED';
		this.titleEl.textContent = 'VOW FULFILLED';
		this.descriptionEl.innerHTML = 'The hollow crown falls silent.<br>A new dawn belongs to no king.';
		this.beginEl.textContent = 'FACE HIM AGAIN';
		this.tipEl.textContent = `Attempt ${attempts} · The last king has fallen.`;
		this.setPlaying(false);
	}
}
