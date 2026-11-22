// Tiny synthesized sound effects — WebAudio oscillators only, no audio files.
// Everything is guarded so the game still runs with audio unavailable (shots).
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      } catch { this.ctx = null; }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  }

  blip(freq, dur, type = 'sine', vol = 0.12, when = 0) {
    if (this.muted || !this.ctx) return;
    try {
      const t = this.ctx.currentTime + when;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g); g.connect(this.ctx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch { /* sound is decoration, never fatal */ }
  }

  pickup() { this.blip(660, 0.09, 'sine', 0.14); this.blip(990, 0.12, 'sine', 0.12, 0.08); }
  coin() { this.blip(1320, 0.06, 'triangle', 0.12); this.blip(1760, 0.08, 'triangle', 0.1, 0.05); }
  spotted() { this.blip(220, 0.16, 'square', 0.1); this.blip(185, 0.2, 'square', 0.1, 0.14); }
  busted() { this.blip(160, 0.3, 'sawtooth', 0.14); this.blip(110, 0.4, 'sawtooth', 0.14, 0.22); }
  levelClear() { [523, 659, 784, 1047].forEach((f, i) => this.blip(f, 0.14, 'sine', 0.13, i * 0.09)); }
  win() { [523, 659, 784, 1047, 1319].forEach((f, i) => this.blip(f, 0.2, 'sine', 0.13, i * 0.11)); }
  alarmTick() { this.blip(880, 0.05, 'square', 0.05); }
}
