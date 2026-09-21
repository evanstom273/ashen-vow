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

function drawShadow(ctx: CanvasRenderingContext2D, width: number, height: number, alpha = 0.42): void {
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.fillStyle = '#0007';
	ctx.beginPath();
	ctx.ellipse(2, 10, width, height, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

function drawMorphAura(ctx: CanvasRenderingContext2D, time: number, color: string, morph: number): void {
	if (morph <= 0 || morph >= 1) return;
	ctx.save();
	ctx.globalAlpha = Math.sin(morph * Math.PI) * 0.34;
	for (let i = 0; i < 7; i++) {
		const angle = time * 1.4 + i * (Math.PI * 2 / 7);
		const radius = 18 + i * 2.2;
		drawCircle(ctx, Math.cos(angle) * radius, Math.sin(angle) * radius * 0.6, 2 + (i % 2), color);
	}
	ctx.restore();
}

function drawRaven(ctx: CanvasRenderingContext2D, player: PlayerState, time: number, rawMorph: number): void {
	const morph = ease(rawMorph);
	const form = getTravelFormDefinition('raven');
	const gait = player.moving ? Math.sin(time * (player.sprinting ? 13 : 9)) : 0;
	const bob = player.moving ? Math.abs(gait) * 2.2 * morph : 0;
	const body = lerp(13, 24, morph);
	const wing = lerp(7, 24, morph);

	ctx.save();
	ctx.translate(player.x, player.y - bob);
	ctx.rotate(player.angle + Math.PI / 2 + gait * 0.025 * morph);

	drawShadow(ctx, lerp(12, 24, morph), lerp(6, 11, morph), 0.4);
	drawMorphAura(ctx, time, form.accent, morph);

	// Tail: a single clean wedge, like the player's cloak.
	ctx.fillStyle = '#27373d';
	ctx.strokeStyle = '#8fa8b4';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(-body * 0.52, body * 0.35);
	ctx.lineTo(0, body * 1.15);
	ctx.lineTo(body * 0.52, body * 0.35);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();

	// Wings are deliberately simple silhouette shapes rather than feather anatomy.
	ctx.fillStyle = '#33464e';
	ctx.beginPath();
	ctx.moveTo(-body * 0.45, -body * 0.1);
	ctx.lineTo(-wing - Math.abs(gait) * 3, body * 0.3);
	ctx.lineTo(-body * 0.5, body * 0.52);
	ctx.closePath();
	ctx.moveTo(body * 0.45, -body * 0.1);
	ctx.lineTo(wing + Math.abs(gait) * 3, body * 0.3);
	ctx.lineTo(body * 0.5, body * 0.52);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();

	// Main body: compact, readable, same clean polygon language as the player.
	ctx.fillStyle = '#536b72';
	ctx.strokeStyle = '#27343a';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(0, -body * 0.72);
	ctx.lineTo(-body * 0.7, -body * 0.1);
	ctx.lineTo(-body * 0.48, body * 0.55);
	ctx.lineTo(body * 0.48, body * 0.55);
	ctx.lineTo(body * 0.7, -body * 0.1);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();

	// Head + beak.
	drawCircle(ctx, 0, -body * 0.68, body * 0.34, '#607982', '#c1cbbf', 1);
	ctx.fillStyle = '#9fb3ba';
	ctx.beginPath();
	ctx.moveTo(-body * 0.14, -body * 0.82);
	ctx.lineTo(0, -body * 1.08);
	ctx.lineTo(body * 0.14, -body * 0.82);
	ctx.closePath();
	ctx.fill();

	if (morph > 0.45) {
		ctx.globalAlpha = (morph - 0.45) / 0.55;
		drawCircle(ctx, -body * 0.12, -body * 0.69, 1.8, '#e5f3ef');
		drawCircle(ctx, body * 0.12, -body * 0.69, 1.8, '#e5f3ef');
		ctx.globalAlpha = 1;
	}

	ctx.restore();
}

function drawWolf(ctx: CanvasRenderingContext2D, player: PlayerState, time: number, rawMorph: number): void {
	const morph = ease(rawMorph);
	const form = getTravelFormDefinition('wolf');
	const gait = player.moving ? Math.sin(time * (player.sprinting ? 13.5 : 9.3)) : 0;
	const bob = player.moving ? Math.abs(gait) * 2.4 * morph : 0;
	const body = lerp(13, 25, morph);
	const stretch = player.moving ? Math.abs(gait) * (player.sprinting ? 2.8 : 1.7) * morph : 0;

	ctx.save();
	ctx.translate(player.x, player.y - bob);
	ctx.rotate(player.angle + Math.PI / 2 + gait * 0.022 * morph);

	drawShadow(ctx, lerp(12, 23, morph), lerp(6, 10, morph), 0.42);
	drawMorphAura(ctx, time, form.accent, morph);

	// Tail: one simple stroke, not a fully articulated appendage.
	ctx.save();
	ctx.strokeStyle = '#56645e';
	ctx.lineWidth = lerp(3, 6, morph);
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(0, body * 0.58);
	ctx.quadraticCurveTo(-body * 0.25 - gait * 2, body * 0.92, body * 0.18 + gait * 4, body * 1.08);
	ctx.stroke();
	ctx.restore();

	// Tiny implied paws only; movement comes from squash/stretch rather than leg anatomy.
	const pawY = body * 0.48;
	const pawFrontY = -body * 0.34;
	const pawOffset = gait * 2.6 * morph;
	drawLine(ctx, -body * 0.46, pawFrontY, -body * 0.56 + pawOffset, pawFrontY - body * 0.24, '#728078', 4);
	drawLine(ctx, body * 0.46, pawFrontY, body * 0.56 - pawOffset, pawFrontY - body * 0.24, '#728078', 4);
	drawLine(ctx, -body * 0.38, pawY, -body * 0.48 - pawOffset, pawY + body * 0.2, '#505d57', 4);
	drawLine(ctx, body * 0.38, pawY, body * 0.48 + pawOffset, pawY + body * 0.2, '#505d57', 4);

	// Main body: intentionally mirrors the player's cloak-like polygon simplicity.
	ctx.fillStyle = '#57655f';
	ctx.strokeStyle = '#2b3530';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(-body * 0.58, -body * 0.38 - stretch);
	ctx.lineTo(-body * 0.78, body * 0.08);
	ctx.lineTo(-body * 0.5, body * 0.66 + stretch);
	ctx.lineTo(body * 0.5, body * 0.66 + stretch);
	ctx.lineTo(body * 0.78, body * 0.08);
	ctx.lineTo(body * 0.58, -body * 0.38 - stretch);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();

	// Shoulder highlight like the player's simple armour plane.
	ctx.fillStyle = '#75827b';
	ctx.beginPath();
	ctx.moveTo(-body * 0.48, -body * 0.3);
	ctx.lineTo(0, -body * 0.5);
	ctx.lineTo(body * 0.48, -body * 0.3);
	ctx.lineTo(body * 0.35, body * 0.05);
	ctx.lineTo(-body * 0.35, body * 0.05);
	ctx.closePath();
	ctx.fill();

	// Head is one clear shape with just ears and snout as identifiers.
	ctx.fillStyle = '#69776f';
	ctx.strokeStyle = '#c1bda0';
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.moveTo(-body * 0.42, -body * 0.42);
	ctx.lineTo(-body * 0.58, -body * 0.88);
	ctx.lineTo(-body * 0.2, -body * 0.7);
	ctx.lineTo(0, -body * 0.96);
	ctx.lineTo(body * 0.2, -body * 0.7);
	ctx.lineTo(body * 0.58, -body * 0.88);
	ctx.lineTo(body * 0.42, -body * 0.42);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();

	ctx.fillStyle = '#87948d';
	ctx.beginPath();
	ctx.moveTo(-body * 0.18, -body * 0.75);
	ctx.lineTo(0, -body * 1.08);
	ctx.lineTo(body * 0.18, -body * 0.75);
	ctx.closePath();
	ctx.fill();

	if (morph > 0.45) {
		ctx.globalAlpha = (morph - 0.45) / 0.55;
		drawCircle(ctx, -body * 0.14, -body * 0.65, 1.8, '#e4e7c7');
		drawCircle(ctx, body * 0.14, -body * 0.65, 1.8, '#e4e7c7');
		ctx.globalAlpha = 1;
	}

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
	else drawWolf(ctx, player, time, amount);
}
