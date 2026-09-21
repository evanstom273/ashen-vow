import type { EffectId } from './content/effects.ts';
import type { SpellId } from './content/spells.ts';
import type { WeaponClassId } from './content/weapons.ts';

export type GameMode = 'title' | 'play' | 'pause' | 'dead' | 'win';

export type SceneKind = 'title' | 'world' | 'combat' | 'pause' | 'transition' | 'dead' | 'victory';
export type EnemyId = 'aeron' | 'vael' | 'fort-guard';
export type EnemyCategory = 'regular' | 'boss';
export type EnemyControllerId = 'aeron' | 'vael' | 'generic';
export type EnemyArchetype = 'melee' | 'ranged' | 'magic';
export type EnemyIdleBehavior = 'stationary' | 'patrol';
export type EnemyAwarenessState = 'unaware' | 'suspicious' | 'alerted' | 'searching' | 'returning';
export type FightId = 'aeron' | 'vael';
export type TravelFormId = 'raven' | 'wolf';
export type UtilityItemId = 'flask' | 'transform';
export type AreaId = 'ashen-wilds' | 'aeron-arena' | 'vael-arena';
export type AreaKind = 'overworld' | 'boss' | 'interior';

export interface SceneState {
	kind: SceneKind;
	areaId: AreaId | null;
	previousKind: SceneKind | null;
}

export interface Vec2 {
	x: number;
	y: number;
}

export interface CircleBounds {
	kind: 'circle';
	x: number;
	y: number;
	radius: number;
	inset: number;
}

export interface RectBounds {
	kind: 'rect';
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

export type AreaBounds = CircleBounds | RectBounds;

export interface AreaExit {
	id: string;
	position: Vec2;
	targetAreaId: AreaId;
	targetSpawnId: string;
}

export interface AreaSpawn {
	id: string;
	position: Vec2;
	facing: number;
}

export interface AreaDefinition {
	id: AreaId;
	kind: AreaKind;
	displayName: string;
	subtitle: string;
	bounds: AreaBounds;
	spawns: readonly AreaSpawn[];
	exits: readonly AreaExit[];
	fightId?: FightId;
	artTheme: 'wilds' | 'sanctum' | 'orrery';
}

export type EntityKind = 'player' | 'enemy' | 'boss' | 'npc' | 'interactable' | 'projectile' | 'hazard';

export interface EntityDefinition {
	id: string;
	kind: EntityKind;
	position: Vec2;
}

export interface ActorDefinition extends EntityDefinition {
	kind: 'player' | 'enemy' | 'boss' | 'npc';
	facing: number;
}

export interface InteractableDefinition extends EntityDefinition {
	kind: 'interactable';
	interactionId: string;
}

export interface BossWorldState {
	alive: boolean;
	defeatedCount: number;
}

export interface GeneratedEnemyConfig {
	spawnId: string;
	enemyId: EnemyId;
	archetype: EnemyArchetype;
	idleBehavior: EnemyIdleBehavior;
	weaponClass: WeaponClassId;
	spellIds: SpellId[];
}

export interface WorldEnemyState {
	spawnId: string;
	config: GeneratedEnemyConfig;
	x: number;
	y: number;
	homeX: number;
	homeY: number;
	facing: number;
	hp: number;
	maxHp: number;
	alive: boolean;
	awareness: number;
	awarenessState: EnemyAwarenessState;
	attackCooldown: number;
	patrolIndex: number;
	searchTimer: number;
	lastKnownX: number;
	lastKnownY: number;
	hitFlash: number;
	deathProgress: number;
}

export interface WorldEnemyProjectile {
	x: number;
	y: number;
	vx: number;
	vy: number;
	t: number;
	damage: number;
	kind: 'arrow' | 'magic';
	sourceId: string;
}

export interface WorldState {
	bosses: Record<FightId, BossWorldState>;
	enemySeed: number;
	enemyConfigs: Record<string, GeneratedEnemyConfig>;
	flags: Record<string, boolean>;
	activeCheckpointId: string | null;
}

export type GameEvent =
	| { type: 'sceneChanged'; from: SceneKind; to: SceneKind; areaId: AreaId | null }
	| { type: 'areaEntered'; areaId: AreaId }
	| { type: 'bossDefeated'; fightId: FightId }
	| { type: 'playerDied'; fightId: FightId }
	| { type: 'checkpointRested'; checkpointId: string };

export type BossFsmState = 'idle' | 'windup' | 'attack' | 'recover';

export type HazardKind = 'ring' | 'blast' | 'starfall' | 'beam';

/** Boss attack pattern index cycled via combo counter. */
export type BossAttackIndex = 0 | 1 | 2;

export interface Arena {
	x: number;
	y: number;
	r: number;
}

export interface PlayerState {
	x: number;
	y: number;
	hp: number;
	sp: number;
	flasks: number;
	angle: number;
	roll: number;
	inv: number;
	cd: number;
	heal: number;
	swing: number;
	regen: number;
	dx: number;
	dy: number;
	moving: boolean;
	sprinting: boolean;
	transformed: boolean;
	selectedTravelForm: TravelFormId;
	transformProgress: number;
	transformTarget: boolean;
	hitReact: number;
}

export interface ActiveEffect {
	effectId: EffectId;
	remainingDuration: number;
	tickTimer: number;
	/** Snapshot of max-HP reduction applied by this instance. */
	appliedMaxReduction: number;
}

export interface BossState {
	x: number;
	y: number;
	hp: number;
	/** Permanent maximum from content — never modified by transient effects. */
	baseMax: number;
	/** Effective maximum — may be reduced temporarily by status effects. */
	max: number;
	angle: number;
	state: BossFsmState;
	timer: number;
	move: BossAttackIndex;
	flash: number;
	combo: number;
	tx: number;
	ty: number;
	effects: ActiveEffect[];
	moving: boolean;
	hitReact: number;
}

export interface Shot {
	x: number;
	y: number;
	vx: number;
	vy: number;
	t: number;
	spellId: SpellId;
	powered: boolean;
}

export interface Particle {
	x: number;
	y: number;
	vx: number;
	vy: number;
	t: number;
	max: number;
	color: string;
	r: number;
}

export interface RingHazard {
	kind: 'ring';
	x: number;
	y: number;
	r: number;
	max: number;
	t: number;
}

export interface BlastHazard {
	kind: 'blast';
	x: number;
	y: number;
	r: number;
	t: number;
}

export interface StarfallHazard {
	kind: 'starfall';
	x: number;
	y: number;
	r: number;
	t: number;
	triggered: boolean;
	damage: number;
}

export interface BeamHazard {
	kind: 'beam';
	x: number;
	y: number;
	angle: number;
	length: number;
	width: number;
	angularSpeed: number;
	t: number;
	damage: number;
}

export type Hazard = RingHazard | BlastHazard | StarfallHazard | BeamHazard;

export interface Viewport {
	w: number;
	h: number;
	scale: number;
	ox: number;
	oy: number;
}

export interface SpellRuntimeState {
	remainingCasts: number;
	cooldownRemaining: number;
}

export interface GameState {
	mode: GameMode;
	scene: SceneState;
	currentAreaId: AreaId;
	fightId: FightId;
	encounterOriginAreaId: AreaId | null;
	world: WorldState;
	attempts: number;
	runes: number;
	pendingRuneReward: number;
	time: number;
	player: PlayerState;
	boss: BossState;
	worldEnemies: WorldEnemyState[];
	worldEnemyProjectiles: WorldEnemyProjectile[];
	shots: Shot[];
	particles: Particle[];
	hazards: Hazard[];
	equippedSpellId: SpellId;
	spells: Record<SpellId, SpellRuntimeState>;
	charge: number;
	charging: boolean;
	shake: number;
	noticeTime: number;
	phase2: boolean;
	utilityItem: UtilityItemId;
	hitStop: number;
	postFight: boolean;
	bossDeathProgress: number;
	arenaExitActive: boolean;
}

export interface StickInput {
	x: number;
	y: number;
}

/** Logical player actions — independent of physical input device. */
export type PlayerAction =
	| 'dodge'
	| 'contextAction'
	| 'sprintStart'
	| 'sprintEnd'
	| 'cycleSpell'
	| 'cycleUtility'
	| 'activateUtility'
	| 'useConsumable'
	| 'castStart'
	| 'castRelease'
	| 'interact'
	| 'pause';

export interface InputState {
	keys: Record<string, boolean>;
	padPrev: Record<string, boolean>;
	stick: StickInput;
	touchStick: StickInput;
}
