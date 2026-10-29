// Дом бабушки Хару: уютная комната с футоном и лампой-андон. Отсюда день заканчивается сном:
// лампа гаснет, комната синеет, «Zzz», ночью развиваются болезни; утром — лучи сквозь сёдзи и записка с итогами ночи.
import { game } from '../state/game';
import { events } from '../state/events';
import { paintHome } from '../art/interiors';
import { Painter } from '../art/paint';
import { text, HEX, paperPanel } from '../ui/ui';
import { sound } from '../audio/sound';
import { CLASSES, CROP_NAME, isHealthy } from '../data/diseases';
import { ritualText } from './Procedure';

const S = 3;

export class Home extends Phaser.Scene {
  aoi!: Phaser.GameObjects.Sprite;
  glow!: Phaser.GameObjects.Image;
  shade!: Phaser.GameObjects.Rectangle;
  ui!: Phaser.GameObjects.Container;
  state: 'idle' | 'sleeping' | 'morning' = 'idle';
  notes: string[] = [];

  constructor() { super('Home'); }

  create() {
    paintHome(this);
    this.state = 'idle'; this.notes = [];
    sound.setMood('evening');
    this.add.image(0, 0, 'home-bg').setOrigin(0).setScale(S);
    // Фуку на зарядке на полке
    const fuku = this.add.sprite(283 * S, 42 * S, 'fuku', 1).setScale(2.2);
    this.tweens.add({ targets: fuku, y: fuku.y - 2, duration: 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.image(0, 0, 'home-fg').setOrigin(0).setScale(S);
    this.aoi = this.add.sprite(150 * S, 128 * S, 'aoi-home', 0).setOrigin(0.5, 1).setScale(S);
    // свет лампы-андон
    this.glow = this.add.image(118 * S, 108 * S, 'glow').setScale(7).setAlpha(0.75).setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({ targets: this.glow, alpha: 0.62, scale: 6.8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // пар над чашкой
    this.add.particles(60 * S, 132 * S, 'pixel', { speedY: { min: -14, max: -8 }, speedX: { min: -3, max: 3 }, lifespan: 1600, frequency: 260, scale: { start: 3, end: 0 }, alpha: { start: 0.5, end: 0 }, tint: 0xffffff });
    // затемнение для ночи
    this.shade = this.add.rectangle(0, 0, 960, 540, 0x141432, 0).setOrigin(0).setDepth(5);
    this.ui = this.add.container(0, 0).setDepth(10);
    this.menu();
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.key(e));
    this.cameras.main.fadeIn(500, 0, 0, 0);
  }

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
    const d = game.data, seen = new Map<string, string>();
    for (const c of CLASSES) if (!isHealthy(c) && c.season <= d.season && !seen.has(c.key)) seen.set(c.key, `${c.name} → ${ritualText(c)}`);
    this.card(['«Растение не умеет жаловаться. Оно показывает — листьями.» — Хару', '', ...seen.values()], [['2', 'Закрыть дневник', () => this.menu()]], 24, 560);
  }

  sleep() {
    if (this.state !== 'idle') return;
    this.state = 'sleeping';
    this.ui.removeAll(true);
    sound.play('night');
    // Аой ложится
    this.tweens.add({ targets: this.aoi, alpha: 0, duration: 400, onComplete: () => this.aoi.setFrame(1).setPosition(162 * S, 146 * S).setAlpha(1) });
    // лампа гаснет, комната синеет
    this.tweens.killTweensOf(this.glow);
    this.tweens.add({ targets: this.glow, alpha: 0, duration: 1600, delay: 600 });
    this.tweens.add({ targets: this.shade, fillAlpha: 0.62, duration: 1800, delay: 600 });
    // Zzz
    this.time.delayedCall(1600, () => {
      for (let i = 0; i < 4; i++) this.time.delayedCall(i * 700, () => {
        const z = text(this, 150 * S + i * 6, 128 * S, 'z', 18 + i * 6, HEX.paper).setDepth(6).setAlpha(0.9);
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
    // утренний свет сквозь сёдзи
    const win = new Painter(114, 76, 5);
    win.bands(0, 0, 114, 76, ['#f6e7c1', '#f2d39a', '#f2b45a', '#f2a7b8']);
    win.ellipse(80, 20, 9, 9, '#fff6dc');
    if (this.textures.exists('home-morning')) this.textures.remove('home-morning');
    win.toTexture(this, 'home-morning');
    const w = this.add.image(75 * S, 19 * S, 'home-morning').setOrigin(0).setScale(S).setAlpha(0).setDepth(4);
    for (const x of [113, 151]) this.add.rectangle(x * S, 19 * S, S, 76 * S, 0x6a4329).setOrigin(0).setDepth(4);
    const rays = this.add.graphics().setDepth(7).setAlpha(0).setBlendMode(Phaser.BlendModes.ADD);
    rays.fillStyle(0xffd27a, 0.18);
    for (let i = 0; i < 3; i++) rays.fillPoints([{ x: (80 + i * 36) * S, y: 22 * S }, { x: (96 + i * 36) * S, y: 22 * S }, { x: (150 + i * 40) * S, y: 180 * S }, { x: (120 + i * 40) * S, y: 180 * S }], true);
    this.tweens.add({ targets: this.shade, fillAlpha: 0, duration: 1600 });
    this.tweens.add({ targets: [w, rays], alpha: 1, duration: 1600 });
    sound.setMood('day'); sound.play('ok');
    this.time.delayedCall(700, () => this.aoi.setFrame(0).setPosition(150 * S, 128 * S));
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

