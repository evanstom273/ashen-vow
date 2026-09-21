import type { AreaDefinition, AreaId, FightId } from '../types.ts';

export const AREAS: Record<AreaId, AreaDefinition> = {
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
