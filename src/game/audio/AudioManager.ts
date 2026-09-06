export class AudioManager {
	private context: AudioContext | null = null;
	private muted = false;

	init(): void {
		if (this.context) {
			void this.context.resume();
			return;
		}
		try {
			const AudioCtx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
			if (!AudioCtx) return;
			this.context = new AudioCtx();
			void this.context.resume();
		} catch {
			// Web Audio unavailable; game remains playable silently.
		}
	}

	play(freq: number, duration = 0.1, type: OscillatorType = 'sine', vol = 0.04): void {
		const audio = this.context;
		if (!audio || this.muted) return;

		const oscillator = audio.createOscillator();
		const gain = audio.createGain();
		oscillator.type = type;
		oscillator.frequency.setValueAtTime(freq, audio.currentTime);
		oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, freq * 0.4), audio.currentTime + duration);
		gain.gain.setValueAtTime(vol, audio.currentTime);
		gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + duration);
		oscillator.connect(gain).connect(audio.destination);
		oscillator.start();
		oscillator.stop(audio.currentTime + duration);
	}
}
