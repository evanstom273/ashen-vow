import type { SpellId } from '../content/spells.ts';
import type { PlayerAttributes, TravelFormId, UtilityItemId, WorldState } from '../types.ts';

export const SAVE_VERSION = 1 as const;

export interface SaveGameSnapshotV1 {
	saveVersion: typeof SAVE_VERSION;
	level: number;
	attributes: PlayerAttributes;
	runes: number;
	attempts: number;
	world: WorldState;
	selectedTravelForm: TravelFormId;
	utilityItem: UtilityItemId;
	equippedSpellId: SpellId;
}

export type SaveGameSnapshot = SaveGameSnapshotV1;

export interface SaveRecord {
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;
	level: number;
	runes: number;
	snapshot: SaveGameSnapshot;
}

export interface SaveSummary {
	id: string;
	name: string;
	createdAt: number;
	updatedAt: number;
	level: number;
	runes: number;
}
