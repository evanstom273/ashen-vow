import { PLAYER_START } from '../content/playerDefaults.ts';
import { getAreaForFight } from '../content/areas.ts';
import { getFightDefinition } from '../content/fights.ts';
import { getEnemyDefinition } from '../content/enemies.ts';
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
		moving: false,
		sprinting: false,
		transformed: false,
		selectedTravelForm: 'raven',
		transformProgress: 0,
		transformTarget: false,
		hitReact: 0,
	};
}

export function createBossState(fightId: FightId): BossState {
	const fight = getFightDefinition(fightId);
	const enemy = getEnemyDefinition(fight.enemyId);
	return {
		x: fight.spawn.x,
		y: fight.spawn.y,
		hp: enemy.maxHp,
		baseMax: enemy.maxHp,
		max: enemy.maxHp,
		angle: Math.PI / 2,
		state: 'idle',
		timer: fight.idleTimer,
		move: 0,
		flash: 0,
		combo: 0,
		tx: 0,
		ty: 0,
		effects: [],
		moving: false,
		hitReact: 0,
	};
}

export function createInitialGameState(): GameState {
	const initialFight: FightId = 'aeron';
	const initialAreaId = 'ashen-wilds' as const;
	const state: GameState = {
		mode: 'title',
		scene: { kind: 'title', areaId: null, previousKind: null },
		currentAreaId: initialAreaId,
		fightId: initialFight,
		encounterOriginAreaId: null,
		world: createInitialWorldState(),
		attempts: 0,
		runes: 0,
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
		utilityItem: 'flask',
		hitStop: 0,
		postFight: false,
		bossDeathProgress: 0,
		arenaExitActive: false,
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

export function resetCombatState(state: GameState, preserveResources = false): void {
	const area = getAreaForFight(state.fightId);
	const spawn = area.spawns[0];
	const previousPlayer = state.player;
	state.currentAreaId = area.id;
	state.player = createPlayerState();
	state.player.selectedTravelForm = previousPlayer.selectedTravelForm;
	state.player.transformed = false;
	state.player.transformTarget = false;
	state.player.transformProgress = 0;
	if (preserveResources) {
		state.player.hp = previousPlayer.hp;
		state.player.sp = previousPlayer.sp;
		state.player.flasks = previousPlayer.flasks;
	}
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
	state.hitStop = 0;
	state.postFight = false;
	state.bossDeathProgress = 0;
	state.arenaExitActive = false;
	if (!preserveResources) replenishSpellsAtRest(state);
}
