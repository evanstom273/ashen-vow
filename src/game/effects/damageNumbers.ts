import type { GameState } from '../types.ts';

export function spawnDamageNumber(state: GameState, x: number, y: number, amount: number, heavy = false): void {
	state.damageNumbers.push({
		x: x + (Math.random() - 0.5) * 14,
		y: y - 28,
		vx: (Math.random() - 0.5) * 14,
		vy: heavy ? -38 : -30,
		t: 0.9,
		max: 0.9,
		amount: Math.max(0, Math.round(amount)),
		heavy,
	});
}

export function updateDamageNumbers(state: GameState, dt: number): void {
	state.damageNumbers = state.damageNumbers.filter((entry) => {
		entry.x += entry.vx * dt;
		entry.y += entry.vy * dt;
		entry.vy += 18 * dt;
		entry.t -= dt;
		return entry.t > 0;
	});
}
