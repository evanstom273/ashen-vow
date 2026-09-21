import { Game } from './game/Game.ts';
import './style.css';

const BUILD_SHA = import.meta.env.VITE_BUILD_SHA ?? 'dev';
const VERSION_URL = '/ashen-vow/version.json';

const buildEl = document.getElementById('buildId');
if (buildEl) {
	buildEl.textContent = `BUILD ${BUILD_SHA.slice(0, 7)}`;
}

async function checkForNewBuild(): Promise<void> {
	if (BUILD_SHA === 'dev') return;
	try {
		const response = await fetch(`${VERSION_URL}?t=${Date.now()}`, {
			cache: 'no-store',
			headers: { 'cache-control': 'no-cache' },
		});
		if (!response.ok) return;
		const version = await response.json() as { sha?: string };
		if (!version.sha || version.sha === BUILD_SHA) return;

		const url = new URL(location.href);
		url.searchParams.set('v', version.sha.slice(0, 7));
		location.replace(url.toString());
	} catch {
		// The game should remain playable if the update check cannot reach Pages.
	}
}

void checkForNewBuild();
addEventListener('focus', () => void checkForNewBuild());
document.addEventListener('visibilitychange', () => {
	if (document.visibilityState === 'visible') void checkForNewBuild();
});
window.setInterval(() => void checkForNewBuild(), 30_000);

const canvas = document.querySelector<HTMLCanvasElement>('canvas');
if (!canvas) {
	throw new Error('Missing canvas element.');
}

new Game(canvas);
