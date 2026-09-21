import type { GameState, Viewport } from '../types.ts';
import { drawKnight, drawParticles } from '../render/drawActors.ts';
import { drawCircle, drawLine } from '../render/primitives.ts';
import {
	AERON_GATE_POSITION,
	GRACE_POSITION,
	OVERWORLD_SIZE,
	ROUTE_POINTS,
	WORLD_PROPS,
	type WorldProp,
} from './overworldContent.ts';

export interface WorldCamera {
	x: number;
	y: number;
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export function getWorldCamera(state: GameState): WorldCamera {
	const halfW = 500;
	const halfH = 375;
	const x = Math.max(halfW, Math.min(OVERWORLD_SIZE - halfW, state.player.x));
	const y = Math.max(halfH, Math.min(OVERWORLD_SIZE - halfH, state.player.y));
	return { x, y, left: x - halfW, top: y - halfH, right: x + halfW, bottom: y + halfH };
}

function drawGround(ctx: CanvasRenderingContext2D): void {
	ctx.fillStyle = '#142019';
	ctx.fillRect(0, 0, OVERWORLD_SIZE, OVERWORLD_SIZE);

	for (let y = 0; y < OVERWORLD_SIZE; y += 90) {
		for (let x = 0; x < OVERWORLD_SIZE; x += 90) {
			const n = Math.sin(x * 0.009 + y * 0.013) * 0.5 + 0.5;
			ctx.fillStyle = n > 0.58 ? '#19271d' : '#111b15';
			ctx.fillRect(x, y, 90, 90);
		}
	}
}

function strokeRouteSegment(
	ctx: CanvasRenderingContext2D,
	fromIndex: number,
	toIndex: number,
	width: number,
	color: string,
): void {
	ctx.save();
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.strokeStyle = color;
	ctx.lineWidth = width;
	ctx.beginPath();
	ctx.moveTo(ROUTE_POINTS[fromIndex]!.x, ROUTE_POINTS[fromIndex]!.y);
	for (let i = fromIndex + 1; i <= toIndex; i++) {
		ctx.lineTo(ROUTE_POINTS[i]!.x, ROUTE_POINTS[i]!.y);
	}
	ctx.stroke();
	ctx.restore();
}

function drawRoute(ctx: CanvasRenderingContext2D): void {
	strokeRouteSegment(ctx, 0, 2, 34, '#554b3522');
	strokeRouteSegment(ctx, 0, 2, 10, '#8b77543d');
	strokeRouteSegment(ctx, 2, 4, 70, '#544b3833');
	strokeRouteSegment(ctx, 2, 4, 38, '#73654a66');
	strokeRouteSegment(ctx, 4, 6, 104, '#353a31');
	strokeRouteSegment(ctx, 4, 6, 80, '#5e6258');

	for (let i = 0; i < 23; i++) {
		const t = i / 22;
		const x = 2380 + (AERON_GATE_POSITION.x - 2380) * t;
		const y = 1380 + (AERON_GATE_POSITION.y - 1380) * t + Math.sin(t * 7) * 10;
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate((i % 3 - 1) * 0.08);
		ctx.fillStyle = i % 2 ? '#77796d' : '#666a60';
		ctx.fillRect(-18, -22, 36, 44);
		ctx.strokeStyle = '#242a25';
		ctx.lineWidth = 2;
		ctx.strokeRect(-18, -22, 36, 44);
		ctx.restore();
	}
}

function drawGrace(ctx: CanvasRenderingContext2D, time: number): void {
	const pulse = 0.5 + Math.sin(time * 3) * 0.12;
	ctx.save();
	ctx.translate(GRACE_POSITION.x, GRACE_POSITION.y);
	ctx.globalAlpha = 0.45 + pulse * 0.35;
	const glow = ctx.createRadialGradient(0, 0, 8, 0, 0, 92);
	glow.addColorStop(0, '#ffe9aacc');
	glow.addColorStop(0.35, '#d6b55d66');
	glow.addColorStop(1, '#d6b55d00');
	ctx.fillStyle = glow;
	ctx.fillRect(-100, -100, 200, 200);
	ctx.globalAlpha = 1;

	drawCircle(ctx, 0, 8, 34, '#211d14', '#9b7f45', 2);
	drawCircle(ctx, 0, 8, 25, '#392e18', '#d3b665', 2);
	drawLine(ctx, 0, 12, 22, -34, '#e8d28f', 5);
	drawLine(ctx, 22, -34, 29, -56, '#f5e6b2', 3);
	for (let i = 0; i < 7; i++) {
		const angle = time * 0.35 + (i * Math.PI * 2) / 7;
		const radius = 32 + (i % 2) * 9;
		drawCircle(ctx, Math.cos(angle) * radius, Math.sin(angle) * radius * 0.45, 2.5, '#f0cf76');
	}
	ctx.restore();
}

function drawTree(ctx: CanvasRenderingContext2D, prop: WorldProp, state: GameState): void {
	const s = prop.scale;
	const dx = state.player.x - prop.x;
	const dy = state.player.y - prop.y;
	const hiddenBehindCanopy = state.player.y < prop.sortY && Math.hypot(dx, dy + 42 * s) < 58 * s;
	ctx.save();
	if (hiddenBehindCanopy) ctx.globalAlpha = 0.62;
	ctx.translate(prop.x, prop.y);
	ctx.rotate(prop.rotation ?? 0);
	drawCircle(ctx, 4 * s, 15 * s, 22 * s, '#0006');
	ctx.fillStyle = '#4c3c2a';
	ctx.fillRect(-7 * s, -32 * s, 14 * s, 54 * s);
	ctx.fillStyle = '#263c2a';
	drawCircle(ctx, -16 * s, -48 * s, 30 * s, '#263c2a');
	drawCircle(ctx, 12 * s, -58 * s, 36 * s, '#2d4931');
	drawCircle(ctx, 28 * s, -38 * s, 27 * s, '#203725');
	drawCircle(ctx, -3 * s, -79 * s, 31 * s, '#35543a');
	ctx.restore();
}

function drawRock(ctx: CanvasRenderingContext2D, prop: WorldProp): void {
	const s = prop.scale;
	ctx.save();
	ctx.translate(prop.x, prop.y);
	ctx.rotate(prop.rotation ?? 0);
	ctx.fillStyle = '#454d45';
	ctx.strokeStyle = '#252c27';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(-20 * s, 9 * s);
	ctx.lineTo(-13 * s, -15 * s);
	ctx.lineTo(7 * s, -23 * s);
	ctx.lineTo(24 * s, -4 * s);
	ctx.lineTo(17 * s, 16 * s);
	ctx.lineTo(-6 * s, 20 * s);
	ctx.closePath();
	ctx.fill();
	ctx.stroke();
	ctx.restore();
}

function drawStump(ctx: CanvasRenderingContext2D, prop: WorldProp): void {
	const s = prop.scale;
	ctx.save();
	ctx.translate(prop.x, prop.y);
	ctx.fillStyle = '#4a3926';
	ctx.fillRect(-13 * s, -12 * s, 26 * s, 27 * s);
	ctx.beginPath();
	ctx.ellipse(0, -12 * s, 13 * s, 7 * s, 0, 0, Math.PI * 2);
	ctx.fillStyle = '#71563a';
	ctx.fill();
	ctx.strokeStyle = '#33271c';
	ctx.stroke();
	ctx.restore();
}

function drawTorch(ctx: CanvasRenderingContext2D, prop: WorldProp, time: number): void {
	ctx.save();
	ctx.translate(prop.x, prop.y);
	drawLine(ctx, 0, 18, 0, -28, '#5b4932', 5);
	const flicker = 7 + Math.sin(time * 10 + prop.x) * 2;
	drawCircle(ctx, 0, -34, flicker, '#dc8d38');
	drawCircle(ctx, 0, -36, flicker * 0.55, '#f6d27b');
	ctx.restore();
}

function drawBarricade(ctx: CanvasRenderingContext2D, prop: WorldProp): void {
	ctx.save();
	ctx.translate(prop.x, prop.y);
	ctx.rotate(prop.rotation ?? 0.12);
	for (let i = -1; i <= 1; i++) drawLine(ctx, -30, i * 12, 30, i * 12, '#665039', 7);
	drawLine(ctx, -20, 25, -20, -34, '#3c3024', 6);
	drawLine(ctx, 20, 25, 20, -34, '#3c3024', 6);
	ctx.restore();
}

function drawGuard(ctx: CanvasRenderingContext2D, prop: WorldProp): void {
	ctx.save();
	ctx.translate(prop.x, prop.y);
	ctx.fillStyle = '#433f34';
	ctx.beginPath();
	ctx.moveTo(-10, -10); ctx.lineTo(-16, 25); ctx.lineTo(0, 34); ctx.lineTo(16, 25); ctx.lineTo(10, -10); ctx.closePath();
	ctx.fill();
	drawCircle(ctx, 0, -17, 9, '#6d6b60', '#2f342f', 2);
	drawLine(ctx, 12, 12, 18, -38, '#9c947b', 4);
	drawLine(ctx, 18, -38, 18, -52, '#b8aa7e', 2);
	ctx.restore();
}

function drawCart(ctx: CanvasRenderingContext2D, prop: WorldProp): void {
	ctx.save();
	ctx.translate(prop.x, prop.y);
	ctx.rotate(-0.1);
	ctx.fillStyle = '#5d4934';
	ctx.fillRect(-35, -18, 70, 36);
	drawCircle(ctx, -27, 23, 14, '#211c17', '#756149', 5);
	drawCircle(ctx, 27, 23, 14, '#211c17', '#756149', 5);
	drawLine(ctx, 34, -2, 76, 22, '#654d35', 5);
	ctx.restore();
}

function drawMarker(ctx: CanvasRenderingContext2D, prop: WorldProp): void {
	ctx.save();
	ctx.translate(prop.x, prop.y);
	ctx.fillStyle = '#52564f';
	ctx.fillRect(-8, -36, 16, 55);
	ctx.fillStyle = '#77796e';
	ctx.fillRect(-13, -40, 26, 9);
	ctx.restore();
}

function drawWall(ctx: CanvasRenderingContext2D, prop: WorldProp): void {
	const rect = prop.collisionRect!;
	ctx.save();
	ctx.fillStyle = '#3a4039';
	ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
	ctx.strokeStyle = '#74786c';
	ctx.lineWidth = 4;
	ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
	for (let y = rect.y + 18; y < rect.y + rect.h; y += 38) {
		drawLine(ctx, rect.x, y, rect.x + rect.w, y, '#232823', 2);
	}
	ctx.restore();
}

function drawTower(ctx: CanvasRenderingContext2D, prop: WorldProp): void {
	ctx.save();
	ctx.translate(prop.x, prop.y);
	ctx.fillStyle = '#444a42';
	ctx.strokeStyle = '#7a7e70';
	ctx.lineWidth = 4;
	ctx.fillRect(-52, -98, 104, 138);
	ctx.strokeRect(-52, -98, 104, 138);
	for (let x = -48; x < 50; x += 24) ctx.fillRect(x, -116, 14, 22);
	ctx.fillStyle = '#242a25';
	ctx.fillRect(-14, -18, 28, 58);
	ctx.restore();
}

function drawGate(ctx: CanvasRenderingContext2D, prop: WorldProp, bossAlive: boolean, time: number): void {
	ctx.save();
	ctx.translate(prop.x, prop.y);
	ctx.fillStyle = '#383f38';
	ctx.fillRect(-38, -118, 76, 54);
	ctx.fillRect(-58, -70, 20, 118);
	ctx.fillRect(38, -70, 20, 118);
	ctx.strokeStyle = '#808274';
	ctx.lineWidth = 4;
	ctx.strokeRect(-38, -118, 76, 54);
	if (bossAlive) {
		ctx.fillStyle = '#59452f';
		ctx.save();
		ctx.translate(-38, -12);
		ctx.rotate(-0.5);
		ctx.fillRect(-8, -48, 16, 84);
		ctx.restore();
		ctx.save();
		ctx.translate(38, -12);
		ctx.rotate(0.5);
		ctx.fillRect(-8, -48, 16, 84);
		ctx.restore();
		drawCircle(ctx, 0, 2, 3 + Math.sin(time * 4) * 0.7, '#d3b566');
	} else {
		ctx.globalAlpha = 0.55 + Math.sin(time * 2.4) * 0.08;
		drawCircle(ctx, 0, -5, 44, '#6d786b22', '#a2aa9555', 3);
		ctx.globalAlpha = 1;
	}
	ctx.fillStyle = bossAlive ? '#b79b5d' : '#5b5f57';
	ctx.font = '12px Georgia';
	ctx.textAlign = 'center';
	ctx.fillText('THE HOLLOW KING', 0, -84);
	ctx.restore();
}

function drawProp(ctx: CanvasRenderingContext2D, prop: WorldProp, time: number, bossAlive: boolean, state: GameState): void {
	switch (prop.kind) {
		case 'tree': drawTree(ctx, prop, state); break;
		case 'rock': drawRock(ctx, prop); break;
		case 'stump': drawStump(ctx, prop); break;
		case 'torch': drawTorch(ctx, prop, time); break;
		case 'barricade': drawBarricade(ctx, prop); break;
		case 'guard': drawGuard(ctx, prop); break;
		case 'cart': drawCart(ctx, prop); break;
		case 'marker': drawMarker(ctx, prop); break;
		case 'wall': drawWall(ctx, prop); break;
		case 'tower': drawTower(ctx, prop); break;
		case 'gate': drawGate(ctx, prop, bossAlive, time); break;
	}
}

export function renderOverworld(
	ctx: CanvasRenderingContext2D,
	state: GameState,
	viewport: Viewport,
): void {
	const camera = getWorldCamera(state);
	const { scale, ox, oy } = viewport;

	ctx.save();
	ctx.translate(
		ox + (500 - camera.x) * scale + (Math.random() - 0.5) * state.shake,
		oy + (375 - camera.y) * scale + (Math.random() - 0.5) * state.shake,
	);
	ctx.scale(scale, scale);

	drawGround(ctx);
	drawRoute(ctx);
	drawGrace(ctx, state.time);

	const visible = WORLD_PROPS.filter((prop) =>
		prop.x > camera.left - 160 && prop.x < camera.right + 160 &&
		prop.y > camera.top - 180 && prop.y < camera.bottom + 180
	);

	const layers: Array<{ sortY: number; draw: () => void }> = visible.map((prop) => ({
		sortY: prop.sortY,
		draw: () => drawProp(ctx, prop, state.time, state.world.bosses.aeron.alive, state),
	}));
	layers.push({
		sortY: state.player.y,
		draw: () => drawKnight(ctx, state.player, false, state.time, false, 'aeron'),
	});
	layers.sort((a, b) => a.sortY - b.sortY);
	for (const layer of layers) layer.draw();
	drawParticles(ctx, state.particles);

	ctx.restore();
}
