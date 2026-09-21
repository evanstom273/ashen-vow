import { getFightDefinition } from '../content/fights.ts';
import type { FightId } from '../types.ts';

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
	private readonly beginEl = $('begin') as HTMLButtonElement;
	private readonly secondFightEl = $('secondFight') as HTMLButtonElement;
	private readonly menuEl = $('menu') as HTMLButtonElement;
	private readonly tipEl = $('tip');

	setPlaying(isPlaying: boolean): void {
		document.body.classList.toggle('playing', isPlaying);
	}

	private setMenuChoicesVisible(visible: boolean): void {
		this.secondFightEl.hidden = !visible;
		this.menuEl.hidden = visible;
	}

	showMainMenu(): void {
		this.eyebrowEl.textContent = 'TWO VOWS. TWO ENDS.';
		this.titleEl.innerHTML = 'ASHEN <span>VOW</span>';
		this.descriptionEl.innerHTML = 'Choose a duel.<br>Every shape, arena and foe is drawn in code.';
		this.beginEl.innerHTML = '<small>THE SUNKEN SANCTUM</small><strong>AERON, THE HOLLOW KING</strong><span>→</span>';
		this.secondFightEl.innerHTML = '<small>THE SHATTERED ORRERY</small><strong>VAEL, THE STARVED SEER</strong><span>→</span>';
		this.tipEl.textContent = 'Two bosses. Two arenas. One procedural visual language.';
		this.setMenuChoicesVisible(true);
		this.setPlaying(false);
	}

	showPauseScreen(): void {
		this.eyebrowEl.textContent = 'A MOMENT BETWEEN BLOWS';
		this.titleEl.textContent = 'PAUSED';
		this.descriptionEl.textContent = 'Take a breath. The arena can wait.';
		this.beginEl.textContent = 'RETURN TO THE FIGHT';
		this.tipEl.textContent = 'Esc or the pause button to resume.';
		this.secondFightEl.hidden = true;
		this.menuEl.hidden = false;
		this.setPlaying(false);
	}

	showDeathScreen(attempts: number, bossHpPercentTaken: number, fightId: FightId): void {
		const fight = getFightDefinition(fightId);
		this.eyebrowEl.textContent = fight.copy.deathEyebrow;
		this.titleEl.textContent = 'YOU DIED';
		this.descriptionEl.innerHTML = fight.copy.deathDescription;
		this.beginEl.textContent = 'RISE AGAIN';
		this.tipEl.textContent = `Attempt ${attempts} · ${bossHpPercentTaken}% of ${fight.displayName.split(',')[0]}'s health taken.`;
		this.secondFightEl.hidden = true;
		this.menuEl.hidden = false;
		this.setPlaying(false);
	}

	showVictoryScreen(attempts: number, fightId: FightId): void {
		const fight = getFightDefinition(fightId);
		this.eyebrowEl.textContent = fight.copy.victoryEyebrow;
		this.titleEl.textContent = 'VOW FULFILLED';
		this.descriptionEl.innerHTML = fight.copy.victoryDescription;
		this.beginEl.textContent = 'FACE THEM AGAIN';
		this.tipEl.textContent = `Attempt ${attempts} · ${fight.copy.victoryTip}`;
		this.secondFightEl.hidden = true;
		this.menuEl.hidden = false;
		this.setPlaying(false);
	}
}
