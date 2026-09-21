import type { BossAttackIndex, FightId } from '../types.ts';

export interface BossFightDefinition {
	id: FightId;
	displayName: string;
	locationName: string;
	locationSubtitle: string;
	introAnnouncement: string;
	introDialogue: string;
	allowTravelForm: boolean;
	maxHp: number;
	spawn: { x: number; y: number };
	idleTimer: number;
	approachDistance: number;
	approachSpeed: { phase1: number; phase2: number };
	phaseThreshold: number;
	phases: {
		phase1: { label: string; recover: number; idle: number };
		phase2: {
			label: string;
			announce: string;
			announceDuration: number;
			windupMultiplier: number;
			recover: number;
			idle: number;
			transitionRecover: number;
			ringHazard: { maxRadius: number; duration: number };
		};
	};
	attacks: readonly [
		{ id: string; windup: number; attackDuration: number; meleeRadius: number; damage: number },
		{ id: string; windup: number; attackDuration: number; lungeSpeed: number; hitRadius: number; damage: number },
		{
			id: string;
			windup: number;
			attackDuration: number;
			blastRadius: number;
			blastDuration: number;
			damage: number;
			phase2Ring: { maxRadius: number; duration: number };
		},
	];
	visuals: {
		arena: 'sanctum' | 'orrery';
		boss: 'hollow-king' | 'star-seer';
		accent: string;
		accentSoft: string;
		hazard: string;
		hazardSoft: string;
		phaseBurst: string;
		trail: string;
	};
	copy: {
		deathEyebrow: string;
		deathDescription: string;
		victoryEyebrow: string;
		victoryDescription: string;
		victoryTip: string;
	};
}

const AERON_FIGHT: BossFightDefinition = {
	id: 'aeron',
	displayName: 'AERON, THE HOLLOW KING',
	locationName: 'THE SUNKEN SANCTUM',
	locationSubtitle: 'A duel at the end of an age',
	introAnnouncement: 'THE LAST WATCH',
	introDialogue: 'You crossed a dead kingdom for this. Come, then — let the crown remember you.',
	allowTravelForm: false,
	maxHp: 1200,
	spawn: { x: 500, y: 260 },
	idleTimer: 2,
	approachDistance: 88,
	approachSpeed: { phase1: 65, phase2: 88 },
	phaseThreshold: 0.5,
	phases: {
		phase1: { label: 'I · THE LAST WATCH', recover: 1.2, idle: 0.9 },
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
		{ id: 'crescent-sweep', windup: 0.85, attackDuration: 0.28, meleeRadius: 135, damage: 26 },
		{ id: 'kings-lunge', windup: 1.05, attackDuration: 0.38, lungeSpeed: 560, hitRadius: 58, damage: 30 },
		{
			id: 'ashen-rupture',
			windup: 1.2,
			attackDuration: 0.28,
			blastRadius: 100,
			blastDuration: 0.3,
			damage: 32,
			phase2Ring: { maxRadius: 320, duration: 2.3 },
		},
	],
	visuals: {
		arena: 'sanctum',
		boss: 'hollow-king',
		accent: '#d09b66',
		accentSoft: '#d09b6630',
		hazard: '#f2b06ca0',
		hazardSoft: '#eac78a55',
		phaseBurst: '#f4a45c',
		trail: '#b19563',
	},
	copy: {
		deathEyebrow: 'THE SANCTUM REMEMBERS',
		deathDescription: 'Read the wind-up. Dodge through the blow.<br>Even a king must pause to breathe.',
		victoryEyebrow: 'THE WATCH IS ENDED',
		victoryDescription: 'The hollow crown falls silent.<br>A new dawn belongs to no king.',
		victoryTip: 'The last king has fallen.',
	},
};

const VAEL_FIGHT: BossFightDefinition = {
	id: 'vael',
	displayName: 'VAEL, THE STARVED SEER',
	locationName: 'THE SHATTERED ORRERY',
	locationSubtitle: 'Where dead stars still turn',
	introAnnouncement: 'THE ORRERY WAKES',
	introDialogue: 'I have watched your path in broken stars. It ends beneath this sky.',
	allowTravelForm: false,
	maxHp: 980,
	spawn: { x: 500, y: 245 },
	idleTimer: 1.5,
	approachDistance: 150,
	approachSpeed: { phase1: 52, phase2: 72 },
	phaseThreshold: 0.55,
	phases: {
		phase1: { label: 'I · BLIND CONSTELLATION', recover: 1.05, idle: 0.75 },
		phase2: {
			label: 'II · THE SKY OPENS',
			announce: 'THE SKY OPENS',
			announceDuration: 3,
			windupMultiplier: 0.72,
			recover: 0.72,
			idle: 0.48,
			transitionRecover: 1.55,
			ringHazard: { maxRadius: 345, duration: 2.45 },
		},
	},
	attacks: [
		{ id: 'constellation-fall', windup: 0.92, attackDuration: 0.22, meleeRadius: 112, damage: 22 },
		{ id: 'celestial-sweep', windup: 1.05, attackDuration: 1.5, lungeSpeed: 690, hitRadius: 48, damage: 27 },
		{
			id: 'mirror-gate',
			windup: 0.86,
			attackDuration: 0.24,
			blastRadius: 82,
			blastDuration: 0.38,
			damage: 35,
			phase2Ring: { maxRadius: 285, duration: 1.9 },
		},
	],
	visuals: {
		arena: 'orrery',
		boss: 'star-seer',
		accent: '#87b9c7',
		accentSoft: '#87b9c72e',
		hazard: '#a9dce6a0',
		hazardSoft: '#759aa655',
		phaseBurst: '#b7e1df',
		trail: '#78a7b5',
	},
	copy: {
		deathEyebrow: 'THE STARS REFUSE YOUR NAME',
		deathDescription: 'The Seer reads motion before steel.<br>Break the rhythm. Leave the omen unfinished.',
		victoryEyebrow: 'THE ORRERY FALLS STILL',
		victoryDescription: 'The final lens cracks in silence.<br>No star remains to answer Vael.',
		victoryTip: 'The Starved Seer has gone dark.',
	},
};

export const FIGHTS: Record<FightId, BossFightDefinition> = {
	aeron: AERON_FIGHT,
	vael: VAEL_FIGHT,
};

export function getFightDefinition(id: FightId): BossFightDefinition {
	return FIGHTS[id];
}

export function getAttackIndex(combo: number): BossAttackIndex {
	return (combo % 3) as BossAttackIndex;
}

export function getAttackWindup(fight: BossFightDefinition, index: BossAttackIndex, phase2: boolean): number {
	const attack = fight.attacks[index];
	return phase2 ? attack.windup * fight.phases.phase2.windupMultiplier : attack.windup;
}

export function getPhaseTiming(fight: BossFightDefinition, phase2: boolean) {
	return phase2 ? fight.phases.phase2 : fight.phases.phase1;
}
