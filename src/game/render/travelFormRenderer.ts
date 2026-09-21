import { getTravelFormDefinition } from '../content/travelForms.ts';
import type { PlayerState } from '../types.ts';
import { drawCircle, drawLine } from './primitives.ts';

function drawSpectralTrail(ctx: CanvasRenderingContext2D, time: number, accent: string, scale: number): void {
	ctx.save();
	ctx.globalAlpha = 0.32;
	for (let i = 0; i < 4; i++) {
		const drift = 18 + i * 10;
		const wobble = Math.sin(time * 7 + i) * 4;
		drawCircle(ctx, wobble, drift, (7 - i) * scale, accent);
	}
	ctx.restore();
}

function drawRaven(ctx: CanvasRenderingContext2D, player: PlayerState, time: number): void {
	const form = getTravelFormDefinition('raven');
	const step = player.moving ? Math.sin(time * (player.sprinting ? 15 : 10)) : 0;
	const bob = player.moving ? Math.abs(step) * 3 : 0;
	ctx.save();
	ctx.translate(player.x, player.y - bob);
	ctx.rotate(player.angle + Math.PI / 2 + step * 0.04);
	drawSpectralTrail(ctx, time, form.accentSoft, 1);

	ctx.fillStyle = '#26333b';
	ctx.strokeStyle = form.accent;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(0, -30);
	ctx.quadraticCurveTo(-22, -12, -18, 14);
	ctx.quadraticCurveTo(0, 28, 18, 14);
	ctx.quadraticCurveTo(22, -12, 0, -30);
	ctx.fill();
	ctx.stroke();

	const wing = 28 + Math.abs(step) * 10;
	ctx.beginPath();
	ctx.moveTo(-8, -8);
	ctx.lineTo(-wing, 12 + step * 5);
	ctx.lineTo(-12, 17);
	ctx.closePath();
	ctx.moveTo(8, -8);
	ctx.lineTo(wing, 12 - step * 5);
	ctx.lineTo(12, 17);
	ctx.closePath();
	ctx.fillStyle = '#1a252b';
	ctx.fill();
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(-7, -26);
	ctx.lineTo(0, -43);
	ctx.lineTo(8, -25);
	ctx.closePath();
	ctx.fillStyle = '#607786';
	ctx.fill();
	drawCircle(ctx, -3, -30, 2, '#d7eef1');
	drawCircle(ctx, 3, -30, 2, '#d7eef1');

	drawLine(ctx, -8, 16, -12 - step * 4, 33, '#8097a3', 3);
	drawLine(ctx, 8, 16, 12 + step * 4, 33, '#8097a3', 3);
	ctx.restore();
}

function drawWolf(ctx: CanvasRenderingContext2D, player: PlayerState, time: number): void {
	const form = getTravelFormDefinition('wolf');
	const step = player.moving ? Math.sin(time * (player.sprinting ? 14 : 9)) : 0;
	const bob = player.moving ? Math.abs(step) * 3.4 : 0;
	ctx.save();
	ctx.translate(player.x, player.y - bob);
	ctx.rotate(player.angle + Math.PI / 2 + step * 0.035);
	drawSpectralTrail(ctx, time, form.accentSoft, 1.1);

	ctx.fillStyle = '#39413d';
	ctx.strokeStyle = form.accent;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.ellipse(0, 0, 21, 34, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(-13, -26);
	ctx.lineTo(-19, -43);
	ctx.lineTo(-5, -34);
	ctx.lineTo(0, -48);
	ctx.lineTo(7, -34);
	ctx.lineTo(20, -43);
	ctx.lineTo(14, -25);
	ctx.closePath();
	ctx.fillStyle = '#4b5550';
	ctx.fill();
	ctx.stroke();
	drawCircle(ctx, -5, -34, 2.3, '#edf1cf');
	drawCircle(ctx, 5, -34, 2.3, '#edf1cf');

	const stride = step * (player.sprinting ? 10 : 7);
	drawLine(ctx, -12, 20, -18 - stride, 42, '#7c8279', 5);
	drawLine(ctx, 12, 20, 18 + stride, 42, '#7c8279', 5);
	drawLine(ctx, -12, -2, -22 + stride, 19, '#666f68', 5);
	drawLine(ctx, 12, -2, 22 - stride, 19, '#666f68', 5);
	drawLine(ctx, 0, 28, step * 8, 55, '#657169', 6);
	ctx.restore();
}

function drawFeline(ctx: CanvasRenderingContext2D, player: PlayerState, time: number): void {
	const form = getTravelFormDefinition('feline');
	const step = player.moving ? Math.sin(time * (player.sprinting ? 16 : 10.5)) : 0;
	const bob = player.moving ? Math.abs(step) * 3.8 : 0;
	ctx.save();
	ctx.translate(player.x, player.y - bob);
	ctx.rotate(player.angle + Math.PI / 2 + step * 0.03);
	drawSpectralTrail(ctx, time, form.accentSoft, 1.2);

	ctx.fillStyle = '#44394a';
	ctx.strokeStyle = form.accent;
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.ellipse(0, 0, 23, 37, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.stroke();

	ctx.beginPath();
	ctx.moveTo(-14, -28);
	ctx.lineTo(-12, -45);
	ctx.lineTo(-4, -38);
	ctx.lineTo(0, -48);
	ctx.lineTo(5, -38);
	ctx.lineTo(13, -45);
	ctx.lineTo(15, -27);
	ctx.closePath();
	ctx.fillStyle = '#58475f';
	ctx.fill();
	ctx.stroke();
	drawCircle(ctx, -5, -34, 2.4, '#f0d8ff');
	drawCircle(ctx, 5, -34, 2.4, '#f0d8ff');

	const stride = step * (player.sprinting ? 11 : 7);
	const legs = [
		[-16, 15, -23 - stride, 43],
		[16, 15, 23 + stride, 43],
		[-19, 2, -30 + stride, 28],
		[19, 2, 30 - stride, 28],
		[-14, -10, -25 - stride * 0.6, 10],
		[14, -10, 25 + stride * 0.6, 10],
	] as const;
	for (const [x1,y1,x2,y2] of legs) drawLine(ctx, x1, y1, x2, y2, '#826d8d', 5);
	drawLine(ctx, 0, 31, step * 11, 62, '#846f91', 6);
	ctx.restore();
}

export function drawTravelForm(ctx: CanvasRenderingContext2D, player: PlayerState, time: number): void {
	if (player.selectedTravelForm === 'raven') drawRaven(ctx, player, time);
	else if (player.selectedTravelForm === 'wolf') drawWolf(ctx, player, time);
	else drawFeline(ctx, player, time);
}
