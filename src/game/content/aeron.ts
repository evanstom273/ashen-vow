import type { BossAttackIndex } from '../types.ts';

interface AttackTiming {
	windup: number;
	attackDuration: number;
}

export interface CrescentSweepAttack extends AttackTiming {
	id: 'crescent-sweep';
	meleeRadius: number;
	damage: number;
}

export interface KingsLungeAttack extends AttackTiming {
	id: 'kings-lunge';
	lungeSpeed: number;
	hitRadius: number;
	damage: number;
}

export interface AshenRuptureAttack extends AttackTiming {
	id: 'ashen-rupture';
	blastRadius: number;
	blastDuration: number;
	damage: number;
	phase2Ring: { maxRadius: number; duration: number };
}

export type AeronAttack = CrescentSweepAttack | KingsLungeAttack | AshenRuptureAttack;

export interface BossPhaseTiming {
	recover: number;
	idle: number;
}

export const AERON = {
	id: 'aeron',
	displayName: 'AERON, THE HOLLOW KING',
	maxHp: 1200,
	spawn: { x: 500, y: 260 },
	idleTimer: 2,
	approachDistance: 88,
	approachSpeed: { phase1: 65, phase2: 88 },
	phaseThreshold: 0.5,
	phases: {
		phase1: {
			label: 'I · THE LAST WATCH',
			recover: 1.2,
			idle: 0.9,
		},
		phase2: {
			label: 'II · THE CROWN REMEMBERS',
			announce: 'THE CROWN REMEMBERS',
			announceDuration: 3,
			windupMultiplier: 0.8,
			recover: 0.85,
			idle: 0.6,
			transitionRecover: 1.8,
			ringHazard: { maxRadius: 370, duration: 2.7 },
		},
	},
	attacks: [
		{
			id: 'crescent-sweep',
			windup: 0.85,
			attackDuration: 0.28,
			meleeRadius: 135,
			damage: 26,
		},
		{
			id: 'kings-lunge',
			windup: 1.05,
			attackDuration: 0.38,
			lungeSpeed: 560,
			hitRadius: 58,
			damage: 30,
		},
		{
			id: 'ashen-rupture',
			windup: 1.2,
			attackDuration: 0.28,
			blastRadius: 100,
			blastDuration: 0.3,
			damage: 32,
			phase2Ring: { maxRadius: 320, duration: 2.3 },
		},
	] as const satisfies readonly [CrescentSweepAttack, KingsLungeAttack, AshenRuptureAttack],
	attackCount: 3,
	combat: {
		meleeRange: 105,
		meleeDamage: 65,
		projectileBasicDamage: 65,
		projectileChargedDamage: 150,
		projectileHitRadius: 38,
	},
} as const;

export function getAttackIndex(combo: number): BossAttackIndex {
	return (combo % AERON.attackCount) as BossAttackIndex;
}

export function getAttackWindup(index: BossAttackIndex, phase2: boolean): number {
	const attack = AERON.attacks[index];
	return phase2 ? attack.windup * AERON.phases.phase2.windupMultiplier : attack.windup;
}

export function getPhaseTiming(phase2: boolean): BossPhaseTiming {
	return phase2 ? AERON.phases.phase2 : AERON.phases.phase1;
}
