/** Reusable status/effect identifiers — content layer only. */
export type EffectId = 'ash-burn' | 'death-mark';

export type DamageType = 'physical' | 'arcane' | 'ash' | 'void' | 'death';

export type EffectKind = 'damageOverTime' | 'maxHealthReduction';

export interface DotEffectParams {
	tickDamage: number;
	tickInterval: number;
}

export interface DamageOverTimeEffectDefinition {
	kind: 'damageOverTime';
	id: EffectId;
	displayName: string;
	duration: number;
	damageType: DamageType;
	dot: DotEffectParams;
	/** Optional tint for generic status VFX. */
	particleColor: string;
}

export interface MaxHealthReductionEffectDefinition {
	kind: 'maxHealthReduction';
	id: EffectId;
	displayName: string;
	duration: number;
	damageType: DamageType;
	reductionAmount: number;
	/** Optional bundled DoT while the mark persists. */
	dot?: DotEffectParams;
	particleColor: string;
}

export type EffectDefinition = DamageOverTimeEffectDefinition | MaxHealthReductionEffectDefinition;

export const EFFECTS: Record<EffectId, EffectDefinition> = {
	'ash-burn': {
		kind: 'damageOverTime',
		id: 'ash-burn',
		displayName: 'Ash Burn',
		duration: 3,
		damageType: 'ash',
		dot: {
			tickDamage: 8,
			tickInterval: 0.5,
		},
		particleColor: '#5a1830',
	},
	'death-mark': {
		kind: 'maxHealthReduction',
		id: 'death-mark',
		displayName: 'Death Mark',
		duration: 5,
		damageType: 'death',
		reductionAmount: 180,
		dot: {
			tickDamage: 5,
			tickInterval: 1,
		},
		particleColor: '#8b0020',
	},
};

export function getEffectDefinition(id: EffectId): EffectDefinition {
	return EFFECTS[id];
}
