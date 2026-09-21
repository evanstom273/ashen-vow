import { getSpellDefinition, getSpellDamage } from '../content/spells.ts';
import { spawnSpellImpact, spawnSpellTrail } from '../render/spellVisualRenderer.ts';
import { applyEffectsToBoss } from './effectSystem.ts';
import { hitBoss, isProjectileHit, type CombatContext } from './combat.ts';
import { findWorldEnemyProjectileHit, hitWorldEnemy } from './worldEnemies.ts';

export function updateProjectiles(ctx: CombatContext, dt: number): void {
	const { state } = ctx;

	state.shots = state.shots.filter((shot) => {
		const spell = getSpellDefinition(shot.spellId);
		const prevX = shot.x;
		const prevY = shot.y;

		shot.x += shot.vx * dt;
		shot.y += shot.vy * dt;
		shot.t -= dt;
		spawnSpellTrail(state, shot.x, shot.y, spell.visual);

		const damage = getSpellDamage(spell, shot.powered);
		if (state.scene.kind === 'world') {
			const enemy = findWorldEnemyProjectileHit(state, prevX, prevY, shot.x, shot.y, spell.projectile.hitRadius);
			if (enemy) {
				hitWorldEnemy(ctx, enemy, damage, spell.visual.impact.primaryColor);
				spawnSpellImpact(state, shot.x, shot.y, spell.visual, shot.powered);
				return false;
			}
		} else if (state.scene.kind === 'combat' && isProjectileHit(state, prevX, prevY, shot.x, shot.y, spell.projectile.hitRadius)) {
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
