import type { PlayerState } from '../types.ts';

export const PLAYER_MAX_HP = 100;
export const PLAYER_MAX_SP = 100;

export const PLAYER_START: Omit<PlayerState, 'roll' | 'inv' | 'cd' | 'heal' | 'swing' | 'regen'> = {
	x: 500,
	y: 550,
	hp: PLAYER_MAX_HP,
	sp: PLAYER_MAX_SP,
	flasks: 3,
	angle: -Math.PI / 2,
	dx: 0,
	dy: -1,
};

export const PLAYER_TUNING = {
	dodge: {
		staminaCost: 25,
		duration: 0.34,
		invulnerability: 0.34,
		speed: 420,
		regenLock: 0.65,
		cooldownGate: 0.2,
	},
	strike: {
		staminaCost: 18,
		cooldown: 0.43,
		swingDuration: 0.22,
		range: 105,
		damage: 65,
		regenLock: 0.65,
	},
	heal: {
		duration: 0.95,
		cooldown: 1,
		restore: 58,
	},
	movement: {
		normalSpeed: 175,
		healingSpeed: 65,
	},
	regen: {
		staminaPerSecond: 30,
	},
	invulnerabilityAfterHit: 0.65,
	staminaLowThreshold: 25,
} as const;
