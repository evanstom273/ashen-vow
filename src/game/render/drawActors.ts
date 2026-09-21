import { getSpellDefinition } from '../content/spells.ts';
import type { SpellVisualProfile } from '../content/spellVisuals.ts';
import type { BossState, FightId, PlayerState, Shot } from '../types.ts';
import { drawSpellChargeRing, drawSpellProjectile } from './spellVisualRenderer.ts';
import { drawCircle, drawLine } from './primitives.ts';

function drawPlayer(ctx: CanvasRenderingContext2D, player: PlayerState, time: number): void {
	const radius = 13;
	ctx.save();
	ctx.translate(player.x, player.y);
	drawCircle(ctx, 2, 12, radius * 1.1, '#0007');
	ctx.rotate(player.angle + Math.PI / 2);
	if (player.inv > 0 && player.roll <= 0) ctx.globalAlpha = 0.5 + Math.sin(time * 50) * 0.25;

	ctx.fillStyle = '#4d6865';
	ctx.beginPath();
	ctx.moveTo(-radius * 0.8, 0);
	ctx.lineTo(-radius * 1.1, radius * 1.65);
	ctx.quadraticCurveTo(0, radius * 1.2, radius * 1.1, radius * 1.65);
	ctx.lineTo(radius * 0.8, 0);
	ctx.fill();

	ctx.fillStyle = '#a6b7ae';
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
	drawCircle(ctx, 0, -radius * 0.5, radius * 0.43, '#586b64', '#c1bda0', 1);
	drawLine(ctx, -radius * 0.25, -radius * 0.5, radius * 0.25, -radius * 0.5, '#dfe2c4', 2);

	ctx.save();
	ctx.translate(radius * 0.9, 0);
	ctx.rotate(0.2);
	drawLine(ctx, 0, 10, 0, -34, '#d7e0ca', 3);
	drawLine(ctx, -8, 0, 8, 0, '#ac9461', 3);
	ctx.restore();
	ctx.restore();
}

function drawHollowKing(ctx: CanvasRenderingContext2D, boss: BossState, _time: number, phase2: boolean): void {
	const radius = 25;
	ctx.save();
	ctx.translate(boss.x, boss.y);
	drawCircle(ctx, 2, 12, radius * 1.1, '#0007');
	ctx.rotate(boss.angle + Math.PI / 2);

	ctx.fillStyle = phase2 ? '#743b2c' : '#514b3d';
	ctx.beginPath();
	ctx.moveTo(-radius * 0.8, 0);
	ctx.lineTo(-radius * 1.1, radius * 1.65);
	ctx.quadraticCurveTo(0, radius * 1.2, radius * 1.1, radius * 1.65);
	ctx.lineTo(radius * 0.8, 0);
	ctx.fill();

	ctx.fillStyle = boss.flash > 0 ? '#e6cfaa' : '#8b8876';
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
	drawCircle(ctx, 0, -radius * 0.5, radius * 0.43, '#45463e', '#c1bda0', 1);
	drawLine(ctx, -radius * 0.25, -radius * 0.5, radius * 0.25, -radius * 0.5, '#efa96b', 2);

	ctx.strokeStyle = '#c2a768';
	ctx.lineWidth = 3;
	ctx.beginPath();
	ctx.moveTo(-13, -19); ctx.lineTo(-15, -30); ctx.lineTo(-7, -25); ctx.lineTo(0, -35);
	ctx.lineTo(7, -25); ctx.lineTo(15, -30); ctx.lineTo(13, -19);
	ctx.stroke();

	ctx.save();
	ctx.translate(radius * 0.9, 0);
	const weaponAngle = boss.state === 'windup' ? -0.9 : boss.state === 'attack' ? 1.4 : 0.2;
	ctx.rotate(weaponAngle);
	drawLine(ctx, 0, 10, 0, -64, '#c2b99b', 7);
	drawLine(ctx, -8, 0, 8, 0, '#ac9461', 3);
	ctx.restore();
	ctx.restore();
}

function drawStarSeer(ctx: CanvasRenderingContext2D, boss: BossState, time: number, phase2: boolean): void {
	const r = 27;
	ctx.save();
	ctx.translate(boss.x, boss.y);
	drawCircle(ctx, 3, 14, 31, '#0008');
	ctx.rotate(boss.angle + Math.PI / 2);

	if (phase2) {
		ctx.globalAlpha = 0.14 + Math.sin(time * 5) * 0.04;
		drawCircle(ctx, 0, -8, 44, null, '#b7e1df', 5);
		ctx.globalAlpha = 1;
	}

	ctx.fillStyle = phase2 ? '#34505a' : '#263a42';
	ctx.beginPath();
	ctx.moveTo(-12, -5);
	ctx.lineTo(-25, 38);
	ctx.lineTo(0, 52);
	ctx.lineTo(25, 38);
	ctx.lineTo(12, -5);
	ctx.closePath();
	ctx.fill();

	ctx.strokeStyle = '#6e9098';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(-15, 5); ctx.lineTo(0, 34); ctx.lineTo(15, 5);
	ctx.stroke();

	ctx.fillStyle = boss.flash > 0 ? '#e2f1ed' : '#9eb7b9';
	ctx.beginPath();
	ctx.moveTo(-15, -13);
	ctx.lineTo(-8, -28);
	ctx.lineTo(0, -34);
	ctx.lineTo(8, -28);
	ctx.lineTo(15, -13);
	ctx.lineTo(9, 2);
	ctx.lineTo(-9, 2);
	ctx.closePath();
	ctx.fill();
	ctx.strokeStyle = '#40575f';
	ctx.stroke();

	drawCircle(ctx, 0, -18, 5, '#0d171c', '#d3eeee', 1);
	drawLine(ctx, -9, -12, 9, -12, '#b9d9dc', 2);

	ctx.save();
	ctx.rotate(-time * 0.25);
	ctx.strokeStyle = phase2 ? '#b7e1df99' : '#789da6aa';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.arc(0, -17, 31, 0.35, Math.PI - 0.35);
	ctx.stroke();
	ctx.beginPath();
	ctx.arc(0, -17, 37, Math.PI + 0.35, Math.PI * 2 - 0.35);
	ctx.stroke();
	ctx.restore();

	ctx.save();
	ctx.translate(r * 0.95, -2);
	const weaponAngle = boss.state === 'windup' ? -1.25 : boss.state === 'attack' ? 1.15 : -0.05;
	ctx.rotate(weaponAngle);
	drawLine(ctx, 0, 16, 0, -72, '#9fc9ce', 4);
	drawLine(ctx, -10, -58, 0, -76, '#c4e7e7', 3);
	drawLine(ctx, 10, -58, 0, -76, '#c4e7e7', 3);
	drawCircle(ctx, 0, -53, 4 + Math.sin(time * 7) * 1.2, '#b7e1df');
	ctx.restore();
	ctx.restore();
}

export function drawKnight(
	ctx: CanvasRenderingContext2D,
	entity: PlayerState | BossState,
	isBoss: boolean,
	time: number,
	phase2: boolean,
	fightId: FightId,
): void {
	if (!isBoss) {
		drawPlayer(ctx, entity as PlayerState, time);
		return;
	}
	if (fightId === 'vael') drawStarSeer(ctx, entity as BossState, time, phase2);
	else drawHollowKing(ctx, entity as BossState, time, phase2);
}

export function drawProjectiles(ctx: CanvasRenderingContext2D, shots: Shot[], time: number): void {
	for (const shot of shots) {
		const spell = getSpellDefinition(shot.spellId);
		drawSpellProjectile(ctx, shot, spell.visual, time);
	}
}

export function drawParticles(ctx: CanvasRenderingContext2D, particles: { x: number; y: number; t: number; max: number; color: string; r: number }[]): void {
	for (const particle of particles) {
		ctx.globalAlpha = Math.max(0, particle.t / particle.max);
		drawCircle(ctx, particle.x, particle.y, particle.r, particle.color);
	}
	ctx.globalAlpha = 1;
}

export function drawChargeRing(ctx: CanvasRenderingContext2D, x: number, y: number, charge: number, visual: SpellVisualProfile): void {
	drawSpellChargeRing(ctx, x, y, charge, visual);
}
