import { PLAYER_TUNING } from '../content/playerDefaults.ts';
import { spawnBurst } from '../effects/particles.ts';
import type { ActionKey, GameState, StickInput } from '../types.ts';
import { hitBoss, isPlayerInMeleeRange, type CombatContext } from './combat.ts';

export interface PlayerActionContext extends CombatContext {
	onPause: () => void;
	getMovementInput: () => StickInput;
}

export function handleAction(ctx: PlayerActionContext, key: ActionKey): void {
	const { state, audio, onPause } = ctx;
	const { player, boss } = state;

	if (key === 'Escape') {
		onPause();
		return;
	}
	if (state.mode !== 'play') return;

	if (key === ' ' && player.sp >= PLAYER_TUNING.dodge.staminaCost && player.roll <= 0 && player.cd < PLAYER_TUNING.dodge.cooldownGate && player.heal <= 0) {
		player.sp -= PLAYER_TUNING.dodge.staminaCost;
		player.regen = PLAYER_TUNING.dodge.regenLock;
		player.roll = PLAYER_TUNING.dodge.duration;
		player.inv = PLAYER_TUNING.dodge.invulnerability;
		const movement = ctx.getMovementInput();
		const length = Math.hypot(movement.x, movement.y);
		player.dx = length ? movement.x / length : Math.cos(player.angle);
		player.dy = length ? movement.y / length : Math.sin(player.angle);
		state.charging = false;
		state.charge = 0;
		audio.play(170, 0.16, 'triangle');
	}

	if (key === 'j' && player.cd <= 0 && player.roll <= 0 && player.heal <= 0 && player.sp >= PLAYER_TUNING.strike.staminaCost) {
		player.sp -= PLAYER_TUNING.strike.staminaCost;
		player.regen = PLAYER_TUNING.strike.regenLock;
		player.cd = PLAYER_TUNING.strike.cooldown;
		player.swing = PLAYER_TUNING.strike.swingDuration;
		player.angle = Math.atan2(boss.y - player.y, boss.x - player.x);
		if (isPlayerInMeleeRange(state)) {
			hitBoss(ctx, PLAYER_TUNING.strike.damage);
		}
		audio.play(280, 0.12, 'sawtooth', 0.02);
	}

	if (key === 'k' && player.cd <= 0 && player.roll <= 0 && player.heal <= 0 && player.fp >= PLAYER_TUNING.sorcery.basicFocusCost) {
		state.charging = true;
		state.charge = 0;
	}

	if (key === 'e' && player.flasks > 0 && player.hp < 100 && player.heal <= 0 && player.roll <= 0 && player.cd <= 0) {
		player.heal = PLAYER_TUNING.heal.duration;
		player.cd = PLAYER_TUNING.heal.cooldown;
		player.flasks -= 1;
		state.charging = false;
		state.charge = 0;
		spawnBurst(state, player.x, player.y, '#e8b75d', 20, 40);
		audio.play(500, 0.4);
	}
}

export function castSorcery(ctx: CombatContext): void {
	const { state, audio } = ctx;
	if (!state.charging) return;

	state.charging = false;
	if (state.mode !== 'play' || state.player.fp < PLAYER_TUNING.sorcery.basicFocusCost) return;

	const powered = state.charge > PLAYER_TUNING.sorcery.chargeThreshold && state.player.fp >= PLAYER_TUNING.sorcery.chargedFocusCost;
	state.player.fp -= powered ? PLAYER_TUNING.sorcery.chargedFocusCost : PLAYER_TUNING.sorcery.basicFocusCost;
	state.player.cd = PLAYER_TUNING.sorcery.cooldown;
	const angle = Math.atan2(state.boss.y - state.player.y, state.boss.x - state.player.x);
	state.shots.push({
		x: state.player.x,
		y: state.player.y,
		vx: Math.cos(angle) * PLAYER_TUNING.sorcery.projectileSpeed,
		vy: Math.sin(angle) * PLAYER_TUNING.sorcery.projectileSpeed,
		t: PLAYER_TUNING.sorcery.projectileLifetime,
		powered,
	});
	state.charge = 0;
	audio.play(powered ? 600 : 800, 0.3, 'sine', 0.04);
}

export function updatePlayerRegen(state: GameState, dt: number): void {
	const { player } = state;
	player.inv -= dt;
	player.cd -= dt;
	player.swing -= dt;
	player.regen -= dt;

	if (player.regen <= 0 && player.roll <= 0 && !state.charging) {
		player.sp = Math.min(100, player.sp + PLAYER_TUNING.regen.staminaPerSecond * dt);
	}
	player.fp = Math.min(100, player.fp + PLAYER_TUNING.regen.focusPerSecond * dt);
}

export function updatePlayerHealing(ctx: CombatContext, dt: number): void {
	const { state, audio } = ctx;
	const { player } = state;

	if (player.heal <= 0) return;

	player.heal -= dt;
	if (player.heal <= 0) {
		player.hp = Math.min(100, player.hp + PLAYER_TUNING.heal.restore);
		spawnBurst(state, player.x, player.y, '#f3d484', 30, 70);
		audio.play(750, 0.3);
	}
}

export function updateSorceryCharge(state: GameState, dt: number): void {
	if (!state.charging) return;

	state.charge = Math.min(PLAYER_TUNING.sorcery.maxCharge, state.charge + dt);
	if (Math.random() < 0.5) {
		spawnBurst(state, state.player.x, state.player.y, '#83cdd5', 1, 25);
	}
}

export function updatePlayerMovement(state: GameState, movement: StickInput, dt: number): void {
	const { player } = state;
	const length = Math.hypot(movement.x, movement.y);

	if (player.roll > 0) {
		player.roll -= dt;
		player.x += player.dx * PLAYER_TUNING.dodge.speed * dt;
		player.y += player.dy * PLAYER_TUNING.dodge.speed * dt;
		spawnBurst(state, player.x, player.y, '#8a9d92', 1, 20);
	} else if (length) {
		const speed = player.heal > 0
			? PLAYER_TUNING.movement.healingSpeed
			: state.charging
				? PLAYER_TUNING.movement.chargingSpeed
				: PLAYER_TUNING.movement.normalSpeed;
		player.x += (movement.x / Math.max(1, length)) * speed * dt;
		player.y += (movement.y / Math.max(1, length)) * speed * dt;
		player.angle = Math.atan2(movement.y, movement.x);
	}
}
