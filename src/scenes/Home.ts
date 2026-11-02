// Дом бабушки Хару: уютная комната с футоном и лампой-андон. Отсюда день заканчивается сном:
// лампа гаснет, комната синеет, «Zzz», ночью развиваются болезни; утром — лучи сквозь сёдзи и записка с итогами ночи.
import { game } from '../state/game';
import { events } from '../state/events';
import { makeGlow } from '../art/interiors';
import { Painter } from '../art/paint';
import { text, HEX, paperPanel } from '../ui/ui';
import { sound } from '../audio/sound';
import { CLASSES, CROP_NAME, isHealthy } from '../data/diseases';
import { ritualText } from './Procedure';

const S = 3;

export class Home extends Phaser.Scene {
  aoi!: Phaser.GameObjects.Sprite;
  glow!: Phaser.GameObjects.Image;
  lamps: Phaser.GameObjects.Image[] = [];
  sleeper?: Phaser.GameObjects.Image;
  ring?: Phaser.GameObjects.Graphics;
  shade!: Phaser.GameObjects.Rectangle;
  ui!: Phaser.GameObjects.Container;
  state: 'idle' | 'sleeping' | 'morning' = 'idle';
  notes: string[] = [];

  auto = false;
  constructor() { super('Home'); }

  init(data: { auto?: boolean }) { this.auto = !!data?.auto; }

  create() {
    makeGlow(this);
    this.state = 'idle'; this.notes = [];
    sound.setMood('evening');
    this.add.image(0, 0, 'g-home_bg').setOrigin(0).setScale(2);
    // Фуку на зарядке на полке
    const fuku = this.add.sprite(728, 214, 'fuku', 1).setOrigin(0.5, 1).setScale(0.42);
    this.tweens.add({ targets: fuku, y: fuku.y - 3, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // футон, столик и лампа-андон
    this.add.image(960, 540, 'g-home_fg').setOrigin(1, 1).setScale(1.12);
    // Аой в домашнем (вид спереди — первый кадр листа)
    const tex = this.textures.get('g-aoi_home');
    if (!tex.has('front')) tex.add('front', 0, 0, 0, Math.floor(tex.getSourceImage().width / 4), tex.getSourceImage().height);
    this.aoi = this.add.sprite(606, 492, 'g-aoi_home', 'front').setOrigin(0.5, 1).setScale(1.5);
    this.tweens.add({ targets: this.aoi, scaleY: 1.515, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // свет: бумажный фонарь под потолком и лампа-андон у футона
    this.glow = this.add.image(548, 150, 'glow').setScale(5.5).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffc880);
    this.tweens.add({ targets: this.glow, alpha: 0.45, scale: 5.3, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    const andon = this.add.image(910, 345, 'glow').setScale(3.2).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd27a);
    this.tweens.add({ targets: andon, alpha: 0.4, duration: 1200, yoyo: true, repeat: -1 });
    this.lamps = [this.glow, andon];
    // пар над чашкой на столике
    this.add.particles(724, 388, 'pixel', { speedY: { min: -14, max: -8 }, speedX: { min: -3, max: 3 }, lifespan: 1600, frequency: 260, scale: { start: 3, end: 0 }, alpha: { start: 0.5, end: 0 }, tint: 0xffffff });
    // затемнение для ночи
    this.shade = this.add.rectangle(0, 0, 960, 540, 0x141432, 0).setOrigin(0).setDepth(5);
    this.ui = this.add.container(0, 0).setDepth(10);
    this.menu();
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.key(e));
    this.cameras.main.fadeIn(500, 0, 0, 0);
    if (this.auto) this.time.delayedCall(600, () => this.sleep());
    events.on('diary-closed', this.diaryClosed, this);
    this.events.once('shutdown', () => events.off('diary-closed', this.diaryClosed, this));
  }

  diaryClosed() { this.input.keyboard!.enabled = true; this.menu(); }

  key(e: KeyboardEvent) {
    if (this.state === 'idle') {
      if (e.key === '1' || e.key === 'Enter') this.sleep();
      else if (e.key === '2') this.diary();
      else if (e.key === 'Escape') this.leave(false);
    } else if (this.state === 'morning' && (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape' || e.key === '1')) this.leave(true);
  }

  card(lines: string[], options: [string, string, () => void][], x = 24, w = 460) {
    this.ui.removeAll(true);
    const body = text(this, x + 18, 0, lines.join('\n'), 16, HEX.ink, { wordWrap: { width: w - 36 }, lineSpacing: 5 });
    const h = body.height + 30 + options.length * 30;
    const y = 540 - 24 - h;
    this.ui.add(paperPanel(this, x, y, w, h));
    body.setY(y + 14); this.ui.add(body);
    options.forEach(([k, label, fn], i) => this.ui.add(text(this, x + 18, y + body.height + 22 + i * 30, `[${k}] ${label}`, 17, '#c8323c')
      .setInteractive({ useHandCursor: true }).on('pointerdown', fn)));
  }

  menu() {
    const d = game.data;
    this.card([`Дом бабушки Хару. ${['', 'Весна', 'Лето', 'Осень'][d.season]}, день ${d.day}.`, 'Тихо тикают часы. Чай ещё тёплый.'], [
      ['1', 'Лечь спать', () => this.sleep()],
      ['2', 'Перечитать дневник Хару', () => this.diary()],
      ['Esc', 'Ещё не время — вернуться во двор', () => this.leave(false)],
    ]);
  }

  diary() {
    this.ui.removeAll(true);
    this.input.keyboard!.enabled = false;
    this.scene.launch('Diary', { returnTo: 'Home' });
  }

  sleep() {
    if (this.state !== 'idle') return;
    this.state = 'sleeping';
    this.ui.removeAll(true);
    sound.play('night');
    // Аой ложится: крупный план — спит под одеялом
    this.tweens.add({ targets: this.aoi, alpha: 0, duration: 400 });
    // круглое «окно сна»: картинка в круглой маске с бумажной каймой
    const ring = this.add.graphics().setDepth(6).setAlpha(0);
    ring.fillStyle(0x1e1b2e, 0.55).fillCircle(480, 262, 214).fillStyle(0x6f86b8, 1).fillCircle(480, 262, 198).lineStyle(6, 0xf6e7c1, 0.9).strokeCircle(480, 262, 200);
    const mask = this.make.graphics({}, false); mask.fillStyle(0xffffff).fillCircle(480, 262, 197);
    this.sleeper = this.add.image(480, 300, 'g-aoi_sleep').setScale(1.35).setAlpha(0).setDepth(6).setMask(mask.createGeometryMask());
    this.tweens.add({ targets: [this.sleeper, ring], alpha: 1, duration: 900, delay: 900 });
    this.ring = ring;
    this.tweens.add({ targets: this.sleeper, scale: 1.38, duration: 1600, yoyo: true, repeat: -1, delay: 1800, ease: 'Sine.inOut' });
    // лампы гаснут, комната синеет
    this.lamps.forEach((l) => { this.tweens.killTweensOf(l); this.tweens.add({ targets: l, alpha: 0, duration: 1600, delay: 600 }); });
    this.tweens.add({ targets: this.shade, fillAlpha: 0.62, duration: 1800, delay: 600 });
    // Zzz
    this.time.delayedCall(1600, () => {
      for (let i = 0; i < 4; i++) this.time.delayedCall(i * 700, () => {
        const z = text(this, 600 + i * 8, 200, 'z', 18 + i * 6, HEX.paper).setDepth(7).setAlpha(0.9);
        this.tweens.add({ targets: z, y: z.y - 90, x: z.x + 40, alpha: 0, duration: 2200 });
      });
      sound.setMood('off');
    });
    // ночь: развитие болезней
    this.time.delayedCall(3600, () => {
      this.notes = game.endDay();
      events.emit('refresh-beds');
      this.morning();
    });
  }

  morning() {
    this.state = 'morning';
    const d = game.data;
    // утро: в окне рассвет вместо луны, лучи сквозь сёдзи
    const win = new Painter(125, 180, 5);
    win.bands(0, 0, 125, 180, ['#f6e7c1', '#f2d39a', '#f2b45a', '#f2a7b8']);
    win.ellipse(60, 46, 16, 16, '#fff6dc');
    if (this.textures.exists('home-morning')) this.textures.remove('home-morning');
    win.toTexture(this, 'home-morning');
    const w = this.add.image(315, 120, 'home-morning').setOrigin(0).setAlpha(0).setDepth(4);
    w.setBlendMode(Phaser.BlendModes.SCREEN);
    const rays = this.add.graphics().setDepth(7).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    rays.fillStyle(0xffd27a, 0.16);
    for (let i = 0; i < 3; i++) rays.fillPoints([{ x: 320 + i * 42, y: 124 }, { x: 352 + i * 42, y: 124 }, { x: 520 + i * 70, y: 540 }, { x: 440 + i * 70, y: 540 }], true);
    this.tweens.add({ targets: this.shade, fillAlpha: 0, duration: 1600 });
    this.tweens.add({ targets: [w, rays], alpha: 1, duration: 1600 });
    if (this.sleeper) this.tweens.add({ targets: [this.sleeper, this.ring], alpha: 0, duration: 900 });
    sound.setMood('day'); sound.play('ok');
    this.time.delayedCall(700, () => this.tweens.add({ targets: this.aoi, alpha: 1, duration: 500 }));
    const sick = d.beds.filter((b) => b.crop && !b.dead && !isHealthy(game.cls(b))).length;
    const lines = [`Утро. ${['', 'Весна', 'Лето', 'Осень'][d.season]}, день ${Math.min(d.day, 5)}.`];
    const events_ = this.notes.filter((n) => n !== 'season-end');
    lines.push(...(events_.length ? events_.slice(0, 4) : ['Ночь прошла спокойно.']));
    lines.push(`Больных грядок: ${sick}. Влажность ${d.weather.humidity}%. Заряд Фуку восстановлен.`);
    const first = d.beds.find((b) => b.crop && !b.dead && !isHealthy(game.cls(b)));
    if (first) lines.push(`Фуку: «Начнём с грядки ${first.id + 1} (${CROP_NAME[first.crop!]}) — там споры».`);
    this.time.delayedCall(1200, () => this.card(lines, [['Enter', 'Выйти во двор', () => this.leave(true)]], 24, 520));
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

