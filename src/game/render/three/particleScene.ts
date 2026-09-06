import * as THREE from 'three';
import type { Particle } from '../../types.ts';
import { gameXToWorld, gameYToWorld } from './worldMapping.ts';

export class ParticleScene {
	readonly root = new THREE.Group();
	private readonly meshes = new Map<Particle, THREE.Mesh>();
	private readonly pool: THREE.Mesh[] = [];

	sync(particles: Particle[]): void {
		const active = new Set(particles);
		for (const [particle, mesh] of this.meshes) {
			if (!active.has(particle)) {
				this.root.remove(mesh);
				this.meshes.delete(particle);
				this.pool.push(mesh);
			}
		}

		for (const particle of particles) {
			let mesh = this.meshes.get(particle);
			if (!mesh) {
				mesh = this.pool.pop() ?? new THREE.Mesh(
					new THREE.SphereGeometry(1, 6, 6),
					new THREE.MeshBasicMaterial({ transparent: true }),
				);
				this.root.add(mesh);
				this.meshes.set(particle, mesh);
			}
			const material = mesh.material as THREE.MeshBasicMaterial;
			material.color.set(particle.color);
			material.opacity = Math.max(0, particle.t / particle.max);
			mesh.position.set(gameXToWorld(particle.x), 3 + particle.r, gameYToWorld(particle.y));
			mesh.scale.setScalar(Math.max(0.5, particle.r));
		}
	}
}
