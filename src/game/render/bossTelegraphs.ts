import { clamp } from '../constants.ts';
import { getFightDefinition } from '../content/fights.ts';
import type { BossState, FightId, GameMode } from '../types.ts';
import { drawCircle, drawLine } from './primitives.ts';

type TelegraphDrawer = (
	ctx: CanvasRenderingContext2D,
	boss: BossState,
	mode: GameMode,
	time: number,
) => void;

const drawAeronTelegraph: TelegraphDrawer = (ctx, boss, mode, time) => {
	if (boss.state !== 'windup' || mode !== 'play') return;
	const fight = getFightDefinition('aeron');
	const pulseAlpha = 0.78 + Math.sin(time * 15) * 0.12;
	ctx.globalAlpha = pulseAlpha;

	if (boss.move === 0) {
		const radius = fight.attacks[0].meleeRadius;
		drawCircle(ctx, boss.x, boss.y, radius, fight.visuals.accentSoft, fight.visuals.accent, 2);
	} else if (boss.move === 1) {
		ctx.save();
		ctx.translate(boss.x, boss.y);
		ctx.rotate(boss.angle);
		ctx.fillStyle = fight.visuals.accentSoft;
		ctx.fillRect(0, -24, 270, 48);
		ctx.strokeStyle = fight.visuals.accent;
		ctx.strokeRect(0, -24, 270, 48);
		ctx.restore();
	} else {
		const attack = fight.attacks[2];
		drawCircle(ctx, boss.tx, boss.ty, attack.blastRadius, fight.visuals.accentSoft, fight.visuals.accent, 2);
		drawCircle(
			ctx,
			boss.tx,
			boss.ty,
			attack.blastRadius * (1 - clamp(boss.timer / attack.windup, 0, 1)),
			null,
			fight.visuals.accent,
			2,
		);
	}
	ctx.globalAlpha = 1;
};

const drawVaelTelegraph: TelegraphDrawer = (ctx, boss, mode, time) => {
	if (boss.state !== 'windup' || mode !== 'play') return;
	const pulseAlpha = 0.78 + Math.sin(time * 15) * 0.12;
	ctx.globalAlpha = pulseAlpha;

	if (boss.move === 0) {
		const offsets = [[0, 0], [-92, 0], [92, 0], [0, -92], [0, 92]] as const;
		for (const [dx, dy] of offsets) {
			drawCircle(ctx, boss.tx + dx, boss.ty + dy, 50, '#7daab21f', '#9fcbd3aa', 2);
			drawCircle(ctx, boss.tx + dx, boss.ty + dy, 8 + Math.sin(time * 8) * 2, null, '#c3e7e8aa', 1);
		}
	} else if (boss.move === 1) {
		drawCircle(ctx, 500, 375, 46, '#7daab222', '#a8d7dbaa', 2);
		const base = Math.atan2(boss.ty - 375, boss.tx - 500);
		for (let i = 0; i < 2; i++) {
			const angle = base + i * Math.PI;
			drawLine(ctx, 500, 375, 500 + Math.cos(angle) * 430, 375 + Math.sin(angle) * 430, '#9fcbd399', 8);
		}
	} else {
		const aim = Math.atan2(boss.y - boss.ty, boss.x - boss.tx);
		drawCircle(ctx, boss.tx, boss.ty, 58, '#7daab222', '#a8d7dbaa', 2);
		drawCircle(ctx, boss.tx, boss.ty, 18 + Math.sin(time * 9) * 3, null, '#d0eeeecc', 2);
		for (let i = -1; i <= 1; i++) {
			const angle = aim + Math.PI + i * 0.34;
			drawLine(ctx, boss.tx, boss.ty, boss.tx + Math.cos(angle) * 220, boss.ty + Math.sin(angle) * 220, '#9fcbd355', 3);
		}
	}
	ctx.globalAlpha = 1;
};

const TELEGRAPH_DRAWERS: Record<FightId, TelegraphDrawer> = {
	aeron: drawAeronTelegraph,
	vael: drawVaelTelegraph,
};

export function drawBossTelegraph(
	ctx: CanvasRenderingContext2D,
	boss: BossState,
	mode: GameMode,
	time: number,
	fightId: FightId,
): void {
	TELEGRAPH_DRAWERS[fightId](ctx, boss, mode, time);
}
