// Tiny WebAudio synth: engine hum, siren, mission chimes, radio chords.
// Everything is generated in code — no audio files ship with the game.
export class GameAudio {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.sirenOsc = null;
    this.sirenGain = null;
    this.radioTimer = 0;
    this.chordIdx = 0;
  }
  start() {
    if (this.ctx) return;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc.type = "sawtooth";
    this.engineOsc.frequency.value = 55;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0;
    const lp = this.ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 420;
    this.engineOsc.connect(lp).connect(this.engineGain).connect(this.ctx.destination);
    this.engineOsc.start();
    this.sirenOsc = this.ctx.createOscillator();
    this.sirenOsc.type = "triangle";
    this.sirenGain = this.ctx.createGain();
    this.sirenGain.gain.value = 0;
    this.sirenOsc.connect(this.sirenGain).connect(this.ctx.destination);
    this.sirenOsc.start();
  }
  update(dt, speedKmh, wantedStars) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const driving = speedKmh > 1;
    this.engineGain.gain.setTargetAtTime(driving ? 0.05 : 0, t, 0.1);
    this.engineOsc.frequency.setTargetAtTime(55 + speedKmh * 1.1, t, 0.1);
    const sirenOn = wantedStars > 0;
    this.sirenGain.gain.setTargetAtTime(sirenOn ? 0.028 : 0, t, 0.15);
    if (sirenOn) {
      const phase = (performance.now() / 700) % 1;
      this.sirenOsc.frequency.setValueAtTime(phase < 0.5 ? 720 : 960, t);
    }
    // Radio: a lazy sunset chord loop while driving.
    this.radioTimer -= dt;
    if (driving && this.radioTimer <= 0) {
      this.radioTimer = 2.4;
      const chords = [[220, 277, 330], [196, 247, 294], [175, 220, 262], [165, 208, 247]];
      const chord = chords[this.chordIdx++ % chords.length];
      for (const f of chord) this.blip(f, 1.6, 0.018, "sine");
    }
  }
  blip(freq, dur, vol, type = "square") {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }
  chime() { this.blip(880, 0.25, 0.05); setTimeout(() => this.blip(1318, 0.35, 0.05), 110); }
  thud() { this.blip(90, 0.18, 0.09, "sine"); }
  shot() { this.blip(1400, 0.07, 0.07, "square"); this.blip(220, 0.12, 0.06, "sawtooth"); }
}
