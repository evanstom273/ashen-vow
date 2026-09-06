import { clamp, TAU } from '../constants.ts';
import type { BossState, GameMode, Hazard } from '../types.ts';
import { drawCircle, drawLine } from './primitives.ts';

export function drawArena(ctx: CanvasRenderingContext2D, time: number): void {
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
			if (n > 0.8) {
				drawLine(ctx, x + 5, y + 8, x + 23, y + 25, '#65705b25');
			}
		}
	}

	for (const radius of [80, 86, 177, 182, 279, 288]) {
		drawCircle(ctx, 500, 370, radius, null, '#93947530', 1);
	}

	for (let i = 0; i < 16; i++) {
		const angle = (i * TAU) / 16;
		drawLine(
			ctx,
			500 + Math.cos(angle) * 184,
			370 + Math.sin(angle) * 184,
			500 + Math.cos(angle) * 279,
			370 + Math.sin(angle) * 279,
			'#8a91782a',
		);
	}

	drawCircle(ctx, 500, 370, 37, null, '#a69d7155');
	for (let i = 0; i < 8; i++) {
		const angle = (i * TAU) / 8;
		drawLine(
			ctx,
			500 + Math.cos(angle) * 37,
			370 + Math.sin(angle) * 37,
			500 + Math.cos(angle + Math.PI) * 37,
			370 + Math.sin(angle + Math.PI) * 37,
			'#a69d7133',
		);
	}
	ctx.restore();

	for (let i = 0; i < 12; i++) {
		const angle = (i * TAU) / 12;
		const x = 500 + Math.cos(angle) * 323;
		const y = 370 + Math.sin(angle) * 323;
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

export function drawBossTelegraph(
	ctx: CanvasRenderingContext2D,
	boss: BossState,
	mode: GameMode,
	time: number,
): void {
	if (boss.state !== 'windup' || mode !== 'play') return;

	const alpha = 0.12 + Math.sin(time * 15) * 0.05;
	if (boss.move === 0) {
		drawCircle(ctx, boss.x, boss.y, 135, `rgba(206,123,66,${alpha})`, '#d09b6699', 2);
	} else if (boss.move === 1) {
		ctx.save();
		ctx.translate(boss.x, boss.y);
		ctx.rotate(boss.angle);
		ctx.fillStyle = `rgba(224,158,86,${alpha})`;
		ctx.fillRect(0, -28, 270, 56);
		ctx.strokeStyle = '#d7a06588';
		ctx.strokeRect(0, -28, 270, 56);
		ctx.restore();
	} else {
		drawCircle(ctx, boss.tx, boss.ty, 100, `rgba(218,145,70,${alpha})`, '#d7b374aa', 2);
		drawCircle(
			ctx,
			boss.tx,
			boss.ty,
			100 * (1 - clamp(boss.timer / 1.2, 0, 1)),
			null,
			'#d7b37477',
			2,
		);
	}
}

export function drawHazards(ctx: CanvasRenderingContext2D, hazards: Hazard[]): void {
	for (const hazard of hazards) {
		if (hazard.kind === 'ring') {
			drawCircle(ctx, hazard.x, hazard.y, hazard.r, null, '#f2b06ca0', 8);
			drawCircle(ctx, hazard.x, hazard.y, hazard.r + 6, null, '#f8d19755', 2);
		} else {
			drawCircle(ctx, hazard.x, hazard.y, hazard.r, '#eac78a55', '#f6d8a6', 3);
		}
	}
}

export function drawAtmosphericDust(ctx: CanvasRenderingContext2D, time: number): void {
	for (let i = 0; i < 45; i++) {
		const x = (i * 137.2 + Math.sin(time * 0.3 + i) * 15) % 1100;
		const y = (i * 73 - time * (4 + (i % 4)) + 85000) % 850;
		drawCircle(ctx, x, y, 1, '#c7cba133');
	}
}
