import type { GameRenderer } from './GameRenderer.ts';
import { CanvasRenderer } from './CanvasRenderer.ts';
import { ThreeRenderer } from './three/ThreeRenderer.ts';

export type RendererKind = 'canvas' | '3d';

export function resolveRendererKind(): RendererKind {
	const param = new URLSearchParams(location.search).get('renderer');
	if (param === 'canvas') return 'canvas';
	if (param === '3d') return '3d';
	return '3d';
}

export function createGameRenderer(canvas: HTMLCanvasElement, kind = resolveRendererKind()): {
	renderer: GameRenderer;
	cameraRelativeMovement: boolean;
} {
	if (kind === 'canvas') {
		return { renderer: new CanvasRenderer(canvas), cameraRelativeMovement: false };
	}
	return { renderer: new ThreeRenderer(canvas), cameraRelativeMovement: true };
}
