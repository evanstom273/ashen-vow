import * as THREE from 'three';

/** Tunable elevated camera — Don't Starve–inspired presentation (camera only). */
export const CAMERA_CONFIG = {
	/** Perspective vertical field of view in degrees. */
	fov: 42,
	/** Camera height above the arena plane (world Y). */
	elevation: 420,
	/** Distance behind the player on the gameplay XZ plane. */
	distance: 520,
	/** Look-at point ahead of the player along the view forward axis. */
	lookAhead: 120,
	/** Look-at height above the ground plane. */
	lookAtY: 12,
	/** Near/far clip planes. */
	near: 10,
	far: 2500,
} as const;

export function normalizeForward(forwardX: number, forwardZ: number): { forwardX: number; forwardZ: number } {
	const length = Math.hypot(forwardX, forwardZ) || 1;
	return { forwardX: forwardX / length, forwardZ: forwardZ / length };
}

/** Fixed elevated camera rig behind the player, looking toward the forward axis. */
export function getCameraRig(
	playerX: number,
	playerZ: number,
	forwardX: number,
	forwardZ: number,
): { position: THREE.Vector3; lookAt: THREE.Vector3 } {
	const forward = normalizeForward(forwardX, forwardZ);
	return {
		position: new THREE.Vector3(
			playerX - forward.forwardX * CAMERA_CONFIG.distance,
			CAMERA_CONFIG.elevation,
			playerZ - forward.forwardZ * CAMERA_CONFIG.distance,
		),
		lookAt: new THREE.Vector3(
			playerX + forward.forwardX * CAMERA_CONFIG.lookAhead,
			CAMERA_CONFIG.lookAtY,
			playerZ + forward.forwardZ * CAMERA_CONFIG.lookAhead,
		),
	};
}

/** Camera forward/right on the gameplay XZ plane for movement remapping. */
export function getCameraMovementAxes(
	forwardX: number,
	forwardZ: number,
): { forwardX: number; forwardZ: number; rightX: number; rightZ: number } {
	const forward = normalizeForward(forwardX, forwardZ);
	return {
		forwardX: forward.forwardX,
		forwardZ: forward.forwardZ,
		rightX: forward.forwardZ,
		rightZ: -forward.forwardX,
	};
}
