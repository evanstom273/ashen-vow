export type SpellId = 'ashen-bolt';

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
};

export const DEFAULT_EQUIPPED_SPELL: SpellId = 'ashen-bolt';

export function getSpellDefinition(id: SpellId): SpellDefinition {
	return SPELLS[id];
}
