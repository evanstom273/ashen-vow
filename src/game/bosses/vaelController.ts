import { dist, TAU } from '../constants.ts';
import { getAreaForFight } from '../content/areas.ts';
import { getAttackIndex, getAttackWindup, getFightDefinition, getPhaseTiming } from '../content/fights.ts';
import { spawnBurst } from '../effects/particles.ts';
import type { GameState } from '../types.ts';
import { constrainToArea } from '../systems/combat.ts';
import type { BossController, BossUpdateContext } from './BossController.ts';

const ANCHORS = [
	{ x: 210, y: 190 },
	{ x: 790, y: 190 },
	{ x: 790, y: 575 },
	{ x: 210, y: 575 },
] as const;

function beginAttack(state: GameState): void {
	const { boss, player } = state;
	const fight = getFightDefinition('vael');
	boss.state = 'windup';
	boss.move = getAttackIndex(boss.combo++);
	boss.timer = getAttackWindup(fight, boss.move, state.phase2);
	boss.angle = Math.atan2(player.y - boss.y, player.x - boss.x);
	boss.tx = player.x;
	boss.ty = player.y;

	if (boss.move === 2) {
		const anchor = ANCHORS[boss.combo % ANCHORS.length]!;
		boss.tx = anchor.x;
		boss.ty = anchor.y;
	}
}

function triggerPhaseTransition(ctx: BossUpdateContext): void {
	const { state, audio, announce } = ctx;
	const { boss } = state;
	const fight = getFightDefinition('vael');

	state.phase2 = true;
	boss.state = 'recover';
	boss.timer = fight.phases.phase2.transitionRecover;
	announce(fight.phases.phase2.announce, fight.phases.phase2.announceDuration);
	spawnBurst(state, boss.x, boss.y, fight.visuals.phaseBurst, 70, 160);

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
	audio.play(55, 1, 'sawtooth', 0.04);
}

function resolveWindup(ctx: BossUpdateContext): void {
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
		for (const angle of [base, base + Math.PI]) {
			state.hazards.push({
				kind: 'beam',
				x: boss.x,
				y: boss.y,
				angle,
				length: 430,
				width: 17,
				angularSpeed: state.phase2 ? 1.75 : 1.25,
				t: state.phase2 ? 1.75 : 1.5,
				damage: 20,
			});
		}
		boss.timer = state.phase2 ? 1.6 : 1.35;
	}

	if (boss.move === 2) {
		boss.x = boss.tx;
		boss.y = boss.ty;
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

function updateIdle(state: GameState, dt: number): void {
	const { boss, player } = state;
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

	if (boss.timer <= 0) beginAttack(state);
}

export const vaelController: BossController = {
	update(ctx, dt) {
		const { state } = ctx;
		const { boss } = state;
		const fight = getFightDefinition('vael');

		boss.flash -= dt;
		if (boss.hp < boss.baseMax * fight.phaseThreshold && !state.phase2) triggerPhaseTransition(ctx);
		boss.timer -= dt;

		if (boss.state === 'idle') {
			updateIdle(state, dt);
		} else if (boss.state === 'windup' && boss.timer <= 0) {
			resolveWindup(ctx);
		} else if (boss.state === 'attack' && boss.timer <= 0) {
			boss.state = 'recover';
			boss.timer = getPhaseTiming(fight, state.phase2).recover;
		} else if (boss.state === 'recover' && boss.timer <= 0) {
			boss.state = 'idle';
			boss.timer = getPhaseTiming(fight, state.phase2).idle;
		}

		constrainToArea(boss, getAreaForFight('vael').id);
	},
};
