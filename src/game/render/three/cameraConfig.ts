import * as THREE from 'three';

/** Tunable elevated camera — fixed world orientation, tracks player position only. */
export const CAMERA_CONFIG = {
	/** Perspective vertical field of view in degrees. */
	fov: 42,
	/** Near/far clip planes. */
	near: 10,
	far: 2500,
	/**
	 * Fixed world-space view forward on the gameplay XZ plane.
	 * Defines camera yaw and screen-relative movement — never derived from player facing or lock-on.
	 */
	viewForwardX: 0,
	viewForwardZ: 1,
	/** Fixed offset from player world position to camera position. */
	positionOffsetX: 0,
	positionOffsetY: 420,
	positionOffsetZ: -520,
	/** Fixed offset from player world position to look-at point. */
	lookOffsetX: 0,
	lookOffsetY: 12,
	lookOffsetZ: 120,
	/**
	 * Screen-strafe sign derived from the fixed camera rig (+1 for the current offset layout).
	 * Multiply the computed ground-plane right axis by this when remapping horizontal input.
	 */
	strafeSign: 1,
} as const;

export function getFixedViewForward(): { forwardX: number; forwardZ: number } {
	const length = Math.hypot(CAMERA_CONFIG.viewForwardX, CAMERA_CONFIG.viewForwardZ) || 1;
	return {
		forwardX: CAMERA_CONFIG.viewForwardX / length,
		forwardZ: CAMERA_CONFIG.viewForwardZ / length,
	};
}

/** Ground-plane right axis for the fixed camera rig (perpendicular to view forward). */
export function getFixedViewRight(): { rightX: number; rightZ: number } {
	const { forwardX, forwardZ } = getFixedViewForward();
	return {
		rightX: forwardZ * CAMERA_CONFIG.strafeSign,
		rightZ: -forwardX * CAMERA_CONFIG.strafeSign,
	};
}

/** Fixed elevated camera rig — translates with player, never rotates with facing or lock-on. */
export function getCameraRig(playerX: number, playerZ: number): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
	return {
		position: new THREE.Vector3(
			playerX + CAMERA_CONFIG.positionOffsetX,
			CAMERA_CONFIG.positionOffsetY,
			playerZ + CAMERA_CONFIG.positionOffsetZ,
		),
		lookAt: new THREE.Vector3(
			playerX + CAMERA_CONFIG.lookOffsetX,
			CAMERA_CONFIG.lookOffsetY,
			playerZ + CAMERA_CONFIG.lookOffsetZ,
		),
	};
}

/** Fixed camera forward/right on the gameplay XZ plane for movement remapping. */
export function getCameraMovementAxes(): { forwardX: number; forwardZ: number; rightX: number; rightZ: number } {
	const { forwardX, forwardZ } = getFixedViewForward();
	const { rightX, rightZ } = getFixedViewRight();
	return { forwardX, forwardZ, rightX, rightZ };
}
