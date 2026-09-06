import * as THREE from 'three';
import type { BossState, PlayerState } from '../../types.ts';
import { gameAngleToRotation, gameXToWorld, gameYToWorld } from './worldMapping.ts';

export interface ActorScene {
	root: THREE.Group;
	player: THREE.Group;
	boss: THREE.Group;
	playerLockMarker: THREE.Mesh;
	bossLockRing: THREE.Mesh;
	bossTelegraph: THREE.Mesh;
	bossWeapon: THREE.Mesh;
	updatePlayer(player: PlayerState, time: number): void;
	updateBoss(boss: BossState, phase2: boolean, time: number): void;
	setLockOnVisible(active: boolean): void;
}

function buildKnightPlaceholder(isBoss: boolean): THREE.Group {
	const group = new THREE.Group();
	const body = new THREE.Mesh(
		new THREE.CylinderGeometry(isBoss ? 16 : 9, isBoss ? 20 : 11, isBoss ? 42 : 24, 8),
		new THREE.MeshStandardMaterial({
			color: isBoss ? '#514b3d' : '#4d6865',
			roughness: 0.78,
			metalness: 0.12,
		}),
	);
	body.position.y = isBoss ? 21 : 12;
	body.castShadow = true;
	body.userData.isBossBody = isBoss;
	group.add(body);

	const helm = new THREE.Mesh(
		new THREE.BoxGeometry(isBoss ? 22 : 14, isBoss ? 16 : 10, isBoss ? 18 : 12),
		new THREE.MeshStandardMaterial({ color: isBoss ? '#8b8876' : '#a6b7ae', roughness: 0.7, metalness: 0.15 }),
	);
	helm.position.y = isBoss ? 44 : 26;
	helm.castShadow = true;
	group.add(helm);

	const nose = new THREE.Mesh(
		new THREE.ConeGeometry(isBoss ? 5 : 3, isBoss ? 10 : 6, 4),
		new THREE.MeshStandardMaterial({ color: '#c1bda0', roughness: 0.65, metalness: 0.2 }),
	);
	nose.rotation.x = Math.PI / 2;
	nose.position.set(0, isBoss ? 44 : 26, isBoss ? 10 : 7);
	group.add(nose);

	if (isBoss) {
		const crownLeft = new THREE.Mesh(
			new THREE.ConeGeometry(4, 14, 4),
			new THREE.MeshStandardMaterial({ color: '#c2a768', roughness: 0.55, metalness: 0.35 }),
		);
		crownLeft.position.set(-10, 58, 0);
		const crownRight = crownLeft.clone();
		crownRight.position.x = 10;
		group.add(crownLeft, crownRight);
	}

	return group;
}

export function buildActorScene(): ActorScene {
	const root = new THREE.Group();
	const player = buildKnightPlaceholder(false);
	const boss = buildKnightPlaceholder(true);

	const bossWeapon = new THREE.Mesh(
		new THREE.BoxGeometry(6, 64, 6),
		new THREE.MeshStandardMaterial({ color: '#c2b99b', roughness: 0.45, metalness: 0.4 }),
	);
	bossWeapon.position.set(18, 30, 0);
	boss.add(bossWeapon);

	const playerLockMarker = new THREE.Mesh(
		new THREE.RingGeometry(14, 17, 24),
		new THREE.MeshBasicMaterial({ color: '#a4e1df', transparent: true, opacity: 0.7, side: THREE.DoubleSide }),
	);
	playerLockMarker.rotation.x = -Math.PI / 2;
	playerLockMarker.position.y = 1.2;
	playerLockMarker.visible = false;
	player.add(playerLockMarker);

	const bossLockRing = new THREE.Mesh(
		new THREE.RingGeometry(34, 38, 32),
		new THREE.MeshBasicMaterial({ color: '#efd38c', transparent: true, opacity: 0.85, side: THREE.DoubleSide }),
	);
	bossLockRing.rotation.x = -Math.PI / 2;
	bossLockRing.position.y = 1.5;
	bossLockRing.visible = false;
	boss.add(bossLockRing);

	const bossTelegraph = new THREE.Mesh(
		new THREE.CircleGeometry(1, 32),
		new THREE.MeshBasicMaterial({ color: '#d09b66', transparent: true, opacity: 0.25, side: THREE.DoubleSide }),
	);
	bossTelegraph.rotation.x = -Math.PI / 2;
	bossTelegraph.position.y = 0.4;
	bossTelegraph.visible = false;
	root.add(bossTelegraph);

	root.add(player);
	root.add(boss);

	return {
		root,
		player,
		boss,
		playerLockMarker,
		bossLockRing,
		bossTelegraph,
		bossWeapon,
		updatePlayer(playerState, time) {
			player.position.set(gameXToWorld(playerState.x), 0, gameYToWorld(playerState.y));
			player.rotation.y = gameAngleToRotation(playerState.angle);
			const rollAlpha = playerState.roll > 0 ? 0.55 : playerState.inv > 0 ? 0.45 + Math.sin(time * 50) * 0.2 : 1;
			player.traverse((child) => {
				if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
					child.material.opacity = rollAlpha;
					child.material.transparent = rollAlpha < 1;
				}
			});
		},
		updateBoss(bossState, phase2, time) {
			boss.position.set(gameXToWorld(bossState.x), 0, gameYToWorld(bossState.y));
			boss.rotation.y = gameAngleToRotation(bossState.angle);

			boss.traverse((child) => {
				if (!(child instanceof THREE.Mesh) || !(child.material instanceof THREE.MeshStandardMaterial)) return;
				if (child === bossWeapon) return;
				if (child.userData.isBossBody) {
					child.material.color.set(bossState.flash > 0 ? '#e6cfaa' : phase2 ? '#743b2c' : '#514b3d');
				}
			});

			const weaponAngle = bossState.state === 'windup'
				? -0.9
				: bossState.state === 'attack'
					? 1.4
					: 0.2;
			bossWeapon.rotation.z = weaponAngle;

			if (bossState.state === 'windup') {
				bossTelegraph.visible = true;
				bossTelegraph.position.set(gameXToWorld(bossState.x), 0.4, gameYToWorld(bossState.y));
				bossTelegraph.rotation.y = gameAngleToRotation(bossState.angle);
				const pulse = 0.85 + Math.sin(time * 15) * 0.15;
				if (bossState.move === 0) {
					bossTelegraph.scale.set(135 * pulse, 135 * pulse, 1);
					(bossTelegraph.material as THREE.MeshBasicMaterial).color.set('#d09b66');
				} else if (bossState.move === 1) {
					bossTelegraph.scale.set(270 * pulse, 56 * pulse, 1);
					(bossTelegraph.material as THREE.MeshBasicMaterial).color.set('#d7a065');
				} else {
					bossTelegraph.position.set(gameXToWorld(bossState.tx), 0.4, gameYToWorld(bossState.ty));
					bossTelegraph.rotation.y = 0;
					bossTelegraph.scale.set(100 * pulse, 100 * pulse, 1);
					(bossTelegraph.material as THREE.MeshBasicMaterial).color.set('#d7b374');
				}
			} else {
				bossTelegraph.visible = false;
			}
		},
		setLockOnVisible(active) {
			bossLockRing.visible = active;
			playerLockMarker.visible = active;
		},
	};
}
