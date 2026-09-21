import { WORLD_CENTER_X, WORLD_CENTER_Y, WORLD_HEIGHT, WORLD_WIDTH } from '../constants.ts';
import type { GameMode, GameState, Viewport } from '../types.ts';
import { getAreaDefinition } from '../content/areas.ts';
import { getArtTheme } from './artThemes.ts';
import { getWorldCamera, renderOverworld } from '../world/overworldRenderer.ts';
import {
	drawArena,
	drawArenaExit,
	drawAtmosphericDust,
	drawHazards,
} from './drawArena.ts';
import { drawBossTelegraph } from './bossTelegraphs.ts';
import { getEquippedSpellDefinition } from '../state/spellState.ts';
import {
	drawChargeRing,
	drawKnight,
	drawParticles,
	drawProjectiles,
} from './drawActors.ts';

export class CanvasRenderer {
	private readonly canvas: HTMLCanvasElement;
	private readonly ctx: CanvasRenderingContext2D;
	private viewport: Viewport = { w: 0, h: 0, scale: 1, ox: 0, oy: 0 };

	constructor(canvas: HTMLCanvasElement) {
		const context = canvas.getContext('2d');
		if (!context) {
			throw new Error('Canvas 2D context unavailable.');
		}
		this.canvas = canvas;
		this.ctx = context;
		this.bindResize();
		this.resize();
	}

	private bindResize(): void {
		addEventListener('resize', () => this.resize());
	}

	resize(): Viewport {
		const w = innerWidth;
		const h = innerHeight;
		this.canvas.width = w * devicePixelRatio;
		this.canvas.height = h * devicePixelRatio;
		const scale = Math.min(w / WORLD_WIDTH, h / WORLD_HEIGHT);
		const ox = w / 2 - WORLD_CENTER_X * scale;
		const oy = h / 2 - WORLD_CENTER_Y * scale;
		this.viewport = { w, h, scale, ox, oy };
		return this.viewport;
	}

	getViewport(): Viewport {
		return this.viewport;
	}
	getActorScreenPosition(state: GameState): { x: number; y: number } {
		const { scale, ox, oy } = this.viewport;
		const area = getAreaDefinition(state.currentAreaId);
		if (area.kind === 'overworld') {
			const camera = getWorldCamera(state);
			const worldScale = scale * 1.18;
			return {
				x: ox + 500 * scale + (state.player.x - camera.x) * worldScale,
				y: oy + 375 * scale + (state.player.y - camera.y) * worldScale,
			};
		}
		return { x: ox + state.player.x * scale, y: oy + state.player.y * scale };
	}


	render(state: GameState, mode: GameMode): void {
		const { ctx, viewport } = this;
		const { w, h, scale, ox, oy } = viewport;
		const shakeOffset = state.shake;

		ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
		const currentArea = getAreaDefinition(state.currentAreaId);
		const artTheme = getArtTheme(currentArea.artTheme);
		ctx.fillStyle = artTheme.background;
		ctx.fillRect(0, 0, w, h);

		if (currentArea.kind === 'overworld') {
			renderOverworld(ctx, state, viewport);
		} else {
		ctx.save();
		ctx.translate(
			ox + (Math.random() - 0.5) * shakeOffset,
			oy + (Math.random() - 0.5) * shakeOffset,
		);
		ctx.scale(scale, scale);

		drawArena(ctx, state.time, state.currentAreaId);
		if (!state.postFight) {
			drawBossTelegraph(ctx, state.boss, mode, state.time, state.fightId);
			drawHazards(ctx, state.hazards, state.fightId);
		}
		if (state.arenaExitActive) drawArenaExit(ctx, state.time, state.currentAreaId);

		if (state.player.y < state.boss.y) {
			drawKnight(ctx, state.player, false, state.time, state.phase2, state.fightId, state.charging);
			drawKnight(ctx, state.boss, true, state.time, state.phase2, state.fightId, false, state.bossDeathProgress);
		} else {
			drawKnight(ctx, state.boss, true, state.time, state.phase2, state.fightId, false, state.bossDeathProgress);
			drawKnight(ctx, state.player, false, state.time, state.phase2, state.fightId);
		}

		if (state.charging) {
			const spell = getEquippedSpellDefinition(state);
			drawChargeRing(ctx, state.player.x, state.player.y, state.charge, spell.visual);
		}

		drawProjectiles(ctx, state.shots, state.time);
		drawParticles(ctx, state.particles);
		drawAtmosphericDust(ctx, state.time, state.currentAreaId);

		ctx.restore();
		}

		const vignette = ctx.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, Math.max(w, h) * 0.7);
		vignette.addColorStop(0, '#0000');
		vignette.addColorStop(1, '#020806cc');
		ctx.fillStyle = vignette;
		ctx.fillRect(0, 0, w, h);

		if (mode === 'dead') {
			ctx.fillStyle = '#641d1822';
			ctx.fillRect(0, 0, w, h);
		}
	}
}
