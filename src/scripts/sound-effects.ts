export type SoundEffect = 'blip' | 'sweep' | 'data-hit' | 'victory';

let audioContext: AudioContext | undefined;
let enabled = true;
let unavailable = false;

function getAudioContext(): AudioContext | undefined {
	if (unavailable || !('AudioContext' in window)) return undefined;
	try {
		if (!audioContext) audioContext = new AudioContext();
		if (audioContext.state === 'suspended') {
			void audioContext.resume().catch((error: unknown) => {
				console.warn('Could not resume sound effects.', error);
			});
		}
		return audioContext;
	} catch (error) {
		unavailable = true;
		console.warn('Sound effects are unavailable in this browser.', error);
		return undefined;
	}
}

function playTone(
	startFrequency: number,
	endFrequency: number,
	duration: number,
	type: OscillatorType,
	volume: number,
	delay = 0,
) {
	if (!enabled) return;

	const context = getAudioContext();
	if (!context) return;
	const start = context.currentTime + delay;
	const oscillator = context.createOscillator();
	const gain = context.createGain();
	oscillator.type = type;
	oscillator.frequency.setValueAtTime(startFrequency, start);
	oscillator.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
	gain.gain.setValueAtTime(0.0001, start);
	gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
	gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
	oscillator.connect(gain);
	gain.connect(context.destination);
	oscillator.start(start);
	oscillator.stop(start + duration);
}

export function isSfxEnabled() {
	return enabled;
}

export function setSfxEnabled(value: boolean) {
	enabled = value;
	return enabled;
}

export function playSound(effect: SoundEffect) {
	switch (effect) {
		case 'blip':
			playTone(760, 420, 0.07, 'square', 0.035);
			break;
		case 'sweep':
			playTone(150, 720, 0.7, 'sawtooth', 0.045);
			break;
		case 'data-hit':
			playTone(520, 190, 0.11, 'square', 0.04);
			playTone(1_100, 640, 0.06, 'triangle', 0.025, 0.025);
			break;
		case 'victory':
			playTone(330, 660, 0.22, 'triangle', 0.05);
			playTone(440, 880, 0.28, 'sawtooth', 0.035, 0.12);
			playTone(660, 990, 0.35, 'triangle', 0.045, 0.26);
			break;
	}
}
