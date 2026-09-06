import { AERON } from '../content/aeron.ts';
import { PLAYER_TUNING } from '../content/playerDefaults.ts';
import type { GameState } from '../types.ts';

function $(id: string): HTMLElement {
	const element = document.getElementById(id);
	if (!element) {
		throw new Error(`Missing DOM element: #${id}`);
	}
	return element;
}

export class DomHud {
	private readonly noticeEl = $('notice');
	private readonly hpEl = $('hp') as HTMLElement;
	private readonly fpEl = $('fp') as HTMLElement;
	private readonly spEl = $('sp') as HTMLElement;
	private readonly flasksEl = $('flasks');
	private readonly bossHpEl = $('bossHp') as HTMLElement;
	private readonly phaseEl = $('phase');
	private readonly stateEl = $('state');

	announceWithTimer(state: GameState, message: string, duration = 2): void {
		this.noticeEl.textContent = message;
		state.noticeTime = duration;
	}

	tickNotice(state: GameState, dt: number): void {
		state.noticeTime -= dt;
		if (state.noticeTime <= 0) {
			this.noticeEl.textContent = '';
		}
	}

	sync(state: GameState): void {
		const { player, boss } = state;
		this.hpEl.style.width = `${player.hp}%`;
		this.fpEl.style.width = `${player.fp}%`;
		this.spEl.style.width = `${player.sp}%`;
		this.flasksEl.textContent = String(player.flasks);
		this.bossHpEl.style.width = `${(boss.hp / boss.max) * 100}%`;
		this.phaseEl.textContent = state.phase2 ? AERON.phases.phase2.label : AERON.phases.phase1.label;
		this.stateEl.textContent = player.heal > 0
			? 'DRINKING…'
			: state.charging
				? state.charge > PLAYER_TUNING.sorcery.chargeThreshold
					? 'SORCERY CHARGED'
					: 'GATHERING LIGHT'
				: player.sp < PLAYER_TUNING.staminaLowThreshold
					? 'STAMINA LOW'
					: 'UNBROKEN';
	}
}
