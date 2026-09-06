import type { EffectId } from './content/effects.ts';
import type { SpellId } from './content/spells.ts';

export type GameMode = 'title' | 'play' | 'pause' | 'dead' | 'win';

export type BossFsmState = 'idle' | 'windup' | 'attack' | 'recover';

export type HazardKind = 'ring' | 'blast';

/** Boss attack pattern index cycled via combo counter. */
export type BossAttackIndex = 0 | 1 | 2;

export interface Vec2 {
	x: number;
	y: number;
}

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

export type Hazard = RingHazard | BlastHazard;

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
	attempts: number;
	time: number;
	player: PlayerState;
	boss: BossState;
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
}

export interface StickInput {
	x: number;
	y: number;
}

/** Logical player actions — independent of physical input device. */
export type PlayerAction =
	| 'dodge'
	| 'cycleSpell'
	| 'useConsumable'
	| 'castStart'
	| 'castRelease'
	| 'pause';

export interface InputState {
	keys: Record<string, boolean>;
	padPrev: Record<string, boolean>;
	stick: StickInput;
	touchStick: StickInput;
}
