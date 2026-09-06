import type { GameState, Particle } from '../types.ts';

export function spawnBurst(
	state: GameState,
	x: number,
	y: number,
	color: string,
	count = 12,
	speed = 100,
): void {
	for (let i = 0; i < count; i++) {
		const angle = Math.random() * Math.PI * 2;
		const velocity = Math.random() * speed;
		const particle: Particle = {
			x,
			y,
			vx: Math.cos(angle) * velocity,
			vy: Math.sin(angle) * velocity,
			t: 0.3 + Math.random() * 0.5,
			max: 0.8,
			color,
			r: 1 + Math.random() * 3,
		};
		state.particles.push(particle);
	}
}

export function updateParticles(state: GameState, dt: number): void {
	state.particles = state.particles.filter((particle) => {
		particle.t -= dt;
		particle.x += particle.vx * dt;
		particle.y += particle.vy * dt;
		particle.vx *= 0.96;
		particle.vy *= 0.96;
		return particle.t > 0;
	});
}

export function decayShake(state: GameState, dt: number): void {
	state.shake = Math.max(0, state.shake - 35 * dt);
}
