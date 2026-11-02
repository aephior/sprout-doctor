// «Жизнь» фермы: время суток и освещение, огни в окнах и фонари, светлячки, дождь и туман,
// сезонные лепестки/листья, бабочки, следы, тень Аой, кошка Моти, рыбак у пруда, автобус.
import { game } from '../state/game';
import { registerWorldExtras } from '../art/worldExtras';
import { makeGlow } from '../art/interiors';
import { sound } from '../audio/sound';
import { events } from '../state/events';
import { LAYOUT } from './layout';

const T = 16, MAPW = LAYOUT.MW * T, MAPH = LAYOUT.MH * T;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function mix(c1: number, c2: number, t: number) {
  const r = lerp((c1 >> 16) & 255, (c2 >> 16) & 255, t), g = lerp((c1 >> 8) & 255, (c2 >> 8) & 255, t), b = lerp(c1 & 255, c2 & 255, t);
  return (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
}
// освещение по часам: [час, цвет-множитель]
const LIGHT: [number, number][] = [[6, 0xc8b4d8], [7.5, 0xf2e2e8], [9, 0xffffff], [16, 0xffffff], [18, 0xffd6a8], [19.5, 0xd8a0a8], [20.5, 0x8080c0], [22, 0x5a5a9a], [24, 0x44447c]];
function lightAt(h: number) {
  for (let i = 1; i < LIGHT.length; i++) if (h <= LIGHT[i][0]) {
    const [h0, c0] = LIGHT[i - 1], [h1, c1] = LIGHT[i];
    return mix(c0, c1, (h - h0) / (h1 - h0));
  }
  return LIGHT[LIGHT.length - 1][1];
}

export const hourNow = () => game.data.minutes / 60;
export const clockText = () => { const m = Math.floor(game.data.minutes); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

export class FarmLife {
  overlay: Phaser.GameObjects.Rectangle;
  lights: { img: Phaser.GameObjects.Image; base: number }[] = [];
  fireflies: Phaser.GameObjects.Particles.ParticleEmitter;
  rain: Phaser.GameObjects.Particles.ParticleEmitter;
  season: Phaser.GameObjects.Particles.ParticleEmitter | null = null;
  puddles: Phaser.GameObjects.Image[] = [];
  fog: Phaser.GameObjects.Image[] = [];
  butterflies: { s: Phaser.GameObjects.Sprite; cx: number; cy: number; ph: number }[] = [];
  steps: Phaser.GameObjects.Image[] = [];
  shadow: Phaser.GameObjects.Image;
  mochi: Phaser.GameObjects.Sprite;
  mochiAnim?: Phaser.Time.TimerEvent;
  fisher: Phaser.GameObjects.Sprite;
  bus: Phaser.GameObjects.Sprite;
  busDone = new Set<string>();
  private lastTenMin = -1;
  private midnightSent = false;

  constructor(private sc: Phaser.Scene, private aoi: Phaser.GameObjects.Sprite) {
    registerWorldExtras(sc); makeGlow(sc);
    const add = sc.add;
    // фонарь у остановки
    const [lx, ly] = LAYOUT.lamp;
    add.image(lx, ly + 12, 'lamppost-hd').setOrigin(0.5, 1).setScale(0.5).setDepth(ly + 12);
    // лужи на тропинке (видны в дождь)
    for (const [x, y] of [[8, 9], [16, 10], [27, 9], [19, 22], [35, 15], [12, 25], [30, 26]]) this.puddles.push(add.image(x * T + 2, y * T + 6, 'puddle').setOrigin(0).setDepth(-4).setVisible(false));
    // тень под Аой
    this.shadow = add.image(aoi.x, aoi.y, 'shadow').setAlpha(0.3);

    // освещение: прямоугольник-множитель поверх мира, огни — над ним (сложение)
    this.overlay = add.rectangle(0, 0, MAPW, MAPH, 0xffffff).setOrigin(0).setDepth(9000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    const light = (x: number, y: number, scale: number, tint: number, base = 1) => {
      const img = add.image(x, y, 'glow').setScale(scale).setTint(tint).setBlendMode(Phaser.BlendModes.ADD).setDepth(9001).setAlpha(0);
      this.lights.push({ img, base });
    };
    light(69, 112, 0.5, 0xffd27a); light(100, 112, 0.5, 0xffd27a);                      // окна дома
    light(470, 119, 0.45, 0xffb070); light(495, 119, 0.45, 0xffb070);                   // окна лавки
    light(LAYOUT.doorShop[0], 124, 0.55, 0xff9060);                                      // фонарь у норэна
    light(LAYOUT.vending[0] + 8, LAYOUT.vending[1] + 10, 0.35, 0x3fd0c9, 0.8);           // торговый автомат
    light(lx, ly - 8, 0.7, 0xffe0a0);                                                   // фонарь
    this.fireflies = add.particles(0, 0, 'pixel', {
      x: { min: 0, max: MAPW }, y: { min: 40, max: MAPH }, lifespan: 3500, speedX: { min: -6, max: 6 }, speedY: { min: -5, max: 5 },
      scale: { start: 1.6, end: 0 }, alpha: { start: 1, end: 0 }, frequency: 180, tint: [0xf2e070, 0xd8f080], blendMode: 'ADD',
    }).setDepth(9002);
    this.fireflies.emitting = false;
    // дождь и туман
    this.rain = add.particles(0, 0, 'raindrop', {
      x: { min: -40, max: MAPW }, y: -10, lifespan: 900, speedY: { min: 330, max: 380 }, speedX: 40, quantity: 3, frequency: 16, alpha: 0.7,
    }).setDepth(9004);
    this.rain.emitting = false;
    for (let i = 0; i < 7; i++) {
      const f = add.image(Math.random() * MAPW, 30 + Math.random() * (MAPH - 60), 'fog').setScale(1.4 + Math.random()).setDepth(9005).setAlpha(0);
      this.fog.push(f);
      sc.tweens.add({ targets: f, x: f.x + 60 + Math.random() * 40, duration: 14000 + Math.random() * 8000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    }
    // сезонные частицы: весной лепестки сакуры, осенью листья
    const s = game.data.season;
    if (s !== 2) this.season = add.particles(0, 0, s === 1 ? 'petal' : 'leaf-fall', {
      x: { min: 0, max: MAPW }, y: -6, lifespan: 9000, speedY: { min: 10, max: 18 }, speedX: { min: 4, max: 14 }, rotate: { min: 0, max: 360 },
      frequency: s === 1 ? 700 : 500, quantity: 1,
    }).setDepth(9003);
    // бабочки
    for (const [cx, cy] of [[12 * T, 13 * T], [20 * T, 16 * T], [30 * T, 15 * T]]) {
      const b = add.sprite(cx, cy, 'butterfly', 0).setDepth(8000).setTint([0xffffff, 0xf2c230, 0xf2a7b8][this.butterflies.length]);
      this.butterflies.push({ s: b, cx, cy, ph: Math.random() * 10 });
    }
    // кошка Моти
    this.mochi = add.sprite(LAYOUT.doorHouse[0] + 30, LAYOUT.doorHouse[1] + 12, 'mochi-walk', 2).setOrigin(0.5, 1).setScale(0.5);
    this.mochiNext();
    // рыбак (бывает у пруда после обеда)
    // рыбак сидит на берегу лицом к воде, удочка — линия с поплавком
    const [fx, fy] = LAYOUT.fisher;
    this.fisher = add.sprite(fx + 2, fy + 6, 'fisher').setOrigin(0.7, 1).setScale(0.5).setDepth(fy + 6).setVisible(false);
    sc.tweens.add({ targets: this.fisher, scaleY: 0.505, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // автобус
    this.bus = add.sprite(MAPW + 40, LAYOUT.road + 10, 'bus-hd', 0).setOrigin(0.5, 1).setScale(0.5).setDepth(LAYOUT.road + 12).setVisible(false);
    this.apply(true);
  }

  // ---------- Моти ----------
  private mochiNext() {
    const h = hourNow();
    if (h >= 21 || h < 6.5) {   // ночью спит у крыльца
      this.walkMochi(LAYOUT.doorHouse[0] + 26, LAYOUT.doorHouse[1] + 8, () => { this.mochi.setFrame(3); this.sc.time.delayedCall(8000, () => this.mochiNext()); });
      return;
    }
    const spots = [[8, 11], [14, 12], [12, 10], [24, 11], [26, 14], [28, 18], [30, 21], [13, 20], [11, 23], [22, 22], [32, 10], [17, 9], [10, 14]];
    const [tx, ty] = spots[Math.floor(Math.random() * spots.length)];
    this.walkMochi(tx * T + 8, ty * T + 10, () => {
      this.mochi.setFrame(2);
      this.sc.time.delayedCall(2500 + Math.random() * 4500, () => this.mochiNext());
    });
  }
  private walkMochi(x: number, y: number, done: () => void) {
    this.mochiAnim?.remove();
    const d = Math.hypot(x - this.mochi.x, y - this.mochi.y);
    this.mochi.setFlipX(x > this.mochi.x);   // кадры смотрят влево
    this.mochiAnim = this.sc.time.addEvent({ delay: 180, loop: true, callback: () => this.mochi.setFrame(this.mochi.frame.name === '0' ? 1 : 0) });
    this.sc.tweens.add({ targets: this.mochi, x, y, duration: (d / 22) * 1000, onComplete: () => { this.mochiAnim?.remove(); done(); } });
  }
  nearMochi(x: number, y: number) { return Math.hypot(this.mochi.x - x, this.mochi.y - y) < 16; }
  petMochi(): string {
    const d = game.data;
    sound.play('meow');
    this.sc.tweens.killTweensOf(this.mochi); this.mochiAnim?.remove();
    this.mochi.setFrame(2);
    const heart = this.sc.add.text(this.mochi.x, this.mochi.y - 16, '♥', { fontSize: '10px', color: '#ff4f9a' }).setOrigin(0.5).setDepth(9500).setResolution(4);
    this.sc.tweens.add({ targets: heart, y: heart.y - 12, alpha: 0, duration: 1200, onComplete: () => heart.destroy() });
    this.sc.time.delayedCall(2500, () => this.mochiNext());
    if (d.mochiDay === d.totalDays) return 'Моти мурчит и трётся о сапоги.';
    d.mochiDay = d.totalDays;
    const r = Math.random();
    if (r < 0.5) { const c = 5 + Math.floor(Math.random() * 8); d.coins += c; return `Моти принесла монетку! +${c} монет.`; }
    if (r < 0.8) { d.fungicide++; return 'Моти притащила бутылочку фунгицида из лавки. Огава, кажется, не против. +1 фунгицид.'; }
    d.reputation = Math.min(100, d.reputation + 3); return 'Моти принесла четырёхлистный клевер. На удачу! +3 репутации.';
  }

  // ---------- следы ----------
  footstep() {
    const st = this.sc.add.image(this.aoi.x + (Math.random() - 0.5) * 2, this.aoi.y - 1, 'step').setDepth(-3).setAlpha(game.data.rain ? 0.7 : 0.45);
    this.steps.push(st);
    this.sc.tweens.add({ targets: st, alpha: 0, duration: 2600, delay: 600, onComplete: () => { st.destroy(); this.steps.splice(this.steps.indexOf(st), 1); } });
  }

  // ---------- каждый кадр ----------
  update(dt: number, moving: boolean) {
    const h = hourNow();
    if (moving) game.addMinutes((dt / 1000) * 2); else game.addMinutes((dt / 1000) * 1.5);   // 1 игровая минута ≈ 0,5–0,7 с
    const ten = Math.floor(game.data.minutes / 10);
    if (ten !== this.lastTenMin) { this.lastTenMin = ten; this.apply(); events.emit('stats'); }
    if (game.data.minutes >= 24 * 60 && !this.midnightSent) { this.midnightSent = true; events.emit('midnight'); }
    if (game.data.minutes < 23 * 60) this.midnightSent = false;
    this.shadow.setPosition(this.aoi.x, this.aoi.y - 1).setDepth(this.aoi.depth - 1);
    this.mochi.setDepth(this.mochi.y);
    // бабочки — днём, весной и летом
    const showB = h > 8 && h < 18 && !game.data.rain && game.data.season < 3;
    for (const b of this.butterflies) {
      b.s.setVisible(showB);
      if (!showB) continue;
      b.ph += dt / 1000;
      b.s.setPosition(b.cx + Math.sin(b.ph * 0.7) * 26 + Math.sin(b.ph * 2.3) * 6, b.cy + Math.cos(b.ph * 0.9) * 14 + Math.sin(b.ph * 5) * 2);
      b.s.setFrame(Math.floor(b.ph * 8) % 2);
    }
    // автобус: 7:40 и 18:20
    for (const [key, t] of [['m', 7 * 60 + 40], ['e', 18 * 60 + 20]] as [string, number][]) {
      const k = `${game.data.totalDays}${key}`;
      if (game.data.minutes >= t && game.data.minutes < t + 30 && !this.busDone.has(k)) { this.busDone.add(k); this.runBus(); }
    }
  }

  runBus() {
    const b = this.bus.setVisible(true).setAlpha(1).setPosition(MAPW + 40, LAYOUT.road + 10).setFlipX(true);
    const wheels = this.sc.time.addEvent({ delay: 120, loop: true, callback: () => b.setFrame(b.frame.name === '0' ? 1 : 0) });
    this.sc.tweens.add({ targets: b, x: LAYOUT.busstop[0] + 16, duration: 3200, ease: 'Quad.out', onComplete: () => {
      wheels.paused = true; sound.play('bus');
      this.sc.time.delayedCall(3500, () => {
        wheels.paused = false;
        this.sc.tweens.add({ targets: b, x: -60, duration: 6200, ease: 'Quad.in', onComplete: () => this.sc.tweens.add({ targets: b, alpha: 0, duration: 400, onComplete: () => { wheels.remove(); b.setVisible(false); } }) });
      });
    } });
  }

  /** Освещение, огни, погода — по текущему часу. */
  apply(_first = false) {
    const h = hourNow(), d = game.data;
    let col = lightAt(h);
    if (d.rain) col = mix(col, mix(col, 0x8c9cb8, 1), 0.45);
    this.overlay.setFillStyle(col);
    const dark = h < 7 ? (7 - h) : h > 18 ? Math.min(1, (h - 18) / 2.2) : 0;
    const lamp = Math.min(1, dark + (d.rain ? 0.35 : 0));
    this.lights.forEach((l) => l.img.setAlpha(lamp * 0.9 * l.base));
    this.fireflies.emitting = h > 19.5 && !d.rain && d.season < 3;
    this.rain.emitting = d.rain;
    this.puddles.forEach((p) => p.setVisible(d.rain));
    const fogA = h < 9 ? (9 - h) / 3 * (d.season === 3 ? 0.9 : 0.6) : d.rain ? 0.25 : 0;
    this.fog.forEach((f) => f.setAlpha(Math.min(0.9, fogA)));
    if (this.season) this.season.emitting = !d.rain;
    const fish = h >= 15 && h < 20.5 && !d.rain;
    this.fisher.setVisible(fish);
    sound.setAmbient({ rain: d.rain, night: h > 20 || h < 5.5, morning: h > 6 && h < 9 && !d.rain });
  }
}
