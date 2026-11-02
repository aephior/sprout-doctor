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
const LIGHT: [number, number][] = [[6, 0xb0a0cc], [7.5, 0xf2e2e8], [9, 0xffffff], [16, 0xffffff], [18, 0xffd0a0], [19.5, 0xc8889a], [20.5, 0x6a6aa8], [21.5, 0x46467c], [24, 0x34345e]];
function lightAt(h: number) {
  for (let i = 1; i < LIGHT.length; i++) if (h <= LIGHT[i][0]) {
    const [h0, c0] = LIGHT[i - 1], [h1, c1] = LIGHT[i];
    return mix(c0, c1, (h - h0) / (h1 - h0));
  }
  return LIGHT[LIGHT.length - 1][1];
}

export const hourNow = () => game.data.minutes / 60;
export const clockText = () => { const m = Math.floor(game.data.minutes); return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

/** Персонаж, гуляющий по точкам: идёт «буквой Г» (сначала по горизонтали, потом по вертикали) — анимация всегда совпадает с направлением. */
export class Walker {
  busy = false;
  constructor(private sc: Phaser.Scene, public s: Phaser.GameObjects.Sprite, private anim: string, private speed = 22) {}
  private leg(x: number, y: number, done: () => void) {
    const dx = x - this.s.x, dy = y - this.s.y, d = Math.abs(dx) + Math.abs(dy);
    if (d < 1) { done(); return; }
    const dir = Math.abs(dx) > 0.5 ? (dx < 0 ? 'left' : 'right') : (dy < 0 ? 'up' : 'down');
    this.s.anims.play(`${this.anim}-${dir}`, true);
    this.sc.tweens.add({ targets: this.s, x, y, duration: (d / this.speed) * 1000, onComplete: done });
  }
  go(x: number, y: number, done: () => void) {
    this.busy = true;
    this.sc.tweens.killTweensOf(this.s);
    this.leg(x, this.s.y, () => this.leg(x, y, () => { this.busy = false; this.s.anims.stop(); done(); }));
  }
  stop() { this.sc.tweens.killTweensOf(this.s); this.s.anims.stop(); this.busy = false; }
}

const VILLAGERS: { key: string; name: string; route: [number, number][]; lines: string[] }[] = [
  { key: 'villager16-na', name: 'Юки', route: [[10, 8], [15, 8], [15, 20], [22, 20], [15, 20]],
    lines: ['Юки: «Ты внучка Хару? Она угощала нас томатами каждое лето!»', 'Юки: «Если листья желтеют снизу — это не всегда болезнь. Бабушка так говорила».', 'Юки: «На фестивале будет конкурс на лучший урожай. Я болею за тебя!»'] },
  { key: 'villager2-na', name: 'Кэндзи', route: [[29, 20], [15, 20], [15, 6], [27, 6]],
    lines: ['Кэндзи: «Автобус в город — в 7:40 и 18:20. Не опаздывай».', 'Кэндзи: «Старая теплица за лесом… Говорят, оттуда и летят споры».', 'Кэндзи: «Огава опять поднял цены на фунгицид? Шучу, шучу».'] },
  { key: 'villager25-na', name: 'Хина', route: [[5, 17], [5, 19], [12, 20], [7, 20]],
    lines: ['Хина: «А это правда, что твой фонарик умеет смотреть сквозь листья?»', 'Хина: «Я видела, как Моти ловила бабочку!»'] },
];

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
  rod!: Phaser.GameObjects.Graphics;
  ogawa!: Phaser.GameObjects.Sprite;
  cat!: Walker;
  people: { w: Walker; def: typeof VILLAGERS[number]; i: number; talk: number }[] = [];
  bus: Phaser.GameObjects.Sprite;
  busDone = new Set<string>();
  private lastTenMin = -1;
  private midnightSent = false;

  constructor(private sc: Phaser.Scene, private aoi: Phaser.GameObjects.Sprite) {
    registerWorldExtras(sc); makeGlow(sc);
    const add = sc.add;
    // лужи (видны в дождь)
    for (const [x, y] of [[8, 8], [13, 9], [27, 8], [19, 17], [11, 19], [26, 20], [6, 16]]) this.puddles.push(add.image(x * T + 2, y * T + 6, 'puddle').setOrigin(0).setDepth(-4).setVisible(false));
    // тень под Аой
    this.shadow = add.image(aoi.x, aoi.y, 'shadow').setAlpha(0.3);

    // освещение: прямоугольник-множитель поверх мира, огни — над ним (сложение)
    this.overlay = add.rectangle(0, 0, MAPW, MAPH, 0xffffff).setOrigin(0).setDepth(9000).setBlendMode(Phaser.BlendModes.MULTIPLY);
    const light = (x: number, y: number, scale: number, tint: number, base = 1) => {
      const img = add.image(x, y, 'glow').setScale(scale).setTint(tint).setBlendMode(Phaser.BlendModes.ADD).setDepth(9001).setAlpha(0);
      this.lights.push({ img, base });
    };
    const [hx, hy] = LAYOUT.doorHouse, [sx, sy] = LAYOUT.doorShop;
    light(hx - 20, hy - 18, 0.4, 0xffd27a); light(hx + 20, hy - 18, 0.4, 0xffd27a);      // окна дома
    light(hx, hy - 6, 0.5, 0xffb070);                                                     // дверь дома
    light(sx, sy - 10, 0.55, 0xffb070); light(sx - 22, sy - 22, 0.4, 0xffd27a);         // лавка
    light(LAYOUT.vending[0] + 8, LAYOUT.vending[1] + 10, 0.35, 0x3fd0c9, 0.8);           // торговый автомат
    for (const o of LAYOUT.objs) if (o.key === 'lantern') light(o.x + 8, o.y + 4, 0.45, 0xffe0a0);   // каменные фонари у тории
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
    // сезонные частицы: весной лепестки сакуры, летом — ничего, осенью листья; пересоздаются при смене сезона
    this.seasonFx();
    const onSeason = () => { this.seasonFx(); this.apply(); };
    events.on('season', onSeason);
    sc.events.once('shutdown', () => events.off('season', onSeason));
    // бабочки
    for (const [cx, cy] of [[12 * T, 9 * T], [22 * T, 11 * T], [9 * T, 17 * T]]) {
      const b = add.sprite(cx, cy, 'butterfly', 0).setDepth(8000).setTint([0xffffff, 0xf2c230, 0xf2a7b8][this.butterflies.length]);
      this.butterflies.push({ s: b, cx, cy, ph: Math.random() * 10 });
    }
    // кошка Моти
    this.mochi = add.sprite(LAYOUT.doorHouse[0] + 24, LAYOUT.doorHouse[1] + 12, 'mochi-na', 8).setOrigin(0.5, 1);
    this.cat = new Walker(sc, this.mochi, 'mochi', 24);
    this.mochiNext();
    // жители деревни гуляют по своим маршрутам
    for (const def of VILLAGERS) {
      const [tx, ty] = def.route[0];
      const s = add.sprite(tx * T + 8, ty * T + 12, def.key, 0).setOrigin(0.5, 1);
      const w = new Walker(sc, s, def.key, 20);
      const p = { w, def, i: 0, talk: 0 };
      this.people.push(p);
      sc.time.delayedCall(800 + Math.random() * 3000, () => this.walkOn(p));
    }
    // Огава днём стоит у лавки и поглядывает по сторонам
    this.ogawa = add.sprite(LAYOUT.doorShop[0] + 22, LAYOUT.doorShop[1] + 14, 'ogawa-na', 0).setOrigin(0.5, 1).setDepth(LAYOUT.doorShop[1] + 14);
    sc.time.addEvent({ delay: 2600, loop: true, callback: () => this.ogawa.setFrame([0, 0, 2, 3][Math.floor(Math.random() * 4)]) });
    // рыбак у пруда (после обеда): смотрит на воду, удочка — линия с поплавком
    const [fx, fy] = LAYOUT.fisher;
    this.fisher = add.sprite(fx, fy, 'fisher-na', 2).setOrigin(0.5, 1).setDepth(fy).setVisible(false);
    this.rod = add.graphics().setDepth(fy + 1);
    // автобус
    this.bus = add.sprite(MAPW + 40, LAYOUT.road + 10, 'bus-px', 0).setOrigin(0.5, 1).setDepth(LAYOUT.road + 12).setVisible(false);
    this.apply(true);
  }

  seasonFx() {
    this.season?.destroy(); this.season = null;
    const s = game.data.season;
    if (s === 2) return;
    this.season = this.sc.add.particles(0, 0, s === 1 ? 'petal' : 'leaf-fall', {
      x: { min: 0, max: MAPW }, y: -6, lifespan: 9000, speedY: { min: 10, max: 18 }, speedX: { min: 4, max: 14 }, rotate: { min: 0, max: 360 },
      frequency: s === 1 ? 700 : 500, quantity: 1,
    }).setDepth(8990);   // под слоем освещения: ночью лепестки темнеют вместе с миром
  }

  // ---------- Моти ----------
  private mochiNext() {
    if (!this.mochi.active) return;
    const h = hourNow();
    if (h >= 21 || h < 6.5) {   // ночью спит у крыльца
      this.cat.go(LAYOUT.doorHouse[0] + 24, LAYOUT.doorHouse[1] + 12, () => { this.mochi.setFrame(9); this.sc.time.delayedCall(8000, () => this.mochiNext()); });
      return;
    }
    const spots = [[9, 7], [13, 8], [16, 6], [19, 6], [27, 15], [16, 18], [6, 16], [9, 14], [12, 12], [20, 18], [25, 6]];
    const [tx, ty] = spots[Math.floor(Math.random() * spots.length)];
    this.cat.go(tx * T + 8, ty * T + 10, () => {
      this.mochi.setFrame(Math.random() < 0.3 ? 9 : 8);
      this.sc.time.delayedCall(2500 + Math.random() * 4500, () => this.mochiNext());
    });
  }
  private walkOn(p: { w: Walker; def: typeof VILLAGERS[number]; i: number; talk: number }) {
    if (!p.w.s.active) return;
    if (p.talk > this.sc.time.now) { this.sc.time.delayedCall(1000, () => this.walkOn(p)); return; }
    p.i = (p.i + 1) % p.def.route.length;
    const [tx, ty] = p.def.route[p.i];
    p.w.go(tx * T + 8, ty * T + 12, () => { p.w.s.setFrame(0); this.sc.time.delayedCall(1500 + Math.random() * 3500, () => this.walkOn(p)); });
  }
  nearVillager(x: number, y: number): string | null {
    const p = this.people.find((q) => q.w.s.visible && Math.hypot(q.w.s.x - x, q.w.s.y - y) < 16);
    return p ? p.def.key : null;
  }
  talkVillager(key: string): string {
    const p = this.people.find((q) => q.def.key === key)!;
    p.w.stop(); p.talk = this.sc.time.now + 4000;
    const dx = this.aoi.x - p.w.s.x, dy = this.aoi.y - p.w.s.y;      // повернуться к Аой
    p.w.s.setFrame(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0));
    this.sc.time.delayedCall(4000, () => this.walkOn(p));
    return p.def.lines[Math.floor(Math.random() * p.def.lines.length)];
  }
  /** Точки, сквозь которые Аой не проходит (жители, Огава, рыбак). */
  blockers(): { x: number; y: number }[] {
    const r = this.people.filter((p) => p.w.s.visible).map((p) => ({ x: p.w.s.x, y: p.w.s.y }));
    if (this.ogawa.visible) r.push({ x: this.ogawa.x, y: this.ogawa.y });
    if (this.fisher.visible) r.push({ x: this.fisher.x, y: this.fisher.y });
    return r;
  }
  nearMochi(x: number, y: number) { return Math.hypot(this.mochi.x - x, this.mochi.y - y) < 16; }
  petMochi(): string {
    const d = game.data;
    sound.play('meow');
    this.cat.stop();
    this.mochi.setFrame(8);
    const heart = this.sc.add.image(this.mochi.x, this.mochi.y - 16, 'heart-px').setDepth(9500);
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
    for (const p of this.people) {
      p.w.s.setDepth(p.w.s.y);
      // жители не проходят сквозь Аой: останавливаются, пока она рядом
      const close = Math.hypot(p.w.s.x - this.aoi.x, p.w.s.y - this.aoi.y) < 13;
      for (const tw of this.sc.tweens.getTweensOf(p.w.s)) { if (close && tw.isPlaying()) { tw.pause(); p.w.s.anims.pause(); } else if (!close && tw.isPaused()) { tw.resume(); p.w.s.anims.resume(); } }
    }
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
    // яркость огней — по тому, насколько темно на самом деле (иначе на рассвете фасады «пересвечены»)
    const lum = (((col >> 16) & 255) * 0.3 + ((col >> 8) & 255) * 0.59 + (col & 255) * 0.11) / 255;
    const lamp = Math.min(1, Math.max(0, (0.92 - lum) * 1.7) + (d.rain ? 0.25 : 0));
    this.lights.forEach((l) => l.img.setAlpha(lamp * 0.9 * l.base));
    this.fireflies.emitting = h > 19.5 && !d.rain && d.season < 3;
    this.rain.emitting = d.rain;
    this.puddles.forEach((p) => p.setVisible(d.rain));
    const fogA = h < 9 ? (9 - h) / 3 * (d.season === 3 ? 0.9 : 0.6) : d.rain ? 0.25 : 0;
    this.fog.forEach((f) => f.setAlpha(Math.min(0.9, fogA)));
    if (this.season) this.season.emitting = !d.rain;
    const fish = h >= 15 && h < 20.5 && !d.rain;
    this.fisher.setVisible(fish);
    this.ogawa.setVisible(h >= 8 && h < 19 && !d.rain);
    for (const p of this.people) p.w.s.setVisible(h >= 7 && h < 20 && !d.rain);
    this.rod.clear();
    if (fish) {   // удочка над водой и поплавок
      const x0 = this.fisher.x - 5, y0 = this.fisher.y - 9;
      // удочка и леска — пиксельными отрезками (без субпиксельных линий)
      const px = (xa: number, ya: number, xb: number, yb: number, col: number) => {
        const n = Math.max(Math.abs(xb - xa), Math.abs(yb - ya));
        this.rod.fillStyle(col, 1);
        for (let i = 0; i <= n; i++) this.rod.fillRect(Math.round(xa + (xb - xa) * i / n), Math.round(ya + (yb - ya) * i / n), 1, 1);
      };
      px(x0, y0, x0 - 14, y0 - 10, 0x6a4329);
      px(x0 - 14, y0 - 10, x0 - 20, y0 + 8, 0xd8ccb0);
      this.rod.fillStyle(0xd63a3a, 1).fillRect(x0 - 21, y0 + 7, 2, 2).fillStyle(0xffffff, 1).fillRect(x0 - 21, y0 + 7, 2, 1);
    }
    sound.setAmbient({ rain: d.rain, night: h > 20 || h < 5.5, morning: h > 6 && h < 9 && !d.rain });
  }
}
