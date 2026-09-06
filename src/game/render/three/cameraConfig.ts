import * as THREE from 'three';

/** Tunable elevated camera — Don't Starve–inspired presentation (camera only). */
export const CAMERA_CONFIG = {
	/** Perspective vertical field of view in degrees. */
	fov: 42,
	/** Camera height above the arena plane (world Y). */
	elevation: 420,
	/** Horizontal offset on X (arena-local). */
	offsetX: 0,
	/** Pull-back on Z (negative = behind the play area looking inward). */
	distance: 520,
	/** Look-at height above the ground plane. */
	lookAtY: 0,
	/** Subtle framing bias toward the player (0 = arena center). */
	playerFraming: 0.22,
	/** Near/far clip planes. */
	near: 10,
	far: 2500,
} as const;

export function getCameraPosition(targetX: number, targetZ: number): THREE.Vector3 {
	const blendX = targetX * CAMERA_CONFIG.playerFraming;
	const blendZ = targetZ * CAMERA_CONFIG.playerFraming;
	return new THREE.Vector3(
		CAMERA_CONFIG.offsetX + blendX,
		CAMERA_CONFIG.elevation,
		-CAMERA_CONFIG.distance + blendZ,
	);
}

export function getCameraLookAt(targetX: number, targetZ: number): THREE.Vector3 {
	return new THREE.Vector3(
		targetX * CAMERA_CONFIG.playerFraming,
		CAMERA_CONFIG.lookAtY,
		targetZ * CAMERA_CONFIG.playerFraming,
	);
}

/** Camera forward/right on the gameplay XZ plane for movement remapping. */
export function getCameraMovementAxes(): { forwardX: number; forwardZ: number; rightX: number; rightZ: number } {
	const position = getCameraPosition(0, 0);
	const lookAt = getCameraLookAt(0, 0);
	let forwardX = lookAt.x - position.x;
	let forwardZ = lookAt.z - position.z;
	const length = Math.hypot(forwardX, forwardZ) || 1;
	forwardX /= length;
	forwardZ /= length;
	const rightX = forwardZ;
	const rightZ = -forwardX;
	return { forwardX, forwardZ, rightX, rightZ };
}
