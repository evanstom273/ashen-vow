import type { TravelFormId } from '../types.ts';

export interface TravelFormDefinition {
	id: TravelFormId;
	displayName: string;
	shortName: string;
	accent: string;
	accentSoft: string;
	walkSpeed: number;
	sprintSpeed: number;
}

export const TRAVEL_FORM_DEFINITIONS: Record<TravelFormId, TravelFormDefinition> = {
	raven: {
		id: 'raven',
		displayName: 'ASHEN RAVEN',
		shortName: 'Raven',
		accent: '#9ab5c8',
		accentSoft: '#9ab5c844',
		walkSpeed: 180,
		sprintSpeed: 300,
	},
	wolf: {
		id: 'wolf',
		displayName: 'DUSK WOLF',
		shortName: 'Wolf',
		accent: '#b3b8ac',
		accentSoft: '#b3b8ac44',
		walkSpeed: 180,
		sprintSpeed: 300,
	},
};

export const TRAVEL_FORM_IDS = Object.keys(TRAVEL_FORM_DEFINITIONS) as TravelFormId[];

export function getTravelFormDefinition(id: TravelFormId): TravelFormDefinition {
	return TRAVEL_FORM_DEFINITIONS[id];
}
