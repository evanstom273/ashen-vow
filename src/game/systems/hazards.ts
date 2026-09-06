import { hurtPlayer, type CombatContext } from './combat.ts';

const RING_EXPANSION_SPEED = 155;
const RING_HIT_TOLERANCE = 13;
const RING_DAMAGE = 24;

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
		return hazard.t > 0;
	});
}
