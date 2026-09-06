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

export function toggleBossLockOn(state: GameState): boolean {
	if (state.lockOn.active) {
		clearLockOn(state);
		return false;
	}
	if (state.boss.hp <= 0) {
		return false;
	}
	activateBossLockOn(state);
	return true;
}

export function getLockOnTargetPosition(state: GameState): { x: number; y: number } | null {
	if (!state.lockOn.active || state.lockOn.targetId !== 'boss') {
		return null;
	}
	return { x: state.boss.x, y: state.boss.y };
}

export function updateLockOnFacing(state: GameState): void {
	const target = getLockOnTargetPosition(state);
	if (!target) return;

	state.player.angle = Math.atan2(target.y - state.player.y, target.x - state.player.x);
}

export function getCastAimAngle(state: GameState): number {
	const target = getLockOnTargetPosition(state);
	if (target) {
		return Math.atan2(target.y - state.player.y, target.x - state.player.x);
	}
	return state.player.angle;
}
