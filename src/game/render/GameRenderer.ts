import type { GameMode, GameState } from '../types.ts';

/** Renderer-neutral view contract — simulation never imports Three.js. */
export interface GameRenderer {
	render(state: GameState, mode: GameMode): void;
	dispose?(): void;
}
