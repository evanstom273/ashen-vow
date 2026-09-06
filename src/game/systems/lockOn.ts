import type { GameState } from '../types.ts';

/** Single-boss prototype lock-on — gameplay targeting, not renderer state. */
export function activateBossLockOn(state: GameState): void {
	state.lockOn.active = true;
	state.lockOn.targetId = 'boss';
}

export function clearLockOn(state: GameState): void {
	state.lockOn.active = false;
	state.lockOn.targetId = null;
}

export function getLockOnTargetPosition(state: GameState): { x: number; y: number } | null {
	if (!state.lockOn.active || state.lockOn.targetId !== 'boss') {
		return null;
	}
	return { x: state.boss.x, y: state.boss.y };
}
