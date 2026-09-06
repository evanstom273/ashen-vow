import { ARENA } from '../../constants.ts';
import type { GameState, StickInput } from '../../types.ts';
import { getCameraMovementAxes } from './cameraConfig.ts';

/** Map simulation X to Three.js X (arena-centered). */
export function gameXToWorld(x: number): number {
	return x - ARENA.x;
}

/** Map simulation Y to Three.js Z (arena-centered, canvas-down = +Z). */
export function gameYToWorld(y: number): number {
	return y - ARENA.y;
}

export function worldToGameX(worldX: number): number {
	return worldX + ARENA.x;
}

export function worldToGameZ(worldZ: number): number {
	return worldZ + ARENA.y;
}

/** Simulation facing angle (0 = +X) → Y rotation for meshes on XZ plane. */
export function gameAngleToRotation(angle: number): number {
	return -angle + Math.PI / 2;
}

/** View forward on XZ — toward lock-on target when active, else player facing. */
export function getForwardFromGameState(state: GameState): { forwardX: number; forwardZ: number } {
	if (state.lockOn.active && state.lockOn.targetId === 'boss') {
		const dx = gameXToWorld(state.boss.x) - gameXToWorld(state.player.x);
		const dz = gameYToWorld(state.boss.y) - gameYToWorld(state.player.y);
		const length = Math.hypot(dx, dz) || 1;
		return { forwardX: dx / length, forwardZ: dz / length };
	}

	return {
		forwardX: Math.cos(state.player.angle),
		forwardZ: Math.sin(state.player.angle),
	};
}

/** Remap stick/keyboard input to the player-relative camera on the XZ plane. */
export function transformMovementForCamera(
	input: StickInput,
	forwardX: number,
	forwardZ: number,
): StickInput {
	const { forwardX: fx, forwardZ: fz, rightX, rightZ } = getCameraMovementAxes(forwardX, forwardZ);
	const screenY = -input.y;
	return {
		x: rightX * input.x + fx * screenY,
		y: rightZ * input.x + fz * screenY,
	};
}
