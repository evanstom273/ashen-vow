import type { GameState, Viewport } from '../types.ts';
import { drawChargeRing, drawDamageNumbers, drawKnight, drawParticles, drawProjectiles } from '../render/drawActors.ts';
import { drawWorldEnemy, drawWorldEnemyProjectiles } from '../render/worldEnemyRenderer.ts';
import { getEquippedSpellDefinition } from '../state/spellState.ts';
import { drawCircle, drawLine } from '../render/primitives.ts';
import {
	AERON_GATE_POSITION,
	GRACE_POSITION,
	OVERWORLD_SIZE,
	ROUTE_POINTS,
	WORLD_PROPS,
	type WorldProp,
} from './overworldContent.ts';

const WORLD_ZOOM = 1.18;
const FORT_VIEW_EDGE = AERON_GATE_POSITION.x + 65;

export interface WorldCamera {
	x: number;
	y: number;
	left: number;
	top: number;
	right: number;
	bottom: number;
}

export function getWorldCamera(state: GameState): WorldCamera {
	const halfW = 500 / WORLD_ZOOM;
	const halfH = 375 / WORLD_ZOOM;
	const maxX = Math.max(halfW, FORT_VIEW_EDGE - halfW);
	const x = Math.max(halfW, Math.min(maxX, state.player.x));
	const y = Math.max(halfH, Math.min(OVERWORLD_SIZE - halfH, state.player.y));
	return { x, y, left: x - halfW, top: y - halfH, right: x + halfW, bottom: y + halfH };
}

function drawGround(ctx: CanvasRenderingContext2D, camera: WorldCamera): void {
	ctx.fillStyle = '#142019';
	ctx.fillRect(0, 0, OVERWORLD_SIZE, OVERWORLD_SIZE);

	const startX = Math.floor((camera.left - 120) / 90) * 90;
	const endX = camera.right + 120;
	const startY = Math.floor((camera.top - 120) / 90) * 90;
	const endY = camera.bottom + 120;

	for (let y = startY; y <= endY; y += 90) {
		for (let x = startX; x <= endX; x += 90) {
			const wave = Math.sin(x * 0.011 + y * 0.016);
			const patchX = x + 42 + Math.sin(y * 0.021) * 18;
			const patchY = y + 38 + Math.cos(x * 0.017) * 16;
			ctx.fillStyle = wave > 0.2 ? '#1a2a1f44' : '#0e181244';
			ctx.beginPath();
			ctx.ellipse(patchX, patchY, 42, 27, wave * 0.35, 0, Math.PI * 2);
			ctx.fill();

			ctx.strokeStyle = wave > 0 ? '#36503835' : '#2234262e';
			ctx.lineWidth = 1.2;
			for (let g = 0; g < 3; g++) {
				const gx = x + 18 + g * 24 + Math.sin(y + g) * 6;
				const gy = y + 58 + Math.cos(x * 0.03 + g) * 10;
				ctx.beginPath();
				ctx.moveTo(gx, gy + 5);
				ctx.lineTo(gx - 2, gy - 4);
				ctx.moveTo(gx, gy + 5);
				ctx.lineTo(gx + 4, gy - 2);
				ctx.stroke();
			}
		}
	}
}

function blendRgb(a: readonly number[], b: readonly number[], t: number): string {
	const clamped = Math.max(0, Math.min(1, t));
	const r = Math.round(a[0]! + (b[0]! - a[0]!) * clamped);
	const g = Math.round(a[1]! + (b[1]! - a[1]!) * clamped);
	const blue = Math.round(a[2]! + (b[2]! - a[2]!) * clamped);
	return `rgb(${r} ${g} ${blue})`;
}

function drawTaperedSegment(
	ctx: CanvasRenderingContext2D,
	a: { x: number; y: number },
	b: { x: number; y: number },
	startWidth: number,
	endWidth: number,
	color: string,
): void {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	const length = Math.max(1, Math.hypot(dx, dy));
	const nx = -dy / length;
	const ny = dx / length;
	ctx.fillStyle = color;
	ctx.beginPath();
	ctx.moveTo(a.x + nx * startWidth * 0.5, a.y + ny * startWidth * 0.5);
	ctx.lineTo(b.x + nx * endWidth * 0.5, b.y + ny * endWidth * 0.5);
	ctx.lineTo(b.x - nx * endWidth * 0.5, b.y - ny * endWidth * 0.5);
	ctx.lineTo(a.x - nx * startWidth * 0.5, a.y - ny * startWidth * 0.5);
	ctx.closePath();
	ctx.fill();
}

function pointAlongRoute(progress: number): { x: number; y: number; angle: number } {
	const p = Math.max(0, Math.min(0.9999, progress));
	const scaled = p * (ROUTE_POINTS.length - 1);
	const index = Math.floor(scaled);
	const local = scaled - index;
	const a = ROUTE_POINTS[index]!;
	const b = ROUTE_POINTS[Math.min(index + 1, ROUTE_POINTS.length - 1)]!;
	return {
		x: a.x + (b.x - a.x) * local,
		y: a.y + (b.y - a.y) * local,
		angle: Math.atan2(b.y - a.y, b.x - a.x),
	};
}

function drawRoute(ctx: CanvasRenderingContext2D): void {
	const dirtDark: readonly number[] = [66, 59, 43];
	const dirtLight: readonly number[] = [111, 94, 65];
	const stoneDark: readonly number[] = [72, 76, 70];
	const stoneLight: readonly number[] = [104, 108, 99];

	for (let i = 0; i < ROUTE_POINTS.length - 1; i++) {
		const a = ROUTE_POINTS[i]!;
		const b = ROUTE_POINTS[i + 1]!;
		const p0 = i / (ROUTE_POINTS.length - 1);
		const p1 = (i + 1) / (ROUTE_POINTS.length - 1);
		const w0 = 18 + p0 * 76;
		const w1 = 18 + p1 * 76;
		const stone0 = Math.max(0, Math.min(1, (p0 - 0.52) / 0.38));
		const stone1 = Math.max(0, Math.min(1, (p1 - 0.52) / 0.38));
		const c0 = blendRgb(dirtDark, stoneDark, (stone0 + stone1) * 0.5);
		const c1 = blendRgb(dirtLight, stoneLight, (stone0 + stone1) * 0.5);

		drawTaperedSegment(ctx, a, b, w0 + 18, w1 + 18, c0);
		drawTaperedSegment(ctx, a, b, w0, w1, c1);
	}

	for (let i = 0; i < 38; i++) {
		const p = i / 37;
		const pos = pointAlongRoute(p);
		const worn = 0.2 + p * 0.8;
		const side = i % 2 === 0 ? -1 : 1;
		const offset = (10 + p * 23) * side * (0.35 + ((i * 17) % 10) / 20);
		ctx.save();
		ctx.translate(pos.x - Math.sin(pos.angle) * offset, pos.y + Math.cos(pos.angle) * offset);
		ctx.rotate(pos.angle + ((i % 3) - 1) * 0.08);
		ctx.globalAlpha = 0.14 + worn * 0.18;
		ctx.fillStyle = p < 0.62 ? '#3c3225' : '#252a26';
		ctx.fillRect(-8 - p * 4, -3, 16 + p * 8, 6);
		ctx.restore();
	}

	for (let i = 0; i < 30; i++) {
		const p = 0.55 + (i / 29) * 0.45;
		const pos = pointAlongRoute(p);
		const alpha = Math.max(0, Math.min(1, (p - 0.55) / 0.32));
		const side = i % 2 === 0 ? -1 : 1;
		const offset = side * (9 + (i % 4) * 8);
		ctx.save();
		ctx.translate(pos.x - Math.sin(pos.angle) * offset, pos.y + Math.cos(pos.angle) * offset);
		ctx.rotate(pos.angle + ((i % 5) - 2) * 0.025);
		ctx.globalAlpha = alpha * 0.82;
		ctx.fillStyle = i % 3 === 0 ? '#87897d' : '#70746b';
		ctx.fillRect(-13, -9, 26, 18);
		ctx.strokeStyle = '#3a403a';
		ctx.lineWidth = 1.4;
		ctx.strokeRect(-13, -9, 26, 18);
		ctx.restore();
	}
	ctx.globalAlpha = 1;
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
	const variant = prop.variant ?? 0;
	const dx = state.player.x - prop.x;
	const dy = state.player.y - prop.y;
	const hiddenBehindCanopy = state.player.y < prop.sortY && Math.hypot(dx, dy + 50 * s) < 62 * s;

	const variants = [
		[[-18, -52, 30], [14, -61, 35], [29, -39, 25], [-3, -82, 29]],
		[[-24, -45, 27], [8, -57, 38], [28, -64, 24], [4, -89, 26]],
		[[-18, -60, 34], [20, -50, 31], [6, -88, 34]],
		[[-27, -52, 25], [0, -66, 37], [28, -48, 28], [18, -86, 25]],
	] as const;
	const canopy = variants[variant % variants.length]!;

	ctx.save();
	if (hiddenBehindCanopy) ctx.globalAlpha = 0.64;
	ctx.translate(prop.x, prop.y);

	ctx.beginPath();
	ctx.ellipse(5 * s, 17 * s, 26 * s, 14 * s, 0, 0, Math.PI * 2);
	ctx.fillStyle = '#06100a88';
	ctx.fill();

	const trunk = ctx.createLinearGradient(-8 * s, 0, 8 * s, 0);
	trunk.addColorStop(0, '#34291d');
	trunk.addColorStop(0.5, '#5b442d');
	trunk.addColorStop(1, '#2b231a');
	ctx.fillStyle = trunk;
	ctx.fillRect(-7 * s, -38 * s, 14 * s, 60 * s);
	ctx.fillStyle = '#82624355';
	ctx.fillRect(-3 * s, -36 * s, 3 * s, 55 * s);
	ctx.strokeStyle = '#241c14aa';
	ctx.lineWidth = Math.max(1, 1.2 * s);
	for (let y = -30; y < 14; y += 13) {
		drawLine(ctx, -5 * s, y * s, 4 * s, (y - 5) * s, '#241c14aa', Math.max(1, 1.1 * s));
	}

	for (const [cx, cy, radius] of canopy) {
		drawCircle(ctx, cx * s, (cy + 7) * s, radius * 1.04 * s, '#18291d');
	}
	for (let i = 0; i < canopy.length; i++) {
		const [cx, cy, radius] = canopy[i]!;
		const mid = i % 2 === 0 ? '#2b4931' : '#31543a';
		drawCircle(ctx, cx * s, cy * s, radius * s, mid);
		drawCircle(ctx, (cx - radius * 0.22) * s, (cy - radius * 0.28) * s, radius * 0.56 * s, '#42654755');
		drawCircle(ctx, (cx + radius * 0.3) * s, (cy + radius * 0.18) * s, radius * 0.42 * s, '#17301f55');
	}

	ctx.fillStyle = '#66806466';
	for (let i = 0; i < 6; i++) {
		const angle = (i * 2.399 + variant) % (Math.PI * 2);
		const radius = (24 + (i % 3) * 11) * s;
		const cx = Math.cos(angle) * radius * 0.72;
		const cy = -63 * s + Math.sin(angle) * radius * 0.55;
		ctx.beginPath();
		ctx.ellipse(cx, cy, 3.5 * s, 2.2 * s, angle, 0, Math.PI * 2);
		ctx.fill();
	}
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
	ctx.fillStyle = '#69726888';
	ctx.beginPath();
	ctx.moveTo(-13 * s, -14 * s);
	ctx.lineTo(7 * s, -22 * s);
	ctx.lineTo(3 * s, -2 * s);
	ctx.lineTo(-8 * s, 4 * s);
	ctx.closePath();
	ctx.fill();
	ctx.fillStyle = '#2b322dcc';
	ctx.beginPath();
	ctx.moveTo(3 * s, -2 * s);
	ctx.lineTo(23 * s, -4 * s);
	ctx.lineTo(17 * s, 16 * s);
	ctx.lineTo(4 * s, 9 * s);
	ctx.closePath();
	ctx.fill();
	ctx.restore();
}

function drawStump(ctx: CanvasRenderingContext2D, prop: WorldProp): void {
	const s = prop.scale;
	ctx.save();
	ctx.translate(prop.x, prop.y);
	ctx.fillStyle = '#4a3926';
	ctx.fillRect(-13 * s, -12 * s, 26 * s, 27 * s);
	ctx.fillStyle = '#2c2118';
	ctx.fillRect(-13 * s, 5 * s, 26 * s, 10 * s);
	ctx.beginPath();
	ctx.ellipse(0, -12 * s, 13 * s, 7 * s, 0, 0, Math.PI * 2);
	ctx.fillStyle = '#806241';
	ctx.fill();
	ctx.strokeStyle = '#33271c';
	ctx.stroke();
	drawCircle(ctx, 0, -12 * s, 6 * s, null, '#4b3826', 1.5);
	ctx.restore();
}

function drawTorch(ctx: CanvasRenderingContext2D, prop: WorldProp, time: number): void {
	ctx.save();
	ctx.translate(prop.x, prop.y);
	drawLine(ctx, 0, 18, 0, -28, '#5b4932', 5);
	drawLine(ctx, -2, 15, -2, -25, '#8a6c48', 1.5);
	const flicker = 7 + Math.sin(time * 10 + prop.x) * 2;
	drawCircle(ctx, 0, -34, flicker * 1.8, '#dc8d3822');
	drawCircle(ctx, 0, -34, flicker, '#dc8d38');
	drawCircle(ctx, 0, -36, flicker * 0.55, '#f6d27b');
	ctx.restore();
}

function drawBarricade(ctx: CanvasRenderingContext2D, prop: WorldProp): void {
	ctx.save();
	ctx.translate(prop.x, prop.y);
	ctx.rotate(prop.rotation ?? 0.12);
	for (let i = -1; i <= 1; i++) {
		drawLine(ctx, -30, i * 12, 30, i * 12, '#665039', 7);
		drawLine(ctx, -27, i * 12 - 2, 26, i * 12 - 2, '#9a765044', 1.5);
	}
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
	ctx.fillStyle = '#6f6752';
	ctx.fillRect(-8, -7, 16, 18);
	drawCircle(ctx, 0, -17, 9, '#77766a', '#2f342f', 2);
	drawLine(ctx, -5, -18, 5, -18, '#c0b897', 1.5);
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
	for (let x = -28; x <= 28; x += 14) drawLine(ctx, x, -16, x, 16, '#8d6e4a66', 1.5);
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
	drawLine(ctx, -5, -30, -5, 14, '#8a8f8455', 1.5);
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
		for (let x = rect.x + 18 + ((y / 38) % 2) * 14; x < rect.x + rect.w; x += 34) {
			drawLine(ctx, x, y - 18, x, y, '#2b302b', 1.5);
		}
	}
	ctx.fillStyle = '#85897b22';
	ctx.fillRect(rect.x + 4, rect.y + 4, 7, rect.h - 8);
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
	for (let y = -76; y < 30; y += 28) drawLine(ctx, -49, y, 49, y, '#292f2a', 1.7);
	for (let x = -48; x < 50; x += 24) ctx.fillRect(x, -116, 14, 22);
	ctx.fillStyle = '#242a25';
	ctx.fillRect(-14, -18, 28, 58);
	ctx.fillStyle = '#8e928333';
	ctx.fillRect(-47, -92, 8, 124);
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
	for (let y = -108; y < -72; y += 17) drawLine(ctx, -35, y, 35, y, '#232823', 1.5);
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
	const worldScale = scale * WORLD_ZOOM;
	const screenCenterX = ox + 500 * scale;
	const screenCenterY = oy + 375 * scale;

	ctx.save();
	ctx.translate(
		screenCenterX - camera.x * worldScale + (Math.random() - 0.5) * state.shake,
		screenCenterY - camera.y * worldScale + (Math.random() - 0.5) * state.shake,
	);
	ctx.scale(worldScale, worldScale);

	drawGround(ctx, camera);
	drawRoute(ctx);
	drawGrace(ctx, state.time);

	const visible = WORLD_PROPS.filter((prop) =>
		prop.x > camera.left - 140 && prop.x < camera.right + 140 &&
		prop.y > camera.top - 170 && prop.y < camera.bottom + 170
	);

	const layers: Array<{ sortY: number; draw: () => void }> = visible.map((prop) => ({
		sortY: prop.sortY,
		draw: () => drawProp(ctx, prop, state.time, state.world.bosses.aeron.alive, state),
	}));
	for (const enemy of state.worldEnemies) {
		if (enemy.x < camera.left - 120 || enemy.x > camera.right + 120 || enemy.y < camera.top - 140 || enemy.y > camera.bottom + 140) continue;
		layers.push({
			sortY: enemy.y,
			draw: () => drawWorldEnemy(ctx, enemy, state.time),
		});
	}
	layers.push({
		sortY: state.player.y,
		draw: () => drawKnight(ctx, state.player, false, state.time, false, 'aeron', state.charging),
	});
	layers.sort((a, b) => a.sortY - b.sortY);
	for (const layer of layers) layer.draw();
	if (state.charging) {
		const spell = getEquippedSpellDefinition(state);
		drawChargeRing(ctx, state.player.x, state.player.y, state.charge, spell.visual);
	}
	drawProjectiles(ctx, state.shots, state.time);
	drawWorldEnemyProjectiles(ctx, state.worldEnemyProjectiles, state.time);
	drawParticles(ctx, state.particles);
	drawDamageNumbers(ctx, state.damageNumbers);

	ctx.restore();
}
