import type { GameEvent } from '../types.ts';

export type GameEventListener = (event: GameEvent) => void;

export class GameEventBus {
	private readonly listeners = new Set<GameEventListener>();

	subscribe(listener: GameEventListener): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	emit(event: GameEvent): void {
		for (const listener of this.listeners) {
			listener(event);
		}
	}
}
