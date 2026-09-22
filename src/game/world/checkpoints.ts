import { replenishSpellsAtRest } from '../state/spellState.ts';
import { respawnAllBosses } from '../state/worldState.ts';
import { respawnWorldEnemies } from '../state/worldEnemyState.ts';
import type { GameState } from '../types.ts';

export function reviveAtCheckpoint(state: GameState): void {
	state.player.hp = state.player.maxHp;
	state.player.sp = state.player.maxSp;
	state.player.flasks = 3;
	state.player.heal = 0;
	state.player.roll = 0;
	state.player.inv = 0;
	state.player.cd = 0;
	state.charging = false;
	state.charge = 0;
	replenishSpellsAtRest(state);
}

export function restAtCheckpoint(state: GameState, checkpointId: string): void {
	state.world.activeCheckpointId = checkpointId;
	reviveAtCheckpoint(state);
	respawnAllBosses(state.world);
	state.worldEnemies = respawnWorldEnemies(state.world.enemyConfigs);
	state.worldEnemyProjectiles = [];
}
