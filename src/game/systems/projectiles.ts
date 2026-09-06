import { AERON } from '../content/aeron.ts';
import { spawnBurst } from '../effects/particles.ts';
import { hitBoss, isProjectileHit, type CombatContext } from './combat.ts';

export function updateProjectiles(ctx: CombatContext, dt: number): void {
	const { state } = ctx;

	state.shots = state.shots.filter((shot) => {
		shot.x += shot.vx * dt;
		shot.y += shot.vy * dt;
		shot.t -= dt;
		spawnBurst(state, shot.x, shot.y, '#a8e6e4', 1, 20);

		if (isProjectileHit(state, shot.x, shot.y)) {
			hitBoss(ctx, shot.powered ? AERON.combat.projectileChargedDamage : AERON.combat.projectileBasicDamage);
			return false;
		}
		return shot.t > 0;
	});
}
