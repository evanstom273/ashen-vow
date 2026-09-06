import * as THREE from 'three';

export function hexColor(hex: string): THREE.Color {
	return new THREE.Color(hex);
}

export function emissiveFromGlow(base: string, glowBlur: number): THREE.Color {
	const color = hexColor(base);
	const intensity = Math.min(2.5, glowBlur / 18);
	return color.clone().multiplyScalar(intensity);
}
