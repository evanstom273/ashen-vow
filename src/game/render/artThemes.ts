export type ArtThemeId = 'wilds' | 'sanctum' | 'orrery';

export interface ArtThemeDefinition {
	id: ArtThemeId;
	background: string;
	dustColor: string;
	dustCount: number;
	dustSpeed: number;
}

export const ART_THEMES: Record<ArtThemeId, ArtThemeDefinition> = {
	wilds: {
		id: 'wilds',
		background: '#101914',
		dustColor: '#b5c49a24',
		dustCount: 48,
		dustSpeed: 3,
	},
	sanctum: {
		id: 'sanctum',
		background: '#0a100f',
		dustColor: '#c7cba133',
		dustCount: 45,
		dustSpeed: 4,
	},
	orrery: {
		id: 'orrery',
		background: '#070d12',
		dustColor: '#b7dadd38',
		dustCount: 62,
		dustSpeed: 7,
	},
};

export function getArtTheme(id: ArtThemeId): ArtThemeDefinition {
	return ART_THEMES[id];
}
