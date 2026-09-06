/** Canvas-oriented visual profile for a sorcery — interpreted by the render layer. */
export type ProjectileShape = 'circle' | 'ring' | 'crescent' | 'flame' | 'rune';

export interface SpellProjectileVisual {
	shape: ProjectileShape;
	basicRadius: number;
	chargedRadius: number;
	primaryColor: string;
	secondaryColor: string;
	glowColor: string;
	glowBlur: number;
	/** Optional pulse frequency for animated projectiles. */
	pulseSpeed?: number;
	flicker?: boolean;
}

export interface SpellTrailVisual {
	enabled: boolean;
	color: string;
	/** Multiplier on trail particle count. */
	intensity: number;
	/** Influences trail particle velocity. */
	length: number;
	/** Per-frame spawn probability (0–1). */
	spawnRate: number;
}

export interface SpellChargeVisual {
	ringColor: string;
	ringStrokeWidth: number;
	particleColor: string;
	baseRadius: number;
	radiusScale: number;
}

export interface SpellCastVisual {
	particleColor: string;
	particleCount: number;
	particleSpeed: number;
}

export interface SpellImpactVisual {
	primaryColor: string;
	secondaryColor: string;
	particleCount: number;
	particleSpeed: number;
	shake: number;
}

export interface SpellVisualProfile {
	projectile: SpellProjectileVisual;
	trail: SpellTrailVisual;
	charge: SpellChargeVisual;
	cast: SpellCastVisual;
	impact: SpellImpactVisual;
}

export const ASHEN_BOLT_VISUAL: SpellVisualProfile = {
	projectile: {
		shape: 'circle',
		basicRadius: 7,
		chargedRadius: 11,
		primaryColor: '#c4a882',
		secondaryColor: '#6b4f28',
		glowColor: '#e8c878',
		glowBlur: 28,
		pulseSpeed: 4,
	},
	trail: {
		enabled: true,
		color: '#a88850',
		intensity: 2.5,
		length: 35,
		spawnRate: 0.85,
	},
	charge: {
		ringColor: '#d4b878cc',
		ringStrokeWidth: 3,
		particleColor: '#c8a860',
		baseRadius: 24,
		radiusScale: 10,
	},
	cast: {
		particleColor: '#b89858',
		particleCount: 6,
		particleSpeed: 40,
	},
	impact: {
		primaryColor: '#d6b378',
		secondaryColor: '#8b6914',
		particleCount: 18,
		particleSpeed: 120,
		shake: 4,
	},
};

export const HOLLOW_ARC_VISUAL: SpellVisualProfile = {
	projectile: {
		shape: 'crescent',
		basicRadius: 4,
		chargedRadius: 6,
		primaryColor: '#b8f0ff',
		secondaryColor: '#4a9eb8',
		glowColor: '#7ee8ff',
		glowBlur: 14,
		pulseSpeed: 10,
	},
	trail: {
		enabled: true,
		color: '#6ec8e0',
		intensity: 0.8,
		length: 55,
		spawnRate: 0.45,
	},
	charge: {
		ringColor: '#8ed8e8aa',
		ringStrokeWidth: 2,
		particleColor: '#7ec8dc',
		baseRadius: 18,
		radiusScale: 6,
	},
	cast: {
		particleColor: '#8ed4e8',
		particleCount: 3,
		particleSpeed: 60,
	},
	impact: {
		primaryColor: '#a8e6ff',
		secondaryColor: '#4a9eb8',
		particleCount: 10,
		particleSpeed: 160,
		shake: 2,
	},
};

/** Dark unnatural flame — distinct silhouette from projectile sorceries. */
export const CINDER_WREATH_VISUAL: SpellVisualProfile = {
	projectile: {
		shape: 'flame',
		basicRadius: 6,
		chargedRadius: 9,
		primaryColor: '#1a1018',
		secondaryColor: '#4a0820',
		glowColor: '#8b1030',
		glowBlur: 22,
		pulseSpeed: 14,
		flicker: true,
	},
	trail: {
		enabled: true,
		color: '#3a0818',
		intensity: 1.8,
		length: 40,
		spawnRate: 0.7,
	},
	charge: {
		ringColor: '#5a1028aa',
		ringStrokeWidth: 2,
		particleColor: '#6a1830',
		baseRadius: 20,
		radiusScale: 8,
	},
	cast: {
		particleColor: '#4a1020',
		particleCount: 8,
		particleSpeed: 35,
	},
	impact: {
		primaryColor: '#6a1830',
		secondaryColor: '#1a0810',
		particleCount: 22,
		particleSpeed: 90,
		shake: 3,
	},
};

/** Ominous red/black death mark — heavier and more dangerous looking. */
export const HOLLOW_EDICT_VISUAL: SpellVisualProfile = {
	projectile: {
		shape: 'rune',
		basicRadius: 8,
		chargedRadius: 12,
		primaryColor: '#120008',
		secondaryColor: '#8b0020',
		glowColor: '#c41030',
		glowBlur: 26,
		pulseSpeed: 6,
	},
	trail: {
		enabled: true,
		color: '#5a0018',
		intensity: 1.2,
		length: 25,
		spawnRate: 0.55,
	},
	charge: {
		ringColor: '#8b0020cc',
		ringStrokeWidth: 3,
		particleColor: '#6a0018',
		baseRadius: 26,
		radiusScale: 12,
	},
	cast: {
		particleColor: '#4a0010',
		particleCount: 10,
		particleSpeed: 30,
	},
	impact: {
		primaryColor: '#8b0020',
		secondaryColor: '#1a0008',
		particleCount: 28,
		particleSpeed: 100,
		shake: 6,
	},
};
