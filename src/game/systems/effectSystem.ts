import type { EffectDefinition, EffectId } from '../content/effects.ts';
import { EFFECTS, getEffectDefinition } from '../content/effects.ts';
import { spawnBurst } from '../effects/particles.ts';
import type { ActiveEffect, BossState } from '../types.ts';
import { hitBoss, type CombatContext } from './combat.ts';

function getTotalMaxReduction(boss: BossState): number {
	let total = 0;
	for (const active of boss.effects) {
		total += active.appliedMaxReduction;
	}
	return total;
}

function syncBossEffectiveMax(boss: BossState): void {
	boss.max = Math.max(1, boss.baseMax - getTotalMaxReduction(boss));
	boss.hp = Math.min(boss.hp, boss.max);
}

function findActiveEffect(boss: BossState, effectId: EffectId): ActiveEffect | undefined {
	return boss.effects.find((active) => active.effectId === effectId);
}

function createActiveEffect(definition: EffectDefinition): ActiveEffect {
	const appliedMaxReduction = definition.kind === 'maxHealthReduction'
		? definition.reductionAmount
		: 0;

	return {
		effectId: definition.id,
		remainingDuration: definition.duration,
		tickTimer: definition.kind === 'damageOverTime'
			? definition.dot.tickInterval
			: definition.dot?.tickInterval ?? definition.duration,
		appliedMaxReduction,
	};
}

function getDotParams(definition: EffectDefinition): { tickDamage: number; tickInterval: number } | null {
	if (definition.kind === 'damageOverTime') {
		return definition.dot;
	}
	return definition.dot ?? null;
}

function tickEffectDot(ctx: CombatContext, definition: EffectDefinition): void {
	const dot = getDotParams(definition);
	if (!dot) return;

	hitBoss(ctx, dot.tickDamage, definition.damageType, {
		flash: false,
		shake: 0,
		particles: 4,
		particleColor: definition.particleColor,
		particleSpeed: 50,
	});
}

export function clearBossEffects(boss: BossState): void {
	boss.effects = [];
	boss.max = boss.baseMax;
}

export function applyEffectToBoss(ctx: CombatContext, effectId: EffectId): void {
	const { state } = ctx;
	const { boss } = state;
	if (boss.hp <= 0) return;

	const definition = getEffectDefinition(effectId);
	const existing = findActiveEffect(boss, effectId);

	if (existing) {
		existing.remainingDuration = definition.duration;
		existing.tickTimer = getDotParams(definition)?.tickInterval ?? existing.tickTimer;
		return;
	}

	boss.effects.push(createActiveEffect(definition));

	if (definition.kind === 'maxHealthReduction') {
		syncBossEffectiveMax(boss);
	}

	spawnBurst(state, boss.x, boss.y, definition.particleColor, 8, 60);
}

export function applyEffectsToBoss(ctx: CombatContext, effectIds: readonly EffectId[]): void {
	for (const effectId of effectIds) {
		applyEffectToBoss(ctx, effectId);
	}
}

export function updateBossEffects(ctx: CombatContext, dt: number): void {
	const { state } = ctx;
	const { boss } = state;
	if (boss.hp <= 0 || boss.effects.length === 0) return;

	const expired: EffectId[] = [];

	for (const active of boss.effects) {
		const definition = EFFECTS[active.effectId];
		active.remainingDuration -= dt;

		const dot = getDotParams(definition);
		if (dot) {
			active.tickTimer -= dt;
			while (active.tickTimer <= 0 && active.remainingDuration > 0) {
				tickEffectDot(ctx, definition);
				active.tickTimer += dot.tickInterval;
			}
		}

		if (active.remainingDuration <= 0) {
			expired.push(active.effectId);
		}
	}

	if (expired.length === 0) return;

	boss.effects = boss.effects.filter((active) => !expired.includes(active.effectId));
	syncBossEffectiveMax(boss);
}
