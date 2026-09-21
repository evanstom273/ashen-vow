import { getFightDefinition } from '../content/fights.ts';
import { getAreaDefinition } from '../content/areas.ts';
import { PLAYER_TUNING } from '../content/playerDefaults.ts';
import {
	canCastEquippedSpell,
	getEquippedSpellDefinition,
	getEquippedSpellState,
	getSpellCycleLabel,
} from '../state/spellState.ts';
import { isSpellCharged } from '../content/spells.ts';
import { getTravelFormDefinition } from '../content/travelForms.ts';
import type { GameState } from '../types.ts';

function $(id: string): HTMLElement {
	const element = document.getElementById(id);
	if (!element) {
		throw new Error(`Missing DOM element: #${id}`);
	}
	return element;
}

export class DomHud {
	private readonly noticeEl = $('notice');
	private readonly interactionPromptEl = $('interactionPrompt');
	private readonly hpEl = $('hp') as HTMLElement;
	private readonly spEl = $('sp') as HTMLElement;
	private readonly stateEl = $('state');
	private readonly bossHpEl = $('bossHp') as HTMLElement;
	private readonly phaseEl = $('phase');
	private readonly bossNameEl = $('bossName');
	private readonly locationNameEl = $('locationName');
	private readonly locationSubtitleEl = $('locationSubtitle');
	private readonly slotSpellNameEl = $('slotSpellName');
	private readonly slotSpellCastsEl = $('slotSpellCasts');
	private readonly slotSpellIndexEl = $('slotSpellIndex');
	private readonly slotFlasksEl = $('slotFlasks');
	private readonly slotUtilityEl = $('slotUtility');
	private readonly slotUtilityTagEl = $('slotUtilityTag');
	private readonly slotUtilityTitleEl = $('slotUtilityTitle');
	private readonly slotUtilityMetaEl = $('slotUtilityMeta');
	private readonly slotRightEl = $('slotRight');
	private readonly slotContextEl = $('slotContext');
	private readonly slotContextTagEl = $('slotContextTag');
	private readonly slotContextTitleEl = $('slotContextTitle');
	private readonly slotContextMetaEl = $('slotContextMeta');

	setContextAction(mode: 'roll' | 'grace' | 'gate' | 'blocked' | 'exit'): void {
		this.slotContextEl.classList.toggle('is-context', mode !== 'roll');
		if (mode === 'grace') {
			this.slotContextTagEl.textContent = 'Grace';
			this.slotContextTitleEl.textContent = 'Rest';
			this.slotContextMetaEl.textContent = 'tap';
			this.slotContextEl.setAttribute('aria-label', 'Rest at grace');
		} else if (mode === 'gate') {
			this.slotContextTagEl.textContent = 'Enter';
			this.slotContextTitleEl.textContent = 'Fort';
			this.slotContextMetaEl.textContent = 'tap';
			this.slotContextEl.setAttribute('aria-label', 'Enter Aeron\'s fort');
		} else if (mode === 'exit') {
			this.slotContextTagEl.textContent = 'Return';
			this.slotContextTitleEl.textContent = 'Leave';
			this.slotContextMetaEl.textContent = 'tap';
			this.slotContextEl.setAttribute('aria-label', 'Leave the arena');
		} else if (mode === 'blocked') {
			this.slotContextTagEl.textContent = 'Fort';
			this.slotContextTitleEl.textContent = 'Silent';
			this.slotContextMetaEl.textContent = 'rest to restore';
			this.slotContextEl.setAttribute('aria-label', 'The Hollow King is slain; rest at grace to restore him');
		} else {
			this.slotContextTagEl.textContent = 'Roll';
			this.slotContextTitleEl.textContent = 'Dodge';
			this.slotContextMetaEl.textContent = 'tap · hold sprint';
			this.slotContextEl.setAttribute('aria-label', 'Roll; hold to sprint');
		}
	}

	setInteractionPrompt(message: string | null): void {
		this.interactionPromptEl.textContent = message ?? '';
		document.body.classList.toggle('near-interaction', Boolean(message));
	}

	announceWithTimer(state: GameState, message: string, duration = 2): void {
		this.noticeEl.textContent = message;
		state.noticeTime = duration;
	}

	tickNotice(state: GameState, dt: number): void {
		state.noticeTime -= dt;
		if (state.noticeTime <= 0) {
			this.noticeEl.textContent = '';
		}
	}

	sync(state: GameState): void {
		const { player, boss } = state;
		const fight = getFightDefinition(state.fightId);
		const area = getAreaDefinition(state.currentAreaId);
		const spell = getEquippedSpellDefinition(state);
		const spellState = getEquippedSpellState(state);

		this.hpEl.style.width = `${player.hp}%`;
		this.spEl.style.width = `${player.sp}%`;
		// Always scale against baseMax so temporary max-HP reduction never looks like a heal.
		this.bossHpEl.style.width = `${(boss.hp / boss.baseMax) * 100}%`;
		this.bossNameEl.textContent = fight.displayName;
		this.locationNameEl.textContent = area.displayName;
		this.locationSubtitleEl.textContent = area.subtitle;
		this.phaseEl.textContent = state.phase2 ? fight.phases.phase2.label : fight.phases.phase1.label;

		this.slotSpellNameEl.textContent = spell.displayName;
		this.slotSpellCastsEl.textContent = String(spellState.remainingCasts);
		this.slotSpellIndexEl.textContent = getSpellCycleLabel(state);
		const travelForm = getTravelFormDefinition(player.selectedTravelForm);
		const transformSelected = state.utilityItem === 'transform';
		this.slotUtilityEl.classList.toggle('is-transform', transformSelected);
		this.slotUtilityTagEl.textContent = transformSelected ? 'Form' : '✦';
		this.slotUtilityTitleEl.textContent = transformSelected
			? (player.transformed || player.transformProgress > 0.5 ? 'Return' : travelForm.shortName)
			: 'Flask';
		this.slotFlasksEl.textContent = transformSelected ? '◇' : String(player.flasks);
		this.slotUtilityMetaEl.textContent = transformSelected
			? 'tap cycle · hold shift'
			: 'tap cycle · hold drink';
		this.slotRightEl.classList.toggle('is-charging', state.charging);
		this.slotRightEl.classList.toggle('is-ready', canCastEquippedSpell(state));

		this.stateEl.textContent = player.transformProgress > 0 && player.transformProgress < 1
			? 'FORM SHIFTING…'
			: player.transformed
				? `${travelForm.displayName} · ${player.sprinting ? 'SPRINTING' : 'TRAVELLING'}`
				: player.heal > 0
			? 'DRINKING…'
				: state.charging
					? isSpellCharged(spell, state.charge)
						? 'SORCERY CHARGED'
						: 'GATHERING LIGHT'
				: spellState.remainingCasts <= 0
					? 'NO CASTS REMAIN'
					: spellState.cooldownRemaining > 0
						? 'SORCERY COOLING'
						: player.sp < PLAYER_TUNING.staminaLowThreshold
							? 'STAMINA LOW'
							: 'UNBROKEN';
	}
}
