import type { PlayerAttributeId, PlayerAttributes, PlayerState } from '../types.ts';

export const STARTING_LEVEL = 1;
export const STARTING_ATTRIBUTE_VALUE = 10;
export const MAX_ATTRIBUTE_VALUE = 99;
export const LEVEL_COST_BASE = 200;
export const LEVEL_COST_GROWTH = 1.075;

export const PLAYER_ATTRIBUTE_ORDER: readonly PlayerAttributeId[] = [
	'vigor',
	'endurance',
	'strength',
	'dexterity',
	'intelligence',
	'faith',
	'arcane',
];

export const PLAYER_ATTRIBUTE_LABELS: Record<PlayerAttributeId, string> = {
	vigor: 'Vigor',
	endurance: 'Endurance',
	strength: 'Strength',
	dexterity: 'Dexterity',
	intelligence: 'Intelligence',
	faith: 'Faith',
	arcane: 'Arcane',
};

export const STARTING_ATTRIBUTES: PlayerAttributes = {
	vigor: STARTING_ATTRIBUTE_VALUE,
	endurance: STARTING_ATTRIBUTE_VALUE,
	strength: STARTING_ATTRIBUTE_VALUE,
	dexterity: STARTING_ATTRIBUTE_VALUE,
	intelligence: STARTING_ATTRIBUTE_VALUE,
	faith: STARTING_ATTRIBUTE_VALUE,
	arcane: STARTING_ATTRIBUTE_VALUE,
};

const VIGOR_HP_POINTS: readonly [number, number][] = [
	[10, 100],
	[20, 190],
	[30, 275],
	[40, 355],
	[50, 425],
	[60, 485],
	[70, 535],
	[80, 575],
	[90, 605],
	[99, 630],
];

const ENDURANCE_STAMINA_POINTS: readonly [number, number][] = [
	[10, 100],
	[20, 205],
	[30, 305],
	[40, 400],
	[50, 490],
	[60, 570],
	[70, 635],
	[80, 685],
	[90, 725],
	[99, 750],
];

function interpolateCurve(value: number, points: readonly [number, number][]): number {
	const clamped = Math.max(points[0]![0], Math.min(points[points.length - 1]![0], value));
	for (let i = 0; i < points.length - 1; i++) {
		const [x0, y0] = points[i]!;
		const [x1, y1] = points[i + 1]!;
		if (clamped <= x1) {
			const t = (clamped - x0) / (x1 - x0);
			return Math.round(y0 + (y1 - y0) * t);
		}
	}
	return points[points.length - 1]![1];
}

export function getMaxHp(vigor: number): number {
	return interpolateCurve(vigor, VIGOR_HP_POINTS);
}

export function getMaxStamina(endurance: number): number {
	return interpolateCurve(endurance, ENDURANCE_STAMINA_POINTS);
}

export function getMovementSpeedMultiplier(endurance: number): number {
	const t = Math.max(0, Math.min(1, (endurance - 10) / 20));
	return 1 + t * 0.10;
}

export function getDodgeDistanceMultiplier(endurance: number): number {
	const t = Math.max(0, Math.min(1, (endurance - 10) / 20));
	return 1 + t * 0.15;
}

export function getLevelUpCost(currentLevel: number): number {
	return Math.round(LEVEL_COST_BASE * LEVEL_COST_GROWTH ** Math.max(0, currentLevel - STARTING_LEVEL));
}

export function getLevelUpCostForCount(currentLevel: number, count: number): number {
	let total = 0;
	for (let i = 0; i < count; i++) total += getLevelUpCost(currentLevel + i);
	return total;
}

export function countAttributeIncreases(base: PlayerAttributes, draft: PlayerAttributes): number {
	return PLAYER_ATTRIBUTE_ORDER.reduce((total, key) => total + Math.max(0, draft[key] - base[key]), 0);
}

export function applyDerivedVitals(player: PlayerState, attributes: PlayerAttributes, refill = false): void {
	const previousMaxHp = player.maxHp;
	const previousMaxSp = player.maxSp;
	player.maxHp = getMaxHp(attributes.vigor);
	player.maxSp = getMaxStamina(attributes.endurance);
	if (refill) {
		player.hp = player.maxHp;
		player.sp = player.maxSp;
		return;
	}
	player.hp = Math.min(player.maxHp, player.hp + Math.max(0, player.maxHp - previousMaxHp));
	player.sp = Math.min(player.maxSp, player.sp + Math.max(0, player.maxSp - previousMaxSp));
}
