import type { SpellVisualProfile } from '../content/spellVisuals.ts';
import { spawnBurst } from '../effects/particles.ts';
import type { GameState, Shot } from '../types.ts';
import { drawCircle } from './primitives.ts';

function getProjectileRadius(visual: SpellVisualProfile, powered: boolean): number {
	return powered ? visual.projectile.chargedRadius : visual.projectile.basicRadius;
}

function drawCircleProjectile(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	radius: number,
	visual: SpellVisualProfile,
	time: number,
): void {
	const pulse = visual.projectile.pulseSpeed
		? 1 + Math.sin(time * visual.projectile.pulseSpeed) * 0.08
		: 1;
	const size = radius * pulse;

	ctx.shadowColor = visual.projectile.glowColor;
	ctx.shadowBlur = visual.projectile.glowBlur;
	drawCircle(ctx, x, y, size, visual.projectile.primaryColor);
	if (visual.projectile.secondaryColor) {
		drawCircle(ctx, x, y, size * 0.55, visual.projectile.secondaryColor);
	}
	ctx.shadowBlur = 0;
}

function drawRingProjectile(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	radius: number,
	visual: SpellVisualProfile,
): void {
	ctx.shadowColor = visual.projectile.glowColor;
	ctx.shadowBlur = visual.projectile.glowBlur;
	drawCircle(ctx, x, y, radius, null, visual.projectile.primaryColor, 2);
	drawCircle(ctx, x, y, radius * 0.45, visual.projectile.secondaryColor);
	ctx.shadowBlur = 0;
}

function drawCrescentProjectile(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	radius: number,
	visual: SpellVisualProfile,
	angle: number,
): void {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(angle);
	ctx.shadowColor = visual.projectile.glowColor;
	ctx.shadowBlur = visual.projectile.glowBlur;
	ctx.fillStyle = visual.projectile.primaryColor;
	ctx.beginPath();
	ctx.moveTo(radius * 1.4, 0);
	ctx.quadraticCurveTo(0, -radius * 1.6, -radius * 1.4, 0);
	ctx.quadraticCurveTo(0, radius * 0.35, radius * 1.4, 0);
	ctx.fill();
	ctx.strokeStyle = visual.projectile.secondaryColor;
	ctx.lineWidth = 1.5;
	ctx.stroke();
	ctx.shadowBlur = 0;
	ctx.restore();
}

function drawFlameProjectile(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	radius: number,
	visual: SpellVisualProfile,
	time: number,
	angle: number,
): void {
	const flicker = visual.projectile.flicker
		? 0.85 + Math.sin(time * 22) * 0.15 + Math.random() * 0.1
		: 1;

	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(angle + Math.PI / 2);
	ctx.shadowColor = visual.projectile.glowColor;
	ctx.shadowBlur = visual.projectile.glowBlur;

	ctx.fillStyle = visual.projectile.primaryColor;
	ctx.beginPath();
	ctx.moveTo(0, -radius * 1.5 * flicker);
	ctx.quadraticCurveTo(radius * 0.9, -radius * 0.2, radius * 0.55, radius * 0.8);
	ctx.quadraticCurveTo(0, radius * 0.45, -radius * 0.55, radius * 0.8);
	ctx.quadraticCurveTo(-radius * 0.9, -radius * 0.2, 0, -radius * 1.5 * flicker);
	ctx.fill();

	ctx.fillStyle = visual.projectile.secondaryColor;
	ctx.beginPath();
	ctx.moveTo(0, -radius * 0.9 * flicker);
	ctx.quadraticCurveTo(radius * 0.35, 0, 0, radius * 0.35);
	ctx.quadraticCurveTo(-radius * 0.35, 0, 0, -radius * 0.9 * flicker);
	ctx.fill();

	ctx.shadowBlur = 0;
	ctx.restore();
}

function drawRuneProjectile(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	radius: number,
	visual: SpellVisualProfile,
	time: number,
): void {
	const pulse = 1 + Math.sin(time * (visual.projectile.pulseSpeed ?? 6)) * 0.12;

	ctx.save();
	ctx.translate(x, y);
	ctx.shadowColor = visual.projectile.glowColor;
	ctx.shadowBlur = visual.projectile.glowBlur;
	drawCircle(ctx, 0, 0, radius * pulse, visual.projectile.primaryColor, visual.projectile.secondaryColor, 2);

	ctx.strokeStyle = visual.projectile.glowColor;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(0, -radius * 0.75);
	ctx.lineTo(0, radius * 0.75);
	ctx.moveTo(-radius * 0.75, 0);
	ctx.lineTo(radius * 0.75, 0);
	ctx.stroke();

	ctx.beginPath();
	ctx.arc(0, 0, radius * 0.55 * pulse, 0, Math.PI * 2);
	ctx.stroke();

	ctx.shadowBlur = 0;
	ctx.restore();
}

export function drawSpellProjectile(
	ctx: CanvasRenderingContext2D,
	shot: Shot,
	visual: SpellVisualProfile,
	time: number,
): void {
	const radius = getProjectileRadius(visual, shot.powered);
	const angle = Math.atan2(shot.vy, shot.vx);

	switch (visual.projectile.shape) {
		case 'circle':
			drawCircleProjectile(ctx, shot.x, shot.y, radius, visual, time);
			break;
		case 'ring':
			drawRingProjectile(ctx, shot.x, shot.y, radius, visual);
			break;
		case 'crescent':
			drawCrescentProjectile(ctx, shot.x, shot.y, radius, visual, angle);
			break;
		case 'flame':
			drawFlameProjectile(ctx, shot.x, shot.y, radius, visual, time, angle);
			break;
		case 'rune':
			drawRuneProjectile(ctx, shot.x, shot.y, radius, visual, time);
			break;
	}
}

export function drawSpellChargeRing(
	ctx: CanvasRenderingContext2D,
	x: number,
	y: number,
	charge: number,
	visual: SpellVisualProfile,
): void {
	const radius = visual.charge.baseRadius + charge * visual.charge.radiusScale;
	drawCircle(ctx, x, y, radius, null, visual.charge.ringColor, visual.charge.ringStrokeWidth);
}

export function spawnSpellTrail(state: GameState, x: number, y: number, visual: SpellVisualProfile): void {
	if (!visual.trail.enabled || Math.random() > visual.trail.spawnRate) return;

	const count = Math.max(1, Math.round(visual.trail.intensity));
	spawnBurst(state, x, y, visual.trail.color, count, visual.trail.length);
}

export function spawnSpellChargeParticles(state: GameState, x: number, y: number, visual: SpellVisualProfile): void {
	if (Math.random() > 0.5) return;
	spawnBurst(state, x, y, visual.charge.particleColor, 1, 25);
}

export function spawnSpellCastBurst(state: GameState, x: number, y: number, visual: SpellVisualProfile): void {
	spawnBurst(
		state,
		x,
		y,
		visual.cast.particleColor,
		visual.cast.particleCount,
		visual.cast.particleSpeed,
	);
}

export function spawnSpellImpact(
	state: GameState,
	x: number,
	y: number,
	visual: SpellVisualProfile,
	_powered: boolean,
): void {
	spawnBurst(
		state,
		x,
		y,
		visual.impact.secondaryColor,
		Math.round(visual.impact.particleCount * 0.4),
		visual.impact.particleSpeed * 0.8,
	);
}
