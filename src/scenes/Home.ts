// Дом бабушки Хару (слои в полном разрешении, tools/art/house_import.py): комната днём/вечером, футон
// со столиком и лампой-андон, Аой дома (пьёт чай / зевает / потягивается), Фуку на зарядке.
// День заканчивается сном прямо в комнате: Аой зевает и ложится, свет гаснет, «z»; ночью развиваются
// болезни; утром комната светлеет, Аой потягивается, на записке — итоги ночи.
import { game } from '../state/game';
import { events } from '../state/events';
import { makeGlow } from '../art/interiors';
import { text, HEX, paperPanel } from '../ui/ui';
import { sound } from '../audio/sound';
import { isHealthy, CROP_NAME } from '../data/diseases';

const FUTON = { x: 590, y: 552 };        // левый низ футона
const AOI = { x: 470, y: 520 };          // Аой: низ по центру
const CARD_W = 372;                      // записки слева, не заслоняют Аой

export class Home extends Phaser.Scene {
  aoi!: Phaser.GameObjects.Sprite;
  fuku!: Phaser.GameObjects.Sprite;
  room!: Phaser.GameObjects.Image;
  roomNight!: Phaser.GameObjects.Image;
  futon!: Phaser.GameObjects.Image;
  futonSleep!: Phaser.GameObjects.Image;
  lamps: Phaser.GameObjects.Image[] = [];
  steam?: Phaser.GameObjects.Particles.ParticleEmitter;
  shade!: Phaser.GameObjects.Rectangle;
  ui!: Phaser.GameObjects.Container;
  state: 'idle' | 'sleeping' | 'morning' = 'idle';
  notes: string[] = [];
  zs: Phaser.GameObjects.Text[] = [];
  auto = false;
  early = false;
  fukuAwake = true;

  constructor() { super('Home'); }

  init(data: { auto?: boolean; early?: boolean }) { this.auto = !!data?.auto; this.early = !!data?.early; }

  create() {
    makeGlow(this); this.anims0();
    this.state = 'idle'; this.notes = []; this.zs = []; this.lamps = [];
    sound.setMood('evening');
    const day = this.early;
    // комната: дневная внизу, вечерняя поверх (при смене времени просто меняется прозрачность)
    this.room = this.add.image(0, 0, 'home-room-day').setOrigin(0);
    this.roomNight = this.add.image(0, 0, 'home-room-night').setOrigin(0).setAlpha(day ? 0 : 1);
    // бумажный фонарь под потолком и пылинки в луче из окна
    const lantern = this.add.image(563, 112, 'glow').setScale(3.2).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffc070).setAlpha(day ? 0 : 0.5);
    this.tweens.add({ targets: lantern, scale: 3.05, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.particles(0, 0, 'pixel', {
      x: { min: 330, max: 520 }, y: { min: 160, max: 440 }, lifespan: 5000, speedY: { min: 2, max: 6 }, speedX: { min: -3, max: 3 },
      scale: { start: 2, end: 0 }, alpha: { start: day ? 0.7 : 0.25, end: 0 }, frequency: 260, tint: 0xfff2c0,
    });
    // Фуку заряжается на сундуке у стены; моргает, ночью спит
    this.fuku = this.add.sprite(800, 340, 'home-fuku', 1).setOrigin(0.5, 1);
    this.fukuAwake = true;
    const blink = () => {
      if (!this.scene.isActive()) return;
      if (this.fukuAwake) { this.fuku.setFrame(0); this.time.delayedCall(170, () => this.fukuAwake && this.fuku.setFrame(1)); }
      this.time.delayedCall(2500 + Math.random() * 3500, blink);
    };
    this.time.delayedCall(2000, blink);
    // футон со столиком: днём лампа-андон погашена, вечером горит
    this.futon = this.add.image(FUTON.x, FUTON.y, day ? 'home-futon-day' : 'home-futon-eve').setOrigin(0, 1);
    this.futonSleep = this.add.image(FUTON.x, FUTON.y, 'home-futon-sleep').setOrigin(0, 1).setAlpha(0);
    const andon = this.add.image(926, 374, 'glow').setScale(1.9).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd27a).setAlpha(day ? 0 : 0.45);
    this.tweens.add({ targets: andon, alpha: day ? 0 : 0.36, duration: 1100, yoyo: true, repeat: -1 });
    this.lamps = [lantern, andon];
    // Аой с чашкой чая: «дышит» кадрами, над чаем пар
    this.aoi = this.add.sprite(AOI.x, AOI.y, 'home-aoi-idle', 0).setOrigin(0.5, 1).play('home-aoi-idle');
    this.steam = this.add.particles(AOI.x + 8, AOI.y - 118, 'pixel', {
      speedY: { min: -14, max: -8 }, speedX: { min: -3, max: 3 }, lifespan: 1500, frequency: 260, scale: { start: 3, end: 1 },
      alpha: { start: 0.5, end: 0 }, tint: 0xffffff,
    });
    // ночь — синеватое затемнение поверх комнаты
    this.shade = this.add.rectangle(0, 0, 960, 540, 0x141432, 0).setOrigin(0).setDepth(5);
    this.ui = this.add.container(0, 0).setDepth(10);
    this.menu();
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.key(e));
    this.cameras.main.fadeIn(500, 0, 0, 0);
    if (this.auto) this.time.delayedCall(600, () => this.sleep());
    events.on('diary-closed', this.diaryClosed, this);
    this.events.once('shutdown', () => events.off('diary-closed', this.diaryClosed, this));
  }

  /** Анимации слоёв дома (создаются один раз на всю игру). */
  anims0() {
    const a = this.anims;
    if (!a.exists('home-aoi-idle')) a.create({ key: 'home-aoi-idle', frames: a.generateFrameNumbers('home-aoi-idle', { frames: [0, 1, 0, 2] }), frameRate: 1.6, repeat: -1 });
    if (!a.exists('home-aoi-yawn')) a.create({ key: 'home-aoi-yawn', frames: a.generateFrameNumbers('home-aoi-yawn', { frames: [0, 1, 1, 2, 2] }), frameRate: 4 });
    if (!a.exists('home-aoi-stretch')) a.create({ key: 'home-aoi-stretch', frames: a.generateFrameNumbers('home-aoi-stretch', { frames: [0, 1, 1, 2] }), frameRate: 3 });
  }

  diaryClosed() { this.input.keyboard!.enabled = true; this.menu(); }

  key(e: KeyboardEvent) {
    if (this.state === 'idle') {
      if (e.key === '1' || e.key === 'Enter') this.sleep();
      else if (e.key === '2') this.diary();
      else if (e.key === 'Escape' && !this.auto) this.leave(false);   // полночь: сон обязателен
    } else if (this.state === 'morning' && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || e.key === '1')) this.leave(true);
  }

  card(lines: string[], options: [string, string, () => void][], x = 24, w = CARD_W) {
    this.ui.removeAll(true);
    const body = text(this, x + 18, 0, lines.join('\n'), 16, HEX.ink, { wordWrap: { width: w - 36 }, lineSpacing: 5 });
    const opts = options.map(([k, label, fn]) => text(this, x + 18, 0, `[${k}] ${label}`, 17, '#c8323c', { wordWrap: { width: w - 36 } })
      .setInteractive({ useHandCursor: true }).on('pointerdown', fn));
    const h = body.height + 30 + opts.reduce((s, o) => s + o.height + 10, 0);
    const y = 540 - 24 - h;
    this.ui.add(paperPanel(this, x, y, w, h));
    body.setY(y + 14); this.ui.add(body);
    let oy = y + body.height + 22;
    opts.forEach((o) => { o.setY(oy); oy += o.height + 10; this.ui.add(o); });
    this.ui.setAlpha(0); this.tweens.add({ targets: this.ui, alpha: 1, duration: 250 });
  }

  menu() {
    const d = game.data;
    const opts: [string, string, () => void][] = [
      ['1', this.early ? 'Вздремнуть до утра (день закончится)' : 'Лечь спать', () => this.sleep()],
      ['2', 'Перечитать дневник Хару', () => this.diary()],
    ];
    if (!this.auto) opts.push(['Esc', 'Ещё не время — во двор', () => this.leave(false)]);
    this.card([`Дом бабушки Хару. ${['', 'Весна', 'Лето', 'Осень'][d.season]}, день ${Math.min(d.day, 5)}.`,
      this.auto ? 'Уже полночь — глаза слипаются.' : this.early ? 'Ещё светло. Можно вздремнуть до утра — но тогда день закончится.' : 'Тихо тикают часы. Чай ещё тёплый.'], opts);
  }

  diary() {
    this.ui.removeAll(true);
    this.input.keyboard!.enabled = false;
    this.fuku.setFrame(1);   // Фуку просыпается, когда открывают дневник
    this.scene.launch('Diary', { returnTo: 'Home' });
  }

  sleep() {
    if (this.state !== 'idle') return;
    this.state = 'sleeping';
    this.ui.removeAll(true);
    sound.play('night');
    // Аой зевает и ложится: её слой сменяется футоном со спящей Аой
    this.steam?.stop();
    this.aoi.play('home-aoi-yawn');
    this.time.delayedCall(1300, () => {
      this.tweens.add({ targets: this.aoi, alpha: 0, duration: 450 });
      this.tweens.add({ targets: this.futonSleep, alpha: 1, duration: 700, delay: 200 });
      this.tweens.add({ targets: this.futon, alpha: 0, duration: 700, delay: 200 });
    });
    // свет гаснет, за окном — ночь; Фуку засыпает
    this.time.delayedCall(1500, () => {
      this.lamps.forEach((l) => { this.tweens.killTweensOf(l); this.tweens.add({ targets: l, alpha: 0, duration: 1500 }); });
      this.tweens.add({ targets: this.roomNight, alpha: 1, duration: 1500 });
      this.tweens.add({ targets: this.shade, fillAlpha: 0.55, duration: 1800 });
      this.fukuAwake = false; this.fuku.setFrame(0);
    });
    // «z» над спящей Аой
    this.time.delayedCall(2300, () => {
      for (let i = 0; i < 6; i++) this.time.delayedCall(i * 650, () => {
        if (this.state !== 'sleeping') return;
        const z = text(this, 724 + (i % 3) * 8, 384, 'z', 18 + (i % 3) * 6, HEX.paper, { stroke: HEX.ink, strokeThickness: 3 }).setDepth(7).setAlpha(0.95);
        this.zs.push(z);
        this.tweens.add({ targets: z, y: z.y - 80, x: z.x + 26, alpha: 0, duration: 2200 });
      });
      sound.setMood('off');
    });
    // ночь: развитие болезней
    this.time.delayedCall(6200, () => {
      this.notes = game.endDay();
      events.emit('refresh-beds');
      this.morning();
    });
  }

  morning() {
    this.state = 'morning';
    this.zs.forEach((z) => z.active && this.tweens.add({ targets: z, alpha: 0, duration: 300, onComplete: () => z.destroy() })); this.zs = [];
    const d = game.data;
    // утро: комната светлеет (дневной слой), солнечная вспышка из окна
    this.tweens.add({ targets: this.shade, fillAlpha: 0, duration: 1600 });
    this.tweens.add({ targets: this.roomNight, alpha: 0, duration: 1600 });
    const sun = this.add.rectangle(0, 0, 960, 540, 0xfff0c0, 0).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD).setDepth(6);
    this.tweens.add({ targets: sun, fillAlpha: 0.22, duration: 900, yoyo: true, onComplete: () => sun.destroy() });
    this.futon.setTexture('home-futon-day');
    this.tweens.add({ targets: this.futon, alpha: 1, duration: 800, delay: 600 });
    this.tweens.add({ targets: this.futonSleep, alpha: 0, duration: 800, delay: 600 });
    sound.setMood('day'); sound.play('ok');
    // Аой встаёт и потягивается, потом снова с чаем; Фуку просыпается
    this.time.delayedCall(900, () => {
      this.aoi.setAlpha(1).play('home-aoi-stretch');
      this.aoi.once('animationcomplete', () => { this.aoi.play('home-aoi-idle'); this.steam?.start(); });
      this.fukuAwake = true; this.fuku.setFrame(1);
      this.tweens.add({ targets: this.fuku, y: this.fuku.y - 6, duration: 160, yoyo: true });
    });
    const sick = d.beds.filter((b) => b.crop && !b.dead && !isHealthy(game.cls(b))).length;
    const lines = [`Утро. ${['', 'Весна', 'Лето', 'Осень'][d.season]}, день ${Math.min(d.day, 5)}.`];
    const events_ = this.notes.filter((n) => n !== 'season-end');
    lines.push(...(events_.length ? events_.slice(0, 4) : ['Ночь прошла спокойно.']));
    lines.push(`Больных грядок: ${sick}. Влажность ${d.weather.humidity}%. Заряд Фуку восстановлен.`);
    const first = d.beds.find((b) => b.crop && !b.dead && !isHealthy(game.cls(b)));
    if (first) lines.push(`Фуку: «Начнём с грядки ${first.id + 1} (${CROP_NAME[first.crop!]}) — там споры».`);
    this.time.delayedCall(2200, () => this.card(lines, [['Enter', 'Выйти во двор', () => this.leave(true)]]));
  }

  leave(slept: boolean) {
    if ((this as any)._leaving) return; (this as any)._leaving = true;
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
