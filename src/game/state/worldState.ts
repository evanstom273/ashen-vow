import type { FightId, WorldState } from '../types.ts';
import { generateEnemyConfigs } from './worldEnemyState.ts';

const FIGHT_IDS: readonly FightId[] = ['aeron', 'vael'];

export function createInitialWorldState(): WorldState {
	const enemySeed = Math.floor(Math.random() * 0xffffffff) >>> 0;
	return {
		bosses: {
			aeron: { alive: true, defeatedCount: 0 },
			vael: { alive: true, defeatedCount: 0 },
		},
		enemySeed,
		enemyConfigs: generateEnemyConfigs(enemySeed),
		flags: {},
		activeCheckpointId: null,
	};
}

export function markBossDefeated(world: WorldState, fightId: FightId): void {
	const boss = world.bosses[fightId];
	boss.alive = false;
	boss.defeatedCount += 1;
}

export function respawnBoss(world: WorldState, fightId: FightId): void {
	world.bosses[fightId].alive = true;
}

export function respawnAllBosses(world: WorldState): void {
	for (const fightId of FIGHT_IDS) {
		respawnBoss(world, fightId);
	}
}
