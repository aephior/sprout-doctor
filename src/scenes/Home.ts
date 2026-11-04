// Дом бабушки Хару — комната сверху, как ферма: Аой ходит (WASD/стрелки) и осматривает вещи (E).
// Футон — сон и итоги ночи; полка — дневник Хару; зарядка — Фуку; лежанка — Моти; фото, окно, чайник,
// котацу; дверь внизу — во двор. Комната 640×540 по центру экрана (tools/art/house_import.py), по бокам — поля.
import { game } from '../state/game';
import { events } from '../state/events';
import { makeGlow } from '../art/interiors';
import { text, HEX, paperPanel } from '../ui/ui';
import { sound } from '../audio/sound';
import { isHealthy, CROP_NAME } from '../data/diseases';
import { hourNow } from '../world/life';

const RX = 160, RS = 2 / 3;                     // комната: левый край на экране и масштаб «960-координат» картинки
const P = (x: number, y: number) => ({ x: RX + x * RS, y: y * RS });
const R = (x: number, y: number, w: number, h: number) => [RX + x * RS, y * RS, w * RS, h * RS] as const;
const SOLIDS = [
  R(0, 0, 960, 270), R(0, 0, 40, 811), R(920, 0, 40, 811), R(0, 760, 385, 60), R(575, 760, 385, 60),   // стены
  R(40, 140, 190, 230), R(250, 250, 65, 70), R(615, 190, 115, 125), R(830, 190, 90, 180),           // полка, зарядка, комод, кухня
  R(860, 330, 50, 110), R(760, 455, 155, 235), R(860, 645, 50, 115), R(390, 435, 185, 140),         // андон, футон, андон, котацу
  R(45, 440, 110, 85), R(60, 545, 50, 40), R(40, 605, 170, 155),                                      // лежанка, миска, растения
];
type Spot = { key: string; x: number; y: number; hint: string };
const SPOTS: Spot[] = [
  { key: 'futon', ...P(735, 575), hint: 'E — лечь спать' },
  { key: 'diary', ...P(135, 385), hint: 'E — дневник бабушки Хару' },
  { key: 'fuku', ...P(283, 360), hint: 'E — поговорить с Фуку' },
  { key: 'photo', ...P(672, 345), hint: 'E — фотография' },
  { key: 'window', ...P(480, 300), hint: 'E — посмотреть в окно' },
  { key: 'tea', ...P(800, 330), hint: 'E — заварить чай' },
  { key: 'kotatsu', ...P(480, 620), hint: 'E — посидеть у котацу' },
  { key: 'mochi', ...P(175, 485), hint: 'E — погладить Моти' },
  { key: 'door', ...P(480, 745), hint: 'E — выйти во двор' },
];

export class Home extends Phaser.Scene {
  aoi!: Phaser.Physics.Arcade.Sprite;
  fuku!: Phaser.GameObjects.Sprite;
  mochi!: Phaser.GameObjects.Sprite;
  roomNight!: Phaser.GameObjects.Image;
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

  constructor() { super('Home'); }

  init(data: { auto?: boolean; early?: boolean }) { this.auto = !!data?.auto; this.early = !!data?.early; }

  create() {
    makeGlow(this);
    this.state = 'walk'; this.notes = []; this.zs = []; this.lamps = []; this.near = null;
    sound.setMood('evening');
    const night = !this.early;
    // поля по бокам — тёмное дерево, комната по центру
    this.add.rectangle(0, 0, 960, 540, 0x1c1418).setOrigin(0);
    const side = this.add.graphics();
    for (let i = 0; i < 8; i++) side.fillStyle(0x2a1d1c, 1).fillRect(0, i * 68, RX, 2).fillRect(RX + 640, i * 68 + 34, RX, 2);
    this.add.image(RX, 0, 'home-top-day').setOrigin(0);
    this.roomNight = this.add.image(RX, 0, 'home-top-night').setOrigin(0).setAlpha(night ? 1 : 0);
    // свет: две лампы-андон у футона и тёплое пятно над котацу (вечером)
    for (const [x, y, s] of [[885, 385, 1.4], [885, 700, 1.4], [480, 500, 3.2]] as [number, number, number][]) {
      const p = P(x, y);
      const g = this.add.image(p.x, p.y, 'glow').setScale(s).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffc878).setAlpha(night ? 0.4 : 0);
      this.tweens.add({ targets: g, scale: s * 0.94, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.lamps.push(g);
    }
    // пар над чайником на котацу
    const kp = P(480, 440);
    this.add.particles(kp.x, kp.y, 'pixel', { speedY: { min: -12, max: -7 }, speedX: { min: -3, max: 3 }, lifespan: 1500, frequency: 300,
      scale: { start: 3, end: 1 }, alpha: { start: 0.45, end: 0 }, tint: 0xffffff });
    // футон со спящей Аой — появляется ночью поверх футона
    const fp = P(760 + 155 / 2, 455 + 235 / 2);
    this.futonSleep = this.add.image(fp.x, fp.y, 'home-top-futon-sleep').setAlpha(0);

    // физика: стены и мебель
    const solids = this.physics.add.staticGroup();
    for (const [x, y, w, h] of SOLIDS) solids.add(this.add.rectangle(x, y, w, h).setOrigin(0).setVisible(false));
    // Фуку на зарядке и Моти на лежанке (спрайты фермы: Фуку ×3, Моти ×4)
    const fk = P(283, 300);
    this.fuku = this.add.sprite(fk.x, fk.y, 'fuku-na', 0).setScale(3).play('fukuna-idle');
    this.tweens.add({ targets: this.fuku, y: fk.y - 3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const mp = P(100, 500);
    this.mochi = this.add.sprite(mp.x, mp.y, 'mochi-na', 9).setOrigin(0.5, 1).setScale(4).setDepth(mp.y);
    // Аой — спрайт фермы ×4
    const start = this.auto ? P(700, 600) : P(480, 700);
    this.aoi = this.physics.add.sprite(start.x, start.y, 'aoi-na', 1).setOrigin(0.5, 1).setScale(4);
    (this.aoi.body as Phaser.Physics.Arcade.Body).setSize(10, 4).setOffset(3, 16);
    this.physics.add.collider(this.aoi, solids);
    this.add.ellipse(0, 0, 40, 10, 0x000000, 0.25).setName('shadow');

    this.shade = this.add.rectangle(0, 0, 960, 540, 0x141432, 0).setOrigin(0).setDepth(900);
    this.hintBg = this.add.graphics().setDepth(950);
    this.hint = text(this, 480, 516, '', 17, HEX.paper, { stroke: HEX.ink, strokeThickness: 4 }).setOrigin(0.5).setDepth(951);
    this.ui = this.add.container(0, 0).setDepth(1000);
    const d = game.data;
    const head = text(this, 16, 14, `Дом бабушки Хару\n${['', 'Весна', 'Лето', 'Осень'][d.season]}, день ${Math.min(d.day, 5)}`, 15, HEX.paper, { lineSpacing: 4 }).setDepth(950);
    head.setAlpha(0.85);
    text(this, 16, 500, 'WASD — ходить\nE — осмотреть\nEsc — во двор', 13, '#b9a99a', { lineSpacing: 3 }).setDepth(950);

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
    if (this.state === 'walk') {
      if (e.key === 'e' || e.key === 'E' || e.key === 'у' || e.key === 'У' || e.key === 'Enter') { if (this.near) this.use(this.near.key); }
      else if (e.key === 'Escape' && !this.auto) this.leave(false);
    } else if (this.state === 'menu') {
      if (e.key === '1' || e.key === 'Enter') this.sleep();
      else if (e.key === 'Escape' || e.key === '2') { this.ui.removeAll(true); this.state = 'walk'; }
    } else if (this.state === 'morning' && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || e.key === 'e' || e.key === 'E')) this.leave(true);
  }

  update() {
    const shadow = this.children.getByName('shadow') as Phaser.GameObjects.Ellipse;
    shadow.setPosition(this.aoi.x, this.aoi.y - 2).setDepth(this.aoi.y - 1).setVisible(this.aoi.alpha > 0.5);
    this.aoi.setDepth(this.aoi.y);
    if (this.state !== 'walk') { this.aoi.setVelocity(0); this.aoi.anims.stop(); this.setHint(''); return; }
    const k = this.keys;
    const vx = (k.A.isDown || k.LEFT.isDown ? -1 : 0) + (k.D.isDown || k.RIGHT.isDown ? 1 : 0);
    const vy = (k.W.isDown || k.UP.isDown ? -1 : 0) + (k.S.isDown || k.DOWN.isDown ? 1 : 0);
    const sp = 170, n = vx && vy ? Math.SQRT1_2 : 1;
    this.aoi.setVelocity(vx * sp * n, vy * sp * n);
    if (vx || vy) {
      this.facing = vx ? (vx < 0 ? 'left' : 'right') : vy < 0 ? 'up' : 'down';
      this.aoi.anims.play('aoi-na-' + this.facing, true);
    } else { this.aoi.anims.stop(); this.aoi.setFrame({ down: 0, up: 1, left: 2, right: 3 }[this.facing]); }
    // ближайшее место для осмотра
    let best: Spot | null = null, bd = 46;
    for (const s of SPOTS) { const dd = Math.hypot(s.x - this.aoi.x, s.y - this.aoi.y); if (dd < bd) { bd = dd; best = s; } }
    this.near = best;
    this.setHint(best ? best.hint : '');
    // дверь: дошла до порога — выходит сама
    if (this.aoi.y > 520 && Math.abs(this.aoi.x - 480) < 60 && !this.auto) this.leave(false);
  }

  setHint(s: string) {
    if (this.hint.text === s) return;
    this.hint.setText(s); this.hintBg.clear();
    if (s) { const w = this.hint.width + 28; this.hintBg.fillStyle(0x1e1b2e, 0.78).fillRoundedRect(480 - w / 2, 501, w, 30, 8); }
  }

  /** Реплика в рамке сверху (исчезает сама). */
  toast(s: string, ms = 3600) {
    this.ui.removeAll(true);
    const t = text(this, 480, 30, s, 15, HEX.ink, { wordWrap: { width: 520 }, align: 'center', lineSpacing: 3 }).setOrigin(0.5, 0);
    this.ui.add([paperPanel(this, 480 - 280, 18, 560, t.height + 24), t]);
    this.ui.setAlpha(0); this.tweens.add({ targets: this.ui, alpha: 1, duration: 200 });
    this.time.delayedCall(ms, () => { if (this.state === 'walk') this.tweens.add({ targets: this.ui, alpha: 0, duration: 300 }); });
  }

  use(key: string) {
    const d = game.data;
    if (key === 'futon') {
      this.state = 'menu';
      this.ui.removeAll(true);
      const lines = this.early ? 'Ещё светло. Вздремнуть до утра? День закончится.' : 'Футон пахнет солнцем. Лечь спать?';
      const t = text(this, 480, 34, lines, 16, HEX.ink, { align: 'center' }).setOrigin(0.5, 0);
      const o1 = text(this, 400, 66, '[1] Спать', 17, '#c8323c').setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.sleep());
      const o2 = text(this, 560, 66, '[Esc] Не сейчас', 17, '#c8323c').setOrigin(0.5, 0).setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.ui.removeAll(true); this.state = 'walk'; });
      this.ui.add([paperPanel(this, 220, 20, 520, 82), t, o1, o2]);
    } else if (key === 'diary') {
      this.state = 'menu'; this.ui.removeAll(true);
      this.input.keyboard!.enabled = false;
      this.scene.launch('Diary', { returnTo: 'Home' });
    } else if (key === 'fuku') {
      const first = d.beds.find((b) => b.crop && !b.dead && !isHealthy(game.cls(b)));
      this.fuku.anims.stop(); this.fuku.setFrame(2); this.time.delayedCall(1200, () => this.fuku.play('fukuna-idle'));
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
      const h = this.add.image(this.mochi.x, this.mochi.y - 46, 'heart-px').setScale(3).setDepth(950);
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
    // Аой ложится: её спрайт гаснет, на футоне — спящая Аой
    this.tweens.add({ targets: this.aoi, alpha: 0, duration: 450 });
    this.tweens.add({ targets: this.futonSleep, alpha: 1, duration: 700, delay: 250 });
    // свет гаснет, комната синеет, Моти засыпает
    this.time.delayedCall(700, () => {
      this.tweens.add({ targets: this.roomNight, alpha: 1, duration: 1400 });
      this.lamps.forEach((l) => { this.tweens.killTweensOf(l); this.tweens.add({ targets: l, alpha: 0, duration: 1600 }); });
      this.tweens.add({ targets: this.shade, fillAlpha: 0.5, duration: 1800 });
      this.mochi.setFrame(9);
    });
    // «z» над подушкой
    const zp = P(838, 470);
    this.time.delayedCall(1800, () => {
      for (let i = 0; i < 6; i++) this.time.delayedCall(i * 650, () => {
        if (this.state !== 'sleeping') return;
        const z = text(this, zp.x - 10 + (i % 3) * 7, zp.y, 'z', 16 + (i % 3) * 5, HEX.paper, { stroke: HEX.ink, strokeThickness: 3 }).setDepth(905);
        this.zs.push(z);
        this.tweens.add({ targets: z, y: z.y - 70, x: z.x + 22, alpha: 0, duration: 2200 });
      });
      sound.setMood('off');
    });
    this.time.delayedCall(5600, () => {
      this.notes = game.endDay();
      events.emit('refresh-beds');
      this.morning();
    });
  }

  morning() {
    this.state = 'morning';
    this.zs.forEach((z) => z.active && this.tweens.add({ targets: z, alpha: 0, duration: 300, onComplete: () => z.destroy() })); this.zs = [];
    const d = game.data;
    this.tweens.add({ targets: this.shade, fillAlpha: 0, duration: 1600 });
    this.tweens.add({ targets: this.roomNight, alpha: 0, duration: 1600 });
    const sun = this.add.rectangle(0, 0, 960, 540, 0xfff0c0, 0).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(901);
    this.tweens.add({ targets: sun, fillAlpha: 0.2, duration: 900, yoyo: true, onComplete: () => sun.destroy() });
    sound.setMood('day'); sound.play('ok');
    // Аой встаёт рядом с футоном
    this.time.delayedCall(900, () => {
      const p = P(720, 610);
      this.tweens.add({ targets: this.futonSleep, alpha: 0, duration: 600 });
      this.aoi.setPosition(p.x, p.y).setFrame(0); this.facing = 'down';
      this.tweens.add({ targets: this.aoi, alpha: 1, duration: 500 });
      this.mochi.setFrame(8);
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
    if ((this as any)._leaving) return; (this as any)._leaving = true;
    this.state = 'menu';
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      (this as any)._leaving = false;
      this.scene.stop();
      this.scene.wake('World'); this.scene.setVisible(true, 'Hud');
      events.emit('lock', false); events.emit('stats');
      if (slept) events.emit('after-night', this.notes);
    });
  }
}
