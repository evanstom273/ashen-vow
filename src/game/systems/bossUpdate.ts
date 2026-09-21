import { dist, TAU } from '../constants.ts';
import { getAttackIndex, getAttackWindup, getFightDefinition, getPhaseTiming } from '../content/fights.ts';
import { spawnBurst } from '../effects/particles.ts';
import type { GameState } from '../types.ts';
import {
	constrainToFightArena,
	hurtPlayer,
	isPlayerInBlast,
	isPlayerInBossMeleeRadius,
	type CombatContext,
} from './combat.ts';

export interface BossUpdateContext extends CombatContext {
	announce: (message: string, duration?: number) => void;
}

function beginBossAttack(state: GameState): void {
	const { boss, player } = state;
	boss.state = 'windup';
	boss.move = getAttackIndex(boss.combo++);
	const fight = getFightDefinition(state.fightId);
	boss.timer = getAttackWindup(fight, boss.move, state.phase2);
	boss.angle = Math.atan2(player.y - boss.y, player.x - boss.x);
	boss.tx = player.x;
	boss.ty = player.y;
}

function triggerPhaseTransition(ctx: BossUpdateContext): void {
	const { state, audio, announce } = ctx;
	const { boss } = state;
	const fight = getFightDefinition(state.fightId);

	state.phase2 = true;
	boss.state = 'recover';
	boss.timer = fight.phases.phase2.transitionRecover;
	announce(fight.phases.phase2.announce, fight.phases.phase2.announceDuration);
	spawnBurst(state, boss.x, boss.y, fight.visuals.phaseBurst, 70, 160);

	if (state.fightId === 'vael') {
		for (let i = 0; i < 6; i++) {
			const angle = (i * TAU) / 6;
			state.hazards.push({
				kind: 'starfall',
				x: 500 + Math.cos(angle) * 205,
				y: 375 + Math.sin(angle) * 145,
				r: 54,
				t: 0.7 + i * 0.08,
				triggered: false,
				damage: 22,
			});
		}
	} else {
		state.hazards.push({
			kind: 'ring',
			x: boss.x,
			y: boss.y,
			r: 0,
			max: fight.phases.phase2.ringHazard.maxRadius,
			t: fight.phases.phase2.ringHazard.duration,
		});
	}
	audio.play(55, 1, 'sawtooth', 0.04);
}

function resolveAeronWindup(ctx: BossUpdateContext): void {
	const { state, audio } = ctx;
	const { boss } = state;
	const fight = getFightDefinition(state.fightId);
	const attack = fight.attacks[boss.move];

	boss.state = 'attack';
	boss.timer = attack.attackDuration;
	audio.play(100, 0.25, 'sawtooth', 0.03);

	if (boss.move === 0) {
		const sweep = fight.attacks[0];
		if (isPlayerInBossMeleeRadius(state, sweep.meleeRadius)) hurtPlayer(ctx, sweep.damage);
		spawnBurst(state, boss.x, boss.y, fight.visuals.accent, 20, 130);
	}

	if (boss.move === 2) {
		const rupture = fight.attacks[2];
		state.hazards.push({
			kind: 'blast',
			x: boss.tx,
			y: boss.ty,
			r: rupture.blastRadius,
			t: rupture.blastDuration,
		});
		if (isPlayerInBlast(state, boss.tx, boss.ty, rupture.blastRadius)) hurtPlayer(ctx, rupture.damage);
		if (state.phase2) {
			state.hazards.push({
				kind: 'ring',
				x: boss.x,
				y: boss.y,
				r: 0,
				max: rupture.phase2Ring.maxRadius,
				t: rupture.phase2Ring.duration,
			});
		}
		state.shake = 7;
	}
}

function resolveVaelWindup(ctx: BossUpdateContext): void {
	const { state, audio } = ctx;
	const { boss } = state;
	boss.state = 'attack';
	audio.play(180, 0.22, 'triangle', 0.035);

	if (boss.move === 0) {
		const offsets = [
			[0, 0], [-92, 0], [92, 0], [0, -92], [0, 92],
			...(state.phase2 ? [[-68, -68], [68, -68], [-68, 68], [68, 68]] : []),
		] as const;
		offsets.forEach(([dx, dy], index) => {
			state.hazards.push({
				kind: 'starfall',
				x: boss.tx + dx,
				y: boss.ty + dy,
				r: state.phase2 ? 47 : 52,
				t: 0.62 + index * 0.07,
				triggered: false,
				damage: state.phase2 ? 25 : 22,
			});
		});
		boss.timer = 0.22;
	}

	if (boss.move === 1) {
		boss.x = 500;
		boss.y = 375;
		const base = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
		state.hazards.push({
			kind: 'beam',
			x: boss.x,
			y: boss.y,
			angle: base,
			length: 430,
			width: 17,
			angularSpeed: state.phase2 ? 1.75 : 1.25,
			t: state.phase2 ? 1.75 : 1.5,
			damage: 20,
		});
		state.hazards.push({
			kind: 'beam',
			x: boss.x,
			y: boss.y,
			angle: base + Math.PI,
			length: 430,
			width: 17,
			angularSpeed: state.phase2 ? 1.75 : 1.25,
			t: state.phase2 ? 1.75 : 1.5,
			damage: 20,
		});
		boss.timer = state.phase2 ? 1.6 : 1.35;
	}

	if (boss.move === 2) {
		const anchors = [
			{ x: 210, y: 190 },
			{ x: 790, y: 190 },
			{ x: 790, y: 575 },
			{ x: 210, y: 575 },
		];
		const anchor = anchors[boss.combo % anchors.length]!;
		boss.x = anchor.x;
		boss.y = anchor.y;
		boss.angle = Math.atan2(state.player.y - boss.y, state.player.x - boss.x);
		for (let i = -1; i <= 1; i++) {
			state.hazards.push({
				kind: 'beam',
				x: boss.x,
				y: boss.y,
				angle: boss.angle + i * 0.34,
				length: 760,
				width: 13,
				angularSpeed: 0,
				t: 0.62,
				damage: 24,
			});
		}
		spawnBurst(state, boss.x, boss.y, '#b7e1df', 26, 110);
		boss.timer = 0.58;
	}

	state.shake = Math.max(state.shake, 4);
}

function resolveAeronActive(ctx: BossUpdateContext, dt: number): void {
	const { state } = ctx;
	const { boss } = state;
	const fight = getFightDefinition(state.fightId);

	if (boss.move === 1) {
		const lunge = fight.attacks[1];
		boss.x += Math.cos(boss.angle) * lunge.lungeSpeed * dt;
		boss.y += Math.sin(boss.angle) * lunge.lungeSpeed * dt;
		if (dist(state.player, boss) < lunge.hitRadius) hurtPlayer(ctx, lunge.damage);
		spawnBurst(state, boss.x, boss.y, fight.visuals.trail, 2, 60);
	}

	if (boss.timer <= 0) {
		boss.state = 'recover';
		boss.timer = getPhaseTiming(fight, state.phase2).recover;
	}
}

function resolveVaelActive(state: GameState): void {
	if (state.boss.timer <= 0) {
		const fight = getFightDefinition(state.fightId);
		state.boss.state = 'recover';
		state.boss.timer = getPhaseTiming(fight, state.phase2).recover;
	}
}

function updateVaelIdle(state: GameState, dt: number): void {
	const { boss, player } = state;
	const fight = getFightDefinition(state.fightId);
	const separation = dist(player, boss);
	boss.angle = Math.atan2(player.y - boss.y, player.x - boss.x);

	if (separation < 180) {
		boss.x -= Math.cos(boss.angle) * (state.phase2 ? 74 : 58) * dt;
		boss.y -= Math.sin(boss.angle) * (state.phase2 ? 74 : 58) * dt;
	} else if (separation > 285) {
		boss.x += Math.cos(boss.angle) * 46 * dt;
		boss.y += Math.sin(boss.angle) * 46 * dt;
	} else {
		const strafe = boss.combo % 2 === 0 ? 1 : -1;
		boss.x += Math.cos(boss.angle + Math.PI / 2) * 34 * strafe * dt;
		boss.y += Math.sin(boss.angle + Math.PI / 2) * 34 * strafe * dt;
	}

	if (boss.timer <= 0) beginBossAttack(state);
	constrainToFightArena(boss, fight.id);
}

export function updateBoss(ctx: BossUpdateContext, dt: number): void {
	const { state } = ctx;
	const { boss, player } = state;
	const fight = getFightDefinition(state.fightId);

	boss.flash -= dt;

	if (boss.hp < boss.baseMax * fight.phaseThreshold && !state.phase2) triggerPhaseTransition(ctx);
	boss.timer -= dt;

	if (boss.state === 'idle') {
		if (state.fightId === 'vael') {
			updateVaelIdle(state, dt);
		} else {
			const separation = dist(player, boss);
			boss.angle = Math.atan2(player.y - boss.y, player.x - boss.x);
			if (separation > fight.approachDistance) {
				const speed = state.phase2 ? fight.approachSpeed.phase2 : fight.approachSpeed.phase1;
				boss.x += Math.cos(boss.angle) * speed * dt;
				boss.y += Math.sin(boss.angle) * speed * dt;
			}
			if (boss.timer <= 0) beginBossAttack(state);
		}
	} else if (boss.state === 'windup' && boss.timer <= 0) {
		if (state.fightId === 'vael') resolveVaelWindup(ctx);
		else resolveAeronWindup(ctx);
	} else if (boss.state === 'attack') {
		if (state.fightId === 'vael') resolveVaelActive(state);
		else resolveAeronActive(ctx, dt);
	} else if (boss.state === 'recover' && boss.timer <= 0) {
		boss.state = 'idle';
		boss.timer = getPhaseTiming(fight, state.phase2).idle;
	}

	constrainToFightArena(boss, state.fightId);
}
