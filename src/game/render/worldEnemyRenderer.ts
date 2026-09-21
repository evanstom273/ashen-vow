import { getSpellDefinition } from '../content/spells.ts';
import { getWeaponClass } from '../content/weapons.ts';
import type { WorldEnemyProjectile, WorldEnemyState } from '../types.ts';
import { drawCircle, drawLine } from './primitives.ts';

function drawWeapon(ctx: CanvasRenderingContext2D, enemy: WorldEnemyState): void {
	const weapon = getWeaponClass(enemy.config.weaponClass);
	ctx.save();
	ctx.translate(13, 1);
	ctx.rotate(0.22);

	switch (weapon.visual) {
		case 'short-blade':
			drawLine(ctx, 0, 8, 0, -30, '#c8c9bb', 3);
			drawLine(ctx, -6, 0, 6, 0, '#927b52', 2);
			break;
		case 'broad-blade':
			ctx.fillStyle = '#9ea59c';
			ctx.fillRect(-4, -44, 8, 49);
			drawLine(ctx, -8, 2, 8, 2, '#927b52', 3);
			break;
		case 'dagger':
			drawLine(ctx, 0, 7, 0, -18, '#d4d4c7', 3);
			drawLine(ctx, -4, 0, 4, 0, '#927b52', 2);
			break;
		case 'spear':
			drawLine(ctx, 0, 16, 0, -52, '#75654b', 3);
			ctx.fillStyle = '#c1c5ba';
			ctx.beginPath();
			ctx.moveTo(0, -62); ctx.lineTo(-5, -50); ctx.lineTo(5, -50); ctx.closePath();
			ctx.fill();
			break;
		case 'twinblade':
			drawLine(ctx, 0, 17, 0, -34, '#75654b', 3);
			drawLine(ctx, 0, -34, 0, -55, '#c3c6bb', 4);
			drawLine(ctx, 0, 17, 0, 37, '#c3c6bb', 4);
			break;
		case 'bow':
			ctx.strokeStyle = '#8f7148';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.arc(0, -10, 24, -Math.PI / 2, Math.PI / 2);
			ctx.stroke();
			drawLine(ctx, 0, -34, 0, 14, '#c7bfa5', 1);
			break;
		case 'staff':
			drawLine(ctx, 0, 15, 0, -48, '#7a6c55', 4);
			drawCircle(ctx, 0, -53, 6, '#8fbac3', '#c6e6e5', 2);
			break;
		case 'axe':
			drawLine(ctx, 0, 13, 0, -35, '#735f45', 4);
			ctx.fillStyle = '#a8aaa0';
			ctx.beginPath();
			ctx.moveTo(0, -33); ctx.lineTo(14, -42); ctx.lineTo(16, -27); ctx.lineTo(0, -23); ctx.closePath();
			ctx.fill();
			break;
	}
	ctx.restore();
}

function drawAwareness(ctx: CanvasRenderingContext2D, enemy: WorldEnemyState): void {
	if (enemy.awareness <= 0 && enemy.awarenessState === 'unaware') return;
	const width = 34;
	const progress = Math.max(0, Math.min(1, enemy.awareness));
	ctx.fillStyle = '#080b09cc';
	ctx.fillRect(-width / 2, -49, width, 4);
	ctx.fillStyle = enemy.awarenessState === 'alerted' ? '#d48b5f' : '#d3bc78';
	ctx.fillRect(-width / 2, -49, width * progress, 4);
	ctx.font = '10px Arial';
	ctx.textAlign = 'center';
	ctx.fillStyle = enemy.awarenessState === 'alerted' ? '#f0b083' : '#d8c99c';
	ctx.fillText(enemy.awarenessState === 'alerted' ? '!' : '?', 0, -54);
}

export function drawWorldEnemy(ctx: CanvasRenderingContext2D, enemy: WorldEnemyState, time: number): void {
	if (!enemy.alive && enemy.deathProgress >= 1) return;
	const death = enemy.alive ? 0 : enemy.deathProgress;
	const step = enemy.alive && enemy.awarenessState !== 'unaware' ? Math.sin(time * 9 + enemy.x) : Math.sin(time * 5 + enemy.x) * 0.45;
	const bob = Math.abs(step) * 1.8;

	ctx.save();
	ctx.translate(enemy.x, enemy.y + death * 18);
	ctx.globalAlpha *= Math.max(0.05, 1 - death);
	ctx.rotate(enemy.facing + Math.PI / 2 + step * 0.025 + death * 0.65);

	drawCircle(ctx, 2, 15, 16, '#0007');
	ctx.translate(0, -bob);

	ctx.fillStyle = enemy.config.archetype === 'magic' ? '#344a50' : enemy.config.archetype === 'ranged' ? '#4f4938' : '#48483d';
	ctx.beginPath();
	ctx.moveTo(-9, -3);
	ctx.lineTo(-14, 27);
	ctx.lineTo(0, 34);
	ctx.lineTo(14, 27);
	ctx.lineTo(9, -3);
	ctx.closePath();
	ctx.fill();

	ctx.fillStyle = enemy.hitFlash > 0 ? '#d9d5bd' : '#737366';
	ctx.strokeStyle = '#2f342f';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(-10, -4);
	ctx.lineTo(-7, -18);
	ctx.lineTo(7, -18);
	ctx.lineTo(10, -4);
	ctx.lineTo(7, 14);
	ctx.lineTo(-7, 14);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	drawCircle(ctx, 0, -22, 8, '#68695f', '#313630', 2);
	drawLine(ctx, -4, -23, 4, -23, enemy.config.archetype === 'magic' ? '#a9dce6' : '#c7bea0', 1.5);

	drawWeapon(ctx, enemy);
	if (enemy.alive) drawAwareness(ctx, enemy);
	ctx.restore();
}

export function drawWorldEnemyProjectiles(
	ctx: CanvasRenderingContext2D,
	projectiles: readonly WorldEnemyProjectile[],
	time: number,
): void {
	for (const projectile of projectiles) {
		if (projectile.kind === 'arrow') {
			const angle = Math.atan2(projectile.vy, projectile.vx);
			ctx.save();
			ctx.translate(projectile.x, projectile.y);
			ctx.rotate(angle);
			drawLine(ctx, -10, 0, 8, 0, '#c6b58d', 2);
			ctx.fillStyle = '#9da29a';
			ctx.beginPath();
			ctx.moveTo(11, 0); ctx.lineTo(5, -3); ctx.lineTo(5, 3); ctx.closePath();
			ctx.fill();
			ctx.restore();
		} else {
			const spell = projectile.spellId ? getSpellDefinition(projectile.spellId) : null;
			const color = spell?.visual.projectile.primaryColor ?? '#9ccbd2';
			drawCircle(ctx, projectile.x, projectile.y, 5 + Math.sin(time * 12 + projectile.x) * 1.2, color);
			drawCircle(ctx, projectile.x, projectile.y, 10, color + '22');
		}
	}
}
