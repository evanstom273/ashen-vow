import { hurtPlayer, type CombatContext } from './combat.ts';

const RING_EXPANSION_SPEED = 155;
const RING_HIT_TOLERANCE = 13;
const RING_DAMAGE = 24;

function distanceToBeam(px: number, py: number, x: number, y: number, angle: number, length: number): number {
	const ex = x + Math.cos(angle) * length;
	const ey = y + Math.sin(angle) * length;
	const dx = ex - x;
	const dy = ey - y;
	const lengthSq = dx * dx + dy * dy;
	if (lengthSq <= 0) return Math.hypot(px - x, py - y);
	const t = Math.max(0, Math.min(1, ((px - x) * dx + (py - y) * dy) / lengthSq));
	const cx = x + dx * t;
	const cy = y + dy * t;
	return Math.hypot(px - cx, py - cy);
}

export function updateHazards(ctx: CombatContext, dt: number): void {
	const { state } = ctx;

	state.hazards = state.hazards.filter((hazard) => {
		hazard.t -= dt;

		if (hazard.kind === 'ring') {
			hazard.r += RING_EXPANSION_SPEED * dt;
			const playerDistance = Math.hypot(state.player.x - hazard.x, state.player.y - hazard.y);
			if (Math.abs(playerDistance - hazard.r) < RING_HIT_TOLERANCE) {
				hurtPlayer(ctx, RING_DAMAGE);
			}
		}

		if (hazard.kind === 'starfall' && hazard.t <= 0.18 && !hazard.triggered) {
			hazard.triggered = true;
			const d = Math.hypot(state.player.x - hazard.x, state.player.y - hazard.y);
			if (d < hazard.r) hurtPlayer(ctx, hazard.damage);
			state.shake = Math.max(state.shake, 6);
		}

		if (hazard.kind === 'beam') {
			hazard.angle += hazard.angularSpeed * dt;
			if (distanceToBeam(state.player.x, state.player.y, hazard.x, hazard.y, hazard.angle, hazard.length) < hazard.width) {
				hurtPlayer(ctx, hazard.damage);
			}
		}

		return hazard.t > 0;
	});
}
