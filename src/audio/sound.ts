// Звук и музыка, синтезированные в браузере (Web Audio API) — без аудиофайлов и лицензий.
// Музыка: «день» — лоу-фай / city pop (мягкие аккорды maj7, бас, щётки), «скан» — синтвейв (пила, арпеджио),
// «вечер» — тихие пады, «босс» — тревожный минор. Эффекты: скан, полив, спрей, обрезка, оценки жестов и т.д.

type Mood = 'off' | 'day' | 'scan' | 'evening' | 'boss' | 'menu';
const KEY = 'sd-sound';

// аккорды по полутонам от A (A=220 Гц): прогрессии для настроений
const PROG: Record<Exclude<Mood, 'off'>, number[][]> = {
  menu: [[-4, 0, 3, 7], [-7, -3, 0, 5], [-2, 2, 5, 9], [-9, -5, -2, 3]],     // Fmaj7 Dmaj7-ish Gm7 C — city pop
  day: [[-4, 0, 3, 7], [-2, 2, 5, 9], [-7, -3, 0, 5], [-5, -1, 2, 7]],
  evening: [[-9, -5, -2, 3], [-4, 0, 3, 7], [-7, -3, 0, 3], [-5, -2, 2, 5]],
  scan: [[0, 3, 7, 10], [-4, 0, 3, 7], [-7, -4, 0, 3], [-2, 2, 5, 8]],       // Am7 F Dm G — синтвейв
  boss: [[0, 3, 6, 10], [-1, 3, 6, 9], [-4, 0, 3, 6], [-6, -2, 1, 4]],
};
const BPM: Record<Exclude<Mood, 'off'>, number> = { menu: 76, day: 82, evening: 64, scan: 112, boss: 128 };
const hz = (semi: number, base = 220) => base * Math.pow(2, semi / 12);

class Sound {
  ctx: AudioContext | null = null;
  master!: GainNode;
  music!: GainNode;
  sfx!: GainNode;
  mood: Mood = 'off';
  want: Mood = 'menu';
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;
  enabled = true;

  constructor() {
    try { this.enabled = localStorage.getItem(KEY) !== '0'; } catch { /* ignore */ }
  }

  /** Аудио можно запустить только после действия игрока (правило браузеров). */
  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    if (!AC) return;
    this.ctx = new AC();
    this.master = this.ctx.createGain(); this.master.gain.value = this.enabled ? 0.8 : 0;
    const comp = this.ctx.createDynamicsCompressor();
    this.master.connect(comp).connect(this.ctx.destination);
    this.music = this.ctx.createGain(); this.music.gain.value = 0.32; this.music.connect(this.master);
    this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.55; this.sfx.connect(this.master);
    this.setMood(this.want);
  }

  toggle() {
    this.enabled = !this.enabled;
    try { localStorage.setItem(KEY, this.enabled ? '1' : '0'); } catch { /* ignore */ }
    if (this.ctx) this.master.gain.setTargetAtTime(this.enabled ? 0.8 : 0, this.ctx.currentTime, 0.05);
    return this.enabled;
  }

  setMood(m: Mood) {
    this.want = m;
    if (!this.ctx || m === this.mood) return;
    this.mood = m;
    if (this.timer) { clearInterval(this.timer); this.timer = null; }
    if (m === 'off') return;
    this.step = 0; this.nextTime = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 50);
  }

  // ---------- музыка: планировщик восьмых долей ----------
  private schedule() {
    const ctx = this.ctx!, m = this.mood as Exclude<Mood, 'off'>;
    const eighth = 60 / BPM[m] / 2;
    while (this.nextTime < ctx.currentTime + 0.2) {
      const t = this.nextTime, s = this.step;
      const chord = PROG[m][Math.floor(s / 16) % PROG[m].length];
      const beat = s % 16;
      if (m === 'scan' || m === 'boss') {
        if (beat % 2 === 0) this.tone('sawtooth', hz(chord[0] - 24), t, eighth * 1.8, 0.16, 400);   // бас
        this.tone('square', hz(chord[beat % 4] + 12), t, eighth * 0.9, 0.05, 2200);                    // арпеджио
        if (beat % 4 === 0) this.kick(t, 0.5);
        if (beat % 8 === 4) this.snare(t, 0.22);
        if (beat === 0) chord.forEach((c) => this.tone('sawtooth', hz(c), t, eighth * 16, 0.025, 900, 0.4));
      } else {
        if (beat === 0) chord.forEach((c, i) => this.tone(m === 'evening' ? 'sine' : 'triangle', hz(c), t + i * 0.012, eighth * 15, m === 'evening' ? 0.05 : 0.045, 1600, 0.25));
        if (beat === 0 || beat === 6 || beat === 10) this.tone('sine', hz(chord[0] - 24), t, eighth * 3, 0.14, 300);
        if (m !== 'evening') {
          if (beat % 4 === 0) this.kick(t, 0.25);
          if (beat % 8 === 4) this.snare(t, 0.08);
          this.hat(t + (beat % 2 ? eighth * 0.12 : 0), beat % 2 ? 0.025 : 0.04);   // свинг-щётки
          if (beat === 2 || beat === 7 || beat === 11) this.tone('sine', hz(chord[(beat + s) % 4] + 12), t, eighth * 1.5, 0.035, 2500);
        }
      }
      this.nextTime += eighth; this.step++;
    }
  }

  private tone(type: OscillatorType, f: number, t: number, dur: number, vol: number, cutoff = 2000, attack = 0.01, dest?: AudioNode) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
    o.type = type; o.frequency.value = f;
    lp.type = 'lowpass'; lp.frequency.value = cutoff;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(lp).connect(g).connect(dest ?? this.music);
    o.start(t); o.stop(t + dur + 0.05);
  }

  private noise(t: number, dur: number, vol: number, f: number, type: BiquadFilterType, dest?: AudioNode) {
    const ctx = this.ctx!, len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource(), flt = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; flt.type = type; flt.frequency.value = f;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(flt).connect(g).connect(dest ?? this.music);
    src.start(t);
  }

  private kick(t: number, vol: number) {
    const ctx = this.ctx!, o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
    o.connect(g).connect(this.music); o.start(t); o.stop(t + 0.3);
  }
  private snare(t: number, vol: number) { this.noise(t, 0.16, vol, 1800, 'bandpass'); }
  private hat(t: number, vol: number) { this.noise(t, 0.04, vol, 7000, 'highpass'); }

  // ---------- окружение: дождь, сверчки ночью, птицы утром ----------
  private amb = { rain: false, night: false, morning: false };
  private rainSrc: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;
  private ambTimer: number | null = null;

  setAmbient(a: { rain: boolean; night: boolean; morning: boolean }) {
    this.amb = a;
    if (!this.ctx) return;
    const ctx = this.ctx;
    if (a.rain && !this.rainSrc) {
      const len = ctx.sampleRate * 2, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(); src.buffer = buf; src.loop = true;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1400; f.Q.value = 0.4;
      this.rainGain = ctx.createGain(); this.rainGain.gain.value = 0;
      src.connect(f).connect(this.rainGain).connect(this.sfx); src.start();
      this.rainGain.gain.setTargetAtTime(0.18, ctx.currentTime, 1);
      this.rainSrc = src;
      this.music.gain.setTargetAtTime(0.2, ctx.currentTime, 1);
    } else if (!a.rain && this.rainSrc) {
      const src = this.rainSrc; this.rainGain!.gain.setTargetAtTime(0, ctx.currentTime, 0.6);
      setTimeout(() => src.stop(), 2500); this.rainSrc = null;
      this.music.gain.setTargetAtTime(0.32, ctx.currentTime, 1);
    }
    if (!this.ambTimer) this.ambTimer = window.setInterval(() => this.ambTick(), 700);
  }

  private ambTick() {
    if (!this.ctx || !this.enabled || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime, S = this.sfx;
    if (this.amb.night && Math.random() < 0.7) for (let i = 0; i < 3; i++) this.tone('sine', 4200 + Math.random() * 300, t + i * 0.07, 0.04, 0.025, 8000, 0.003, S);
    if (this.amb.morning && Math.random() < 0.35) {
      const o = this.ctx.createOscillator(), g = this.ctx.createGain(), f0 = 2200 + Math.random() * 1200;
      o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f0 * 1.4, t + 0.08); o.frequency.exponentialRampToValueAtTime(f0 * 0.9, t + 0.16);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.03, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
      o.connect(g).connect(S); o.start(t); o.stop(t + 0.25);
    }
  }

  // ---------- эффекты ----------
  play(name: 'meow' | 'bell' | 'drawer' | 'bus' | 'page' | 'scan' | 'water' | 'spray' | 'prune' | 'remove' | 'confirm' | 'perfect' | 'good' | 'miss' | 'ok' | 'fail' | 'aphid' | 'swat' | 'rewind' | 'step' | 'click' | 'coin' | 'night' | 'boss' | 'win') {
    if (!this.ctx || !this.enabled) return;
    const t = this.ctx.currentTime, S = this.sfx;
    const up = (a: number, b: number, dur: number, type: OscillatorType = 'square', vol = 0.2) => {
      const o = this.ctx!.createOscillator(), g = this.ctx!.createGain();
      o.type = type; o.frequency.setValueAtTime(a, t); o.frequency.exponentialRampToValueAtTime(b, t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.05);
      o.connect(g).connect(S); o.start(t); o.stop(t + dur + 0.1);
    };
    switch (name) {
      case 'scan': up(300, 1400, 0.25, 'sawtooth', 0.12); this.tone('sine', 1760, t + 0.25, 0.3, 0.12, 4000, 0.01, S); break;
      case 'water': for (let i = 0; i < 5; i++) this.tone('sine', 900 + Math.random() * 900, t + i * 0.07, 0.08, 0.12, 3000, 0.005, S); this.noise(t, 0.4, 0.05, 1200, 'lowpass', S); break;
      case 'spray': this.noise(t, 0.45, 0.22, 4500, 'highpass', S); break;
      case 'prune': this.noise(t, 0.05, 0.4, 3000, 'bandpass', S); this.noise(t + 0.09, 0.05, 0.35, 3500, 'bandpass', S); break;
      case 'remove': up(200, 60, 0.35, 'triangle', 0.3); this.noise(t, 0.3, 0.15, 600, 'lowpass', S); break;
      case 'confirm': this.tone('triangle', 660, t, 0.1, 0.18, 4000, 0.005, S); this.tone('triangle', 990, t + 0.08, 0.14, 0.18, 4000, 0.005, S); break;
      case 'perfect': [0, 4, 7, 12].forEach((s, i) => this.tone('square', hz(s, 523), t + i * 0.05, 0.18, 0.1, 5000, 0.005, S)); break;
      case 'good': [0, 4, 7].forEach((s, i) => this.tone('triangle', hz(s, 440), t + i * 0.06, 0.16, 0.14, 4000, 0.005, S)); break;
      case 'miss': up(330, 160, 0.25, 'square', 0.12); break;
      case 'ok': [0, 7, 12].forEach((s, i) => this.tone('sine', hz(s, 392), t + i * 0.09, 0.4, 0.18, 4000, 0.01, S)); break;
      case 'fail': [0, -1, -6].forEach((s, i) => this.tone('square', hz(s, 220), t + i * 0.12, 0.2, 0.12, 1500, 0.01, S)); break;
      case 'aphid': for (let i = 0; i < 3; i++) up(1200, 2400, 0.06, 'square', 0.08); break;
      case 'swat': this.noise(t, 0.18, 0.35, 2000, 'bandpass', S); up(800, 2000, 0.15, 'sawtooth', 0.08); break;
      case 'rewind': up(1600, 120, 0.9, 'sawtooth', 0.15); this.noise(t, 0.9, 0.08, 3000, 'bandpass', S); break;
      case 'step': this.noise(t, 0.03, 0.05, 900, 'lowpass', S); break;
      case 'click': this.tone('square', 1320, t, 0.04, 0.06, 5000, 0.002, S); break;
      case 'coin': this.tone('square', 988, t, 0.08, 0.1, 5000, 0.002, S); this.tone('square', 1319, t + 0.07, 0.2, 0.1, 5000, 0.002, S); break;
      case 'night': [12, 7, 3, 0].forEach((s, i) => this.tone('sine', hz(s, 330), t + i * 0.18, 0.8, 0.1, 2000, 0.05, S)); break;
      case 'boss': up(90, 40, 1.4, 'sawtooth', 0.3); this.noise(t, 1.2, 0.15, 300, 'lowpass', S); break;
      case 'bell': this.tone('sine', 1568, t, 1.2, 0.14, 6000, 0.002, S); this.tone('sine', 2349, t, 0.8, 0.06, 6000, 0.002, S); break;
      case 'drawer': this.noise(t, 0.35, 0.12, 700, 'lowpass', S); this.tone('triangle', 140, t + 0.3, 0.08, 0.12, 900, 0.005, S); break;
      case 'meow': up(700, 1100, 0.12, 'triangle', 0.12); this.tone('triangle', 900, t + 0.12, 0.25, 0.1, 3000, 0.02, S); break;
      case 'bus': [0, 4].forEach((sm, i) => this.tone('sine', hz(sm, 880), t + i * 0.25, 0.5, 0.12, 4000, 0.005, S)); this.noise(t, 0.8, 0.06, 300, 'lowpass', S); break;
      case 'page': this.noise(t, 0.25, 0.12, 2500, 'bandpass', S); [0, 7, 12].forEach((sm, i) => this.tone('triangle', hz(sm, 660), t + 0.15 + i * 0.08, 0.3, 0.1, 5000, 0.005, S)); break;
      case 'win': [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => this.tone('triangle', hz(s, 392), t + i * 0.09, 0.5, 0.13, 5000, 0.01, S)); break;
    }
  }
}

export const sound = new Sound();
// первое действие игрока включает звук
['pointerdown', 'keydown'].forEach((e) => window.addEventListener(e, () => sound.unlock(), { capture: true }));
