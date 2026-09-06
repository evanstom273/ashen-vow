import { PLAYER_TUNING } from '../content/playerDefaults.ts';
import {
	canCastEquippedSpell,
	consumeEquippedSpellCast,
	cycleEquippedSpell,
	getEquippedSpellDefinition,
} from '../state/spellState.ts';
import { spawnBurst } from '../effects/particles.ts';
import type { GameState, PlayerAction, StickInput } from '../types.ts';
import type { CombatContext } from './combat.ts';

export interface PlayerActionContext extends CombatContext {
	onPause: () => void;
	getMovementInput: () => StickInput;
}

export function handlePlayerAction(ctx: PlayerActionContext, action: PlayerAction): void {
	const { state, audio, onPause } = ctx;
	const { player } = state;

	if (action === 'pause') {
		onPause();
		return;
	}
	if (state.mode !== 'play') return;

	if (action === 'dodge' && player.sp >= PLAYER_TUNING.dodge.staminaCost && player.roll <= 0 && player.cd < PLAYER_TUNING.dodge.cooldownGate && player.heal <= 0) {
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

	if (action === 'cycleSpell' && player.heal <= 0 && player.roll <= 0) {
		cycleEquippedSpell(state);
		audio.play(420, 0.08, 'sine', 0.03);
	}

	if (action === 'castStart' && player.cd <= 0 && player.roll <= 0 && player.heal <= 0 && canCastEquippedSpell(state)) {
		state.charging = true;
		state.charge = 0;
	}

	if (action === 'useConsumable' && player.flasks > 0 && player.hp < 100 && player.heal <= 0 && player.roll <= 0 && player.cd <= 0) {
		player.heal = PLAYER_TUNING.heal.duration;
		player.cd = PLAYER_TUNING.heal.cooldown;
		player.flasks -= 1;
		state.charging = false;
		state.charge = 0;
		spawnBurst(state, player.x, player.y, '#e8b75d', 20, 40);
		audio.play(500, 0.4);
	}
}

export function releaseCast(ctx: CombatContext): void {
	const { state, audio } = ctx;
	if (!state.charging) return;

	state.charging = false;
	if (state.mode !== 'play' || !canCastEquippedSpell(state)) return;

	const spell = getEquippedSpellDefinition(state);
	const powered = state.charge > spell.chargeThreshold;
	consumeEquippedSpellCast(state);
	const angle = Math.atan2(state.boss.y - state.player.y, state.boss.x - state.player.x);
	state.shots.push({
		x: state.player.x,
		y: state.player.y,
		vx: Math.cos(angle) * spell.projectileSpeed,
		vy: Math.sin(angle) * spell.projectileSpeed,
		t: spell.projectileLifetime,
		powered,
	});
	state.charge = 0;
	audio.play(powered ? 600 : 800, 0.3, 'sine', 0.04);
}

export function updatePlayerRegen(state: GameState, dt: number): void {
	const { player } = state;
	player.inv -= dt;
	player.cd -= dt;
	player.regen -= dt;

	if (player.regen <= 0 && player.roll <= 0 && !state.charging) {
		player.sp = Math.min(100, player.sp + PLAYER_TUNING.regen.staminaPerSecond * dt);
	}
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

	const spell = getEquippedSpellDefinition(state);
	state.charge = Math.min(spell.maxCharge, state.charge + dt);
	if (Math.random() < 0.5) {
		spawnBurst(state, state.player.x, state.player.y, '#83cdd5', 1, 25);
	}
}

export function updatePlayerMovement(state: GameState, movement: StickInput, dt: number): void {
	const { player } = state;
	const length = Math.hypot(movement.x, movement.y);
	const spell = getEquippedSpellDefinition(state);

	if (player.roll > 0) {
		player.roll -= dt;
		player.x += player.dx * PLAYER_TUNING.dodge.speed * dt;
		player.y += player.dy * PLAYER_TUNING.dodge.speed * dt;
		spawnBurst(state, player.x, player.y, '#8a9d92', 1, 20);
	} else if (length) {
		const speed = player.heal > 0
			? PLAYER_TUNING.movement.healingSpeed
			: state.charging
				? spell.chargingMoveSpeed
				: PLAYER_TUNING.movement.normalSpeed;
		player.x += (movement.x / Math.max(1, length)) * speed * dt;
		player.y += (movement.y / Math.max(1, length)) * speed * dt;
		player.angle = Math.atan2(movement.y, movement.x);
	}
}
