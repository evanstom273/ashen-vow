import * as THREE from 'three';
import { getEffectDefinition } from '../../content/effects.ts';
import type { BossState } from '../../types.ts';

export class EffectScene {
	readonly root = new THREE.Group();
	private aura: THREE.Mesh | null = null;

	sync(boss: BossState, time: number): void {
		if (boss.effects.length === 0) {
			if (this.aura) this.aura.visible = false;
			return;
		}

		const latest = boss.effects[boss.effects.length - 1];
		const definition = getEffectDefinition(latest.effectId);
		if (!this.aura) {
			this.aura = new THREE.Mesh(
				new THREE.RingGeometry(28, 32, 32),
				new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.6, side: THREE.DoubleSide }),
			);
			this.aura.rotation.x = -Math.PI / 2;
			this.root.add(this.aura);
		}
		this.aura.visible = true;
		(this.aura.material as THREE.MeshBasicMaterial).color.set(definition.particleColor);
		this.aura.position.y = 2 + Math.sin(time * 8) * 0.5;
		this.aura.scale.setScalar(1 + Math.sin(time * 6) * 0.05);
	}
}
