import { clamp, TAU } from '../constants.ts';
import { getFightDefinition } from '../content/fights.ts';
import type { BossState, FightId, GameMode, Hazard } from '../types.ts';
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
	const fog = ctx.createRadialGradient(500, 330, 60, 500, 370, 610);
	fog.addColorStop(0, '#273942');
	fog.addColorStop(0.55, '#17262d');
	fog.addColorStop(1, '#070d12');
	ctx.fillStyle = fog;
	ctx.fillRect(-1000, -1000, 3000, 3000);

	drawCircle(ctx, 500, 370, 334, '#0d171c', '#48616a', 2);
	drawCircle(ctx, 500, 370, 306, '#202d33', '#78909a', 3);

	ctx.save();
	ctx.beginPath();
	ctx.arc(500, 370, 302, 0, TAU);
	ctx.clip();
	for (let row = -2; row < 21; row++) {
		for (let col = -2; col < 24; col++) {
			const x = col * 48 + ((row & 1) ? 24 : 0);
			const y = row * 38;
			const n = Math.sin(row * 17 + col * 41) * 0.5 + 0.5;
			ctx.fillStyle = n > 0.62 ? '#24343a' : '#1d2a30';
			ctx.fillRect(x + 1, y + 1, 45, 35);
			if ((row + col) % 5 === 0) {
				drawLine(ctx, x + 8, y + 7, x + 37, y + 28, '#6c879025', 1);
				drawCircle(ctx, x + 24, y + 18, 2, '#a7d1d633');
			}
		}
	}
	for (const radius of [72, 118, 184, 245]) {
		ctx.save();
		ctx.translate(500, 370);
		ctx.rotate(time * (radius === 184 ? -0.025 : 0.018));
		ctx.setLineDash(radius === 118 ? [12, 8] : [3, 7]);
		drawCircle(ctx, 0, 0, radius, null, '#8db4bd45', radius === 245 ? 2 : 1);
		ctx.restore();
	}
	ctx.setLineDash([]);
	for (let i = 0; i < 8; i++) {
		const a = (i * TAU) / 8 + time * 0.012;
		const x = 500 + Math.cos(a) * 184;
		const y = 370 + Math.sin(a) * 184;
		drawCircle(ctx, x, y, i % 2 ? 5 : 8, '#759ba5', '#b6d9dd', 1);
		drawLine(ctx, 500, 370, x, y, '#66858d24');
	}
	drawCircle(ctx, 500, 370, 31, '#172329', '#9fc2c8', 2);
	drawCircle(ctx, 500, 370, 8 + Math.sin(time * 2) * 2, '#a9d8dd88');
	ctx.restore();

	for (let i = 0; i < 8; i++) {
		const a = (i * TAU) / 8 + Math.PI / 8;
		const x = 500 + Math.cos(a) * 325;
		const y = 370 + Math.sin(a) * 325;
		ctx.save();
		ctx.translate(x, y);
		ctx.rotate(a + Math.PI / 2);
		ctx.fillStyle = '#293a40';
		ctx.strokeStyle = '#71909a';
		ctx.lineWidth = 2;
		ctx.beginPath();
		ctx.moveTo(0, -29);
		ctx.lineTo(15, 7);
		ctx.lineTo(0, 22);
		ctx.lineTo(-15, 7);
		ctx.closePath();
		ctx.fill();
		ctx.stroke();
		drawCircle(ctx, 0, -4, 4 + Math.sin(time * 5 + i) * 1.5, '#b7e1df');
		ctx.restore();
	}
}

export function drawArena(ctx: CanvasRenderingContext2D, time: number, fightId: FightId): void {
	if (getFightDefinition(fightId).visuals.arena === 'orrery') drawOrrery(ctx, time);
	else drawSanctum(ctx, time);
}

export function drawBossTelegraph(ctx: CanvasRenderingContext2D, boss: BossState, mode: GameMode, time: number, fightId: FightId): void {
	if (boss.state !== 'windup' || mode !== 'play') return;
	const fight = getFightDefinition(fightId);
	const pulseAlpha = 0.86 + Math.sin(time * 15) * 0.08;
	ctx.globalAlpha = pulseAlpha;
	if (boss.move === 0) {
		const r = fight.attacks[0].meleeRadius;
		drawCircle(ctx, boss.x, boss.y, r, fight.visuals.accentSoft, fight.visuals.accent, 2);
	} else if (boss.move === 1) {
		ctx.save();
		ctx.translate(boss.x, boss.y);
		ctx.rotate(boss.angle);
		ctx.fillStyle = fight.visuals.accentSoft;
		ctx.fillRect(0, -24, fight.id === 'vael' ? 320 : 270, 48);
		ctx.strokeStyle = fight.visuals.accent;
		ctx.strokeRect(0, -24, fight.id === 'vael' ? 320 : 270, 48);
		ctx.restore();
	} else {
		const r = fight.attacks[2].blastRadius;
		drawCircle(ctx, boss.tx, boss.ty, r, fight.visuals.accentSoft, fight.visuals.accent, 2);
		drawCircle(ctx, boss.tx, boss.ty, r * (1 - clamp(boss.timer / fight.attacks[2].windup, 0, 1)), null, fight.visuals.accent, 2);
	}
	ctx.globalAlpha = 1;
}

export function drawHazards(ctx: CanvasRenderingContext2D, hazards: Hazard[], fightId: FightId): void {
	const visuals = getFightDefinition(fightId).visuals;
	for (const hazard of hazards) {
		if (hazard.kind === 'ring') {
			drawCircle(ctx, hazard.x, hazard.y, hazard.r, null, visuals.hazard, 8);
			drawCircle(ctx, hazard.x, hazard.y, hazard.r + 6, null, visuals.accentSoft, 2);
		} else {
			drawCircle(ctx, hazard.x, hazard.y, hazard.r, visuals.hazardSoft, visuals.hazard, 3);
		}
	}
}

export function drawAtmosphericDust(ctx: CanvasRenderingContext2D, time: number, fightId: FightId): void {
	const vael = fightId === 'vael';
	for (let i = 0; i < (vael ? 62 : 45); i++) {
		const x = (i * 137.2 + Math.sin(time * 0.3 + i) * 15) % 1100;
		const y = (i * 73 - time * (vael ? 7 + (i % 5) : 4 + (i % 4)) + 85000) % 850;
		drawCircle(ctx, x, y, vael && i % 9 === 0 ? 1.8 : 1, vael ? '#b7dadd38' : '#c7cba133');
	}
}
