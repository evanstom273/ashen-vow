import { getSpellDefinition, getSpellDamage } from '../content/spells.ts';
import { spawnSpellImpact, spawnSpellTrail } from '../render/spellVisualRenderer.ts';
import { applyEffectsToBoss } from './effectSystem.ts';
import { hitBoss, isProjectileHit, type CombatContext } from './combat.ts';

export function updateProjectiles(ctx: CombatContext, dt: number): void {
	const { state } = ctx;

	state.shots = state.shots.filter((shot) => {
		const spell = getSpellDefinition(shot.spellId);

		shot.x += shot.vx * dt;
		shot.y += shot.vy * dt;
		shot.t -= dt;
		spawnSpellTrail(state, shot.x, shot.y, spell.visual);

		if (isProjectileHit(state, shot.x, shot.y, spell.projectile.hitRadius)) {
			const damage = getSpellDamage(spell, shot.powered);
			hitBoss(ctx, damage, spell.damageType, {
				particleColor: spell.visual.impact.primaryColor,
				particles: spell.visual.impact.particleCount,
				particleSpeed: spell.visual.impact.particleSpeed,
				shake: spell.visual.impact.shake,
			});
			spawnSpellImpact(state, shot.x, shot.y, spell.visual, shot.powered);
			applyEffectsToBoss(ctx, spell.onHit.effects.map((ref) => ref.effectId));
			return false;
		}
		return shot.t > 0;
	});
}
