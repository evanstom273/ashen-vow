import type { SceneKind } from '../types.ts';

export const SCENE_TRANSITIONS = {
	title: ['combat', 'world', 'transition'],
	world: ['combat', 'pause', 'transition', 'title'],
	combat: ['pause', 'dead', 'victory', 'transition', 'title'],
	pause: ['combat', 'world', 'title'],
	transition: ['world', 'combat', 'title'],
	dead: ['combat', 'world', 'transition', 'title'],
	victory: ['combat', 'world', 'transition', 'title'],
} as const satisfies Record<SceneKind, readonly SceneKind[]>;

export function canTransitionScene(from: SceneKind, to: SceneKind): boolean {
	return (SCENE_TRANSITIONS[from] as readonly SceneKind[]).includes(to);
}
