import type { Arena } from './types.ts';

export const TAU = Math.PI * 2;

export const WORLD_WIDTH = 1100;
export const WORLD_HEIGHT = 850;
export const WORLD_CENTER_X = 500;
export const WORLD_CENTER_Y = 370;

export const MAX_DELTA_TIME = 0.033;

export const ARENA: Arena = { x: 500, y: 370, r: 305 };

export const ARENA_BOUNDARY_INSET = 22;

export function clamp(v: number, a: number, b: number): number {
	return Math.max(a, Math.min(b, v));
}

export function dist(a: Vec2Like, b: Vec2Like): number {
	return Math.hypot(a.x - b.x, a.y - b.y);
}

interface Vec2Like {
	x: number;
	y: number;
}
