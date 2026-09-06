import { ARENA, ARENA_BOUNDARY_INSET, clamp, dist } from '../constants.ts';
import { PLAYER_TUNING } from '../content/playerDefaults.ts';
import type { DamageType } from '../content/effects.ts';
import { spawnBurst } from '../effects/particles.ts';
import type { AudioManager } from '../audio/AudioManager.ts';
import type { GameState, Vec2 } from '../types.ts';

export interface CombatContext {
	state: GameState;
	audio: AudioManager;
	onPlayerDeath: () => void;
	onBossDefeated: () => void;
}

export interface HitBossOptions {
	flash?: boolean;
	shake?: number;
	particles?: number;
	particleColor?: string;
	particleSpeed?: number;
	audio?: boolean;
}

const DEFAULT_HIT_BOSS_OPTIONS: Required<HitBossOptions> = {
	flash: true,
	shake: 4,
	particles: 18,
	particleColor: '#d6b378',
	particleSpeed: 100,
	audio: true,
};

export function constrainToArena(entity: Vec2): void {
	const distance = dist(entity, ARENA);
	const radius = ARENA.r - ARENA_BOUNDARY_INSET;
	if (distance > radius) {
		entity.x = ARENA.x + ((entity.x - ARENA.x) * radius) / distance;
		entity.y = ARENA.y + ((entity.y - ARENA.y) * radius) / distance;
	}
}

export function hitBoss(
	ctx: CombatContext,
	damage: number,
	_damageType: DamageType = 'physical',
	options: HitBossOptions = {},
): void {
	const { state, audio, onBossDefeated } = ctx;
	const { boss } = state;
	if (boss.hp <= 0) return;

	const resolved = { ...DEFAULT_HIT_BOSS_OPTIONS, ...options };

	boss.hp = Math.max(0, boss.hp - damage);
	if (resolved.flash) {
		boss.flash = 0.12;
	}
	spawnBurst(state, boss.x, boss.y, resolved.particleColor, resolved.particles, resolved.particleSpeed);
	state.shake = Math.max(state.shake, resolved.shake);
	if (resolved.audio) {
		audio.play(90, 0.16, 'triangle', 0.08);
	}

	if (boss.hp <= 0) {
		onBossDefeated();
	}
}

export function hurtPlayer(ctx: CombatContext, damage: number): void {
	const { state, audio, onPlayerDeath } = ctx;
	const { player } = state;
	if (player.inv > 0 || state.mode !== 'play') return;

	player.hp = Math.max(0, player.hp - damage);
	player.inv = PLAYER_TUNING.invulnerabilityAfterHit;
	state.shake = 9;
	spawnBurst(state, player.x, player.y, '#b44e3e', 20, 160);
	audio.play(65, 0.25, 'sawtooth', 0.04);

	if (player.hp <= 0) {
		onPlayerDeath();
	}
}

export function isPlayerInBossMeleeRadius(state: GameState, radius: number): boolean {
	return dist(state.player, state.boss) < radius;
}

export function isPlayerInBlast(state: GameState, x: number, y: number, radius: number): boolean {
	return Math.hypot(state.player.x - x, state.player.y - y) < radius;
}

function isPointInBossHitRadius(state: GameState, x: number, y: number, hitRadius: number): boolean {
	return dist({ x, y }, state.boss) < hitRadius;
}

/** Swept segment test — avoids fast projectiles skipping the boss in one frame. */
export function isProjectileHit(
	state: GameState,
	prevX: number,
	prevY: number,
	x: number,
	y: number,
	hitRadius: number,
): boolean {
	if (isPointInBossHitRadius(state, x, y, hitRadius)) {
		return true;
	}
	if (isPointInBossHitRadius(state, prevX, prevY, hitRadius)) {
		return true;
	}

	const { boss } = state;
	const dx = x - prevX;
	const dy = y - prevY;
	const lengthSq = dx * dx + dy * dy;
	if (lengthSq <= 0) {
		return false;
	}

	const t = clamp(((boss.x - prevX) * dx + (boss.y - prevY) * dy) / lengthSq, 0, 1);
	const closestX = prevX + dx * t;
	const closestY = prevY + dy * t;
	return dist({ x: closestX, y: closestY }, boss) < hitRadius;
}
