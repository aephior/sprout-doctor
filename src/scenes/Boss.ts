// Финал: бой с Хайкаби в заброшенной теплице.
// Споры глушат Линзу Фуку — диагноз недоступен, ритуалы выполняются по подсказке и по памяти.
// Фаза 1: обрезка → спрей. Фаза 2: смахнуть трёх Споронов (G6) → спрей. Фаза 3 (ярость): повторить
// последовательность из трёх жестов, которую Фуку показывает 3 секунды. Ошибка — перемотка к началу фазы.
import { sound } from '../audio/sound';
import { game } from '../state/game';
import { ACTION_NAME, Action } from '../data/diseases';
import { events } from '../state/events';
import { text, HEX, C, paperPanel, neonPanel, bar } from '../ui/ui';
import { gestures } from '../ai/gestureCtl';
import { tracker } from '../ai/hands';
import { GestureEvent, FrameInfo } from '../ai/gestures';
import { drawHand, cameraTexture } from '../ui/hand';
import { GRADES, Grade } from './Procedure';
import { addRecord, FESTIVAL_GOAL } from '../state/records';

const KEYS: Record<string, Action | 'swipe'> = { '2': 'water', '3': 'spray', '4': 'prune', '6': 'swipe' };
const KEY_OF: Record<string, string> = { water: '2', spray: '3', prune: '4', swipe: '6' };

export class Boss extends Phaser.Scene {
  phase = 1;
  hp = 100;
  bossHp = 100;
  need: (Action | 'swipe')[] = [];
  step = 0;
  showSeq = true;
  rewinds = 0;
  sporons: { s: Phaser.GameObjects.Image; until: number }[] = [];
  pendingSporons = 0;
  boss!: Phaser.GameObjects.Image;
  fuku!: Phaser.GameObjects.Sprite;
  ui!: Phaser.GameObjects.Container;
  ghost!: Phaser.GameObjects.Graphics;
  hand: FrameInfo | null = null;
  updateCam?: () => void;
  msg = '';
  locked = true;
  done = false;
  grades: number[] = [];

  constructor() { super('Boss'); }

  create() {
    this.updateCam = undefined; this.hand = null; this.msg = ''; this.showSeq = true; this.locked = true;
    this.phase = 1; this.hp = 100; this.bossHp = 100; this.step = 0; this.rewinds = 0; this.sporons = []; this.done = false; this.grades = [];
    const g = this.add.graphics();
    [0x1a1530, 0x241c3d, 0x30244a, 0x3b2b52].forEach((c, i) => g.fillStyle(c, 1).fillRect(0, i * 135, 960, 136));
    // каркас теплицы
    g.lineStyle(3, 0x55536e, 0.8);
    for (let x = 60; x < 960; x += 120) g.lineBetween(x, 40, x, 470);
    for (const y of [40, 180, 320]) g.lineBetween(0, y, 960, y);
    g.lineStyle(2, 0x6b4e8c, 0.4).lineBetween(0, 40, 480, -60).lineBetween(960, 40, 480, -60);
    g.fillStyle(0x3a2a20, 1).fillRect(0, 470, 960, 70);
    this.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: 960 }, y: { min: 0, max: 470 }, lifespan: 4000, speedY: { min: -12, max: -3 }, speedX: { min: -6, max: 6 },
      scale: { start: 3, end: 0 }, alpha: { start: 0.6, end: 0 }, frequency: 60, tint: [0x6b4e8c, 0x9a9a9a, 0xff4f9a],
    });

    this.boss = this.add.image(480, 318, 'haikabi').setScale(3.6);
    this.tweens.add({ targets: this.boss, y: 328, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.fuku = this.add.sprite(140, 120, 'fuku', 3).setScale(3.5);
    this.tweens.add({ targets: this.fuku, y: 128, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.ui = this.add.container(0, 0).setDepth(20);
    this.ghost = this.add.graphics().setDepth(30);
    this.cameras.main.fadeIn(800, 30, 20, 40); sound.setMood('boss'); sound.play('boss');

    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => { const a = KEYS[e.key]; if (a) this.input2(a, GRADES.Good); });
    if (gestures.wanted && gestures.possible) void this.startGestures();

    this.say('Аой-сан, споры глушат линзу! Диагноза не будет — работаем по памяти и по дневнику.');
    this.time.delayedCall(2600, () => this.startPhase(1));
  }

  async startGestures() {
    if (!(await gestures.start()) || !this.scene.isActive()) return;
    this.updateCam = cameraTexture(this, 'cam-boss', tracker.video, 176, 132);
    const off = gestures.listen({ frame: (i) => { this.hand = i; }, gesture: (e) => this.onGesture(e) });
    this.events.once('shutdown', () => { off(); this.updateCam = undefined; gestures.pause(); });
  }

  onGesture(e: GestureEvent) {
    const map: Record<string, Action | 'swipe'> = { water: 'water', spray: 'spray', prune: 'prune', swipe: 'swipe' };
    const a = map[e.action];
    if (a) this.input2(a, GRADES[e.grade]);
  }

  say(s: string) { this.msg = s; this.redraw(); }

  startPhase(n: number) {
    this.phase = n; this.step = 0; this.locked = false; this.showSeq = true;
    if (n === 1) { this.need = ['prune', 'spray']; this.say('Фаза 1. Хайкаби тянет щупальца к грядкам: обрежьте их (4), затем опрыскайте ядро (3).'); }
    if (n === 2) {
      this.need = ['swipe', 'swipe', 'swipe', 'spray']; this.pendingSporons = 3;
      this.say('Фаза 2. Хайкаби призывает Споронов! Смахивайте каждого (G6 / клавиша 6 / щелчок), потом спрей (3).');
      this.time.delayedCall(800, () => this.spawnSporon());
    }
    if (n === 3) {
      this.boss.setTexture('haikabi-rage');
      this.cameras.main.shake(400, 0.01);
      const pool: Action[] = ['water', 'spray', 'prune'];
      this.need = Array.from({ length: 3 }, () => pool[Math.floor(Math.random() * 3)]);
      this.say('Фаза 3 — ЯРОСТЬ! Запомните ритуал: я покажу его 3 секунды, потом линза погаснет.');
      this.locked = true;
      this.time.delayedCall(3000, () => { this.showSeq = false; this.locked = false; this.say('Линза погасла. Повторите ритуал по памяти!'); });
    }
    this.redraw();
  }

  spawnSporon() {
    if (this.phase !== 2 || this.pendingSporons <= 0 || this.done) return;
    this.pendingSporons--;
    const x = 260 + Math.random() * 440, y = 330 + Math.random() * 100;
    const s = this.add.image(480, 250, 'sporon').setScale(5).setDepth(15).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.input2('swipe', GRADES.Good));
    this.tweens.add({ targets: s, x, y, duration: 350, ease: 'Back.out' });
    this.sporons.push({ s, until: this.time.now + 3500 });
  }

  input2(a: Action | 'swipe', grade: Grade) {
    if (this.locked || this.done) return;
    const want = this.need[this.step];
    if (a === 'swipe' && this.phase === 2) {
      const sp = this.sporons.shift();
      if (!sp) return;
      sound.play('swat');
      this.tweens.add({ targets: sp.s, x: sp.s.x + (Math.random() < 0.5 ? -600 : 600), angle: 540, alpha: 0, duration: 400, onComplete: () => sp.s.destroy() });
      this.hit(grade);
      if (this.pendingSporons > 0) this.time.delayedCall(500, () => this.spawnSporon());
      return;
    }
    if (a === 'swipe') return;
    if (a === want) { this.hit(grade); return; }
    this.rewind(`Нет, так не сработает: нужен был ритуал «${want === 'swipe' ? 'Взмах' : ACTION_NAME[want as Action]}».`);
  }

  hit(grade: Grade) {
    sound.play(grade.label === 'Perfect' ? 'perfect' : grade.label === 'Good' ? 'good' : 'miss');
    this.step++; this.grades.push(grade.mult);
    this.bossHp = Math.max(0, this.bossHp - (100 / 9) * (0.6 + 0.4 * grade.mult));
    this.boss.setTintFill(grade.color);
    this.time.delayedCall(90, () => this.boss.clearTint());
    this.cameras.main.flash(80, (grade.color >> 16) & 255, (grade.color >> 8) & 255, grade.color & 255);
    const col = '#' + grade.color.toString(16).padStart(6, '0');
    const t = text(this, 480, 120, grade.label, 30, col, { stroke: HEX.ink, strokeThickness: 6 }).setOrigin(0.5).setDepth(40);
    this.tweens.add({ targets: t, y: 80, alpha: 0, duration: 700, onComplete: () => t.destroy() });
    if (this.step >= this.need.length) {
      this.locked = true;
      if (this.phase < 3) this.time.delayedCall(900, () => this.startPhase(this.phase + 1));
      else this.time.delayedCall(700, () => this.victory());
    }
    this.redraw();
  }

  /** Перемотка в духе Katana Zero: ошибка не конец игры, фаза начинается заново. */
  rewind(reason: string) {
    sound.play('rewind');
    this.locked = true; this.rewinds++;
    this.hp = Math.max(0, this.hp - 20);
    this.sporons.forEach((sp) => sp.s.destroy()); this.sporons = [];
    const vhs = this.add.container(0, 0).setDepth(50);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45).fillRect(0, 0, 960, 540);
    for (let i = 0; i < 30; i++) g.fillStyle(i % 3 ? 0xffffff : C.magenta, 0.12).fillRect(0, Math.random() * 540, 960, 2 + Math.random() * 6);
    vhs.add([g, text(this, 480, 230, '◀◀  ПЕРЕМОТКА', 48, HEX.white, { stroke: HEX.ink, strokeThickness: 8 }).setOrigin(0.5),
      text(this, 480, 290, reason, 18, HEX.paper, { stroke: HEX.ink, strokeThickness: 4 }).setOrigin(0.5)]);
    this.cameras.main.shake(300, 0.01);
    this.tweens.add({ targets: vhs, x: { from: -12, to: 12 }, duration: 60, yoyo: true, repeat: 10 });
    this.time.delayedCall(1700, () => {
      vhs.destroy();
      if (this.hp <= 0) { this.hp = 60; this.bossHp = Math.min(100, this.bossHp + 20); this.say('Теплица едва держится… Фуку перезапустил защиту. Ещё раз!'); }
      if (this.phase === 3) this.boss.setTexture('haikabi-rage');
      this.startPhase(this.phase);
    });
    this.redraw();
  }

  victory() {
    sound.setMood('evening'); sound.play('win');
    this.done = true;
    const d = game.data;
    d.bossDone = true;
    const avg = this.grades.reduce((a, b) => a + b, 0) / Math.max(1, this.grades.length);
    d.stats.gradeSum += avg; d.stats.gradeN++;
    d.reputation = Math.min(100, d.reputation + 20);
    game.save();
    this.tweens.killTweensOf(this.boss);
    this.boss.setTint(0x777777);
    this.tweens.add({ targets: this.boss, scale: 0.5, alpha: 0, angle: 30, duration: 1800, ease: 'Quad.in' });
    this.cameras.main.flash(600, 246, 231, 193);
    this.time.delayedCall(2000, () => this.festival());
  }

  festival() {
    const d = game.data, revenue = d.coins + d.harvest * 15;
    const full = revenue >= FESTIVAL_GOAL;
    const ending = full ? 'Фестиваль спасён' : 'Хайкаби повержена';
    const { row, place } = addRecord(d, ending, true);
    this.ui.removeAll(true);
    const add = (o: Phaser.GameObjects.GameObject) => this.ui.add(o);
    add(this.add.rectangle(0, 0, 960, 540, 0x000000, 0.55).setOrigin(0));
    add(paperPanel(this, 180, 70, 600, 400));
    add(text(this, 480, 96, full ? 'Фестиваль урожая спасён!' : 'Хайкаби повержена', 30).setOrigin(0.5));
    const lines = [
      full ? 'Деревня Кири-но-Сато снова в цвете. Бабушка Хару гордилась бы вами.' : `Теплица свободна, но выручки к фестивалю не хватило: ${revenue} из ${FESTIVAL_GOAL}.`,
      '',
      `Дней на ферме: ${d.totalDays}   ·   Перемоток в бою: ${this.rewinds}`,
      `Точность ритуалов: ${row.accuracy}%   ·   Вылечено грядок: ${d.stats.cured}`,
      `Сканов Линзой: ${d.stats.scans}   ·   Тли прогнано: ${d.stats.aphids}`,
      `Выручка: ${revenue} монет (цель ${FESTIVAL_GOAL})`,
      '',
      `Итоговый счёт: ${row.score}  —  ${place}-е место в рекордах`,
    ];
    add(text(this, 210, 140, lines.join('\n'), 17, '#3a3550', { lineSpacing: 6, wordWrap: { width: 540 } }));
    const b = text(this, 480, 430, '[ Enter ] В главное меню', 20, '#c8323c').setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.toMenu());
    add(b);
    this.input.keyboard!.once('keydown-ENTER', () => this.toMenu());
  }

  toMenu() {
    this.scene.stop('Hud'); this.scene.stop('World'); this.scene.start('Menu');
    events.emit('stats');
  }

  update() {
    if (!this.done) {
      for (const sp of [...this.sporons]) if (this.time.now > sp.until) {
        this.sporons.splice(this.sporons.indexOf(sp), 1);
        sp.s.destroy(); this.hp = Math.max(0, this.hp - 15); this.step++;
        this.cameras.main.shake(150, 0.006);
        this.say('Спорон взорвался облаком спор: −15 к теплице!');
        if (this.pendingSporons > 0) this.time.delayedCall(400, () => this.spawnSporon());
        if (this.hp <= 0) this.rewind('Теплица не выдержала спор.');
      }
    }
    if (this.updateCam) {
      this.updateCam();
      this.ghost.clear();
      if (this.hand?.landmarks) {
        drawHand(this.ghost, this.hand.landmarks, 160, 40, 640, 480, C.teal, 0.25, 5);
        drawHand(this.ghost, this.hand.landmarks, 760, 392, 176, 132, C.teal, 0.95, 2);
      }
    }
  }

  redraw() {
    if (this.done) return;
    this.ui.removeAll(true);
    const add = (o: Phaser.GameObjects.GameObject) => this.ui.add(o);
    add(text(this, 480, 14, 'ХАЙКАБИ', 26, HEX.magenta, { stroke: HEX.ink, strokeThickness: 5 }).setOrigin(0.5, 0));
    add(bar(this, 330, 48, 300, 12, this.bossHp / 100, C.magenta));
    add(text(this, 24, 470, `Теплица: ${this.hp}`, 16, HEX.paper));
    add(bar(this, 140, 474, 160, 12, this.hp / 100, this.hp > 40 ? C.green : C.magenta));
    add(text(this, 24, 496, `Фаза ${this.phase}/3   ·   Перемоток: ${this.rewinds}`, 14, '#b9b7d9'));

    // реплика Фуку
    const t = text(this, 196, 92, this.msg, 15, HEX.ink, { wordWrap: { width: 300 }, lineSpacing: 2 });
    add(paperPanel(this, 184, 82, 324, t.height + 20)); add(t);

    // ритуал фазы
    add(neonPanel(this, 560, 82, 380, 110, this.phase === 3 ? C.magenta : C.teal));
    add(text(this, 574, 92, `РИТУАЛ ФАЗЫ ${this.phase}`, 15, HEX.teal));
    const names = this.need.map((a, i) => {
      const label = a === 'swipe' ? 'Взмах' : ACTION_NAME[a];
      const hidden = this.phase === 3 && !this.showSeq && i >= this.step;
      return `${i < this.step ? '✓' : '·'} ${hidden ? '???' : `${label} (${KEY_OF[a]})`}`;
    });
    add(text(this, 574, 118, names.join('\n'), 15, HEX.white, { lineSpacing: 3 }));
    if (this.updateCam && this.textures.exists('cam-boss')) {
      add(neonPanel(this, 760, 392, 176, 132, C.teal));
      add(this.add.image(760, 392, 'cam-boss').setOrigin(0));
    } else add(text(this, 936, 526, '2 полив · 3 спрей · 4 обрезка · 6 взмах', 13, '#8a88b0').setOrigin(1, 1));
  }
}
