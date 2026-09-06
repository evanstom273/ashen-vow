import * as THREE from 'three';
import type { GameMode, GameState } from '../../types.ts';
import type { GameRenderer } from '../GameRenderer.ts';
import { gameXToWorld, gameYToWorld } from './worldMapping.ts';
import { CAMERA_CONFIG, getCameraRig } from './cameraConfig.ts';
import { buildArenaScene, buildLighting } from './buildArenaScene.ts';
import { buildActorScene } from './actorScene.ts';
import { SpellScene } from './spellScene.ts';
import { HazardScene } from './hazardScene.ts';
import { ParticleScene } from './particleScene.ts';
import { EffectScene } from './effectScene.ts';

export class ThreeRenderer implements GameRenderer {
	private readonly renderer: THREE.WebGLRenderer;
	private readonly scene = new THREE.Scene();
	private readonly camera: THREE.PerspectiveCamera;
	private readonly actors = buildActorScene();
	private readonly spells = new SpellScene();
	private readonly hazards = new HazardScene();
	private readonly particles = new ParticleScene();
	private readonly effects = new EffectScene();

	constructor(canvas: HTMLCanvasElement) {
		this.scene.background = new THREE.Color('#0a100f');
		this.scene.fog = new THREE.Fog('#0a100f', 500, 1400);

		this.camera = new THREE.PerspectiveCamera(
			CAMERA_CONFIG.fov,
			1,
			CAMERA_CONFIG.near,
			CAMERA_CONFIG.far,
		);

		this.renderer = new THREE.WebGLRenderer({
			canvas,
			antialias: true,
			alpha: false,
			powerPreference: 'high-performance',
		});
		this.renderer.shadowMap.enabled = true;
		this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		this.renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

		this.scene.add(buildArenaScene());
		buildLighting(this.scene);
		this.scene.add(this.actors.root);
		this.scene.add(this.spells.root);
		this.scene.add(this.hazards.root);
		this.scene.add(this.particles.root);
		this.actors.boss.add(this.effects.root);

		this.resize();
		addEventListener('resize', () => this.resize());
	}

	private resize(): void {
		const w = innerWidth;
		const h = innerHeight;
		this.renderer.setSize(w, h, false);
		this.camera.aspect = w / h;
		this.camera.updateProjectionMatrix();
	}

	render(state: GameState, mode: GameMode): void {
		const playerX = gameXToWorld(state.player.x);
		const playerZ = gameYToWorld(state.player.y);
		const shake = state.shake;
		const rig = getCameraRig(playerX, playerZ);

		this.camera.position.set(
			rig.position.x + (Math.random() - 0.5) * shake * 0.35,
			rig.position.y + (Math.random() - 0.5) * shake * 0.2,
			rig.position.z + (Math.random() - 0.5) * shake * 0.35,
		);
		this.camera.lookAt(rig.lookAt);

		this.actors.updatePlayer(state.player, state.time);
		this.actors.updateBoss(state.boss, state.phase2, state.time);
		this.actors.setLockOnVisible(state.lockOn.active && mode === 'play');
		this.spells.sync(state, state.time);
		this.hazards.sync(state.hazards);
		this.particles.sync(state.particles);
		this.effects.sync(state.boss, state.time);

		if (mode === 'dead') {
			this.scene.background = new THREE.Color('#1a0a0a');
		} else {
			this.scene.background = new THREE.Color('#0a100f');
		}

		this.renderer.render(this.scene, this.camera);
	}

	dispose(): void {
		this.renderer.dispose();
	}
}
