import { TAU } from '../constants.ts';
import { getAreaDefinition } from '../content/areas.ts';
import { getFightDefinition } from '../content/fights.ts';
import { getArtTheme } from './artThemes.ts';
import type { AreaId, FightId, Hazard } from '../types.ts';
import { drawCircle, drawLine } from './primitives.ts';

function drawSanctum(ctx: CanvasRenderingContext2D, time: number): void {
	const fog = ctx.createRadialGradient(500, 300, 80, 500, 370, 580);
	fog.addColorStop(0, '#35433a');
	fog.addColorStop(0.6, '#1b2823');
	fog.addColorStop(1, '#09100f');
	ctx.fillStyle = fog;
	ctx.fillRect(-1000, -1000, 3000, 3000);

	drawCircle(ctx, 500, 370, 327, '#151e1a', '#445045', 2);
	drawCircle(ctx, 500, 370, 307, '#303a31', '#6e7561', 3);

	ctx.save();
	ctx.beginPath();
	ctx.arc(500, 370, 303, 0, TAU);
	ctx.clip();
	for (let row = -1; row < 19; row++) {
		for (let col = -1; col < 21; col++) {
			const x = col * 58 + (row % 2) * 29;
			const y = row * 44;
			const n = Math.sin(row * 31 + col * 73) * 0.5 + 0.5;
			ctx.fillStyle = `rgb(${38 + n * 12},${48 + n * 12},${40 + n * 10})`;
			ctx.fillRect(x + 1, y + 1, 55, 41);
			if (n > 0.8) drawLine(ctx, x + 5, y + 8, x + 23, y + 25, '#65705b25');
		}
	}
	for (const radius of [80, 86, 177, 182, 279, 288]) drawCircle(ctx, 500, 370, radius, null, '#93947530', 1);
	for (let i = 0; i < 16; i++) {
		const a = (i * TAU) / 16;
		drawLine(ctx, 500 + Math.cos(a) * 184, 370 + Math.sin(a) * 184, 500 + Math.cos(a) * 279, 370 + Math.sin(a) * 279, '#8a91782a');
	}
	drawCircle(ctx, 500, 370, 37, null, '#a69d7155');
	ctx.restore();

	for (let i = 0; i < 12; i++) {
		const a = (i * TAU) / 12;
		const x = 500 + Math.cos(a) * 323;
		const y = 370 + Math.sin(a) * 323;
		drawCircle(ctx, x + 4, y + 8, 18, '#050c0988');
		ctx.fillStyle = '#3a463b';
		ctx.fillRect(x - 13, y - 15, 26, 28);
		ctx.strokeStyle = '#6b7560';
		ctx.strokeRect(x - 13, y - 15, 26, 28);
		if (i % 2 === 0) {
			const glow = ctx.createRadialGradient(x, y, 0, x, y, 60);
			glow.addColorStop(0, '#d6a65544');
			glow.addColorStop(1, '#d6a65500');
			ctx.fillStyle = glow;
			ctx.fillRect(x - 60, y - 60, 120, 120);
			drawCircle(ctx, x, y, 4 + Math.sin(time * 6 + i), '#e6c278');
		}
	}
	for (let i = 0; i < 18; i++) {
		ctx.globalAlpha = 0.035;
		ctx.fillStyle = '#d8e0bb';
		ctx.fillRect(452 + i * 5, 640 + Math.sin(time + i) * 7, 4, 52);
	}
	ctx.globalAlpha = 1;
}

function drawOrrery(ctx: CanvasRenderingContext2D, time: number): void {
	const fog = ctx.createRadialGradient(500, 340, 90, 500, 380, 650);
	fog.addColorStop(0, '#253840');
	fog.addColorStop(0.58, '#111e24');
	fog.addColorStop(1, '#05090d');
	ctx.fillStyle = fog;
	ctx.fillRect(-1000, -1000, 3000, 3000);

	ctx.save();
	ctx.beginPath();
	ctx.roundRect(120, 110, 760, 540, 54);
	ctx.clip();

	ctx.fillStyle = '#18272d';
	ctx.fillRect(120, 110, 760, 540);

	for (let y = 130; y < 650; y += 52) {
		for (let x = 140; x < 880; x += 64) {
			const stagger = ((Math.floor(y / 52) & 1) * 32);
			const px = x + stagger;
			const n = Math.sin(px * 0.031 + y * 0.047) * 0.5 + 0.5;
			ctx.fillStyle = n > 0.58 ? '#22343a' : '#1b2b31';
			ctx.fillRect(px, y, 58, 46);
			if ((px + y) % 4 < 1) {
				drawLine(ctx, px + 8, y + 8, px + 46, y + 35, '#6e919a22');
			}
		}
	}

	ctx.strokeStyle = '#789ca5';
	ctx.lineWidth = 3;
	ctx.strokeRect(145, 135, 710, 490);

	ctx.setLineDash([12, 10]);
	ctx.strokeStyle = '#8bb1ba55';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(500, 135);
	ctx.lineTo(500, 625);
	ctx.moveTo(145, 380);
	ctx.lineTo(855, 380);
	ctx.stroke();
	ctx.setLineDash([]);

	for (const [x, y] of [[250, 235], [750, 235], [250, 525], [750, 525]] as const) {
		drawCircle(ctx, x, y, 66, null, '#6f949d44', 2);
		drawCircle(ctx, x, y, 20, '#20343a', '#9fc7cc', 2);
		drawCircle(ctx, x, y, 5 + Math.sin(time * 3 + x) * 1.5, '#b9e3e3');
	}

	ctx.save();
	ctx.translate(500, 380);
	ctx.rotate(time * 0.06);
	for (let i = 0; i < 4; i++) {
		ctx.rotate(Math.PI / 2);
		drawLine(ctx, 0, 40, 0, 122, '#8db4bd44', 2);
		drawCircle(ctx, 0, 130, 8, '#729ba5', '#c6e5e5', 1);
	}
	ctx.restore();

	ctx.restore();

	ctx.strokeStyle = '#4d6c75';
	ctx.lineWidth = 5;
	ctx.beginPath();
	ctx.roundRect(120, 110, 760, 540, 54);
	ctx.stroke();

	for (let i = 0; i < 10; i++) {
		const side = i % 2 === 0 ? 1 : -1;
		const x = side > 0 ? 98 : 902;
		const y = 150 + (i % 5) * 112;
		ctx.save();
		ctx.translate(x, y);
		ctx.fillStyle = '#24383e';
		ctx.strokeStyle = '#73939b';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(0, -24);
		ctx.lineTo(18 * side, 0);
		ctx.lineTo(0, 24);
		ctx.lineTo(-10 * side, 0);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		drawCircle(ctx, 0, 0, 4 + Math.sin(time * 4 + i), '#a9d9dc');
		ctx.restore();
	}
}
const ARENA_DRAWERS = {
	sanctum: drawSanctum,
	orrery: drawOrrery,
} as const;

export function drawArena(ctx: CanvasRenderingContext2D, time: number, areaId: AreaId): void {
	const area = getAreaDefinition(areaId);
	if (area.artTheme === 'wilds') return;
	ARENA_DRAWERS[area.artTheme](ctx, time);
}

export function drawHazards(ctx: CanvasRenderingContext2D, hazards: Hazard[], fightId: FightId): void {
	const visuals = getFightDefinition(fightId).visuals;
	for (const hazard of hazards) {
		if (hazard.kind === 'ring') {
			drawCircle(ctx, hazard.x, hazard.y, hazard.r, null, visuals.hazard, 8);
			drawCircle(ctx, hazard.x, hazard.y, hazard.r + 6, null, visuals.accentSoft, 2);
		} else if (hazard.kind === 'blast') {
			drawCircle(ctx, hazard.x, hazard.y, hazard.r, visuals.hazardSoft, visuals.hazard, 3);
		} else if (hazard.kind === 'starfall') {
			const progress = Math.max(0, Math.min(1, hazard.t / 0.9));
			drawCircle(ctx, hazard.x, hazard.y, hazard.r, '#83b4bd20', '#a9dbe2aa', 2);
			drawCircle(ctx, hazard.x, hazard.y, Math.max(5, hazard.r * progress), null, '#d3eeeeaa', 2);
			if (hazard.triggered) {
				ctx.save();
				ctx.translate(hazard.x, hazard.y);
				ctx.strokeStyle = '#d7f1f1aa';
				ctx.lineWidth = 3;
				for (let i = 0; i < 6; i++) {
					ctx.rotate(Math.PI / 3);
					drawLine(ctx, 0, 0, 0, hazard.r + 24, '#d7f1f1aa', 3);
				}
				ctx.restore();
			}
		} else if (hazard.kind === 'beam') {
			const ex = hazard.x + Math.cos(hazard.angle) * hazard.length;
			const ey = hazard.y + Math.sin(hazard.angle) * hazard.length;
			ctx.save();
			ctx.shadowColor = '#aee4e8';
			ctx.shadowBlur = 14;
			drawLine(ctx, hazard.x, hazard.y, ex, ey, '#9dd4da99', hazard.width * 2);
			drawLine(ctx, hazard.x, hazard.y, ex, ey, '#e2f6f5cc', Math.max(2, hazard.width * 0.45));
			ctx.restore();
		}
	}
}

export function drawAtmosphericDust(ctx: CanvasRenderingContext2D, time: number, areaId: AreaId): void {
	const theme = getArtTheme(getAreaDefinition(areaId).artTheme);
	for (let i = 0; i < theme.dustCount; i++) {
		const x = (i * 137.2 + Math.sin(time * 0.3 + i) * 15) % 1100;
		const y = (i * 73 - time * (theme.dustSpeed + (i % 5)) + 85000) % 850;
		drawCircle(ctx, x, y, theme.id === 'orrery' && i % 9 === 0 ? 1.8 : 1, theme.dustColor);
	}
}


export function getArenaExitPosition(areaId: AreaId): { x: number; y: number } {
	const bounds = getAreaDefinition(areaId).bounds;
	if (bounds.kind === 'circle') return { x: bounds.x, y: bounds.y };
	return { x: (bounds.minX + bounds.maxX) / 2, y: (bounds.minY + bounds.maxY) / 2 };
}

export function drawArenaExit(
	ctx: CanvasRenderingContext2D,
	time: number,
	areaId: AreaId,
): void {
	const pos = getArenaExitPosition(areaId);
	const pulse = 0.5 + Math.sin(time * 3.2) * 0.15;
	ctx.save();
	ctx.translate(pos.x, pos.y);

	const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 74);
	glow.addColorStop(0, '#f5e8b7aa');
	glow.addColorStop(0.3, '#d0b76866');
	glow.addColorStop(1, '#d0b76800');
	ctx.fillStyle = glow;
	ctx.fillRect(-82, -82, 164, 164);

	ctx.globalAlpha = 0.65 + pulse * 0.25;
	drawCircle(ctx, 0, 0, 26, '#211c13cc', '#ddc37b', 2.5);
	drawCircle(ctx, 0, 0, 13 + pulse * 4, '#d7bd6a33', '#f0dc9d', 2);
	for (let i = 0; i < 8; i++) {
		const a = time * 0.42 + (i * Math.PI * 2) / 8;
		const inner = 34;
		const outer = 47 + (i % 2) * 7;
		drawLine(
			ctx,
			Math.cos(a) * inner,
			Math.sin(a) * inner,
			Math.cos(a) * outer,
			Math.sin(a) * outer,
			'#d7bd6a88',
			1.5,
		);
	}
	ctx.globalAlpha = 1;

	ctx.fillStyle = '#efe2b8';
	ctx.font = '11px Georgia';
	ctx.textAlign = 'center';
	ctx.fillText('RETURN', 0, -42);
	ctx.restore();
}
