import * as THREE from 'three';
import { ARENA, TAU } from '../../constants.ts';

export function buildArenaScene(): THREE.Group {
	const root = new THREE.Group();

	const floor = new THREE.Mesh(
		new THREE.CircleGeometry(ARENA.r + 24, 64),
		new THREE.MeshStandardMaterial({
			color: '#1b2823',
			roughness: 0.92,
			metalness: 0.05,
		}),
	);
	floor.rotation.x = -Math.PI / 2;
	floor.receiveShadow = true;
	root.add(floor);

	const playSurface = new THREE.Mesh(
		new THREE.CircleGeometry(ARENA.r - 2, 64),
		new THREE.MeshStandardMaterial({
			color: '#303a31',
			roughness: 0.88,
			metalness: 0.04,
		}),
	);
	playSurface.rotation.x = -Math.PI / 2;
	playSurface.position.y = 0.05;
	playSurface.receiveShadow = true;
	root.add(playSurface);

	for (const radius of [80, 177, 279]) {
		const ring = new THREE.Mesh(
			new THREE.RingGeometry(radius - 2, radius + 2, 64),
			new THREE.MeshBasicMaterial({
				color: '#939475',
				transparent: true,
				opacity: 0.18,
				side: THREE.DoubleSide,
			}),
		);
		ring.rotation.x = -Math.PI / 2;
		ring.position.y = 0.12;
		root.add(ring);
	}

	const boundary = new THREE.Mesh(
		new THREE.TorusGeometry(ARENA.r, 3.5, 8, 72),
		new THREE.MeshStandardMaterial({ color: '#6e7561', roughness: 0.8, metalness: 0.1 }),
	);
	boundary.rotation.x = Math.PI / 2;
	boundary.position.y = 2.5;
	root.add(boundary);

	for (let i = 0; i < 12; i++) {
		const angle = (i * TAU) / 12;
		const pillar = new THREE.Mesh(
			new THREE.BoxGeometry(18, 34, 18),
			new THREE.MeshStandardMaterial({ color: '#3a463b', roughness: 0.85, metalness: 0.08 }),
		);
		pillar.position.set(Math.cos(angle) * (ARENA.r + 8), 17, Math.sin(angle) * (ARENA.r + 8));
		pillar.castShadow = true;
		pillar.receiveShadow = true;
		root.add(pillar);

		if (i % 2 === 0) {
			const brazier = new THREE.Mesh(
				new THREE.SphereGeometry(5, 10, 10),
				new THREE.MeshStandardMaterial({
					color: '#e6c278',
					emissive: '#e6c278',
					emissiveIntensity: 0.8,
					roughness: 0.4,
				}),
			);
			brazier.position.set(Math.cos(angle) * (ARENA.r + 8), 38, Math.sin(angle) * (ARENA.r + 8));
			root.add(brazier);
		}
	}

	const obelisk = new THREE.Mesh(
		new THREE.CylinderGeometry(8, 12, 28, 6),
		new THREE.MeshStandardMaterial({ color: '#4a5248', roughness: 0.75, metalness: 0.12 }),
	);
	obelisk.position.y = 14;
	obelisk.castShadow = true;
	root.add(obelisk);

	return root;
}

export function buildLighting(scene: THREE.Scene): void {
	scene.add(new THREE.AmbientLight('#8a9488', 0.55));
	const sun = new THREE.DirectionalLight('#efe8cf', 0.95);
	sun.position.set(-180, 420, -220);
	sun.castShadow = true;
	sun.shadow.mapSize.set(1024, 1024);
	sun.shadow.camera.left = -420;
	sun.shadow.camera.right = 420;
	sun.shadow.camera.top = 420;
	sun.shadow.camera.bottom = -420;
	sun.shadow.camera.near = 80;
	sun.shadow.camera.far = 900;
	scene.add(sun);

	const fill = new THREE.DirectionalLight('#6a7a72', 0.35);
	fill.position.set(260, 180, 320);
	scene.add(fill);
}
