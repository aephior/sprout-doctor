// Финал: бой с Хайкаби в заброшенной теплице.
// Споры глушат Линзу Фуку — диагноз недоступен, ритуалы выполняются по подсказке и по памяти.
// Фаза 1: обрезка → спрей. Фаза 2: смахнуть трёх Споронов (G6) → спрей. Фаза 3 (ярость): повторить
// последовательность из трёх жестов, которую Фуку показывает 3 секунды. Ошибка — перемотка к началу фазы.
import { sound } from '../audio/sound';
import { makeGlow } from '../art/interiors';
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
  aoi!: Phaser.GameObjects.Sprite;
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
    // заброшенная теплица ночью (tools/art/boss_arena.py, 320×180 ×3): разбитое стекло, мёртвые грядки, плесень
    this.add.image(0, 0, 'boss-arena').setOrigin(0).setScale(3);
    const g = this.add.graphics();
    g.fillStyle(0x1e1830, 0.92).fillRect(0, 474, 960, 66);
    this.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: 960 }, y: { min: 0, max: 470 }, lifespan: 4000, speedY: { min: -12, max: -3 }, speedX: { min: -6, max: 6 },
      scale: { start: 3, end: 0 }, alpha: { start: 0.6, end: 0 }, frequency: 60, tint: [0x6b4e8c, 0x9a9a9a, 0xff4f9a],
    });

    // Хайкаби пересэмплирована под сетку арены (×3); щупальца не уходят под нижнюю панель
    this.boss = this.add.image(480, 290, 'g-haikabi_idle_px').setScale(3);
    this.tweens.add({ targets: this.boss, y: 299, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // Аой и Фуку — те же спрайты, что на ферме, ×3
    this.add.ellipse(290, 464, 36, 10, 0x000000, 0.35);
    this.aoi = this.add.sprite(290, 468, 'aoi-na', 3).setOrigin(0.5, 1).setScale(3);
    this.fuku = this.add.sprite(124, 120, 'fuku-na', 0).setScale(4).play('fukuna-idle');
    this.tweens.add({ targets: this.fuku, y: 129, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
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
      this.boss.setTexture('g-haikabi_rage_px');
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
    const s = this.add.image(480, 250, 'sporon').setScale(3).setDepth(15).setInteractive({ useHandCursor: true })
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
    // урон — равная доля оставшихся ударов: последний удар доводит полоску до нуля.
    // Качество (Perfect/Good/Miss) идёт в оценку боя, а не в урон.
    const left = (this.need.length - this.step) + (this.phase === 1 ? 4 + 3 : this.phase === 2 ? 3 : 0);
    this.step++; this.grades.push(grade.mult);
    this.bossHp = left <= 1 ? 0 : Math.max(0, this.bossHp - this.bossHp / left);
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
    vhs.add([g, text(this, 480, 230, '«« ПЕРЕМОТКА', 48, HEX.white, { stroke: HEX.ink, strokeThickness: 8 }).setOrigin(0.5),
      text(this, 480, 290, reason, 18, HEX.paper, { stroke: HEX.ink, strokeThickness: 4 }).setOrigin(0.5)]);
    this.cameras.main.shake(300, 0.01);
    this.tweens.add({ targets: vhs, x: { from: -12, to: 12 }, duration: 60, yoyo: true, repeat: 10 });
    this.time.delayedCall(1700, () => {
      vhs.destroy();
      if (this.hp <= 0) { this.hp = 60; this.bossHp = Math.min(100, this.bossHp + 20); this.say('Теплица едва держится… Фуку перезапустил защиту. Ещё раз!'); }
      if (this.phase === 3) this.boss.setTexture('g-haikabi_rage_px');
      this.startPhase(this.phase);
    });
    this.redraw();
  }

  victory() {
    sound.setMood('evening'); sound.play('win');
    this.done = true;
    this.tweens.killTweensOf(this.boss);
    this.boss.setTexture('g-haikabi_defeated_px');
    this.tweens.add({ targets: this.boss, y: 360, alpha: 0.85, duration: 1600, ease: 'Quad.out' });
    const d = game.data;
    d.bossDone = true; d.completed = true;   // финал пройден: «Продолжить» больше не ведёт в бой
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
    // финал: вечер фестиваля — веранда на закате, гирлянда фонариков, салют; Фуку рядом с Аой
    this.cameras.main.fadeIn(900, 0, 0, 0); makeGlow(this);
    add(this.add.image(0, 0, 'g-evening').setOrigin(0).setScale(2));
    const lan = this.add.graphics();
    lan.lineStyle(2, 0x2a2030, 1);
    const pts: [number, number][] = [];
    for (let x = 0; x <= 960; x += 8) pts.push([x, 40 + Math.sin(x / 960 * Math.PI) * 50]);
    pts.slice(1).forEach(([x, y], i) => lan.lineBetween(pts[i][0], pts[i][1], x, y));
    add(lan);
    const COLS = [0xd8323c, 0xf2b84a, 0xff6fa0, 0x3fd0c9];
    for (let i = 1; i < 12; i++) {
      const x = i * 80, y = 40 + Math.sin(x / 960 * Math.PI) * 50;
      const c = COLS[i % 4];
      const glow = this.add.image(x, y + 12, 'glow').setScale(0.9).setTint(c).setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
      const body = this.add.graphics().fillStyle(0x1e1b2e, 1).fillRect(x - 7, y + 2, 14, 20).fillStyle(c, 1).fillRect(x - 6, y + 3, 12, 18)
        .fillStyle(0xffffff, 0.35).fillRect(x - 4, y + 5, 3, 12).fillStyle(0x1e1b2e, 1).fillRect(x - 6, y + 9, 12, 2).fillRect(x - 6, y + 15, 12, 2);
      add(glow); add(body);
      this.tweens.add({ targets: glow, alpha: 0.3, duration: 700 + i * 60, yoyo: true, repeat: -1 });
    }
    // салют
    const burst = () => {
      if (!this.scene.isActive()) return;
      const x = 520 + Math.random() * 400, y = 60 + Math.random() * 120, c = COLS[Math.floor(Math.random() * 4)];
      const e = this.add.particles(x, y, 'pixel', { speed: { min: 60, max: 140 }, lifespan: 1100, quantity: 36, frequency: -1, scale: { start: 3, end: 0 }, gravityY: 60, tint: [c, 0xffffff], blendMode: 'ADD' });
      add(e); e.explode(36); sound.play('good');
      this.time.delayedCall(1600, () => e.destroy());
    };
    this.time.addEvent({ delay: 1400, loop: true, callback: burst }); this.time.delayedCall(300, burst);
    const fk = this.add.image(830, 290, 'g-fuku_happy').setScale(0.6); add(fk);   // рисованный Фуку — в стиле рисованной веранды
    this.tweens.add({ targets: fk, y: 320, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    add(paperPanel(this, 24, 110, 470, 400));
    add(text(this, 259, 132, full ? 'Фестиваль урожая спасён!' : 'Хайкаби повержена', 26).setOrigin(0.5, 0));
    const lines = [
      full ? 'Деревня Кири-но-Сато снова в цвете. Бабушка Хару гордилась бы вами.' : `Теплица свободна, но выручки к фестивалю не хватило: ${revenue} из ${FESTIVAL_GOAL}.`,
      '',
      `Дней на ферме: ${d.totalDays}   ·   Перемоток в бою: ${this.rewinds}`,
      `Точность ритуалов: ${d.stats.correctTreat + d.stats.wrongTreat ? row.accuracy + '%' : '—'}   ·   Вылечено грядок: ${d.stats.cured}`,
      `Сканов Линзой: ${d.stats.scans}   ·   Тли прогнано: ${d.stats.aphids}`,
      `Выручка: ${revenue} монет (цель ${FESTIVAL_GOAL})`,
      '',
      `Итоговый счёт: ${row.score}  —  ${place}-е место в рекордах`,
    ];
    add(text(this, 46, 176, lines.join('\n'), 16, '#3a3550', { lineSpacing: 6, wordWrap: { width: 426 } }));
    const b = text(this, 259, 474, '[ Enter ] В главное меню', 20, '#c8323c').setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.toMenu());
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
        sp.s.destroy(); this.hp = Math.max(0, this.hp - 15);
        this.pendingSporons++;   // взрыв — не взмах: шаг ритуала не засчитывается, Спорон появится снова
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
    add(neonPanel(this, 560, 82, 380, 46 + this.need.length * 22, this.phase === 3 ? C.magenta : C.teal));   // высота — по числу шагов
    add(text(this, 574, 92, `РИТУАЛ ФАЗЫ ${this.phase}`, 15, HEX.teal));
    const names = this.need.map((a, i) => {
      const label = a === 'swipe' ? 'Взмах' : ACTION_NAME[a];
      const hidden = this.phase === 3 && !this.showSeq && i >= this.step;
      return `${i < this.step ? '+' : '·'} ${hidden ? '???' : `${label} (${KEY_OF[a]})`}`;
    });
    add(text(this, 574, 116, names.join('\n'), 15, HEX.white, { lineSpacing: 5 }));
    if (this.updateCam && this.textures.exists('cam-boss')) {
      add(neonPanel(this, 760, 392, 176, 132, C.teal));
      add(this.add.image(760, 392, 'cam-boss').setOrigin(0));
    } else add(text(this, 936, 526, '2 полив · 3 спрей · 4 обрезка · 6 взмах', 13, '#8a88b0').setOrigin(1, 1));
  }
}
