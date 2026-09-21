import type { EnemyCategory, EnemyControllerId, EnemyId } from '../types.ts';

export interface EnemyDefinition {
	id: EnemyId;
	category: EnemyCategory;
	displayName: string;
	maxHp: number;
	runeReward: number;
	controller: EnemyControllerId;
}

export const ENEMIES: Record<EnemyId, EnemyDefinition> = {
	aeron: {
		id: 'aeron',
		category: 'boss',
		displayName: 'AERON, THE HOLLOW KING',
		maxHp: 1200,
		runeReward: 0,
		controller: 'aeron',
	},
	vael: {
		id: 'vael',
		category: 'boss',
		displayName: 'VAEL, THE STARVED SEER',
		maxHp: 980,
		runeReward: 0,
		controller: 'vael',
	},
};

export function getEnemyDefinition(id: EnemyId): EnemyDefinition {
	return ENEMIES[id];
}
