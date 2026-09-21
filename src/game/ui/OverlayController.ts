import { getFightDefinition } from '../content/fights.ts';
import type { FightId, TravelFormId } from '../types.ts';

function wait(ms: number): Promise<void> {
	return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function $(id: string): HTMLElement {
	const element = document.getElementById(id);
	if (!element) throw new Error(`Missing DOM element: #${id}`);
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
	private readonly bossDialogueEl = $('bossDialogue');
	private readonly bossDialogueNameEl = $('bossDialogueName');
	private readonly bossDialogueTextEl = $('bossDialogueText');
	private readonly graceMenuEl = $('graceMenu');
	private readonly transitionCurtainEl = $('transitionCurtain');
	private readonly loadingCardEl = $('loadingCard');
	private readonly loadingAreaEl = $('loadingArea');


	showBossIntro(fightId: FightId): void {
		const fight = getFightDefinition(fightId);
		this.bossDialogueNameEl.textContent = fight.displayName;
		this.bossDialogueTextEl.textContent = fight.introDialogue;
		this.bossDialogueEl.hidden = false;
		this.bossDialogueEl.classList.add('is-visible');
		document.body.classList.add('boss-intro');
	}

	hideBossIntro(): void {
		this.bossDialogueEl.hidden = true;
		this.bossDialogueEl.classList.remove('is-visible');
		document.body.classList.remove('boss-intro');
	}

	showGraceMenu(selectedForm: TravelFormId): void {
		this.graceMenuEl.querySelectorAll<HTMLButtonElement>('[data-form]').forEach((button) => {
			button.classList.toggle('is-selected', button.dataset.form === selectedForm);
		});
		this.graceMenuEl.hidden = false;
	}

	hideGraceMenu(): void {
		this.graceMenuEl.hidden = true;
	}

	async closeIris(x: number, y: number, areaName: string): Promise<void> {
		this.transitionCurtainEl.style.setProperty('--iris-x', `${x}px`);
		this.transitionCurtainEl.style.setProperty('--iris-y', `${y}px`);
		this.loadingAreaEl.textContent = areaName;
		this.transitionCurtainEl.classList.add('is-active');
		this.loadingCardEl.hidden = true;
		void this.transitionCurtainEl.getBoundingClientRect();
		this.transitionCurtainEl.classList.add('is-closed');
		await wait(570);
		this.loadingCardEl.hidden = false;
	}

	async openIris(x: number, y: number): Promise<void> {
		this.transitionCurtainEl.style.setProperty('--iris-x', `${x}px`);
		this.transitionCurtainEl.style.setProperty('--iris-y', `${y}px`);
		await wait(240);
		this.loadingCardEl.hidden = true;
		this.transitionCurtainEl.classList.remove('is-closed');
		await wait(570);
		this.transitionCurtainEl.classList.remove('is-active');
	}

	setGameplayScene(scene: 'world' | 'combat' | null): void {
		const playing = scene !== null;
		document.body.classList.toggle('playing', playing);
		document.body.classList.toggle('world', scene === 'world');
		document.body.classList.toggle('combat', scene === 'combat');
	}

	setPlaying(isPlaying: boolean): void {
		this.setGameplayScene(isPlaying ? 'combat' : null);
	}

	private setMenuChoicesVisible(visible: boolean): void {
		this.secondFightEl.hidden = !visible;
		this.menuEl.hidden = visible;
	}

	showMainMenu(): void {
		this.eyebrowEl.textContent = 'THE ROAD IS OPEN.';
		this.titleEl.innerHTML = 'ASHEN <span>VOW</span>';
		this.descriptionEl.innerHTML = 'Enter the Ashen Wilds and follow the old road toward the Hollow King.';
		this.beginEl.innerHTML = '<small>62,500 m² · EXPLORATION PROTOTYPE</small><strong>ENTER THE ASHEN WILDS</strong><span>→</span>';
		this.secondFightEl.innerHTML = '<small>DIRECT DUEL · LEFT ROUTE TO COME</small><strong>VAEL, THE STARVED SEER</strong><span>→</span>';
		this.tipEl.textContent = 'The right-hand route is live. The rest of the world can grow around it.';
		this.setMenuChoicesVisible(true);
		this.setGameplayScene(null);
	}

	showPauseScreen(inWorld: boolean): void {
		this.eyebrowEl.textContent = inWorld ? 'A MOMENT BENEATH THE BOUGHS' : 'A MOMENT BETWEEN BLOWS';
		this.titleEl.textContent = 'PAUSED';
		this.descriptionEl.textContent = inWorld ? 'The old road will still be there.' : 'Take a breath. The arena can wait.';
		this.beginEl.textContent = inWorld ? 'RETURN TO THE WILDS' : 'RETURN TO THE FIGHT';
		this.tipEl.textContent = 'Esc or the pause button to resume.';
		this.secondFightEl.hidden = true;
		this.menuEl.hidden = false;
		this.setGameplayScene(null);
	}

	showWorldDeathScreen(): void {
		this.eyebrowEl.textContent = 'THE WILDS CLAIM ANOTHER';
		this.titleEl.textContent = 'YOU DIED';
		this.descriptionEl.textContent = 'Return to Grace and walk the road again.';
		this.beginEl.textContent = 'RETURN TO GRACE';
		this.tipEl.textContent = 'Ordinary enemies return when Grace restores the world.';
		this.secondFightEl.hidden = true;
		this.menuEl.hidden = false;
		this.setGameplayScene(null);
	}

	showDeathScreen(attempts: number, bossHpPercentTaken: number, fightId: FightId, returnToWorld = false): void {
		const fight = getFightDefinition(fightId);
		this.eyebrowEl.textContent = fight.copy.deathEyebrow;
		this.titleEl.textContent = 'YOU DIED';
		this.descriptionEl.innerHTML = fight.copy.deathDescription;
		this.beginEl.textContent = returnToWorld ? 'RETURN TO GRACE' : 'RISE AGAIN';
		this.tipEl.textContent = `Attempt ${attempts} · ${bossHpPercentTaken}% of ${fight.displayName.split(',')[0]}'s health taken.`;
		this.secondFightEl.hidden = true;
		this.menuEl.hidden = false;
		this.setGameplayScene(null);
	}

	showVictoryScreen(attempts: number, fightId: FightId, returnToWorld = false): void {
		const fight = getFightDefinition(fightId);
		this.eyebrowEl.textContent = fight.copy.victoryEyebrow;
		this.titleEl.textContent = 'VOW FULFILLED';
		this.descriptionEl.innerHTML = fight.copy.victoryDescription;
		this.beginEl.textContent = returnToWorld ? 'RETURN TO THE WILDS' : 'FACE THEM AGAIN';
		this.tipEl.textContent = `Attempt ${attempts} · ${fight.copy.victoryTip}`;
		this.secondFightEl.hidden = true;
		this.menuEl.hidden = false;
		this.setGameplayScene(null);
	}
}
