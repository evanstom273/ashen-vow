import type { AreaId, GameState, SceneKind } from '../types.ts';
import type { GameEventBus } from '../events/GameEventBus.ts';
import { canTransitionScene } from './sceneTransitions.ts';

function modeForScene(scene: SceneKind): GameState['mode'] {
	switch (scene) {
		case 'title':
			return 'title';
		case 'pause':
			return 'pause';
		case 'dead':
			return 'dead';
		case 'victory':
			return 'win';
		default:
			return 'play';
	}
}

export class SceneController {
	private readonly state: GameState;
	private readonly events: GameEventBus;

	constructor(state: GameState, events: GameEventBus) {
		this.state = state;
		this.events = events;
	}

	transition(to: SceneKind, areaId: AreaId | null = this.state.scene.areaId): void {
		const from = this.state.scene.kind;
		if (from !== to && !canTransitionScene(from, to)) {
			throw new Error(`Invalid scene transition: ${from} -> ${to}`);
		}

		this.state.scene = {
			kind: to,
			areaId,
			previousKind: from,
		};
		this.state.mode = modeForScene(to);
		this.events.emit({ type: 'sceneChanged', from, to, areaId });
		if (areaId && areaId !== this.state.currentAreaId) {
			this.state.currentAreaId = areaId;
			this.events.emit({ type: 'areaEntered', areaId });
		}
	}

	enterCombat(areaId: AreaId): void {
		this.transition('combat', areaId);
	}

	returnToTitle(): void {
		this.transition('title', null);
	}
}
