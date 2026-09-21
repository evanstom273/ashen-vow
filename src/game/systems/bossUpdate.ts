import { dist } from '../constants.ts';
import { getAttackIndex, getAttackWindup, getFightDefinition, getPhaseTiming } from '../content/fights.ts';
import { spawnBurst } from '../effects/particles.ts';
import type { GameState } from '../types.ts';
import { constrainToArena, hurtPlayer, isPlayerInBlast, isPlayerInBossMeleeRadius, type CombatContext } from './combat.ts';

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

	state.phase2 = true;
	boss.state = 'recover';
	const fight = getFightDefinition(state.fightId);
	boss.timer = fight.phases.phase2.transitionRecover;
	announce(fight.phases.phase2.announce, fight.phases.phase2.announceDuration);
	spawnBurst(state, boss.x, boss.y, fight.visuals.phaseBurst, 70, 160);
	state.hazards.push({
		kind: 'ring',
		x: boss.x,
		y: boss.y,
		r: 0,
		max: fight.phases.phase2.ringHazard.maxRadius,
		t: fight.phases.phase2.ringHazard.duration,
	});
	audio.play(55, 1, 'sawtooth', 0.04);
}

function resolveWindupAttack(ctx: BossUpdateContext): void {
	const { state, audio } = ctx;
	const { boss } = state;
	const fight = getFightDefinition(state.fightId);
	const attack = fight.attacks[boss.move];

	boss.state = 'attack';
	boss.timer = attack.attackDuration;
	audio.play(100, 0.25, 'sawtooth', 0.03);

	if (boss.move === 0) {
		const sweep = fight.attacks[0];
		if (isPlayerInBossMeleeRadius(state, sweep.meleeRadius)) {
			hurtPlayer(ctx, sweep.damage);
		}
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
		if (isPlayerInBlast(state, boss.tx, boss.ty, rupture.blastRadius)) {
			hurtPlayer(ctx, rupture.damage);
		}
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

function resolveActiveAttack(ctx: BossUpdateContext, dt: number): void {
	const { state } = ctx;
	const { boss } = state;

	if (boss.move === 1) {
		const fight = getFightDefinition(state.fightId);
		const lunge = fight.attacks[1];
		boss.x += Math.cos(boss.angle) * lunge.lungeSpeed * dt;
		boss.y += Math.sin(boss.angle) * lunge.lungeSpeed * dt;
		if (dist(state.player, boss) < lunge.hitRadius) {
			hurtPlayer(ctx, lunge.damage);
		}
		spawnBurst(state, boss.x, boss.y, fight.visuals.trail, 2, 60);
	}

	if (boss.timer <= 0) {
		boss.state = 'recover';
		const fight = getFightDefinition(state.fightId);
		boss.timer = getPhaseTiming(fight, state.phase2).recover;
	}
}

export function updateBoss(ctx: BossUpdateContext, dt: number): void {
	const { state } = ctx;
	const { boss, player } = state;

	boss.flash -= dt;

	const fight = getFightDefinition(state.fightId);

	if (boss.hp < boss.baseMax * fight.phaseThreshold && !state.phase2) {
		triggerPhaseTransition(ctx);
	}

	boss.timer -= dt;

	if (boss.state === 'idle') {
		const separation = dist(player, boss);
		boss.angle = Math.atan2(player.y - boss.y, player.x - boss.x);
		if (separation > fight.approachDistance) {
			const speed = state.phase2 ? fight.approachSpeed.phase2 : fight.approachSpeed.phase1;
			boss.x += Math.cos(boss.angle) * speed * dt;
			boss.y += Math.sin(boss.angle) * speed * dt;
		}
		if (boss.timer <= 0) {
			beginBossAttack(state);
		}
	} else if (boss.state === 'windup' && boss.timer <= 0) {
		resolveWindupAttack(ctx);
	} else if (boss.state === 'attack') {
		resolveActiveAttack(ctx, dt);
	} else if (boss.state === 'recover' && boss.timer <= 0) {
		boss.state = 'idle';
		boss.timer = getPhaseTiming(fight, state.phase2).idle;
	}

	constrainToArena(boss);
}
