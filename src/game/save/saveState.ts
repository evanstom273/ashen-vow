import { createInitialGameState, createPlayerState } from '../state/createState.ts';
import { createWorldEnemyStates } from '../state/worldEnemyState.ts';
import type { GameState } from '../types.ts';
import { SAVE_VERSION, type SaveGameSnapshot } from './saveTypes.ts';

export function createSaveSnapshot(state: GameState): SaveGameSnapshot {
	return {
		saveVersion: SAVE_VERSION,
		level: state.level,
		attributes: { ...state.attributes },
		runes: state.runes,
		attempts: state.attempts,
		world: structuredClone(state.world),
		selectedTravelForm: state.player.selectedTravelForm,
		utilityItem: state.utilityItem,
		equippedSpellId: state.equippedSpellId,
	};
}

export function applySaveSnapshot(state: GameState, snapshot: SaveGameSnapshot): void {
	if (snapshot.saveVersion !== SAVE_VERSION) {
		throw new Error(`Unsupported save version: ${snapshot.saveVersion}`);
	}

	const fresh = createInitialGameState();
	fresh.level = snapshot.level;
	fresh.attributes = { ...snapshot.attributes };
	fresh.runes = snapshot.runes;
	fresh.attempts = snapshot.attempts;
	fresh.world = structuredClone(snapshot.world);
	fresh.player = createPlayerState(fresh.attributes);
	fresh.player.selectedTravelForm = snapshot.selectedTravelForm;
	fresh.utilityItem = snapshot.utilityItem;
	fresh.equippedSpellId = snapshot.equippedSpellId;
	fresh.worldEnemies = createWorldEnemyStates(fresh.world.enemyConfigs);
	fresh.worldEnemyProjectiles = [];

	Object.assign(state, fresh);
}
