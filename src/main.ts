import { Game } from './game/Game.ts';
import { createGameRenderer } from './game/render/createRenderer.ts';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('canvas');
if (!canvas) {
	throw new Error('Missing canvas element.');
}

const { renderer, cameraRelativeMovement } = createGameRenderer(canvas);
new Game(canvas, renderer, cameraRelativeMovement);
