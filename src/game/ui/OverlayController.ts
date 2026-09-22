import { getFightDefinition } from '../content/fights.ts';
import {
	PLAYER_ATTRIBUTE_ORDER,
	countAttributeIncreases,
	getDodgeDistanceMultiplier,
	getLevelUpCostForCount,
	getMaxHp,
	getMaxStamina,
	getMovementSpeedMultiplier,
} from '../content/progression.ts';
import type { FightId, GameState, PlayerAttributes, TravelFormId } from '../types.ts';
import type { SaveSummary } from '../save/saveTypes.ts';

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
	private readonly loadGameEl = $('loadGame') as HTMLButtonElement;
	private readonly menuEl = $('menu') as HTMLButtonElement;
	private readonly saveListPanelEl = $('saveListPanel');
	private readonly saveListEl = $('saveList');
	private readonly tipEl = $('tip');
	private readonly bossDialogueEl = $('bossDialogue');
	private readonly bossDialogueNameEl = $('bossDialogueName');
	private readonly bossDialogueTextEl = $('bossDialogueText');
	private readonly graceMenuEl = $('graceMenu');
	private readonly levelPreviewEl = $('levelPreview');
	private readonly levelRunesHeldEl = $('levelRunesHeld');
	private readonly levelHpPreviewEl = $('levelHpPreview');
	private readonly levelSpPreviewEl = $('levelSpPreview');
	private readonly levelMovePreviewEl = $('levelMovePreview');
	private readonly levelDodgePreviewEl = $('levelDodgePreview');
	private readonly levelCostEl = $('levelCost');
	private readonly confirmLevelUpEl = $('confirmLevelUp') as HTMLButtonElement;
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

	showGraceMenu(selectedForm: TravelFormId, state: GameState, draft: PlayerAttributes): void {
		this.graceMenuEl.querySelectorAll<HTMLButtonElement>('[data-form]').forEach((button) => {
			button.classList.toggle('is-selected', button.dataset.form === selectedForm);
		});
		const increases = countAttributeIncreases(state.attributes, draft);
		const cost = getLevelUpCostForCount(state.level, increases);
		const projectedLevel = state.level + increases;
		this.levelPreviewEl.textContent = increases > 0 ? `Level ${state.level} → ${projectedLevel}` : `Level ${state.level}`;
		this.levelRunesHeldEl.textContent = state.runes.toLocaleString('en-GB');
		this.levelHpPreviewEl.textContent = String(getMaxHp(draft.vigor));
		this.levelSpPreviewEl.textContent = String(getMaxStamina(draft.endurance));
		this.levelMovePreviewEl.textContent = `${Math.round(getMovementSpeedMultiplier(draft.endurance) * 100)}%`;
		this.levelDodgePreviewEl.textContent = `${Math.round(getDodgeDistanceMultiplier(draft.endurance) * 100)}%`;
		this.levelCostEl.textContent = cost.toLocaleString('en-GB');
		this.levelCostEl.classList.toggle('is-unaffordable', cost > state.runes);
		this.confirmLevelUpEl.disabled = increases === 0 || cost > state.runes;
		for (const stat of PLAYER_ATTRIBUTE_ORDER) {
			const valueEl = this.graceMenuEl.querySelector<HTMLElement>(`[data-level-value="${stat}"]`);
			if (valueEl) {
				valueEl.textContent = draft[stat] === state.attributes[stat]
					? String(draft[stat])
					: `${state.attributes[stat]} → ${draft[stat]}`;
			}
		}
		this.graceMenuEl.querySelectorAll<HTMLButtonElement>('[data-level-stat]').forEach((button) => {
			const stat = button.dataset.levelStat as keyof PlayerAttributes | undefined;
			const delta = Number(button.dataset.levelDelta ?? 0);
			if (!stat) return;
			button.disabled = delta < 0 ? draft[stat] <= state.attributes[stat] : draft[stat] >= 99;
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
		this.beginEl.hidden = !visible;
		this.secondFightEl.hidden = !visible;
		this.loadGameEl.hidden = !visible;
		this.menuEl.hidden = visible;
		if (visible) this.saveListPanelEl.hidden = true;
	}

	showMainMenu(hasSaves: boolean): void {
		this.eyebrowEl.textContent = 'THE ROAD IS OPEN.';
		this.titleEl.innerHTML = 'ASHEN <span>VOW</span>';
		this.descriptionEl.innerHTML = 'Enter the Ashen Wilds and follow the old road toward the Hollow King.';
		this.beginEl.innerHTML = '<small>MOST RECENT JOURNEY</small><strong>CONTINUE</strong><span>→</span>';
		this.secondFightEl.innerHTML = '<small>BEGIN AGAIN</small><strong>NEW GAME</strong><span>＋</span>';
		this.loadGameEl.innerHTML = '<small>CHOOSE A JOURNEY</small><strong>LOAD GAME</strong><span>→</span>';
		this.beginEl.disabled = !hasSaves;
		this.loadGameEl.disabled = !hasSaves;
		this.tipEl.textContent = hasSaves
			? 'Continue your latest journey, begin a new one, or choose any local save.'
			: 'No journeys saved yet. Begin a new game to create your first save.';
		this.setMenuChoicesVisible(true);
		this.setGameplayScene(null);
	}

	showLoadGameMenu(saves: SaveSummary[]): void {
		this.eyebrowEl.textContent = 'CHOOSE YOUR JOURNEY';
		this.titleEl.textContent = 'LOAD GAME';
		this.descriptionEl.textContent = 'Local saves stored on this browser.';
		this.beginEl.hidden = true;
		this.secondFightEl.hidden = true;
		this.loadGameEl.hidden = true;
		this.menuEl.hidden = true;
		this.saveListPanelEl.hidden = false;
		this.saveListEl.replaceChildren();

		for (const save of saves) {
			const button = document.createElement('button');
			button.type = 'button';
			button.className = 'save-entry';
			button.dataset.saveId = save.id;
			const updated = new Date(save.updatedAt).toLocaleString('en-GB', {
				dateStyle: 'medium',
				timeStyle: 'short',
			});
			button.innerHTML = `<span><strong>${save.name}</strong><small>Level ${save.level} · ${save.runes.toLocaleString('en-GB')} runes</small></span><time>${updated}</time><b>→</b>`;
			this.saveListEl.append(button);
		}
		this.tipEl.textContent = `${saves.length} saved journey${saves.length === 1 ? '' : 's'} · newest first`;
		this.setGameplayScene(null);
	}

	showPauseScreen(inWorld: boolean): void {
		this.saveListPanelEl.hidden = true;
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
		this.saveListPanelEl.hidden = true;
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
		this.saveListPanelEl.hidden = true;
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
		this.saveListPanelEl.hidden = true;
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
