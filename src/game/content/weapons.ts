export type WeaponClassId =
	| 'shortsword'
	| 'greatsword'
	| 'dagger'
	| 'spear'
	| 'twinblade'
	| 'bow'
	| 'catalyst'
	| 'axe';

export interface WeaponClassDefinition {
	id: WeaponClassId;
	displayName: string;
	attackRange: number;
	preferredRange: number;
	damage: number;
	attackCooldown: number;
	moveSpeed: number;
	projectileSpeed?: number;
	visual: 'short-blade' | 'broad-blade' | 'dagger' | 'spear' | 'twinblade' | 'bow' | 'staff' | 'axe';
}

export const WEAPON_CLASSES: Record<WeaponClassId, WeaponClassDefinition> = {
	shortsword: { id: 'shortsword', displayName: 'Shortsword', attackRange: 58, preferredRange: 46, damage: 14, attackCooldown: 1.05, moveSpeed: 112, visual: 'short-blade' },
	greatsword: { id: 'greatsword', displayName: 'Greatsword', attackRange: 78, preferredRange: 64, damage: 24, attackCooldown: 1.65, moveSpeed: 88, visual: 'broad-blade' },
	dagger: { id: 'dagger', displayName: 'Dagger', attackRange: 42, preferredRange: 30, damage: 10, attackCooldown: 0.68, moveSpeed: 132, visual: 'dagger' },
	spear: { id: 'spear', displayName: 'Spear', attackRange: 96, preferredRange: 80, damage: 17, attackCooldown: 1.18, moveSpeed: 104, visual: 'spear' },
	twinblade: { id: 'twinblade', displayName: 'Twinblade', attackRange: 68, preferredRange: 54, damage: 13, attackCooldown: 0.82, moveSpeed: 116, visual: 'twinblade' },
	bow: { id: 'bow', displayName: 'Bow', attackRange: 520, preferredRange: 330, damage: 15, attackCooldown: 1.55, moveSpeed: 98, projectileSpeed: 390, visual: 'bow' },
	catalyst: { id: 'catalyst', displayName: 'Staff / Catalyst', attackRange: 500, preferredRange: 260, damage: 18, attackCooldown: 1.45, moveSpeed: 94, projectileSpeed: 330, visual: 'staff' },
	axe: { id: 'axe', displayName: 'Axe', attackRange: 62, preferredRange: 48, damage: 20, attackCooldown: 1.32, moveSpeed: 98, visual: 'axe' },
};

export const MELEE_WEAPON_CLASSES: readonly WeaponClassId[] = [
	'shortsword',
	'greatsword',
	'dagger',
	'spear',
	'twinblade',
	'axe',
];

export function getWeaponClass(id: WeaponClassId): WeaponClassDefinition {
	return WEAPON_CLASSES[id];
}
