// Дом бабушки Хару — комната сверху, нарисованная попиксельно в стиле фермы (tools/art/home_px.py, 320×176 ×3).
// Аой ходит (WASD/стрелки) и осматривает вещи (E): футон — сон и итоги ночи; полка — дневник; зарядка — Фуку;
// лежанка — Моти; фото, окно, кухня, котацу; дверь внизу — во двор.
import { game } from '../state/game';
import { events } from '../state/events';
import { makeGlow } from '../art/interiors';
import { text, HEX, paperPanel } from '../ui/ui';
import { sound } from '../audio/sound';
import { isHealthy, CROP_NAME } from '../data/diseases';
import { hourNow } from '../world/life';

const S = 3, OY = 6;                                   // масштаб и отступ сверху (комната 960×528)
const P = (x: number, y: number) => ({ x: x * S, y: y * S + OY });
const SOLIDS: [number, number, number, number][] = [
  [0, 0, 320, 52], [0, 0, 6, 176], [313, 0, 7, 176], [0, 167, 144, 9], [176, 167, 144, 9],   // стены (кромка верхней — по плинтусу)
  [10, 40, 72, 17], [198, 36, 42, 21], [244, 40, 70, 18],                                  // шкафы/стол/док, комод с алтарём, кухня
  [262, 90, 40, 62], [301, 88, 11, 15], [301, 145, 11, 15], [136, 93, 48, 15],             // футон, андоны, столик
  [14, 98, 35, 21], [22, 124, 15, 9], [16, 152, 35, 15], [294, 152, 16, 15],                // лежанка, миска, горшки, бонсай
];
type Spot = { key: string; x: number; y: number; hint: string };
const SP = (key: string, x: number, y: number, hint: string): Spot => ({ key, ...P(x, y), hint });
const SPOTS: Spot[] = [
  SP('futon', 254, 122, 'E — лечь спать'), SP('diary', 57, 70, 'E — дневник бабушки Хару'), SP('fuku', 72, 70, 'E — поговорить с Фуку'),
  SP('photo', 214, 70, 'E — фотография'), SP('window', 144, 60, 'E — посмотреть в окно'), SP('tea', 278, 72, 'E — заварить чай'),
  SP('kotatsu', 160, 124, 'E — посидеть у котацу'), SP('mochi', 56, 110, 'E — погладить Моти'), SP('door', 160, 160, 'E — выйти во двор'),
];

export class Home extends Phaser.Scene {
  aoi!: Phaser.Physics.Arcade.Sprite;
  shadow!: Phaser.GameObjects.Ellipse;
  fuku!: Phaser.GameObjects.Sprite;
  mochi!: Phaser.GameObjects.Sprite;
  roomNight!: Phaser.GameObjects.Image;
  kotNight!: Phaser.GameObjects.Image;
  futonSleep!: Phaser.GameObjects.Image;
  lamps: Phaser.GameObjects.Image[] = [];
  shade!: Phaser.GameObjects.Rectangle;
  ui!: Phaser.GameObjects.Container;
  hint!: Phaser.GameObjects.Text;
  hintBg!: Phaser.GameObjects.Graphics;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  facing: 'down' | 'up' | 'left' | 'right' = 'up';
  near: Spot | null = null;
  state: 'walk' | 'menu' | 'sleeping' | 'morning' = 'walk';
  notes: string[] = [];
  zs: Phaser.GameObjects.Text[] = [];
  auto = false;
  early = false;
  teaDay = -1;
  photoDay = -1;
  leaving = false;

  constructor() { super('Home'); }

  init(data: { auto?: boolean; early?: boolean }) { this.auto = !!data?.auto; this.early = !!data?.early; }

  create() {
    makeGlow(this);
    this.state = 'walk'; this.notes = []; this.zs = []; this.lamps = []; this.near = null; this.leaving = false;
    sound.setMood('evening');
    const night = !this.early;
    this.add.rectangle(0, 0, 960, 540, 0x1e1218).setOrigin(0);
    this.add.image(0, OY, 'home-px-day').setOrigin(0).setScale(S);
    this.roomNight = this.add.image(0, OY, 'home-px-night').setOrigin(0).setScale(S).setAlpha(night ? 1 : 0);
    // свет вечером: две лампы-андон у футона, тёплое пятно над котацу, лунный свет из окна
    for (const [x, y, s, c] of [[306, 94, 1.3, 0xffc878], [306, 150, 1.3, 0xffc878], [160, 104, 3.0, 0xffb060], [144, 40, 1.8, 0x9fb8ff]] as [number, number, number, number][]) {
      const p = P(x, y);
      const g = this.add.image(p.x, p.y, 'glow').setScale(s).setBlendMode(Phaser.BlendModes.ADD).setTint(c).setAlpha(night ? 0.42 : 0);
      this.tweens.add({ targets: g, scale: s * 0.94, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.lamps.push(g);
    }
    // футон со спящей Аой — ночью поверх футона
    const fp = P(262, 90);
    this.futonSleep = this.add.image(fp.x, fp.y, 'home-px-sleep').setOrigin(0).setScale(S).setAlpha(0).setDepth(fp.y + 1);
    // котацу — отдельным спрайтом: за ним можно пройти
    const kp = P(136, 92);
    this.add.image(kp.x, kp.y, 'home-px-kot-day').setOrigin(0).setScale(S).setDepth(kp.y + 16 * S);
    this.kotNight = this.add.image(kp.x, kp.y, 'home-px-kot-night').setOrigin(0).setScale(S).setDepth(kp.y + 16 * S + 1).setAlpha(night ? 1 : 0);
    const steam = P(160, 94);
    this.add.particles(steam.x, steam.y, 'pixel', { speedY: { min: -14, max: -8 }, speedX: { min: -3, max: 3 }, lifespan: 1400, frequency: 280,
      scale: { start: 3, end: 1 }, alpha: { start: 0.5, end: 0 }, tint: 0xffffff }).setDepth(kp.y + 200);

    // физика: стены и мебель
    const solids = this.physics.add.staticGroup();
    for (const [x, y, w, h] of SOLIDS) { const p = P(x, y); solids.add(this.add.rectangle(p.x, p.y, w * S, h * S).setOrigin(0).setVisible(false)); }
    // Фуку сидит на зарядке (подставка у полки), Моти спит на лежанке — спрайты фермы ×3
    const fk = P(71, 54);
    this.fuku = this.add.sprite(fk.x, fk.y, 'fuku-na', 0).setOrigin(0.5, 1).setScale(S).play('fukuna-idle').setDepth(fk.y);
    const mp = P(31, 117);
    this.mochi = this.add.sprite(mp.x, mp.y, 'mochi-na', 9).setOrigin(0.5, 1).setScale(S).setDepth(mp.y);
    // Аой — спрайт фермы ×3
    const start = this.auto ? P(250, 128) : P(160, 150);
    this.aoi = this.physics.add.sprite(start.x, start.y, 'aoi-na', 1).setOrigin(0.5, 1).setScale(S);
    (this.aoi.body as Phaser.Physics.Arcade.Body).setSize(10, 4).setOffset(3, 16);
    this.physics.add.collider(this.aoi, solids);
    this.shadow = this.add.ellipse(0, 0, 30, 8, 0x000000, 0.25);

    this.shade = this.add.rectangle(0, 0, 960, 540, 0x141432, 0).setOrigin(0).setDepth(2000);
    this.hintBg = this.add.graphics().setDepth(2050);
    this.hint = text(this, 480, 516, '', 17, HEX.paper, { stroke: HEX.ink, strokeThickness: 4 }).setOrigin(0.5).setDepth(2051);
    this.ui = this.add.container(0, 0).setDepth(3000);

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT') as Record<string, Phaser.Input.Keyboard.Key>;
    kb.on('keydown', (e: KeyboardEvent) => this.key(e));
    this.cameras.main.fadeIn(500, 0, 0, 0);
    if (this.auto) this.time.delayedCall(700, () => { this.toast('Уже полночь — глаза слипаются.'); this.time.delayedCall(900, () => this.sleep()); });
    else if (this.early) this.toast('Ещё светло. Можно вздремнуть на футоне — но тогда день закончится.');
    events.on('diary-closed', this.diaryClosed, this);
    this.events.once('shutdown', () => events.off('diary-closed', this.diaryClosed, this));
  }

  diaryClosed() { this.input.keyboard!.enabled = true; this.state = 'walk'; }

  key(e: KeyboardEvent) {
    const isE = e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У';
    if (this.state === 'walk') {
      if (isE || e.key === 'Enter') { if (this.near) this.use(this.near.key); }
      else if (e.key === 'Escape' && !this.auto) this.leave(false);
    } else if (this.state === 'menu') {
      if (e.key === '1' || e.key === 'Enter') this.sleep();
      else if (e.key === 'Escape' || e.key === '2') { this.ui.removeAll(true); this.state = 'walk'; }
    } else if (this.state === 'morning' && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || isE)) this.leave(true);
  }

  update() {
    this.shadow.setPosition(this.aoi.x, this.aoi.y - 2).setDepth(this.aoi.y - 1).setVisible(this.aoi.alpha > 0.5);
    this.aoi.setDepth(this.aoi.y);
    if (this.state !== 'walk') { this.aoi.setVelocity(0); this.aoi.anims.stop(); this.setHint(''); return; }
    const k = this.keys;
    const vx = (k.A.isDown || k.LEFT.isDown ? -1 : 0) + (k.D.isDown || k.RIGHT.isDown ? 1 : 0);
    const vy = (k.W.isDown || k.UP.isDown ? -1 : 0) + (k.S.isDown || k.DOWN.isDown ? 1 : 0);
    const sp = 200, n = vx && vy ? Math.SQRT1_2 : 1;
    this.aoi.setVelocity(vx * sp * n, vy * sp * n);
    if (vx || vy) {
      this.facing = vx ? (vx < 0 ? 'left' : 'right') : vy < 0 ? 'up' : 'down';
      this.aoi.anims.play('aoi-na-' + this.facing, true);
    } else { this.aoi.anims.stop(); this.aoi.setFrame({ down: 0, up: 1, left: 2, right: 3 }[this.facing]); }
    let best: Spot | null = null, bd = 52;
    for (const s of SPOTS) { const dd = Math.hypot(s.x - this.aoi.x, s.y - this.aoi.y); if (dd < bd) { bd = dd; best = s; } }
    this.near = best;
    this.setHint(best ? best.hint : '');
    // дошла до порога — выходит во двор
    if (this.aoi.y > OY + 170 * S && !this.auto) this.leave(false);
  }

  setHint(s: string) {
    if (this.hint.text === s) return;
    this.hint.setText(s); this.hintBg.clear();
    if (s) { const w = this.hint.width + 28; this.hintBg.fillStyle(0x1e1b2e, 0.8).fillRoundedRect(480 - w / 2, 501, w, 30, 8); }
  }

  /** Реплика в рамке сверху (исчезает сама). */
  toast(s: string, ms = 3600) {
    this.ui.removeAll(true);
    const t = text(this, 480, 30, s, 15, HEX.ink, { wordWrap: { width: 560 }, align: 'center', lineSpacing: 3 }).setOrigin(0.5, 0);
    this.ui.add([paperPanel(this, 480 - 300, 18, 600, t.height + 24), t]);
    this.ui.setAlpha(0); this.tweens.add({ targets: this.ui, alpha: 1, duration: 200 });
    this.time.delayedCall(ms, () => { if (this.state === 'walk') this.tweens.add({ targets: this.ui, alpha: 0, duration: 300 }); });
  }

  use(key: string) {
    const d = game.data;
    if (key === 'futon') {
      this.state = 'menu';
      this.ui.removeAll(true);
      const t = text(this, 480, 34, this.early ? 'Ещё светло. Вздремнуть до утра? День закончится.' : 'Футон пахнет солнцем. Лечь спать?', 16, HEX.ink, { align: 'center' }).setOrigin(0.5, 0);
      const o1 = text(this, 400, 66, '[1] Спать', 17, '#c8323c').setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.sleep());
      const o2 = text(this, 560, 66, '[Esc] Не сейчас', 17, '#c8323c').setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.ui.removeAll(true); this.state = 'walk'; });
      this.ui.add([paperPanel(this, 200, 20, 560, 82), t, o1, o2]);
    } else if (key === 'diary') {
      this.state = 'menu'; this.ui.removeAll(true);
      this.input.keyboard!.enabled = false;
      this.scene.launch('Diary', { returnTo: 'Home' });
    } else if (key === 'fuku') {
      const first = d.beds.find((b) => b.crop && !b.dead && !isHealthy(game.cls(b)));
      this.tweens.add({ targets: this.fuku, y: this.fuku.y - 9, duration: 160, yoyo: true });
      this.toast(first ? `Фуку: «Заряд ${d.fukuCharge}/${d.fukuMax}. Завтра начнём с грядки ${first.id + 1} (${CROP_NAME[first.crop!]}) — там споры».` : `Фуку: «Заряд ${d.fukuCharge}/${d.fukuMax}. Все грядки здоровы — можно отдохнуть!»`);
    } else if (key === 'photo') {
      if (this.photoDay !== d.totalDays) { this.photoDay = d.totalDays; d.reputation = Math.min(100, d.reputation + 1); }
      this.toast('Бабушка Хару и дедушка у этой самой теплицы. «Растение говорит листьями — надо только уметь слушать».');
    } else if (key === 'window') {
      this.toast(`${d.rain ? 'За окном шуршит дождь.' : hourNow() >= 18 || hourNow() < 6 ? 'За окном луна и сакура.' : 'За окном светло, ветер качает сакуру.'} Влажность ${d.weather.humidity}% — ${d.weather.humidity > 70 ? 'плесень такое любит, завтра будь внимательна.' : 'спокойная погода.'}`);
    } else if (key === 'tea') {
      sound.play('water');
      if (this.teaDay !== d.totalDays) { this.teaDay = d.totalDays; this.toast('Аой заваривает чай, как учила бабушка. Тепло и спокойно.'); }
      else this.toast('Чай уже заварен — на котацу ещё тёплый чайник.');
    } else if (key === 'kotatsu') {
      this.toast('Под котацу тепло. Чашка в ладонях, тикают часы…');
    } else if (key === 'mochi') {
      sound.play('meow');
      this.mochi.setFrame(8);
      const h = this.add.image(this.mochi.x, this.mochi.y - 50, 'heart-px').setScale(3).setDepth(2050);
      this.tweens.add({ targets: h, y: h.y - 24, alpha: 0, duration: 1000, onComplete: () => h.destroy() });
      this.time.delayedCall(2200, () => this.mochi.setFrame(9));
      this.toast('Моти мурчит и тычется лбом в ладонь.');
    } else if (key === 'door') this.leave(false);
  }

  sleep() {
    if (this.state === 'sleeping' || this.state === 'morning') return;
    this.state = 'sleeping';
    this.ui.removeAll(true); this.setHint('');
    sound.play('night');
    this.tweens.add({ targets: this.aoi, alpha: 0, duration: 450 });
    this.tweens.add({ targets: this.futonSleep, alpha: 1, duration: 700, delay: 250 });
    this.time.delayedCall(700, () => {
      this.tweens.add({ targets: [this.roomNight, this.kotNight], alpha: 1, duration: 1400 });
      this.lamps.forEach((l) => { this.tweens.killTweensOf(l); this.tweens.add({ targets: l, alpha: 0, duration: 1600 }); });
      this.tweens.add({ targets: this.shade, fillAlpha: 0.45, duration: 1800 });
      this.mochi.setFrame(9); this.fuku.anims.stop(); this.fuku.setFrame(0);
    });
    const zp = P(282, 92);
    this.time.delayedCall(1800, () => {
      for (let i = 0; i < 6; i++) this.time.delayedCall(i * 650, () => {
        if (this.state !== 'sleeping') return;
        const z = text(this, zp.x - 8 + (i % 3) * 7, zp.y, 'z', 16 + (i % 3) * 5, HEX.paper, { stroke: HEX.ink, strokeThickness: 3 }).setDepth(2010);
        this.zs.push(z);
        this.tweens.add({ targets: z, y: z.y - 70, x: z.x + 22, alpha: 0, duration: 2200 });
      });
      sound.setMood('off');
    });
    this.time.delayedCall(5600, () => { this.notes = game.endDay(); events.emit('refresh-beds'); this.morning(); });
  }

  morning() {
    this.state = 'morning';
    this.zs.forEach((z) => z.active && this.tweens.add({ targets: z, alpha: 0, duration: 300, onComplete: () => z.destroy() })); this.zs = [];
    const d = game.data;
    this.tweens.add({ targets: this.shade, fillAlpha: 0, duration: 1600 });
    this.tweens.add({ targets: [this.roomNight, this.kotNight], alpha: 0, duration: 1600 });
    const sun = this.add.rectangle(0, 0, 960, 540, 0xfff0c0, 0).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(2001);
    this.tweens.add({ targets: sun, fillAlpha: 0.2, duration: 900, yoyo: true, onComplete: () => sun.destroy() });
    sound.setMood('day'); sound.play('ok');
    this.time.delayedCall(900, () => {
      const p = P(252, 128);
      this.tweens.add({ targets: this.futonSleep, alpha: 0, duration: 600 });
      this.aoi.setPosition(p.x, p.y).setFrame(0); this.facing = 'down';
      this.tweens.add({ targets: this.aoi, alpha: 1, duration: 500 });
      this.mochi.setFrame(8); this.fuku.play('fukuna-idle');
    });
    const sick = d.beds.filter((b) => b.crop && !b.dead && !isHealthy(game.cls(b))).length;
    const lines = [`Утро. ${['', 'Весна', 'Лето', 'Осень'][d.season]}, день ${Math.min(d.day, 5)}.`];
    const ev = this.notes.filter((n) => n !== 'season-end');
    lines.push(...(ev.length ? ev.slice(0, 4) : ['Ночь прошла спокойно.']));
    lines.push(`Больных грядок: ${sick}. Влажность ${d.weather.humidity}%. Заряд Фуку восстановлен.`);
    const first = d.beds.find((b) => b.crop && !b.dead && !isHealthy(game.cls(b)));
    if (first) lines.push(`Фуку: «Начнём с грядки ${first.id + 1} (${CROP_NAME[first.crop!]}) — там споры».`);
    this.time.delayedCall(1700, () => {
      this.ui.removeAll(true);
      const t = text(this, 200, 34, lines.join('\n'), 15, HEX.ink, { wordWrap: { width: 540 }, lineSpacing: 4 });
      const o = text(this, 200, 40 + t.height, '[Enter] Выйти во двор', 17, '#c8323c').setInteractive({ useHandCursor: true }).on('pointerdown', () => this.leave(true));
      this.ui.add([paperPanel(this, 180, 20, 600, t.height + 56), t, o]);
      this.ui.setAlpha(0); this.tweens.add({ targets: this.ui, alpha: 1, duration: 250 });
    });
  }

  leave(slept: boolean) {
    if (this.leaving) return; this.leaving = true;
    this.state = 'menu';
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.wake('World'); this.scene.setVisible(true, 'Hud');
      events.emit('lock', false); events.emit('stats');
      if (slept) events.emit('after-night', this.notes);
    });
  }
}
