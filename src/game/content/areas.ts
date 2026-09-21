import type { AreaDefinition, AreaId, FightId } from '../types.ts';
import { OVERWORLD_SIZE, GRACE_POSITION, AERON_GATE_POSITION } from '../world/overworldContent.ts';

export const AREAS: Record<AreaId, AreaDefinition> = {
	'ashen-wilds': {
		id: 'ashen-wilds',
		kind: 'overworld',
		displayName: 'THE ASHEN WILDS',
		subtitle: 'An old road beneath a dark canopy',
		bounds: { kind: 'rect', minX: 20, maxX: OVERWORLD_SIZE - 20, minY: 20, maxY: OVERWORLD_SIZE - 20 },
		spawns: [
			{ id: 'grace', position: GRACE_POSITION, facing: 0 },
			{ id: 'aeron-return', position: { x: AERON_GATE_POSITION.x - 150, y: AERON_GATE_POSITION.y }, facing: Math.PI },
		],
		exits: [
			{
				id: 'aeron-gate',
				position: AERON_GATE_POSITION,
				targetAreaId: 'aeron-arena',
				targetSpawnId: 'entry',
			},
		],
		artTheme: 'wilds',
	},
	'aeron-arena': {
		id: 'aeron-arena',
		kind: 'boss',
		displayName: 'THE SUNKEN SANCTUM',
		subtitle: 'A duel at the end of an age',
		bounds: { kind: 'circle', x: 500, y: 370, radius: 305, inset: 22 },
		spawns: [{ id: 'entry', position: { x: 500, y: 550 }, facing: -Math.PI / 2 }],
		exits: [],
		fightId: 'aeron',
		artTheme: 'sanctum',
	},
	'vael-arena': {
		id: 'vael-arena',
		kind: 'boss',
		displayName: 'THE SHATTERED ORRERY',
		subtitle: 'Where dead stars still turn',
		bounds: { kind: 'rect', minX: 155, maxX: 845, minY: 145, maxY: 620 },
		spawns: [{ id: 'entry', position: { x: 500, y: 550 }, facing: -Math.PI / 2 }],
		exits: [],
		fightId: 'vael',
		artTheme: 'orrery',
	},
};

export const FIGHT_AREAS: Record<FightId, AreaId> = {
	aeron: 'aeron-arena',
	vael: 'vael-arena',
};

export function getAreaDefinition(id: AreaId): AreaDefinition {
	return AREAS[id];
}

export function getAreaForFight(fightId: FightId): AreaDefinition {
	return getAreaDefinition(FIGHT_AREAS[fightId]);
}

export function getFightForArea(areaId: AreaId): FightId | null {
	return AREAS[areaId].fightId ?? null;
}

export function getAreaSpawn(areaId: AreaId, spawnId: string) {
	const area = getAreaDefinition(areaId);
	return area.spawns.find((spawn) => spawn.id === spawnId) ?? area.spawns[0];
}
