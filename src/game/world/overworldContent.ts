import type { PlayerState, Vec2 } from '../types.ts';

export const OVERWORLD_METERS = 250;
export const WORLD_UNITS_PER_METER = 12;
export const OVERWORLD_SIZE = OVERWORLD_METERS * WORLD_UNITS_PER_METER;

export const GRACE_POSITION: Vec2 = { x: 1500, y: 1500 };
export const AERON_GATE_POSITION: Vec2 = { x: 2800, y: 1400 };
export const GRACE_INTERACT_RADIUS = 92;

export type WorldPropKind =
	| 'tree'
	| 'rock'
	| 'stump'
	| 'torch'
	| 'barricade'
	| 'wall'
	| 'tower'
	| 'gate'
	| 'guard'
	| 'cart'
	| 'marker';

export interface WorldProp {
	id: string;
	kind: WorldPropKind;
	x: number;
	y: number;
	sortY: number;
	scale: number;
	collisionRadius?: number;
	collisionRect?: { x: number; y: number; w: number; h: number };
	rotation?: number;
	variant?: number;
}

export const ROUTE_POINTS: readonly Vec2[] = [
	{ x: 1500, y: 1500 },
	{ x: 1720, y: 1490 },
	{ x: 1940, y: 1455 },
	{ x: 2160, y: 1410 },
	{ x: 2380, y: 1380 },
	{ x: 2580, y: 1395 },
	{ x: 2800, y: 1400 },
];

function mulberry32(seed: number): () => number {
	let value = seed >>> 0;
	return () => {
		value += 0x6d2b79f5;
		let t = value;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function pointToSegmentDistance(point: Vec2, a: Vec2, b: Vec2): number {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const lengthSq = dx * dx + dy * dy;
	if (lengthSq <= 0) return Math.hypot(point.x - a.x, point.y - a.y);
	const t = Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq));
	const x = a.x + dx * t;
	const y = a.y + dy * t;
	return Math.hypot(point.x - x, point.y - y);
}

function distanceToRoute(point: Vec2): number {
	let best = Infinity;
	for (let i = 0; i < ROUTE_POINTS.length - 1; i++) {
		best = Math.min(best, pointToSegmentDistance(point, ROUTE_POINTS[i]!, ROUTE_POINTS[i + 1]!));
	}
	return best;
}

function buildForest(): WorldProp[] {
	const random = mulberry32(0xa5e7f013);
	const props: WorldProp[] = [];

	for (let i = 0; i < 190; i++) {
		const x = 80 + random() * (OVERWORLD_SIZE - 160);
		const y = 80 + random() * (OVERWORLD_SIZE - 160);
		const point = { x, y };
		const fromGrace = Math.hypot(x - GRACE_POSITION.x, y - GRACE_POSITION.y);
		const routeDistance = distanceToRoute(point);
		const routeProgress = Math.max(0, Math.min(1, (x - GRACE_POSITION.x) / (AERON_GATE_POSITION.x - GRACE_POSITION.x)));
		const pathClearance = 115 + routeProgress * 115;

		if (fromGrace < 230 || routeDistance < pathClearance) continue;
		if (x > 2650 && y > 1150 && y < 1660) continue;

		const scale = 0.8 + random() * 0.65;
		props.push({
			id: `tree-${i}`,
			kind: 'tree',
			x,
			y,
			sortY: y + 18 * scale,
			scale,
			collisionRadius: 18 * scale,
			rotation: 0,
			variant: Math.floor(random() * 4),
		});
	}

	for (let i = 0; i < 46; i++) {
		const x = 100 + random() * (OVERWORLD_SIZE - 200);
		const y = 100 + random() * (OVERWORLD_SIZE - 200);
		if (Math.hypot(x - GRACE_POSITION.x, y - GRACE_POSITION.y) < 180) continue;
		if (distanceToRoute({ x, y }) < 82) continue;
		const scale = 0.65 + random() * 0.7;
		props.push({
			id: `rock-${i}`,
			kind: random() > 0.16 ? 'rock' : 'stump',
			x,
			y,
			sortY: y + 10 * scale,
			scale,
			collisionRadius: 13 * scale,
			rotation: random() * Math.PI * 2,
		});
	}

	return props;
}

const APPROACH_PROPS: WorldProp[] = [
	{ id: 'marker-1', kind: 'marker', x: 2110, y: 1320, sortY: 1340, scale: 0.9 },
	{ id: 'marker-2', kind: 'marker', x: 2260, y: 1505, sortY: 1525, scale: 1 },
	{ id: 'cart-1', kind: 'cart', x: 2375, y: 1265, sortY: 1300, scale: 1.05, collisionRadius: 34 },
	{ id: 'barricade-1', kind: 'barricade', x: 2480, y: 1285, sortY: 1305, scale: 1, collisionRadius: 28 },
	{ id: 'barricade-2', kind: 'barricade', x: 2525, y: 1510, sortY: 1530, scale: 1.05, collisionRadius: 28 },
	{ id: 'torch-1', kind: 'torch', x: 2570, y: 1300, sortY: 1310, scale: 1 },
	{ id: 'torch-2', kind: 'torch', x: 2600, y: 1505, sortY: 1515, scale: 1 },
	{ id: 'wall-north', kind: 'wall', x: 2820, y: 1160, sortY: 1220, scale: 1, collisionRect: { x: 2790, y: 1000, w: 120, h: 300 } },
	{ id: 'wall-south', kind: 'wall', x: 2820, y: 1640, sortY: 1700, scale: 1, collisionRect: { x: 2790, y: 1500, w: 120, h: 500 } },
	{ id: 'tower-north', kind: 'tower', x: 2800, y: 1260, sortY: 1320, scale: 1.1, collisionRadius: 58 },
	{ id: 'tower-south', kind: 'tower', x: 2800, y: 1540, sortY: 1600, scale: 1.1, collisionRadius: 58 },
	{ id: 'aeron-gate', kind: 'gate', x: AERON_GATE_POSITION.x, y: AERON_GATE_POSITION.y, sortY: 1435, scale: 1, collisionRect: { x: 2768, y: 1344, w: 64, h: 112 } },
];

export const WORLD_PROPS: readonly WorldProp[] = [...buildForest(), ...APPROACH_PROPS];

function pushOutOfCircle(player: PlayerState, prop: WorldProp): void {
	if (!prop.collisionRadius) return;
	const dx = player.x - prop.x;
	const dy = player.y - prop.y;
	const distance = Math.hypot(dx, dy);
	const radius = prop.collisionRadius + 13;
	if (distance >= radius || distance === 0) return;
	player.x = prop.x + (dx / distance) * radius;
	player.y = prop.y + (dy / distance) * radius;
}

function pushOutOfRect(player: PlayerState, rect: { x: number; y: number; w: number; h: number }): void {
	const radius = 13;
	const left = rect.x - radius;
	const right = rect.x + rect.w + radius;
	const top = rect.y - radius;
	const bottom = rect.y + rect.h + radius;
	if (player.x <= left || player.x >= right || player.y <= top || player.y >= bottom) return;

	const distances = [
		{ side: 'left', value: Math.abs(player.x - left) },
		{ side: 'right', value: Math.abs(right - player.x) },
		{ side: 'top', value: Math.abs(player.y - top) },
		{ side: 'bottom', value: Math.abs(bottom - player.y) },
	] as const;
	const nearest = [...distances].sort((a, b) => a.value - b.value)[0]!;
	if (nearest.side === 'left') player.x = left;
	else if (nearest.side === 'right') player.x = right;
	else if (nearest.side === 'top') player.y = top;
	else player.y = bottom;
}

export function resolveOverworldCollisions(player: PlayerState): void {
	for (const prop of WORLD_PROPS) {
		if (prop.collisionRadius) pushOutOfCircle(player, prop);
		if (prop.collisionRect) pushOutOfRect(player, prop.collisionRect);
	}
}

export function isNearGrace(player: PlayerState): boolean {
	return Math.hypot(player.x - GRACE_POSITION.x, player.y - GRACE_POSITION.y) <= GRACE_INTERACT_RADIUS;
}

export function isNearAeronGate(player: PlayerState): boolean {
	return Math.hypot(player.x - AERON_GATE_POSITION.x, player.y - AERON_GATE_POSITION.y) <= 125;
}

export function isInsideAeronGate(player: PlayerState): boolean {
	return player.x >= 2790 && player.x <= 2880 && player.y >= 1350 && player.y <= 1450;
}
