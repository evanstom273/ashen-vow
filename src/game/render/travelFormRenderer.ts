import { getTravelFormDefinition } from '../content/travelForms.ts';
import type { PlayerState } from '../types.ts';
import { drawCircle, drawLine } from './primitives.ts';

function clamp01(value: number): number {
	return Math.max(0, Math.min(1, value));
}

function ease(value: number): number {
	const t = clamp01(value);
	return t * t * (3 - 2 * t);
}

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

function drawSpectralTrail(
	ctx: CanvasRenderingContext2D,
	time: number,
	accent: string,
	scale: number,
	morph: number,
): void {
	ctx.save();
	ctx.globalAlpha = 0.32 * morph;
	for (let i = 0; i < 4; i++) {
		const drift = 18 + i * 10;
		const wobble = Math.sin(time * 7 + i) * 4;
		drawCircle(ctx, wobble, drift * morph, (7 - i) * scale * (0.45 + morph * 0.55), accent);
	}
	ctx.restore();
}

function drawMorphAura(
	ctx: CanvasRenderingContext2D,
	time: number,
	accent: string,
	morph: number,
): void {
	if (morph <= 0 || morph >= 1) return;
	ctx.save();
	const pulse = 0.45 + Math.sin(time * 16) * 0.08;
	ctx.globalAlpha = (1 - Math.abs(morph - 0.5) * 1.55) * 0.42;
	for (let i = 0; i < 9; i++) {
		const angle = i * 2.399 + time * 0.9;
		const radius = 18 + i * 3 + pulse * 8;
		drawCircle(
			ctx,
			Math.cos(angle) * radius,
			Math.sin(angle) * radius * 0.65,
			1.8 + (i % 3),
			accent,
		);
	}
	ctx.restore();
}

function drawRaven(ctx: CanvasRenderingContext2D, player: PlayerState, time: number, rawMorph: number): void {
	const morph = ease(rawMorph);
	const form = getTravelFormDefinition('raven');
	const step = player.moving ? Math.sin(time * (player.sprinting ? 15 : 10)) : 0;
	const bob = player.moving ? Math.abs(step) * 3 * morph : 0;
	const bodyW = lerp(10, 20, morph);
	const bodyH = lerp(18, 34, morph);
	const headY = lerp(-12, -33, morph);
	const wing = lerp(7, 28 + Math.abs(step) * 10, morph);
	const legLength = lerp(5, 17, morph);

	ctx.save();
	ctx.translate(player.x, player.y - bob);
	ctx.rotate(player.angle + Math.PI / 2 + step * 0.04 * morph);
	drawSpectralTrail(ctx, time, form.accentSoft, 1, morph);
	drawMorphAura(ctx, time, form.accent, morph);

	ctx.fillStyle = '#26333b';
	ctx.strokeStyle = form.accent;
	ctx.lineWidth = lerp(1, 2, morph);
	ctx.beginPath();
	ctx.moveTo(0, -bodyH * 0.86);
	ctx.quadraticCurveTo(-bodyW * 1.1, -bodyH * 0.35, -bodyW * 0.9, bodyH * 0.42);
	ctx.quadraticCurveTo(0, bodyH * 0.82, bodyW * 0.9, bodyH * 0.42);
	ctx.quadraticCurveTo(bodyW * 1.1, -bodyH * 0.35, 0, -bodyH * 0.86);
	ctx.fill();
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(-bodyW * 0.42, -bodyH * 0.15);
	ctx.lineTo(-wing, lerp(2, 12 + step * 5, morph));
	ctx.lineTo(-bodyW * 0.6, bodyH * 0.5);
	ctx.closePath();
	ctx.moveTo(bodyW * 0.42, -bodyH * 0.15);
	ctx.lineTo(wing, lerp(2, 12 - step * 5, morph));
	ctx.lineTo(bodyW * 0.6, bodyH * 0.5);
	ctx.closePath();
	ctx.fillStyle = '#1a252b';
	ctx.fill();
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(-lerp(4, 7, morph), headY + 4);
	ctx.lineTo(0, headY - lerp(4, 10, morph));
	ctx.lineTo(lerp(4, 8, morph), headY + 5);
	ctx.closePath();
	ctx.fillStyle = '#607786';
	ctx.fill();

	if (morph > 0.45) {
		const eyeAlpha = (morph - 0.45) / 0.55;
		ctx.globalAlpha = eyeAlpha;
		drawCircle(ctx, -3 * morph, headY + 3, 2 * morph, '#d7eef1');
		drawCircle(ctx, 3 * morph, headY + 3, 2 * morph, '#d7eef1');
		ctx.globalAlpha = 1;
	}

	drawLine(ctx, -bodyW * 0.4, bodyH * 0.42, -bodyW * 0.6 - step * 4 * morph, bodyH * 0.42 + legLength, '#8097a3', lerp(2, 3, morph));
	drawLine(ctx, bodyW * 0.4, bodyH * 0.42, bodyW * 0.6 + step * 4 * morph, bodyH * 0.42 + legLength, '#8097a3', lerp(2, 3, morph));
	ctx.restore();
}

function drawWolf(ctx: CanvasRenderingContext2D, player: PlayerState, time: number, rawMorph: number): void {
	const morph = ease(rawMorph);
	const form = getTravelFormDefinition('wolf');
	const step = player.moving ? Math.sin(time * (player.sprinting ? 14 : 9)) : 0;
	const bob = player.moving ? Math.abs(step) * 3.4 * morph : 0;
	const bodyW = lerp(11, 21, morph);
	const bodyH = lerp(18, 34, morph);
	const headY = lerp(-12, -35, morph);
	const stride = step * lerp(2, player.sprinting ? 10 : 7, morph);
	const limbLength = lerp(7, 23, morph);

	ctx.save();
	ctx.translate(player.x, player.y - bob);
	ctx.rotate(player.angle + Math.PI / 2 + step * 0.035 * morph);
	drawSpectralTrail(ctx, time, form.accentSoft, 1.1, morph);
	drawMorphAura(ctx, time, form.accent, morph);

	ctx.fillStyle = '#39413d';
	ctx.strokeStyle = form.accent;
	ctx.lineWidth = lerp(1, 2, morph);
	ctx.beginPath();
	ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();

	const ear = lerp(3, 13, morph);
	ctx.beginPath();
	ctx.moveTo(-bodyW * 0.62, headY + 9);
	ctx.lineTo(-bodyW * 0.9, headY - ear);
	ctx.lineTo(-bodyW * 0.2, headY);
	ctx.lineTo(0, headY - ear * 1.2);
	ctx.lineTo(bodyW * 0.25, headY);
	ctx.lineTo(bodyW * 0.95, headY - ear);
	ctx.lineTo(bodyW * 0.65, headY + 10);
	ctx.closePath();
	ctx.fillStyle = '#4b5550';
	ctx.fill();
	ctx.stroke();

	if (morph > 0.4) {
		ctx.globalAlpha = (morph - 0.4) / 0.6;
		drawCircle(ctx, -5 * morph, headY + 3, 2.3 * morph, '#edf1cf');
		drawCircle(ctx, 5 * morph, headY + 3, 2.3 * morph, '#edf1cf');
		ctx.globalAlpha = 1;
	}

	drawLine(ctx, -bodyW * 0.58, bodyH * 0.55, -bodyW * 0.86 - stride, bodyH * 0.55 + limbLength, '#7c8279', lerp(2.5, 5, morph));
	drawLine(ctx, bodyW * 0.58, bodyH * 0.55, bodyW * 0.86 + stride, bodyH * 0.55 + limbLength, '#7c8279', lerp(2.5, 5, morph));
	drawLine(ctx, -bodyW * 0.58, -2, -bodyW - 1 + stride, limbLength * 0.75, '#666f68', lerp(2.5, 5, morph));
	drawLine(ctx, bodyW * 0.58, -2, bodyW + 1 - stride, limbLength * 0.75, '#666f68', lerp(2.5, 5, morph));
	drawLine(ctx, 0, bodyH * 0.7, step * 8 * morph, bodyH + lerp(8, 21, morph), '#657169', lerp(2, 6, morph));
	ctx.restore();
}

function drawFeline(ctx: CanvasRenderingContext2D, player: PlayerState, time: number, rawMorph: number): void {
	const morph = ease(rawMorph);
	const form = getTravelFormDefinition('feline');
	const step = player.moving ? Math.sin(time * (player.sprinting ? 16 : 10.5)) : 0;
	const bob = player.moving ? Math.abs(step) * 3.8 * morph : 0;
	const bodyW = lerp(11, 23, morph);
	const bodyH = lerp(18, 37, morph);
	const headY = lerp(-12, -36, morph);
	const stride = step * lerp(2, player.sprinting ? 11 : 7, morph);
	const limbLength = lerp(6, 25, morph);

	ctx.save();
	ctx.translate(player.x, player.y - bob);
	ctx.rotate(player.angle + Math.PI / 2 + step * 0.03 * morph);
	drawSpectralTrail(ctx, time, form.accentSoft, 1.2, morph);
	drawMorphAura(ctx, time, form.accent, morph);

	ctx.fillStyle = '#44394a';
	ctx.strokeStyle = form.accent;
	ctx.lineWidth = lerp(1, 2, morph);
	ctx.beginPath();
	ctx.ellipse(0, 0, bodyW, bodyH, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();

	const ear = lerp(3, 13, morph);
	ctx.beginPath();
	ctx.moveTo(-bodyW * 0.62, headY + 9);
	ctx.lineTo(-bodyW * 0.55, headY - ear);
	ctx.lineTo(-bodyW * 0.18, headY);
	ctx.lineTo(0, headY - ear * 1.15);
	ctx.lineTo(bodyW * 0.2, headY);
	ctx.lineTo(bodyW * 0.58, headY - ear);
	ctx.lineTo(bodyW * 0.65, headY + 9);
	ctx.closePath();
	ctx.fillStyle = '#58475f';
	ctx.fill();
	ctx.stroke();

	if (morph > 0.4) {
		ctx.globalAlpha = (morph - 0.4) / 0.6;
		drawCircle(ctx, -5 * morph, headY + 3, 2.4 * morph, '#f0d8ff');
		drawCircle(ctx, 5 * morph, headY + 3, 2.4 * morph, '#f0d8ff');
		ctx.globalAlpha = 1;
	}

	const legScale = Math.max(0.16, morph);
	const legs = [
		[-bodyW * 0.68, bodyH * 0.4, -bodyW - stride, bodyH * 0.4 + limbLength],
		[bodyW * 0.68, bodyH * 0.4, bodyW + stride, bodyH * 0.4 + limbLength],
		[-bodyW * 0.78, 3, -bodyW * 1.25 + stride, limbLength * 0.82],
		[bodyW * 0.78, 3, bodyW * 1.25 - stride, limbLength * 0.82],
		[-bodyW * 0.58, -bodyH * 0.3, -bodyW * 1.08 - stride * 0.6, lerp(-3, 10, morph)],
		[bodyW * 0.58, -bodyH * 0.3, bodyW * 1.08 + stride * 0.6, lerp(-3, 10, morph)],
	] as const;
	ctx.globalAlpha = lerp(0.2, 1, legScale);
	for (const [x1, y1, x2, y2] of legs) {
		drawLine(ctx, x1, y1, x2, y2, '#826d8d', lerp(2, 5, morph));
	}
	ctx.globalAlpha = 1;
	drawLine(ctx, 0, bodyH * 0.72, step * 11 * morph, bodyH + lerp(8, 25, morph), '#846f91', lerp(2, 6, morph));
	ctx.restore();
}

export function drawTravelForm(
	ctx: CanvasRenderingContext2D,
	player: PlayerState,
	time: number,
	morph = 1,
): void {
	const amount = clamp01(morph);
	if (amount <= 0) return;
	if (player.selectedTravelForm === 'raven') drawRaven(ctx, player, time, amount);
	else if (player.selectedTravelForm === 'wolf') drawWolf(ctx, player, time, amount);
	else drawFeline(ctx, player, time, amount);
}
