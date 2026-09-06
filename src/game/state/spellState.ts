import {
	DEFAULT_EQUIPPED_SPELL,
	getSpellDefinition,
	SPELL_CYCLE_ORDER,
	SPELLS,
	type SpellId,
} from '../content/spells.ts';
import type { GameState, SpellRuntimeState } from '../types.ts';

export function createSpellRuntimeState(id: SpellId): SpellRuntimeState {
	return {
		remainingCasts: getSpellDefinition(id).maxCasts,
		cooldownRemaining: 0,
	};
}

export function createInitialSpellState(): GameState['spells'] {
	const spells = {} as GameState['spells'];
	for (const id of Object.keys(SPELLS) as SpellId[]) {
		spells[id] = createSpellRuntimeState(id);
	}
	return spells;
}

export function getEquippedSpellDefinition(state: GameState) {
	return getSpellDefinition(state.equippedSpellId);
}

export function getEquippedSpellState(state: GameState): SpellRuntimeState {
	return state.spells[state.equippedSpellId];
}

export function canCastEquippedSpell(state: GameState): boolean {
	const spell = getEquippedSpellState(state);
	return spell.remainingCasts > 0 && spell.cooldownRemaining <= 0;
}

export function cycleEquippedSpell(state: GameState): void {
	const currentIndex = SPELL_CYCLE_ORDER.indexOf(state.equippedSpellId);
	const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % SPELL_CYCLE_ORDER.length : 0;
	state.equippedSpellId = SPELL_CYCLE_ORDER[nextIndex];
	state.charging = false;
	state.charge = 0;
}

/** Replenish spell charges at rest/checkpoints (entering the sanctum or retrying). */
export function replenishSpellsAtRest(state: GameState): void {
	for (const id of Object.keys(SPELLS) as SpellId[]) {
		const definition = getSpellDefinition(id);
		if (!definition.rechargeAtRest) continue;
		state.spells[id].remainingCasts = definition.maxCasts;
		state.spells[id].cooldownRemaining = 0;
	}
}

export function initializeSpellLoadout(state: GameState): void {
	state.equippedSpellId = DEFAULT_EQUIPPED_SPELL;
	state.spells = createInitialSpellState();
}

export function updateSpellCooldowns(state: GameState, dt: number): void {
	for (const spell of Object.values(state.spells)) {
		if (spell.cooldownRemaining > 0) {
			spell.cooldownRemaining = Math.max(0, spell.cooldownRemaining - dt);
		}
	}
}

export function consumeEquippedSpellCast(state: GameState): void {
	const definition = getEquippedSpellDefinition(state);
	const spell = getEquippedSpellState(state);
	spell.remainingCasts = Math.max(0, spell.remainingCasts - 1);
	spell.cooldownRemaining = definition.cooldown;
	state.player.cd = definition.cooldown;
}

export function getSpellCycleLabel(state: GameState): string {
	const index = SPELL_CYCLE_ORDER.indexOf(state.equippedSpellId);
	return `${index + 1}/${SPELL_CYCLE_ORDER.length}`;
}
