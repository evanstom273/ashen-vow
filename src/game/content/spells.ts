import type { DamageType, EffectId } from './effects.ts';
import type { SpellVisualProfile } from './spellVisuals.ts';
import {
	ASHEN_BOLT_VISUAL,
	CINDER_WREATH_VISUAL,
	HOLLOW_ARC_VISUAL,
	HOLLOW_EDICT_VISUAL,
} from './spellVisuals.ts';

export type SpellId = 'ashen-bolt' | 'hollow-arc' | 'cinder-wreath' | 'hollow-edict';

export interface SpellProjectileConfig {
	speed: number;
	lifetime: number;
	hitRadius: number;
}

export interface SpellChargeConfig {
	threshold: number;
	maxCharge: number;
	chargingMoveSpeed: number;
	basicDamage: number;
	chargedDamage: number;
}

export interface SpellOnHitEffectRef {
	effectId: EffectId;
}

export interface SpellOnHitConfig {
	effects: readonly SpellOnHitEffectRef[];
}

export interface SpellDefinition {
	id: SpellId;
	displayName: string;
	maxCasts: number;
	cooldown: number;
	rechargeAtRest: boolean;
	damageType: DamageType;
	projectile: SpellProjectileConfig;
	charge: SpellChargeConfig;
	onHit: SpellOnHitConfig;
	visual: SpellVisualProfile;
}

export const SPELLS: Record<SpellId, SpellDefinition> = {
	'ashen-bolt': {
		id: 'ashen-bolt',
		displayName: 'Ashen Bolt',
		maxCasts: 8,
		cooldown: 0.45,
		rechargeAtRest: true,
		damageType: 'arcane',
		projectile: {
			speed: 460,
			lifetime: 2,
			hitRadius: 38,
		},
		charge: {
			threshold: 0.8,
			maxCharge: 1.4,
			chargingMoveSpeed: 95,
			basicDamage: 65,
			chargedDamage: 150,
		},
		onHit: { effects: [] },
		visual: ASHEN_BOLT_VISUAL,
	},
	'hollow-arc': {
		id: 'hollow-arc',
		displayName: 'Hollow Arc',
		maxCasts: 12,
		cooldown: 0.32,
		rechargeAtRest: true,
		damageType: 'arcane',
		projectile: {
			speed: 520,
			lifetime: 1.6,
			hitRadius: 32,
		},
		charge: {
			threshold: 0.65,
			maxCharge: 1.1,
			chargingMoveSpeed: 100,
			basicDamage: 45,
			chargedDamage: 95,
		},
		onHit: { effects: [] },
		visual: HOLLOW_ARC_VISUAL,
	},
	'cinder-wreath': {
		id: 'cinder-wreath',
		displayName: 'Cinder Wreath',
		maxCasts: 6,
		cooldown: 0.55,
		rechargeAtRest: true,
		damageType: 'ash',
		projectile: {
			speed: 400,
			lifetime: 1.8,
			hitRadius: 34,
		},
		charge: {
			threshold: 0.75,
			maxCharge: 1.3,
			chargingMoveSpeed: 90,
			basicDamage: 55,
			chargedDamage: 110,
		},
		onHit: { effects: [{ effectId: 'ash-burn' }] },
		visual: CINDER_WREATH_VISUAL,
	},
	'hollow-edict': {
		id: 'hollow-edict',
		displayName: 'Hollow Edict',
		maxCasts: 4,
		cooldown: 0.85,
		rechargeAtRest: true,
		damageType: 'death',
		projectile: {
			speed: 380,
			lifetime: 2.2,
			hitRadius: 40,
		},
		charge: {
			threshold: 0.9,
			maxCharge: 1.5,
			chargingMoveSpeed: 80,
			basicDamage: 80,
			chargedDamage: 160,
		},
		onHit: { effects: [{ effectId: 'death-mark' }] },
		visual: HOLLOW_EDICT_VISUAL,
	},
};

/** Player-facing cycle order for the top spell slot. */
export const SPELL_CYCLE_ORDER: readonly SpellId[] = [
	'ashen-bolt',
	'hollow-arc',
	'cinder-wreath',
	'hollow-edict',
];

export const DEFAULT_EQUIPPED_SPELL: SpellId = SPELL_CYCLE_ORDER[0];

export function getSpellDefinition(id: SpellId): SpellDefinition {
	return SPELLS[id];
}

export function getSpellDamage(spell: SpellDefinition, powered: boolean): number {
	return powered ? spell.charge.chargedDamage : spell.charge.basicDamage;
}

export function isSpellCharged(spell: SpellDefinition, charge: number): boolean {
	return charge > spell.charge.threshold;
}
