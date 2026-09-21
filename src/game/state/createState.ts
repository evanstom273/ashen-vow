import { PLAYER_START } from '../content/playerDefaults.ts';
import { getAreaForFight } from '../content/areas.ts';
import { getFightDefinition } from '../content/fights.ts';
import { initializeSpellLoadout, replenishSpellsAtRest } from './spellState.ts';
import { createInitialWorldState } from './worldState.ts';
import type { BossState, FightId, GameState, InputState, PlayerState } from '../types.ts';

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

export function createBossState(fightId: FightId): BossState {
	const fight = getFightDefinition(fightId);
	return {
		x: fight.spawn.x,
		y: fight.spawn.y,
		hp: fight.maxHp,
		baseMax: fight.maxHp,
		max: fight.maxHp,
		angle: Math.PI / 2,
		state: 'idle',
		timer: fight.idleTimer,
		move: 0,
		flash: 0,
		combo: 0,
		tx: 0,
		ty: 0,
		effects: [],
	};
}

export function createInitialGameState(): GameState {
	const initialFight: FightId = 'aeron';
	const initialArea = getAreaForFight(initialFight);
	const state: GameState = {
		mode: 'title',
		scene: { kind: 'title', areaId: null, previousKind: null },
		currentAreaId: initialArea.id,
		fightId: initialFight,
		world: createInitialWorldState(),
		attempts: 0,
		time: 0,
		player: createPlayerState(),
		boss: createBossState(initialFight),
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
	const area = getAreaForFight(state.fightId);
	const spawn = area.spawns[0];
	state.currentAreaId = area.id;
	state.player = createPlayerState();
	if (spawn) {
		state.player.x = spawn.position.x;
		state.player.y = spawn.position.y;
		state.player.angle = spawn.facing;
	}
	state.boss = createBossState(state.fightId);
	state.shots = [];
	state.particles = [];
	state.hazards = [];
	state.phase2 = false;
	state.charge = 0;
	state.charging = false;
	state.noticeTime = 0;
	state.shake = 0;
	replenishSpellsAtRest(state);
}
