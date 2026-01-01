
// Synthesized Audio Service to avoid external assets
class SoundService {
  private ctx: AudioContext | null = null;

  private getContext() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.ctx;
  }

  private playTone(freq: number, type: OscillatorType, duration: number, delay = 0) {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    
    gain.gain.setValueAtTime(0.1, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + duration);
  }

  playClick() {
    this.playTone(800, 'sine', 0.05);
  }

  playStart() {
    this.playTone(400, 'sine', 0.1);
    this.playTone(600, 'sine', 0.1, 0.1);
    this.playTone(1000, 'sine', 0.3, 0.2);
  }

  playComplete() {
    this.playTone(500, 'triangle', 0.1);
    this.playTone(1000, 'triangle', 0.1, 0.1);
    this.playTone(1500, 'triangle', 0.4, 0.2);
  }

  playError() {
    this.playTone(150, 'sawtooth', 0.3);
    this.playTone(100, 'sawtooth', 0.3, 0.1);
  }

  playAlarm() {
    const ctx = this.getContext();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    
    // Rhythmic alarm
    for(let i=0; i<3; i++) {
        this.playTone(800, 'square', 0.1, i * 0.5);
        this.playTone(800, 'square', 0.1, i * 0.5 + 0.1);
    }
  }
}

export const soundService = new SoundService();
