import type { CombatContext } from '../systems/combat.ts';

export interface BossUpdateContext extends CombatContext {
	announce: (message: string, duration?: number) => void;
}

export interface BossController {
	update(ctx: BossUpdateContext, dt: number): void;
}
