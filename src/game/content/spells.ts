export type SpellId = 'ashen-bolt' | 'hollow-arc';

export interface SpellDefinition {
	id: SpellId;
	displayName: string;
	maxCasts: number;
	cooldown: number;
	rechargeAtRest: boolean;
	projectileSpeed: number;
	projectileLifetime: number;
	basicDamage: number;
	chargedDamage: number;
	chargeThreshold: number;
	maxCharge: number;
	hitRadius: number;
	chargingMoveSpeed: number;
}

export const SPELLS: Record<SpellId, SpellDefinition> = {
	'ashen-bolt': {
		id: 'ashen-bolt',
		displayName: 'Ashen Bolt',
		maxCasts: 8,
		cooldown: 0.45,
		rechargeAtRest: true,
		projectileSpeed: 460,
		projectileLifetime: 2,
		basicDamage: 65,
		chargedDamage: 150,
		chargeThreshold: 0.8,
		maxCharge: 1.4,
		hitRadius: 38,
		chargingMoveSpeed: 95,
	},
	'hollow-arc': {
		id: 'hollow-arc',
		displayName: 'Hollow Arc',
		maxCasts: 12,
		cooldown: 0.32,
		rechargeAtRest: true,
		projectileSpeed: 520,
		projectileLifetime: 1.6,
		basicDamage: 45,
		chargedDamage: 95,
		chargeThreshold: 0.65,
		maxCharge: 1.1,
		hitRadius: 32,
		chargingMoveSpeed: 100,
	},
};

/** Player-facing cycle order for the top spell slot. */
export const SPELL_CYCLE_ORDER: readonly SpellId[] = ['ashen-bolt', 'hollow-arc'];

export const DEFAULT_EQUIPPED_SPELL: SpellId = SPELL_CYCLE_ORDER[0];

export function getSpellDefinition(id: SpellId): SpellDefinition {
	return SPELLS[id];
}
