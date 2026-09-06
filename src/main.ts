import { Game } from './game/Game.ts';
import './style.css';

const canvas = document.querySelector<HTMLCanvasElement>('canvas');
if (!canvas) {
	throw new Error('Missing canvas element.');
}

new Game(canvas);
