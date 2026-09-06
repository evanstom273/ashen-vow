import * as THREE from 'three';
import type { Hazard } from '../../types.ts';
import { gameXToWorld, gameYToWorld } from './worldMapping.ts';

export class HazardScene {
	readonly root = new THREE.Group();
	private readonly meshes = new Map<Hazard, THREE.Mesh>();

	sync(hazards: Hazard[]): void {
		const active = new Set(hazards);
		for (const [hazard, mesh] of this.meshes) {
			if (!active.has(hazard)) {
				this.root.remove(mesh);
				this.meshes.delete(hazard);
			}
		}

		for (const hazard of hazards) {
			let mesh = this.meshes.get(hazard);
			if (!mesh) {
				mesh = new THREE.Mesh(
					new THREE.RingGeometry(0.92, 1, 48),
					new THREE.MeshBasicMaterial({
						color: hazard.kind === 'ring' ? '#f2b06c' : '#eac78a',
						transparent: true,
						opacity: hazard.kind === 'ring' ? 0.55 : 0.35,
						side: THREE.DoubleSide,
					}),
				);
				mesh.rotation.x = -Math.PI / 2;
				this.root.add(mesh);
				this.meshes.set(hazard, mesh);
			}
			mesh.position.set(gameXToWorld(hazard.x), hazard.kind === 'blast' ? 1.2 : 0.8, gameYToWorld(hazard.y));
			const radius = hazard.kind === 'ring' ? hazard.r : hazard.r;
			mesh.scale.set(radius, radius, 1);
		}
	}
}
