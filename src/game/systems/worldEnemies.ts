import { clamp } from '../constants.ts';
import { getEnemyDefinition } from '../content/enemies.ts';
import { getSpellDefinition } from '../content/spells.ts';
import { getWeaponClass } from '../content/weapons.ts';
import { spawnBurst } from '../effects/particles.ts';
import type { GameState, Vec2, WorldEnemyState } from '../types.ts';
import { WORLD_PROPS } from '../world/overworldContent.ts';
import { getEnemySpawn } from '../world/enemySpawns.ts';
import { hurtPlayer, type CombatContext } from './combat.ts';

const VISION_DISTANCE = 410;
const VISION_HALF_ANGLE = 0.58;
const HEARING_RADIUS = 82;
const SUSPICIOUS_THRESHOLD = 0.18;
const ALERT_THRESHOLD = 1;
const SEARCH_DURATION = 2.8;

function angleDelta(a: number, b: number): number {
	let delta = (a - b) % (Math.PI * 2);
	if (delta > Math.PI) delta -= Math.PI * 2;
	if (delta < -Math.PI) delta += Math.PI * 2;
	return delta;
}

function pointInsideBlocker(x: number, y: number): boolean {
	for (const prop of WORLD_PROPS) {
		if (!['tree', 'rock', 'wall', 'tower', 'gate', 'cart', 'barricade'].includes(prop.kind)) continue;
		if (prop.collisionRadius && Math.hypot(x - prop.x, y - prop.y) < prop.collisionRadius) return true;
		if (prop.collisionRect) {
			const rect = prop.collisionRect;
			if (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h) return true;
		}
	}
	return false;
}

export function hasWorldLineOfSight(from: Vec2, to: Vec2): boolean {
	const distance = Math.hypot(to.x - from.x, to.y - from.y);
	const steps = Math.max(1, Math.ceil(distance / 20));
	for (let i = 1; i < steps; i++) {
		const t = i / steps;
		if (pointInsideBlocker(from.x + (to.x - from.x) * t, from.y + (to.y - from.y) * t)) return false;
	}
	return true;
}

function playerVisible(state: GameState, enemy: WorldEnemyState): boolean {
	const dx = state.player.x - enemy.x;
	const dy = state.player.y - enemy.y;
	const distance = Math.hypot(dx, dy);
	if (distance > VISION_DISTANCE) return false;
	const angle = Math.atan2(dy, dx);
	if (Math.abs(angleDelta(angle, enemy.facing)) > VISION_HALF_ANGLE) return false;
	return hasWorldLineOfSight(enemy, state.player);
}

function moveToward(enemy: WorldEnemyState, x: number, y: number, speed: number, dt: number): number {
	const dx = x - enemy.x;
	const dy = y - enemy.y;
	const distance = Math.hypot(dx, dy);
	if (distance <= 0.001) return 0;
	enemy.facing = Math.atan2(dy, dx);
	const amount = Math.min(distance, speed * dt);
	enemy.x += (dx / distance) * amount;
	enemy.y += (dy / distance) * amount;
	return distance;
}

function moveAway(enemy: WorldEnemyState, x: number, y: number, speed: number, dt: number): void {
	const dx = enemy.x - x;
	const dy = enemy.y - y;
	const distance = Math.max(0.001, Math.hypot(dx, dy));
	enemy.facing = Math.atan2(y - enemy.y, x - enemy.x);
	enemy.x += (dx / distance) * speed * dt;
	enemy.y += (dy / distance) * speed * dt;
}

function updateIdleMovement(enemy: WorldEnemyState, dt: number): void {
	if (enemy.config.idleBehavior !== 'patrol') return;
	const spawn = getEnemySpawn(enemy.spawnId);
	if (!spawn || spawn.patrolPoints.length === 0) return;
	const target = spawn.patrolPoints[enemy.patrolIndex % spawn.patrolPoints.length]!;
	if (moveToward(enemy, target.x, target.y, 42, dt) < 14) {
		enemy.patrolIndex = (enemy.patrolIndex + 1) % spawn.patrolPoints.length;
	}
}

function updateAwareness(state: GameState, enemy: WorldEnemyState, dt: number): boolean {
	const visible = playerVisible(state, enemy);
	const distance = Math.hypot(state.player.x - enemy.x, state.player.y - enemy.y);
	const veryClose = distance <= HEARING_RADIUS;

	if (visible || veryClose) {
		const proximity = 1 - clamp(distance / VISION_DISTANCE, 0, 1);
		const rate = veryClose ? 1.8 : 0.42 + proximity * 1.15;
		enemy.awareness = clamp(enemy.awareness + rate * dt, 0, ALERT_THRESHOLD);
		enemy.lastKnownX = state.player.x;
		enemy.lastKnownY = state.player.y;
		if (enemy.awareness >= ALERT_THRESHOLD) {
			enemy.awarenessState = 'alerted';
			enemy.searchTimer = 0;
		} else if (enemy.awareness >= SUSPICIOUS_THRESHOLD && enemy.awarenessState === 'unaware') {
			enemy.awarenessState = 'suspicious';
		}
	} else if (enemy.awarenessState === 'unaware' || enemy.awarenessState === 'suspicious') {
		enemy.awareness = Math.max(0, enemy.awareness - dt * 0.32);
		if (enemy.awareness <= 0) enemy.awarenessState = 'unaware';
	}

	return visible;
}

function attackMelee(ctx: CombatContext, enemy: WorldEnemyState, dt: number): void {
	const weapon = getWeaponClass(enemy.config.weaponClass);
	const { player } = ctx.state;
	const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
	const tooCloseForReachWeapon = enemy.config.weaponClass === 'spear' && distance < weapon.preferredRange * 0.42;

	if (tooCloseForReachWeapon) {
		moveAway(enemy, player.x, player.y, weapon.moveSpeed * 0.7, dt);
	} else if (distance > weapon.preferredRange) {
		moveToward(enemy, player.x, player.y, weapon.moveSpeed, dt);
	}

	if (distance <= weapon.attackRange && enemy.attackCooldown <= 0) {
		enemy.facing = Math.atan2(player.y - enemy.y, player.x - enemy.x);
		hurtPlayer(ctx, weapon.damage);
		enemy.attackCooldown = weapon.attackCooldown;
	}
}

function fireProjectile(ctx: CombatContext, enemy: WorldEnemyState, kind: 'arrow' | 'magic'): void {
	const weapon = getWeaponClass(enemy.config.weaponClass);
	const { player } = ctx.state;
	const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
	const speed = weapon.projectileSpeed ?? 320;
	const spellId = kind === 'magic' && enemy.config.spellIds.length
		? enemy.config.spellIds[Math.floor(Math.random() * enemy.config.spellIds.length)]
		: undefined;
	const spell = spellId ? getSpellDefinition(spellId) : null;
	ctx.state.worldEnemyProjectiles.push({
		x: enemy.x,
		y: enemy.y - 8,
		vx: Math.cos(angle) * speed,
		vy: Math.sin(angle) * speed,
		t: 2.2,
		damage: spell ? Math.max(12, Math.round(spell.charge.basicDamage * 0.28)) : weapon.damage,
		kind,
		spellId,
		sourceId: enemy.spawnId,
	});
	enemy.attackCooldown = spell ? Math.max(0.9, spell.cooldown + 0.65) : weapon.attackCooldown;
}

function attackRanged(ctx: CombatContext, enemy: WorldEnemyState, dt: number): void {
	const weapon = getWeaponClass(enemy.config.weaponClass);
	const { player } = ctx.state;
	const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
	enemy.facing = Math.atan2(player.y - enemy.y, player.x - enemy.x);

	if (distance < weapon.preferredRange * 0.62) {
		moveAway(enemy, player.x, player.y, weapon.moveSpeed, dt);
	} else if (distance > weapon.preferredRange * 1.22) {
		moveToward(enemy, player.x, player.y, weapon.moveSpeed * 0.75, dt);
	}

	if (distance <= weapon.attackRange && enemy.attackCooldown <= 0 && hasWorldLineOfSight(enemy, player)) {
		fireProjectile(ctx, enemy, 'arrow');
	}
}

function attackMagic(ctx: CombatContext, enemy: WorldEnemyState, dt: number): void {
	const weapon = getWeaponClass(enemy.config.weaponClass);
	const { player } = ctx.state;
	const distance = Math.hypot(player.x - enemy.x, player.y - enemy.y);
	enemy.facing = Math.atan2(player.y - enemy.y, player.x - enemy.x);

	if (distance < 72 && enemy.attackCooldown <= 0) {
		hurtPlayer(ctx, 16);
		spawnBurst(ctx.state, enemy.x, enemy.y, '#91bdc7', 12, 70);
		enemy.attackCooldown = 1.15;
		return;
	}

	if (distance < weapon.preferredRange * 0.55) {
		moveAway(enemy, player.x, player.y, weapon.moveSpeed * 0.85, dt);
	} else if (distance > weapon.preferredRange * 1.25) {
		moveToward(enemy, player.x, player.y, weapon.moveSpeed * 0.65, dt);
	}

	if (distance <= weapon.attackRange && enemy.attackCooldown <= 0 && hasWorldLineOfSight(enemy, player)) {
		fireProjectile(ctx, enemy, 'magic');
	}
}

function updateAlerted(ctx: CombatContext, enemy: WorldEnemyState, dt: number, visible: boolean): void {
	if (!visible) {
		enemy.searchTimer += dt;
		moveToward(enemy, enemy.lastKnownX, enemy.lastKnownY, getWeaponClass(enemy.config.weaponClass).moveSpeed * 0.75, dt);
		if (enemy.searchTimer >= 1.6) {
			enemy.awarenessState = 'searching';
			enemy.searchTimer = SEARCH_DURATION;
		}
		return;
	}

	enemy.searchTimer = 0;
	if (enemy.config.archetype === 'melee') attackMelee(ctx, enemy, dt);
	else if (enemy.config.archetype === 'ranged') attackRanged(ctx, enemy, dt);
	else attackMagic(ctx, enemy, dt);
}

function updateSearching(enemy: WorldEnemyState, dt: number): void {
	enemy.searchTimer -= dt;
	const distance = moveToward(enemy, enemy.lastKnownX, enemy.lastKnownY, 58, dt);
	if (enemy.searchTimer <= 0 || distance < 16) {
		enemy.awarenessState = 'returning';
		enemy.awareness = Math.min(enemy.awareness, 0.45);
	}
}

function updateReturning(enemy: WorldEnemyState, dt: number): void {
	if (moveToward(enemy, enemy.homeX, enemy.homeY, 62, dt) < 12) {
		const spawn = getEnemySpawn(enemy.spawnId);
		enemy.x = enemy.homeX;
		enemy.y = enemy.homeY;
		enemy.facing = spawn?.facing ?? enemy.facing;
		enemy.awareness = 0;
		enemy.awarenessState = 'unaware';
	}
}

function updateEnemyProjectiles(ctx: CombatContext, dt: number): void {
	const { state } = ctx;
	state.worldEnemyProjectiles = state.worldEnemyProjectiles.filter((projectile) => {
		projectile.x += projectile.vx * dt;
		projectile.y += projectile.vy * dt;
		projectile.t -= dt;
		if (Math.hypot(projectile.x - state.player.x, projectile.y - state.player.y) < 18) {
			hurtPlayer(ctx, projectile.damage);
			if (projectile.kind === 'magic') spawnBurst(state, projectile.x, projectile.y, '#9ccbd2', 10, 65);
			return false;
		}
		return projectile.t > 0;
	});
}

export function hitWorldEnemy(ctx: CombatContext, enemy: WorldEnemyState, damage: number, color = '#d6b378'): void {
	if (!enemy.alive) return;
	enemy.hp = Math.max(0, enemy.hp - damage);
	enemy.hitFlash = 0.15;
	enemy.awareness = ALERT_THRESHOLD;
	enemy.awarenessState = 'alerted';
	enemy.lastKnownX = ctx.state.player.x;
	enemy.lastKnownY = ctx.state.player.y;
	spawnBurst(ctx.state, enemy.x, enemy.y, color, 12, 85);
	ctx.state.hitStop = Math.max(ctx.state.hitStop, damage >= 30 ? 0.045 : 0.025);
	ctx.audio.play(95, 0.12, 'triangle', 0.045);

	if (enemy.hp <= 0) {
		enemy.alive = false;
		enemy.deathProgress = 0;
		ctx.audio.play(70, 0.28, 'sawtooth', 0.025);
	}
}

export function findNearestWorldEnemy(state: GameState, maxDistance = Infinity): WorldEnemyState | null {
	let nearest: WorldEnemyState | null = null;
	let best = maxDistance;
	for (const enemy of state.worldEnemies) {
		if (!enemy.alive) continue;
		const distance = Math.hypot(enemy.x - state.player.x, enemy.y - state.player.y);
		if (distance < best) {
			best = distance;
			nearest = enemy;
		}
	}
	return nearest;
}

export function findWorldEnemyProjectileHit(
	state: GameState,
	prevX: number,
	prevY: number,
	x: number,
	y: number,
	hitRadius: number,
): WorldEnemyState | null {
	const dx = x - prevX;
	const dy = y - prevY;
	const lengthSq = dx * dx + dy * dy;

	for (const enemy of state.worldEnemies) {
		if (!enemy.alive) continue;
		const radius = hitRadius + 14;
		if (Math.hypot(x - enemy.x, y - enemy.y) <= radius || Math.hypot(prevX - enemy.x, prevY - enemy.y) <= radius) return enemy;
		if (lengthSq <= 0) continue;
		const t = clamp(((enemy.x - prevX) * dx + (enemy.y - prevY) * dy) / lengthSq, 0, 1);
		const closestX = prevX + dx * t;
		const closestY = prevY + dy * t;
		if (Math.hypot(closestX - enemy.x, closestY - enemy.y) <= radius) return enemy;
	}
	return null;
}

export function updateWorldEnemies(ctx: CombatContext, dt: number): void {
	for (const enemy of ctx.state.worldEnemies) {
		enemy.hitFlash = Math.max(0, enemy.hitFlash - dt);
		enemy.attackCooldown = Math.max(0, enemy.attackCooldown - dt);

		if (!enemy.alive) {
			enemy.deathProgress = Math.min(1, enemy.deathProgress + dt / 0.9);
			if (!enemy.runeGranted && enemy.deathProgress >= 0.32) {
				enemy.runeGranted = true;
				ctx.state.runes += getEnemyDefinition(enemy.config.enemyId).runeReward;
			}
			continue;
		}

		const visible = updateAwareness(ctx.state, enemy, dt);
		if (enemy.awarenessState === 'alerted') updateAlerted(ctx, enemy, dt, visible);
		else if (enemy.awarenessState === 'searching') updateSearching(enemy, dt);
		else if (enemy.awarenessState === 'returning') updateReturning(enemy, dt);
		else if (enemy.awarenessState === 'suspicious') {
			enemy.facing = Math.atan2(ctx.state.player.y - enemy.y, ctx.state.player.x - enemy.x);
		} else {
			updateIdleMovement(enemy, dt);
		}
	}

	updateEnemyProjectiles(ctx, dt);
}
