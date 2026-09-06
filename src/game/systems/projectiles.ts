import { getEquippedSpellDefinition } from '../state/spellState.ts';
import { spawnBurst } from '../effects/particles.ts';
import { hitBoss, isProjectileHit, type CombatContext } from './combat.ts';

export function updateProjectiles(ctx: CombatContext, dt: number): void {
	const { state } = ctx;
	const spell = getEquippedSpellDefinition(state);

	state.shots = state.shots.filter((shot) => {
		shot.x += shot.vx * dt;
		shot.y += shot.vy * dt;
		shot.t -= dt;
		spawnBurst(state, shot.x, shot.y, '#a8e6e4', 1, 20);

		if (isProjectileHit(state, shot.x, shot.y, spell.hitRadius)) {
			hitBoss(ctx, shot.powered ? spell.chargedDamage : spell.basicDamage);
			return false;
		}
		return shot.t > 0;
	});
}
