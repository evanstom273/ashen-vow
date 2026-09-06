import * as THREE from 'three';
import { getSpellDefinition } from '../../content/spells.ts';
import type { SpellVisualProfile, ProjectileShape } from '../../content/spellVisuals.ts';
import { emissiveFromGlow, hexColor } from './colorUtils.ts';
import { gameAngleToRotation, gameXToWorld, gameYToWorld } from './worldMapping.ts';
import type { GameState, Shot } from '../../types.ts';
import { getEquippedSpellDefinition } from '../../state/spellState.ts';

function buildProjectileMesh(shape: ProjectileShape, visual: SpellVisualProfile, powered: boolean): THREE.Group {
	const radius = powered ? visual.projectile.chargedRadius : visual.projectile.basicRadius;
	const group = new THREE.Group();
	const primary = new THREE.MeshStandardMaterial({
		color: hexColor(visual.projectile.primaryColor),
		emissive: emissiveFromGlow(visual.projectile.glowColor, visual.projectile.glowBlur),
		emissiveIntensity: 1,
		roughness: 0.35,
		metalness: 0.15,
	});
	const secondary = new THREE.MeshStandardMaterial({
		color: hexColor(visual.projectile.secondaryColor),
		emissive: hexColor(visual.projectile.glowColor),
		emissiveIntensity: 0.35,
		roughness: 0.45,
	});

	let mesh: THREE.Mesh;
	switch (shape) {
		case 'crescent':
			mesh = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.9, radius * 0.28, 8, 16, Math.PI), primary);
			mesh.rotation.x = Math.PI / 2;
			break;
		case 'flame':
			mesh = new THREE.Mesh(new THREE.ConeGeometry(radius * 0.9, radius * 2.2, 8), secondary);
			mesh.rotation.x = Math.PI / 2;
			group.add(new THREE.Mesh(new THREE.SphereGeometry(radius * 0.55, 8, 8), primary));
			break;
		case 'rune':
			mesh = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.75, radius * 0.18, 8, 24), primary);
			mesh.rotation.x = Math.PI / 2;
			group.add(new THREE.Mesh(new THREE.BoxGeometry(radius * 1.4, radius * 0.15, radius * 0.22), secondary));
			group.add(new THREE.Mesh(new THREE.BoxGeometry(radius * 0.22, radius * 0.15, radius * 1.4), secondary));
			break;
		case 'ring':
			mesh = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.85, radius * 0.2, 8, 20), primary);
			mesh.rotation.x = Math.PI / 2;
			break;
		default:
			mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 12, 12), primary);
			group.add(new THREE.Mesh(new THREE.SphereGeometry(radius * 0.55, 8, 8), secondary));
	}
	mesh.castShadow = true;
	group.add(mesh);
	return group;
}

export class SpellScene {
	readonly root = new THREE.Group();
	private readonly shotMeshes = new Map<Shot, THREE.Group>();
	private chargeRing: THREE.Mesh | null = null;

	sync(state: GameState, time: number): void {
		const active = new Set(state.shots);
		for (const [shot, mesh] of this.shotMeshes) {
			if (!active.has(shot)) {
				this.root.remove(mesh);
				this.shotMeshes.delete(shot);
			}
		}

		for (const shot of state.shots) {
			let mesh = this.shotMeshes.get(shot);
			if (!mesh) {
				const spell = getSpellDefinition(shot.spellId);
				mesh = buildProjectileMesh(spell.visual.projectile.shape, spell.visual, shot.powered);
				this.root.add(mesh);
				this.shotMeshes.set(shot, mesh);
			}
			mesh.position.set(gameXToWorld(shot.x), 4, gameYToWorld(shot.y));
			mesh.rotation.y = gameAngleToRotation(Math.atan2(shot.vy, shot.vx));
			const spell = getSpellDefinition(shot.spellId);
			const pulse = spell.visual.projectile.pulseSpeed
				? 1 + Math.sin(time * spell.visual.projectile.pulseSpeed) * 0.08
				: 1;
			mesh.scale.setScalar(pulse);
		}

		if (state.charging) {
			const spell = getEquippedSpellDefinition(state);
			const radius = spell.visual.charge.baseRadius + state.charge * spell.visual.charge.radiusScale;
			if (!this.chargeRing) {
				this.chargeRing = new THREE.Mesh(
					new THREE.RingGeometry(1, 1.08, 32),
					new THREE.MeshBasicMaterial({
						color: hexColor(spell.visual.charge.ringColor),
						transparent: true,
						opacity: 0.75,
						side: THREE.DoubleSide,
					}),
				);
				this.chargeRing.rotation.x = -Math.PI / 2;
				this.root.add(this.chargeRing);
			}
			this.chargeRing.visible = true;
			this.chargeRing.position.set(gameXToWorld(state.player.x), 1.5, gameYToWorld(state.player.y));
			this.chargeRing.scale.set(radius, radius, 1);
			(this.chargeRing.material as THREE.MeshBasicMaterial).color.set(spell.visual.charge.ringColor);
		} else if (this.chargeRing) {
			this.chargeRing.visible = false;
		}
	}
}

export function buildTrailParticle(color: string, size: number): THREE.Mesh {
	return new THREE.Mesh(
		new THREE.SphereGeometry(size, 6, 6),
		new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.65 }),
	);
}
