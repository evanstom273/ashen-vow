import { AERON } from '../content/aeron.ts';
import { PLAYER_TUNING } from '../content/playerDefaults.ts';
import {
	canCastEquippedSpell,
	getEquippedSpellDefinition,
	getEquippedSpellState,
	getSpellCycleLabel,
} from '../state/spellState.ts';
import { isSpellCharged } from '../content/spells.ts';
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
	private readonly hpEl = $('hp') as HTMLElement;
	private readonly spEl = $('sp') as HTMLElement;
	private readonly stateEl = $('state');
	private readonly bossHpEl = $('bossHp') as HTMLElement;
	private readonly phaseEl = $('phase');
	private readonly slotSpellNameEl = $('slotSpellName');
	private readonly slotSpellCastsEl = $('slotSpellCasts');
	private readonly slotSpellIndexEl = $('slotSpellIndex');
	private readonly slotFlasksEl = $('slotFlasks');
	private readonly slotRightEl = $('slotRight');

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
		const spell = getEquippedSpellDefinition(state);
		const spellState = getEquippedSpellState(state);

		this.hpEl.style.width = `${player.hp}%`;
		this.spEl.style.width = `${player.sp}%`;
		this.bossHpEl.style.width = `${(boss.hp / boss.max) * 100}%`;
		this.phaseEl.textContent = state.phase2 ? AERON.phases.phase2.label : AERON.phases.phase1.label;

		this.slotSpellNameEl.textContent = spell.displayName;
		this.slotSpellCastsEl.textContent = String(spellState.remainingCasts);
		this.slotSpellIndexEl.textContent = getSpellCycleLabel(state);
		this.slotFlasksEl.textContent = String(player.flasks);
		this.slotRightEl.classList.toggle('is-charging', state.charging);
		this.slotRightEl.classList.toggle('is-ready', canCastEquippedSpell(state));

		this.stateEl.textContent = player.heal > 0
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
