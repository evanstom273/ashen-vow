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

function drawShadow(ctx: CanvasRenderingContext2D, length: number, width: number, alpha = 0.42): void {
	ctx.save();
	ctx.globalAlpha = alpha;
	ctx.fillStyle = '#020706';
	ctx.beginPath();
	ctx.ellipse(2, length * 0.18, width, length * 0.42, 0, 0, Math.PI * 2);
	ctx.fill();
	ctx.restore();
}

function drawSpectralTrail(ctx: CanvasRenderingContext2D, time: number, accent: string, scale: number, morph: number): void {
	ctx.save();
	ctx.globalAlpha = 0.26 * morph;
	for (let i = 0; i < 5; i++) {
		const drift = 26 + i * 13;
		const wobble = Math.sin(time * 7.5 + i * 1.4) * (3 + i);
		drawCircle(ctx, wobble, drift * morph, (6.5 - i * 0.8) * scale, accent);
	}
	ctx.restore();
}

function drawMorphAura(ctx: CanvasRenderingContext2D, time: number, accent: string, morph: number): void {
	if (morph <= 0 || morph >= 1) return;
	ctx.save();
	ctx.globalAlpha = (1 - Math.abs(morph - 0.5) * 1.65) * 0.36;
	for (let i = 0; i < 10; i++) {
		const angle = i * 2.399 + time * 0.8;
		const radius = 18 + i * 2.5 + Math.sin(time * 13 + i) * 2;
		drawCircle(ctx, Math.cos(angle) * radius, Math.sin(angle) * radius * 0.62, 1.5 + (i % 3), accent);
	}
	ctx.restore();
}

function fillOutlinedPath(
	ctx: CanvasRenderingContext2D,
	fill: string,
	stroke: string,
	lineWidth: number,
	build: () => void,
): void {
	ctx.beginPath();
	build();
	ctx.fillStyle = fill;
	ctx.strokeStyle = stroke;
	ctx.lineWidth = lineWidth;
	ctx.lineJoin = 'round';
	ctx.fill();
	ctx.stroke();
}

function drawPaw(ctx: CanvasRenderingContext2D, x: number, y: number, rotation: number, color: string, outline: string, scale = 1): void {
	ctx.save();
	ctx.translate(x, y);
	ctx.rotate(rotation);
	fillOutlinedPath(ctx, color, outline, 1.5, () => {
		ctx.ellipse(0, 0, 5.2 * scale, 7 * scale, 0, 0, Math.PI * 2);
	});
	ctx.restore();
}

function drawWolf(ctx: CanvasRenderingContext2D, player: PlayerState, time: number, rawMorph: number): void {
	const morph = ease(rawMorph);
	const form = getTravelFormDefinition('wolf');
	const step = player.moving ? Math.sin(time * (player.sprinting ? 14.5 : 9.2)) : 0;
	const bob = player.moving ? Math.abs(step) * 2.6 * morph : 0;
	const stride = step * lerp(1.5, player.sprinting ? 10 : 7, morph);
	const bodyL = lerp(24, 54, morph);
	const shoulderW = lerp(12, 25, morph);
	const hipW = lerp(11, 21, morph);

	ctx.save();
	ctx.translate(player.x, player.y - bob);
	ctx.rotate(player.angle + Math.PI / 2 + step * 0.022 * morph);
	drawShadow(ctx, bodyL, shoulderW * 1.2, 0.5);
	drawSpectralTrail(ctx, time, form.accentSoft, 1.05, morph);
	drawMorphAura(ctx, time, form.accent, morph);

	// Rear legs first: they belong underneath the torso.
	const rearY = bodyL * 0.28;
	const rearKick = stride;
	drawLine(ctx, -hipW * 0.62, rearY - 5, -hipW * 0.95 - rearKick, rearY + lerp(8, 25, morph), '#313a35', lerp(3, 7, morph));
	drawLine(ctx, hipW * 0.62, rearY - 5, hipW * 0.95 + rearKick, rearY + lerp(8, 25, morph), '#313a35', lerp(3, 7, morph));
	drawPaw(ctx, -hipW * 0.95 - rearKick, rearY + lerp(9, 27, morph), -0.1, '#59645d', '#202823', morph);
	drawPaw(ctx, hipW * 0.95 + rearKick, rearY + lerp(9, 27, morph), 0.1, '#59645d', '#202823', morph);

	// Tail tucked under body.
	ctx.save();
	ctx.strokeStyle = '#465149';
	ctx.lineWidth = lerp(3, 8, morph);
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(0, bodyL * 0.44);
	ctx.quadraticCurveTo(-8 - step * 5, bodyL * 0.72, 8 + step * 9, bodyL * 0.98);
	ctx.stroke();
	ctx.restore();

	// Torso is pear-shaped rather than an oval.
	fillOutlinedPath(ctx, '#46514b', '#9ca59d', lerp(1, 2, morph), () => {
		ctx.moveTo(-shoulderW * 0.78, -bodyL * 0.28);
		ctx.quadraticCurveTo(-shoulderW, -bodyL * 0.03, -hipW * 0.7, bodyL * 0.34);
		ctx.quadraticCurveTo(0, bodyL * 0.54, hipW * 0.7, bodyL * 0.34);
		ctx.quadraticCurveTo(shoulderW, -bodyL * 0.03, shoulderW * 0.78, -bodyL * 0.28);
		ctx.quadraticCurveTo(0, -bodyL * 0.48, -shoulderW * 0.78, -bodyL * 0.28);
		ctx.closePath();
	});
	fillOutlinedPath(ctx, '#66716988', '#0000', 0, () => {
		ctx.ellipse(-shoulderW * 0.24, -bodyL * 0.16, shoulderW * 0.28, bodyL * 0.18, -0.25, 0, Math.PI * 2);
	});
	fillOutlinedPath(ctx, '#26312c88', '#0000', 0, () => {
		ctx.ellipse(shoulderW * 0.3, bodyL * 0.16, hipW * 0.35, bodyL * 0.22, 0.22, 0, Math.PI * 2);
	});

	// Front legs over torso edge.
	const frontY = -bodyL * 0.2;
	drawLine(ctx, -shoulderW * 0.72, frontY, -shoulderW * 1.02 + stride, frontY + lerp(10, 26, morph), '#59655e', lerp(3, 7, morph));
	drawLine(ctx, shoulderW * 0.72, frontY, shoulderW * 1.02 - stride, frontY + lerp(10, 26, morph), '#59655e', lerp(3, 7, morph));
	drawPaw(ctx, -shoulderW * 1.02 + stride, frontY + lerp(11, 28, morph), -0.08, '#737d75', '#2a332f', morph);
	drawPaw(ctx, shoulderW * 1.02 - stride, frontY + lerp(11, 28, morph), 0.08, '#737d75', '#2a332f', morph);

	// Neck/head/snout.
	fillOutlinedPath(ctx, '#53605a', '#aeb5ac', lerp(1, 2, morph), () => {
		ctx.moveTo(-shoulderW * 0.56, -bodyL * 0.3);
		ctx.lineTo(-lerp(7, 12, morph), -bodyL * 0.56);
		ctx.lineTo(-lerp(10, 16, morph), -bodyL * 0.76);
		ctx.lineTo(0, -bodyL * 0.94);
		ctx.lineTo(lerp(10, 16, morph), -bodyL * 0.76);
		ctx.lineTo(lerp(7, 12, morph), -bodyL * 0.56);
		ctx.lineTo(shoulderW * 0.56, -bodyL * 0.3);
		ctx.closePath();
	});
	// Ears.
	fillOutlinedPath(ctx, '#39443f', '#9ca59d', 1.5, () => {
		ctx.moveTo(-10 * morph, -bodyL * 0.73);
		ctx.lineTo(-16 * morph, -bodyL * 1.02);
		ctx.lineTo(-3 * morph, -bodyL * 0.84);
		ctx.closePath();
		ctx.moveTo(10 * morph, -bodyL * 0.73);
		ctx.lineTo(16 * morph, -bodyL * 1.02);
		ctx.lineTo(3 * morph, -bodyL * 0.84);
		ctx.closePath();
	});
	// Snout + face.
	fillOutlinedPath(ctx, '#748078', '#252d29', 1.4, () => {
		ctx.moveTo(-8 * morph, -bodyL * 0.88);
		ctx.lineTo(0, -bodyL * 1.12);
		ctx.lineTo(8 * morph, -bodyL * 0.88);
		ctx.lineTo(5 * morph, -bodyL * 0.73);
		ctx.lineTo(-5 * morph, -bodyL * 0.73);
		ctx.closePath();
	});
	if (morph > 0.42) {
		const a = (morph - 0.42) / 0.58;
		ctx.globalAlpha = a;
		drawCircle(ctx, -5, -bodyL * 0.82, 2, '#edf1cf');
		drawCircle(ctx, 5, -bodyL * 0.82, 2, '#edf1cf');
		drawCircle(ctx, 0, -bodyL * 1.08, 2.2, '#1a211e');
		ctx.globalAlpha = 1;
	}
	ctx.restore();
}

function drawFeline(ctx: CanvasRenderingContext2D, player: PlayerState, time: number, rawMorph: number): void {
	const morph = ease(rawMorph);
	const form = getTravelFormDefinition('feline');
	const step = player.moving ? Math.sin(time * (player.sprinting ? 16 : 10.4)) : 0;
	const bob = player.moving ? Math.abs(step) * 2.9 * morph : 0;
	const stride = step * lerp(1.5, player.sprinting ? 11 : 7.5, morph);
	const bodyL = lerp(25, 58, morph);
	const chestW = lerp(12, 24, morph);
	const waistW = lerp(9, 16, morph);

	ctx.save();
	ctx.translate(player.x, player.y - bob);
	ctx.rotate(player.angle + Math.PI / 2 + step * 0.018 * morph);
	drawShadow(ctx, bodyL, chestW * 1.15, 0.5);
	drawSpectralTrail(ctx, time, form.accentSoft, 1.12, morph);
	drawMorphAura(ctx, time, form.accent, morph);

	// Back pair under body.
	const backY = bodyL * 0.27;
	drawLine(ctx, -waistW * 0.72, backY, -waistW * 1.35 - stride, backY + lerp(10, 27, morph), '#493b50', lerp(3, 7, morph));
	drawLine(ctx, waistW * 0.72, backY, waistW * 1.35 + stride, backY + lerp(10, 27, morph), '#493b50', lerp(3, 7, morph));
	drawPaw(ctx, -waistW * 1.35 - stride, backY + lerp(11, 29, morph), -0.1, '#765f80', '#33283a', morph);
	drawPaw(ctx, waistW * 1.35 + stride, backY + lerp(11, 29, morph), 0.1, '#765f80', '#33283a', morph);

	// Long tail behind torso.
	ctx.save();
	ctx.strokeStyle = '#66516f';
	ctx.lineWidth = lerp(3, 7, morph);
	ctx.lineCap = 'round';
	ctx.beginPath();
	ctx.moveTo(0, bodyL * 0.4);
	ctx.bezierCurveTo(-12, bodyL * 0.7, 17 + step * 4, bodyL * 0.9, 4 + step * 11, bodyL * 1.12);
	ctx.stroke();
	ctx.restore();

	// Middle pair, partly tucked behind torso to sell six limbs.
	const midY = bodyL * 0.02;
	drawLine(ctx, -chestW * 0.78, midY, -chestW * 1.35 + stride * 0.65, midY + lerp(8, 22, morph), '#5f4d67', lerp(3, 6.5, morph));
	drawLine(ctx, chestW * 0.78, midY, chestW * 1.35 - stride * 0.65, midY + lerp(8, 22, morph), '#5f4d67', lerp(3, 6.5, morph));

	// Sleek torso with narrow waist.
	fillOutlinedPath(ctx, '#58465f', '#b89bc7', lerp(1, 2, morph), () => {
		ctx.moveTo(-chestW * 0.9, -bodyL * 0.3);
		ctx.quadraticCurveTo(-chestW * 1.05, -bodyL * 0.05, -waistW * 0.64, bodyL * 0.34);
		ctx.quadraticCurveTo(0, bodyL * 0.5, waistW * 0.64, bodyL * 0.34);
		ctx.quadraticCurveTo(chestW * 1.05, -bodyL * 0.05, chestW * 0.9, -bodyL * 0.3);
		ctx.quadraticCurveTo(0, -bodyL * 0.5, -chestW * 0.9, -bodyL * 0.3);
		ctx.closePath();
	});
	fillOutlinedPath(ctx, '#80678b66', '#0000', 0, () => {
		ctx.ellipse(-chestW * 0.26, -bodyL * 0.15, chestW * 0.3, bodyL * 0.2, -0.3, 0, Math.PI * 2);
	});
	fillOutlinedPath(ctx, '#392e3f88', '#0000', 0, () => {
		ctx.ellipse(chestW * 0.28, bodyL * 0.13, waistW * 0.36, bodyL * 0.24, 0.2, 0, Math.PI * 2);
	});

	// Front pair in foreground.
	const frontY = -bodyL * 0.22;
	drawLine(ctx, -chestW * 0.72, frontY, -chestW * 1.15 + stride, frontY + lerp(11, 27, morph), '#785f82', lerp(3, 7, morph));
	drawLine(ctx, chestW * 0.72, frontY, chestW * 1.15 - stride, frontY + lerp(11, 27, morph), '#785f82', lerp(3, 7, morph));
	drawPaw(ctx, -chestW * 1.15 + stride, frontY + lerp(12, 29, morph), -0.1, '#987ca5', '#3d3045', morph);
	drawPaw(ctx, chestW * 1.15 - stride, frontY + lerp(12, 29, morph), 0.1, '#987ca5', '#3d3045', morph);

	// Finish middle paws in front edge but below head.
	drawPaw(ctx, -chestW * 1.35 + stride * 0.65, midY + lerp(9, 24, morph), -0.12, '#826d8d', '#382c40', morph * 0.95);
	drawPaw(ctx, chestW * 1.35 - stride * 0.65, midY + lerp(9, 24, morph), 0.12, '#826d8d', '#382c40', morph * 0.95);

	// Feline head with cheek flare and ears.
	fillOutlinedPath(ctx, '#695370', '#c5a9d1', lerp(1, 2, morph), () => {
		ctx.moveTo(-chestW * 0.58, -bodyL * 0.31);
		ctx.lineTo(-11 * morph, -bodyL * 0.62);
		ctx.lineTo(-15 * morph, -bodyL * 0.85);
		ctx.lineTo(-4 * morph, -bodyL * 0.76);
		ctx.lineTo(0, -bodyL * 0.94);
		ctx.lineTo(4 * morph, -bodyL * 0.76);
		ctx.lineTo(15 * morph, -bodyL * 0.85);
		ctx.lineTo(11 * morph, -bodyL * 0.62);
		ctx.lineTo(chestW * 0.58, -bodyL * 0.31);
		ctx.closePath();
	});
	fillOutlinedPath(ctx, '#8c7298', '#43354b', 1.3, () => {
		ctx.moveTo(-8 * morph, -bodyL * 0.78);
		ctx.lineTo(0, -bodyL * 1.02);
		ctx.lineTo(8 * morph, -bodyL * 0.78);
		ctx.lineTo(5 * morph, -bodyL * 0.65);
		ctx.lineTo(-5 * morph, -bodyL * 0.65);
		ctx.closePath();
	});
	if (morph > 0.38) {
		ctx.globalAlpha = (morph - 0.38) / 0.62;
		drawCircle(ctx, -5, -bodyL * 0.72, 2.2, '#f1dbff');
		drawCircle(ctx, 5, -bodyL * 0.72, 2.2, '#f1dbff');
		drawCircle(ctx, 0, -bodyL * 0.98, 2, '#2a2030');
		ctx.globalAlpha = 1;
	}
	ctx.restore();
}

function drawRaven(ctx: CanvasRenderingContext2D, player: PlayerState, time: number, rawMorph: number): void {
	const morph = ease(rawMorph);
	const form = getTravelFormDefinition('raven');
	const step = player.moving ? Math.sin(time * (player.sprinting ? 15.5 : 10)) : 0;
	const bob = player.moving ? Math.abs(step) * 2.2 * morph : 0;
	const bodyL = lerp(22, 50, morph);
	const bodyW = lerp(10, 22, morph);
	const wingBeat = Math.abs(step) * (player.sprinting ? 8 : 4) * morph;

	ctx.save();
	ctx.translate(player.x, player.y - bob);
	ctx.rotate(player.angle + Math.PI / 2 + step * 0.012 * morph);
	drawShadow(ctx, bodyL, bodyW * 1.25, 0.46);
	drawSpectralTrail(ctx, time, form.accentSoft, 1, morph);
	drawMorphAura(ctx, time, form.accent, morph);

	// Tail feathers underneath everything else.
	fillOutlinedPath(ctx, '#19242a', '#607786', 1.5, () => {
		ctx.moveTo(-bodyW * 0.55, bodyL * 0.3);
		ctx.lineTo(-bodyW * 1.08, bodyL * 0.78);
		ctx.lineTo(-bodyW * 0.35, bodyL * 0.62);
		ctx.lineTo(0, bodyL * 0.9);
		ctx.lineTo(bodyW * 0.35, bodyL * 0.62);
		ctx.lineTo(bodyW * 1.08, bodyL * 0.78);
		ctx.lineTo(bodyW * 0.55, bodyL * 0.3);
		ctx.closePath();
	});

	// Far wing.
	ctx.save();
	ctx.globalAlpha = 0.88;
	fillOutlinedPath(ctx, '#1b272d', '#78909b', 1.6, () => {
		ctx.moveTo(-bodyW * 0.7, -bodyL * 0.1);
		ctx.quadraticCurveTo(-bodyW * 1.55 - wingBeat, bodyL * 0.04, -bodyW * 1.9 - wingBeat, bodyL * 0.42);
		ctx.lineTo(-bodyW * 0.62, bodyL * 0.32);
		ctx.closePath();
	});
	ctx.restore();

	// Main body.
	fillOutlinedPath(ctx, '#293940', '#93a9b5', lerp(1, 2, morph), () => {
		ctx.moveTo(0, -bodyL * 0.56);
		ctx.quadraticCurveTo(-bodyW, -bodyL * 0.26, -bodyW * 0.82, bodyL * 0.3);
		ctx.quadraticCurveTo(0, bodyL * 0.58, bodyW * 0.82, bodyL * 0.3);
		ctx.quadraticCurveTo(bodyW, -bodyL * 0.26, 0, -bodyL * 0.56);
		ctx.closePath();
	});
	fillOutlinedPath(ctx, '#49606b66', '#0000', 0, () => {
		ctx.ellipse(-bodyW * 0.22, -bodyL * 0.12, bodyW * 0.3, bodyL * 0.24, -0.25, 0, Math.PI * 2);
	});

	// Near wing on top for depth.
	fillOutlinedPath(ctx, '#223139', '#9ab5c8', 1.6, () => {
		ctx.moveTo(bodyW * 0.56, -bodyL * 0.12);
		ctx.quadraticCurveTo(bodyW * 1.5 + wingBeat, bodyL * 0.02, bodyW * 1.85 + wingBeat, bodyL * 0.38);
		ctx.lineTo(bodyW * 0.52, bodyL * 0.3);
		ctx.closePath();
	});

	// Head and beak.
	fillOutlinedPath(ctx, '#354952', '#a9c0cb', 1.5, () => {
		ctx.ellipse(0, -bodyL * 0.58, bodyW * 0.62, bodyW * 0.72, 0, 0, Math.PI * 2);
	});
	fillOutlinedPath(ctx, '#7b8f99', '#26343a', 1.2, () => {
		ctx.moveTo(-5 * morph, -bodyL * 0.73);
		ctx.lineTo(0, -bodyL * 1.02);
		ctx.lineTo(5 * morph, -bodyL * 0.73);
		ctx.closePath();
	});
	if (morph > 0.4) {
		ctx.globalAlpha = (morph - 0.4) / 0.6;
		drawCircle(ctx, -4, -bodyL * 0.62, 2, '#e7f7fb');
		drawCircle(ctx, 4, -bodyL * 0.62, 2, '#e7f7fb');
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
	else if (player.selectedTravelForm === 'wolf') drawWolf(ctx, player, time, amount);
	else drawFeline(ctx, player, time, amount);
}
