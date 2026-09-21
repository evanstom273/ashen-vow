import type { FightId } from '../types.ts';
import type { BossController, BossUpdateContext } from '../bosses/BossController.ts';
import { aeronController } from '../bosses/aeronController.ts';
import { vaelController } from '../bosses/vaelController.ts';

const BOSS_CONTROLLERS: Record<FightId, BossController> = {
	aeron: aeronController,
	vael: vaelController,
};

export type { BossUpdateContext } from '../bosses/BossController.ts';

export function updateBoss(ctx: BossUpdateContext, dt: number): void {
	BOSS_CONTROLLERS[ctx.state.fightId].update(ctx, dt);
}
