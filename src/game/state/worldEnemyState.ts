import { getEnemyDefinition } from '../content/enemies.ts';
import { MELEE_WEAPON_CLASSES, type WeaponClassId } from '../content/weapons.ts';
import type { GeneratedEnemyConfig, WorldEnemyState } from '../types.ts';
import { FORT_GUARD_SPAWNS } from '../world/enemySpawns.ts';
import type { SpellId } from '../content/spells.ts';

const MAGIC_SPELL_POOL: readonly SpellId[] = ['ashen-bolt', 'hollow-arc', 'cinder-wreath', 'hollow-edict'];

function mulberry32(seed: number): () => number {
	let value = seed >>> 0;
	return () => {
		value += 0x6d2b79f5;
		let t = value;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

function choose<T>(random: () => number, values: readonly T[]): T {
	return values[Math.floor(random() * values.length)]!;
}

function rollArchetype(random: () => number): GeneratedEnemyConfig['archetype'] {
	const roll = random();
	if (roll < 0.6) return 'melee';
	if (roll < 0.8) return 'ranged';
	return 'magic';
}

function rollMagicSpells(random: () => number): SpellId[] {
	const pool = [...MAGIC_SPELL_POOL];
	const first = pool.splice(Math.floor(random() * pool.length), 1)[0]!;
	const second = pool.splice(Math.floor(random() * pool.length), 1)[0]!;
	return [first, second];
}

export function generateEnemyConfigs(seed: number): Record<string, GeneratedEnemyConfig> {
	const random = mulberry32(seed);
	const result: Record<string, GeneratedEnemyConfig> = {};

	for (const spawn of FORT_GUARD_SPAWNS) {
		const archetype = rollArchetype(random);
		let weaponClass: WeaponClassId;
		let spellIds: SpellId[] = [];

		if (archetype === 'melee') {
			weaponClass = choose(random, MELEE_WEAPON_CLASSES);
		} else if (archetype === 'ranged') {
			weaponClass = 'bow';
		} else {
			weaponClass = 'catalyst';
			spellIds = rollMagicSpells(random);
		}

		result[spawn.id] = {
			spawnId: spawn.id,
			enemyId: spawn.enemyId,
			archetype,
			idleBehavior: random() < 0.5 ? 'stationary' : 'patrol',
			weaponClass,
			spellIds,
		};
	}

	return result;
}

export function createWorldEnemyStates(configs: Record<string, GeneratedEnemyConfig>): WorldEnemyState[] {
	const definition = getEnemyDefinition('fort-guard');
	return FORT_GUARD_SPAWNS.map((spawn) => {
		const config = configs[spawn.id]!;
		return {
			spawnId: spawn.id,
			config,
			x: spawn.position.x,
			y: spawn.position.y,
			homeX: spawn.position.x,
			homeY: spawn.position.y,
			facing: spawn.facing,
			hp: definition.maxHp,
			maxHp: definition.maxHp,
			alive: true,
			awareness: 0,
			awarenessState: 'unaware',
			attackCooldown: 0.35 + Math.random() * 0.5,
			patrolIndex: 0,
			searchTimer: 0,
			lastKnownX: spawn.position.x,
			lastKnownY: spawn.position.y,
			hitFlash: 0,
			deathProgress: 0,
		};
	});
}

export function respawnWorldEnemies(configs: Record<string, GeneratedEnemyConfig>): WorldEnemyState[] {
	return createWorldEnemyStates(configs);
}
