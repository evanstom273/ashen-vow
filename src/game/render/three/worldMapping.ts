import { ARENA } from '../../constants.ts';
import type { StickInput } from '../../types.ts';
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

/** Remap stick/keyboard input to the fixed camera orientation on the XZ plane. */
export function transformMovementForCamera(input: StickInput): StickInput {
	const { forwardX, forwardZ, rightX, rightZ } = getCameraMovementAxes();
	const screenY = -input.y;
	return {
		x: rightX * input.x + forwardX * screenY,
		y: rightZ * input.x + forwardZ * screenY,
	};
}
