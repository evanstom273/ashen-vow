import { getSpellDefinition } from '../content/spells.ts';
import type { SpellVisualProfile } from '../content/spellVisuals.ts';
import type { BossState, PlayerState, Shot } from '../types.ts';
import { drawSpellChargeRing, drawSpellProjectile } from './spellVisualRenderer.ts';
import { drawCircle, drawLine } from './primitives.ts';

export function drawKnight(
	ctx: CanvasRenderingContext2D,
	entity: PlayerState | BossState,
	isBoss: boolean,
	time: number,
	phase2: boolean,
): void {
	const radius = isBoss ? 25 : 13;
	ctx.save();
	ctx.translate(entity.x, entity.y);
	drawCircle(ctx, 2, 12, radius * 1.1, '#0007');
	ctx.rotate(entity.angle + Math.PI / 2);

	if (!isBoss) {
		const player = entity as PlayerState;
		if (player.inv > 0 && player.roll <= 0) {
			ctx.globalAlpha = 0.5 + Math.sin(time * 50) * 0.25;
		}
	}

	ctx.fillStyle = isBoss ? (phase2 ? '#743b2c' : '#514b3d') : '#4d6865';
	ctx.beginPath();
	ctx.moveTo(-radius * 0.8, 0);
	ctx.lineTo(-radius * 1.1, radius * 1.65);
	ctx.quadraticCurveTo(0, radius * 1.2, radius * 1.1, radius * 1.65);
	ctx.lineTo(radius * 0.8, 0);
	ctx.fill();

	const bossEntity = entity as BossState;
	ctx.fillStyle = isBoss ? (bossEntity.flash > 0 ? '#e6cfaa' : '#8b8876') : '#a6b7ae';
	ctx.strokeStyle = '#303c36';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(-radius, -radius * 0.1);
	ctx.lineTo(-radius * 0.6, -radius * 0.8);
	ctx.lineTo(radius * 0.6, -radius * 0.8);
	ctx.lineTo(radius, -radius * 0.1);
	ctx.lineTo(radius * 0.6, radius * 0.7);
	ctx.lineTo(-radius * 0.6, radius * 0.7);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	drawCircle(ctx, 0, -radius * 0.5, radius * 0.43, isBoss ? '#45463e' : '#586b64', '#c1bda0', 1);
	drawLine(ctx, -radius * 0.25, -radius * 0.5, radius * 0.25, -radius * 0.5, isBoss ? '#efa96b' : '#dfe2c4', 2);

	if (isBoss) {
		ctx.strokeStyle = '#c2a768';
		ctx.lineWidth = 3;
		ctx.beginPath();
		ctx.moveTo(-13, -19);
		ctx.lineTo(-15, -30);
		ctx.lineTo(-7, -25);
		ctx.lineTo(0, -35);
		ctx.lineTo(7, -25);
		ctx.lineTo(15, -30);
		ctx.lineTo(13, -19);
		ctx.stroke();
	}

	ctx.save();
	ctx.translate(radius * 0.9, 0);
	const weaponAngle = isBoss
		? bossEntity.state === 'windup'
			? -0.9
			: bossEntity.state === 'attack'
				? 1.4
				: 0.2
		: 0.2;
	ctx.rotate(weaponAngle);
	drawLine(ctx, 0, 10, 0, isBoss ? -64 : -34, isBoss ? '#c2b99b' : '#d7e0ca', isBoss ? 7 : 3);
	drawLine(ctx, -8, 0, 8, 0, '#ac9461', 3);
	ctx.restore();

	ctx.restore();
}

export function drawProjectiles(ctx: CanvasRenderingContext2D, shots: Shot[], time: number): void {
	for (const shot of shots) {
		const spell = getSpellDefinition(shot.spellId);
		drawSpellProjectile(ctx, shot, spell.visual, time);
	}
}

export function drawParticles(
	ctx: CanvasRenderingContext2D,
	particles: { x: number; y: number; t: number; max: number; color: string; r: number }[],
): void {
	for (const particle of particles) {
		ctx.globalAlpha = Math.max(0, particle.t / particle.max);
		drawCircle(ctx, particle.x, particle.y, particle.r, particle.color);
	}
	ctx.globalAlpha = 1;
}

export function drawChargeRing(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	charge: number,
	visual: SpellVisualProfile,
): void {
	drawSpellChargeRing(ctx, x, y, charge, visual);
}
