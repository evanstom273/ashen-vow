import type { EnemyControllerId } from '../types.ts';
import { getEnemyDefinition } from '../content/enemies.ts';
import { getFightDefinition } from '../content/fights.ts';
import type { BossController, BossUpdateContext } from '../bosses/BossController.ts';
import { aeronController } from '../bosses/aeronController.ts';
import { vaelController } from '../bosses/vaelController.ts';

const BOSS_CONTROLLERS: Partial<Record<EnemyControllerId, BossController>> = {
	aeron: aeronController,
	vael: vaelController,
};

export type { BossUpdateContext } from '../bosses/BossController.ts';

export function updateBoss(ctx: BossUpdateContext, dt: number): void {
	const { boss } = ctx.state;
	const beforeX = boss.x;
	const beforeY = boss.y;
	const fight = getFightDefinition(ctx.state.fightId);
	const enemy = getEnemyDefinition(fight.enemyId);
	const controller = BOSS_CONTROLLERS[enemy.controller];
	if (!controller) throw new Error(`Missing boss controller: ${enemy.controller}`);
	controller.update(ctx, dt);
	const moved = Math.hypot(boss.x - beforeX, boss.y - beforeY);
	// Ignore teleports such as Vael's mirror-gate; animate actual traversal only.
	boss.moving = moved > 0.04 && moved < 80;
}
