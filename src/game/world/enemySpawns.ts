import type { Vec2 } from '../types.ts';

export interface EnemySpawnDefinition {
	id: string;
	enemyId: 'fort-guard';
	position: Vec2;
	facing: number;
	patrolPoints: readonly Vec2[];
}

export const FORT_GUARD_SPAWNS: readonly EnemySpawnDefinition[] = [
	{
		id: 'guard-1',
		enemyId: 'fort-guard',
		position: { x: 2645, y: 1335 },
		facing: Math.PI * 0.92,
		patrolPoints: [{ x: 2595, y: 1315 }, { x: 2685, y: 1360 }],
	},
	{
		id: 'guard-2',
		enemyId: 'fort-guard',
		position: { x: 2660, y: 1465 },
		facing: -Math.PI * 0.92,
		patrolPoints: [{ x: 2600, y: 1485 }, { x: 2695, y: 1440 }],
	},
	{
		id: 'guard-3',
		enemyId: 'fort-guard',
		position: { x: 2740, y: 1315 },
		facing: Math.PI,
		patrolPoints: [{ x: 2700, y: 1285 }, { x: 2760, y: 1360 }],
	},
	{
		id: 'guard-4',
		enemyId: 'fort-guard',
		position: { x: 2740, y: 1485 },
		facing: Math.PI,
		patrolPoints: [{ x: 2695, y: 1515 }, { x: 2760, y: 1440 }],
	},
];

export function getEnemySpawn(id: string): EnemySpawnDefinition | undefined {
	return FORT_GUARD_SPAWNS.find((spawn) => spawn.id === id);
}
