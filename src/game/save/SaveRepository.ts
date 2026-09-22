import Dexie, { type Table } from 'dexie';
import type { GameState } from '../types.ts';
import { createSaveSnapshot } from './saveState.ts';
import type { SaveRecord, SaveSummary } from './saveTypes.ts';

class AshenVowDatabase extends Dexie {
	saves!: Table<SaveRecord, string>;

	constructor() {
		super('AshenVow');
		this.version(1).stores({
			saves: '&id, updatedAt, createdAt',
		});
	}
}

const db = new AshenVowDatabase();

function toSummary(record: SaveRecord): SaveSummary {
	return {
		id: record.id,
		name: record.name,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
		level: record.level,
		runes: record.runes,
	};
}

export class SaveRepository {
	async list(): Promise<SaveSummary[]> {
		const records = await db.saves.orderBy('updatedAt').reverse().toArray();
		return records.map(toSummary);
	}

	async get(id: string): Promise<SaveRecord | undefined> {
		return db.saves.get(id);
	}

	async getLatest(): Promise<SaveRecord | undefined> {
		const records = await db.saves.orderBy('updatedAt').reverse().limit(1).toArray();
		return records[0];
	}

	async create(state: GameState): Promise<SaveRecord> {
		const now = Date.now();
		const existingCount = await db.saves.count();
		const snapshot = createSaveSnapshot(state);
		const record: SaveRecord = {
			id: crypto.randomUUID(),
			name: `Journey ${existingCount + 1}`,
			createdAt: now,
			updatedAt: now,
			level: snapshot.level,
			runes: snapshot.runes,
			snapshot,
		};
		await db.saves.add(record);
		return record;
	}

	async save(id: string, state: GameState): Promise<SaveRecord> {
		const existing = await db.saves.get(id);
		if (!existing) throw new Error(`Save not found: ${id}`);

		const snapshot = createSaveSnapshot(state);
		const record: SaveRecord = {
			...existing,
			updatedAt: Date.now(),
			level: snapshot.level,
			runes: snapshot.runes,
			snapshot,
		};
		await db.saves.put(record);
		return record;
	}
}
