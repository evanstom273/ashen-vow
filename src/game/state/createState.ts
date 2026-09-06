import { PLAYER_START } from '../content/playerDefaults.ts';
import { AERON } from '../content/aeron.ts';
import { clearLockOn } from '../systems/lockOn.ts';
import { initializeSpellLoadout, replenishSpellsAtRest } from './spellState.ts';
import type { BossState, GameState, InputState, PlayerState } from '../types.ts';

export function createPlayerState(): PlayerState {
	return {
		...PLAYER_START,
		roll: 0,
		inv: 0,
		cd: 0,
		heal: 0,
		swing: 0,
		regen: 0,
	};
}

export function createBossState(): BossState {
	return {
		x: AERON.spawn.x,
		y: AERON.spawn.y,
		hp: AERON.maxHp,
		baseMax: AERON.maxHp,
		max: AERON.maxHp,
		angle: Math.PI / 2,
		state: 'idle',
		timer: AERON.idleTimer,
		move: 0,
		flash: 0,
		combo: 0,
		tx: 0,
		ty: 0,
		effects: [],
	};
}

export function createInitialGameState(): GameState {
	const state: GameState = {
		mode: 'title',
		attempts: 0,
		time: 0,
		player: createPlayerState(),
		boss: createBossState(),
		shots: [],
		particles: [],
		hazards: [],
		equippedSpellId: 'ashen-bolt',
		spells: {} as GameState['spells'],
		charge: 0,
		charging: false,
		shake: 0,
		noticeTime: 0,
		phase2: false,
		lockOn: { active: false, targetId: null },
	};
	initializeSpellLoadout(state);
	return state;
}

export function createInitialInputState(): InputState {
	return {
		keys: {},
		padPrev: {},
		stick: { x: 0, y: 0 },
		touchStick: { x: 0, y: 0 },
	};
}

export function resetCombatState(state: GameState): void {
	state.player = createPlayerState();
	state.boss = createBossState();
	state.shots = [];
	state.particles = [];
	state.hazards = [];
	state.phase2 = false;
	state.charge = 0;
	state.charging = false;
	state.noticeTime = 0;
	state.shake = 0;
	clearLockOn(state);
	replenishSpellsAtRest(state);
}
