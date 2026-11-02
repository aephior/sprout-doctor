// «Процедурная»: крупный план грядки. Скан Линзой Фуку → диагноз (нейросеть) → ритуал → результат.
// Действия приходят из трёх источников: клавиши, кнопки мышью и (этап жестов) модуль «Ритуалы рук».
// Все они вызывают applyAction(action, grade), поэтому игровая логика одна.
import { sound } from '../audio/sound';
import { game, Bed } from '../state/game';
import { CLASSES, CROP_NAME, ACTION_NAME, Action, isHealthy, DiseaseClass } from '../data/diseases';
import { diagnose, loadLeafModel, Diagnosis, viewTransform } from '../ai/leaf';
import { events } from '../state/events';
import { text, HEX, C, paperPanel, neonPanel, bar } from '../ui/ui';
import { gestures } from '../ai/gestureCtl';
import { tracker } from '../ai/hands';
import { GestureEvent, FrameInfo, POSE_NAME, GESTURE_INFO } from '../ai/gestures';
import { drawHand, cameraTexture } from '../ui/hand';
import { GardenView } from './garden';

export interface Grade { label: 'Perfect' | 'Good' | 'Miss'; mult: number; color: number }
export const GRADES: Record<Grade['label'], Grade> = {
  Perfect: { label: 'Perfect', mult: 1.0, color: C.teal },
  Good: { label: 'Good', mult: 0.7, color: C.orange },
  Miss: { label: 'Miss', mult: 0.3, color: C.magenta },
};
const KEY_GRADE = GRADES.Good;   // режим без камеры

type Cmd = 'scan' | 'view' | Action | 'none' | 'reset' | 'confirm' | 'harvest' | 'back' | 'swipe' | 'diary';
const KEYMAP: Record<string, Cmd> = {
  '1': 'scan', r: 'view', R: 'view', к: 'view', К: 'view', '2': 'water', '3': 'spray', '4': 'prune', '7': 'remove',
  '6': 'swipe', '0': 'none', Backspace: 'reset', Enter: 'confirm', '5': 'confirm', h: 'harvest', H: 'harvest', р: 'harvest', Р: 'harvest', Escape: 'back',
  Tab: 'diary',
};

/** Текст ритуала из дневника бабушки Хару. */
export function ritualText(c: DiseaseClass) {
  if (isHealthy(c)) return 'не лечить (0)';
  const keys: Record<Action, string> = { water: '2', spray: '3', prune: '4', remove: '7' };
  return c.cure.map((a) => `${ACTION_NAME[a]} (${keys[a]})`).join(' › ') + (c.noWaterAfter ? ', без полива' : '');
}

export class Procedure extends Phaser.Scene {
  bed!: Bed;
  seq: Action[] = [];
  grades: Grade[] = [];
  diag: Diagnosis | null = null;
  view = 0;
  busy = false;
  treated = false;
  ui!: Phaser.GameObjects.Container;
  garden!: GardenView;
  fuku!: Phaser.GameObjects.Sprite;
  msg = '';
  msgColor = HEX.ink;
  ghost!: Phaser.GameObjects.Graphics;
  hand: FrameInfo | null = null;
  updateCam?: () => void;
  gestureOn = false;
  aphid: { sprite: Phaser.GameObjects.Sprite; until: number; bar: Phaser.GameObjects.Graphics; hop: Phaser.Time.TimerEvent } | null = null;
  aphidRolled = false;

  constructor() { super('Procedure'); }

  init(data: { bedId: number }) {
    this.bed = game.data.beds[data.bedId];
    this.seq = []; this.grades = []; this.diag = null; this.view = 0; this.busy = false; this.treated = false;
    // скан этого дня хранится на грядке: повторный вход показывает его без траты заряда
    const st = this.bed.scanToday;
    if (st) { this.diag = { top: st.top, ms: st.ms }; this.view = st.view; }
    this.treated = this.bed.treatedDay === game.data.totalDays;
    this.aphid = null; this.aphidRolled = false; this.closing = false;
    // сцена переиспользуется для каждой грядки — сбрасываем всё, что осталось от прошлого визита
    this.gestureOn = false; this.updateCam = undefined; this.hand = null; this.gestureStatus = undefined; this.msg = '';
  }

  create() {
    const g = this.add.graphics();
    [0x1c1a33, 0x201e3a, 0x232141, 0x262446].forEach((c, i) => g.fillStyle(c, 1).fillRect(0, i * 135, 960, 136));
    for (let i = 0; i < 70; i++) g.fillStyle(0x3e3a66, 0.6).fillRect((i * 137) % 960, (i * 71) % 540, 2, 2);   // звёздная пыль

    // окно с проработанной грядкой (анимации действий — в GardenView)
    this.garden = new GardenView(this, 24, 128, this.bed);
    this.fuku = this.garden.fuku;

    this.ui = this.add.container(0, 0).setDepth(25);
    this.cameras.main.fadeIn(250, 28, 26, 51);
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => { const c = KEYMAP[e.key]; if (c) { if (c === 'diary') e.preventDefault(); this.command(c); } });
    loadLeafModel().catch(() => { /* ошибка покажется при скане */ });
    this.say(this.treated ? 'Сегодня эту грядку уже лечили. Приходите завтра — посмотрим, как она.'
      : this.diag ? 'Этот лист уже сканировали сегодня — результат перед вами. Новый ракурс (R) потратит заряд.'
      : 'Шаг 1. Нажмите «Скан» (клавиша 1) — я посмотрю на лист через линзу.');
    events.emit('procedure-open', this);
    this.events.once('shutdown', () => events.emit('procedure-close'));

    // «Ритуалы рук»: жесты с камеры → те же команды, что и клавиши
    this.ghost = this.add.graphics().setDepth(40);
    if (gestures.wanted && gestures.possible) void this.startGestures();
  }

  async startGestures() {
    gestures.rec.holdBonus = game.tuning().holdBonusMs;
    const ok = await gestures.start();
    if (!ok || !this.scene.isActive()) return;
    this.gestureOn = true;
    this.updateCam = cameraTexture(this, 'cam-proc', tracker.video, 120, 90);
    const off = gestures.listen({
      frame: (i) => { this.hand = i; },
      gesture: (e) => this.onGesture(e),
    });
    this.events.once('shutdown', () => { off(); this.gestureOn = false; this.updateCam = undefined; gestures.pause(); });
    this.time.addEvent({ delay: 250, loop: true, callback: () => this.drawGestureStatus() });
    this.redraw();
  }

  onGesture(e: GestureEvent) {
    const grade = GRADES[e.grade];
    const map: Record<string, Cmd> = { scan: 'scan', water: 'water', spray: 'spray', prune: 'prune', remove: 'remove', confirm: 'confirm', swipe: 'swipe' };
    if (e.action === 'swipe') { this.command('swipe', grade); return; }
    const cmd = map[e.action];
    if (!cmd) return;
    if (cmd === 'confirm' && !this.seq.length && this.diag) { this.command('none', grade); return; }   // большой палец без ритуала = «не лечить»
    this.command(cmd, grade);   // проверка доступности — общая, в command() → canDo()
  }

  update() {
    if (this.aphid) {
      const left = Math.max(0, this.aphid.until - this.time.now), win = game.tuning().aphidWindowMs;
      this.aphid.bar.clear().fillStyle(C.ink, 0.9).fillRect(this.aphid.sprite.x - 40, this.aphid.sprite.y - 30, 80, 8).fillStyle(left > win / 3 ? C.orange : C.magenta, 1).fillRect(this.aphid.sprite.x - 39, this.aphid.sprite.y - 29, 78 * left / win, 6);
      if (left <= 0) this.resolveAphid(false);
    }
    if (!this.gestureOn) return;
    this.updateCam?.();
    this.ghost.clear();
    const i = this.hand;
    if (i?.landmarks) {
      // крупный полупрозрачный призрак поверх сцены и маленький — на превью
      drawHand(this.ghost, i.landmarks, 160, 40, 640, 480, C.teal, 0.28, 5);
      drawHand(this.ghost, i.landmarks, 248, 136, 120, 90, C.teal, 0.95, 2);
      const w = i.landmarks[0], cx = 160 + (1 - w.x) * 640, cy = 40 + w.y * 480;
      const col = i.hold >= 1 ? C.teal : C.orange;
      this.ghost.lineStyle(5, col, 0.85).beginPath();
      this.ghost.arc(cx, cy, 30, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * i.hold, false).strokePath();
    }
  }

  gestureStatus?: Phaser.GameObjects.Text;
  drawGestureStatus() {
    const i = this.hand;
    const stale = !this.hand || (tracker.last.t && performance.now() - tracker.last.t > 2000);
    const s = !gestures.active ? 'Камера запускается…'
      : stale && gestures.fps === 0 ? 'Камера не присылает кадры — выйдите (Esc) и войдите снова'
      : i?.landmarks ? `Поза: ${POSE_NAME[i.pose]} · ${Math.round(i.conf * 100)}% · ${gestures.fps} к/с` : `Покажите руку в камеру · ${gestures.fps} к/с`;
    if (!this.gestureStatus) this.gestureStatus = text(this, 36, 500, '', 14, HEX.teal, { stroke: HEX.ink, strokeThickness: 4 }).setDepth(41);
    this.gestureStatus.setText(s);
  }

  say(s: string, color = HEX.ink) { this.msg = s; this.msgColor = color; this.redraw(); }

  /** Доступна ли команда сейчас — одна проверка для кнопок, клавиш и жестов. Возвращает подсказку, если нет. */
  canDo(c: Cmd): true | string {
    const d = game.data, b = this.bed, scanned = !!this.diag;
    const sick = b.crop && !isHealthy(game.cls(b));
    switch (c) {
      case 'back': case 'diary': return true;
      case 'scan': return this.bed.scanToday || d.fukuCharge > 0 ? true : 'Заряд линзы на нуле. Он восстановится ночью — или купите улучшение у Огавы.';
      case 'view': return !scanned ? 'Сначала обычный скан (1).' : d.fukuCharge > 0 ? true : 'Заряд линзы на нуле — другой ракурс не сделать.';
      case 'harvest': return b.stage === 2 && !sick && !b.dead ? true : 'Урожай собирают только со здорового созревшего растения.';
      case 'swipe': return this.aphid ? true : 'Смахивать некого.';
    }
    if (this.treated) return 'Сегодня эту грядку уже лечили. Завтра будет новый день.';
    if (!scanned) return 'Сначала скан (1): без диагноза лечить вслепую рискованно.';
    switch (c) {
      case 'spray': if (d.fungicide <= 0) return 'Нет фунгицида — купите у Огавы.'; break;
      case 'remove': if (d.season < 3) return 'Удалять растения придётся только осенью — сейчас лечим.'; break;
      case 'reset': return this.seq.length ? true : 'Ритуал пока пуст.';
      case 'confirm': return this.seq.length ? true : 'Ритуал пуст. Соберите действия или выберите «Не лечить» (0).';
    }
    if (['water', 'spray', 'prune', 'remove'].includes(c) && this.seq.length >= 3) return 'В ритуале не больше трёх действий.';
    return true;
  }

  /** Единая точка входа для клавиш, кнопок и жестов. */
  command(c: Cmd, grade: Grade = KEY_GRADE) {
    if (c === 'back') return this.close();   // выход работает всегда, даже во время скана
    if (this.busy) return;
    if (this.aphid) { if (c === 'swipe') this.resolveAphid(true, grade); else this.say('Сначала прогоните тлю! Взмах ладонью (G6), клавиша 6 или щелчок по ней.', HEX.magentaDark); return; }
    if (c === 'swipe') return;
    if (c === 'diary') return this.openDiary();
    const ok = this.canDo(c);
    if (ok !== true) { this.say(ok, HEX.orangeDark); sound.play('miss'); return; }
    if (c === 'scan') return void this.scan(0);
    if (c === 'view') return void this.scan(this.view + 1);
    if (c === 'harvest') return this.harvest();
    if (c === 'reset') { this.seq = []; this.grades = []; this.redraw(); return; }
    if (c === 'none') { this.seq = []; this.grades = []; this.confirm(); return; }
    if (c === 'confirm') { this.confirm(); return; }
    this.applyAction(c as Action, grade);
  }

  applyAction(a: Action, grade: Grade) {
    if (this.treated || this.seq.length >= 3) return;
    this.seq.push(a); this.grades.push(grade);
    this.busy = true;
    this.time.delayedCall(Math.min(900, this.garden.act(a)), () => { this.busy = false; });
    sound.play(a); this.time.delayedCall(180, () => sound.play(grade.label === 'Perfect' ? 'perfect' : grade.label === 'Good' ? 'good' : 'miss'));
    this.ring(grade);
    this.redraw();
  }

  /** Дневник поверх процедурной (Tab); Esc в дневнике возвращает сюда. */
  openDiary() {
    this.input.keyboard!.enabled = false;
    this.scene.pause();
    this.scene.launch('Diary', { returnTo: 'Procedure' });
  }

  async scan(view: number) {
    const d = game.data;
    // скан этого ракурса уже был сегодня — показываем без траты заряда
    const st = this.bed.scanToday;
    if (st && view === st.view) {
      this.diag = { top: st.top, ms: st.ms }; this.view = st.view;
      this.say('Этот лист уже сканировали сегодня — результат перед вами.', HEX.greenDark);
      return;
    }
    if (d.fukuCharge <= 0) { this.say('Заряд линзы на нуле. Он восстановится ночью — или купите улучшение у Огавы.', HEX.magentaDark); return; }
    this.busy = true;
    this.fuku.setFrame(2).anims.stop();
    this.glitch(); sound.setMood('scan'); sound.play('scan');
    try {
      const img = this.textures.get(`card:${this.bed.card}`).getSourceImage() as HTMLImageElement;
      const [res] = await Promise.all([diagnose(img, view, this.bed.crop ?? undefined), this.garden.scan()]);
      if (!this.scene.isActive() || this.closing) return;   // игрок ушёл с грядки — результат не нужен
      d.fukuCharge--; d.stats.scans++;
      this.diag = res; this.view = view;
      this.bed.diagnosed = res.top[0].id;
      this.bed.scanToday = { top: res.top, ms: res.ms, view };
      const top = res.top[0], c = CLASSES[top.id], pct = Math.round(top.p * 100);
      // первая встреча с болезнью открывает страницу дневника Хару
      if (!isHealthy(c) && top.p >= 0.6) game.unlockPage(c.key);
      const where = d.season === 1 ? 'Ритуал из дневника — в розовой рамке.' : 'Ритуал — в дневнике Хару (Tab).';
      if (top.p < 0.6) this.say(`Уверенность низкая — ${pct}%. Похоже на «${c.name}», но я не уверен. Сделайте другой ракурс (R).`, HEX.orangeDark);
      else if (isHealthy(c)) this.say(`Диагноз: здоров (${pct}%). Лечить не нужно — «Не лечить» (0).`, HEX.greenDark);
      else this.say(`Диагноз: «${c.name}» (${pct}%). ${where} Соберите его и «Подтвердите».`, HEX.greenDark);
      if (game.newPage) { const k = game.newPage; game.newPage = null; this.time.delayedCall(700, () => this.pageUnlocked(k)); }
    } catch (err) {
      this.say(`Линза не отвечает: ${(err as Error).message}`, HEX.magentaDark);
    }
    this.fuku.play('fukuna-idle');
    this.busy = false;
    events.emit('stats');
    if (!this.aphidRolled && this.diag && !this.treated) {
      this.aphidRolled = true;
      if (Math.random() < game.tuning().aphidChance) this.time.delayedCall(700, () => this.spawnAphid());
    }
  }

  // ---------- тля-ниндзя: реакция на время, жест G6 «взмах» ----------
  spawnAphid() {
    if (this.aphid || this.treated || !this.scene.isActive()) return;
    const win = game.tuning().aphidWindowMs;
    const pos = () => this.garden.leafPoint();
    const p = pos();
    const sprite = this.add.sprite(p.x, p.y, 'g-aphid_dash').setScale(0.32).setDepth(60).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.command('swipe'));
    const hop = this.time.addEvent({ delay: 420, loop: true, callback: () => {
      const q = pos();
      this.tweens.add({ targets: sprite, x: q.x, y: q.y, duration: 160, ease: 'Quad.out' });
      sprite.setFlipX(q.x < sprite.x);
      if (this.bed.health > 1) { this.bed.health = Math.max(1, this.bed.health - 1); this.redraw(); }
    } });
    const bar = this.add.graphics().setDepth(61);
    this.aphid = { sprite, until: this.time.now + win, bar, hop };
    this.cameras.main.shake(120, 0.004); sound.play('aphid');
    this.say('Тля-ниндзя на листе! Смахните её: взмах ладонью (G6), клавиша 6 или щелчок по ней.', HEX.magentaDark);
  }

  resolveAphid(ok: boolean, grade: Grade = KEY_GRADE) {
    const a = this.aphid; if (!a) return;
    this.aphid = null;
    a.hop.remove(); a.bar.destroy();
    if (ok) {
      game.data.stats.aphids++; sound.play('swat');
      this.ring(grade);
      this.tweens.add({ targets: a.sprite, x: a.sprite.x + 500, angle: 720, alpha: 0, duration: 450, onComplete: () => a.sprite.destroy() });
      this.say(`Тля улетела! ${grade.label}. Продолжаем лечение.`, HEX.greenDark);
    } else {
      a.sprite.destroy();
      this.bed.health = Math.max(0, this.bed.health - 8);
      this.cameras.main.shake(200, 0.008);
      this.say('Тля успела погрызть листья: −8 здоровья. Продолжаем лечение.', HEX.magentaDark);
    }
    game.save();
  }

  confirm() {
    if (this.treated) return;
    if (!this.diag && this.bed.diagnosed === null) { this.say('Сначала скан (1): без диагноза лечить вслепую рискованно.', HEX.orangeDark); return; }
    if (this.seq.includes('water') && this.bed.noWater) { this.say('Сегодня поливать нельзя: после спрея от кладоспориоза нужна сухость.', HEX.magentaDark); return; }
    const mult = this.grades.length ? this.grades.reduce((s, g) => s + g.mult, 0) / this.grades.length : 1;
    const res = game.treat(this.bed, this.seq, mult);
    if (res.blocked) { this.say(res.msg, HEX.magentaDark); sound.play('miss'); return; }   // ресурс кончился — ритуал не начат
    this.treated = true;
    this.hitStop(res.ok); sound.play(res.ok ? 'ok' : 'fail');
    if (res.ok) this.garden.heal(); else this.garden.fail();
    if (game.newPage) { const k = game.newPage; game.newPage = null; this.time.delayedCall(900, () => this.pageUnlocked(k)); }
    this.say(`${res.ok ? 'Успех.' : 'Неудача.'} ${res.msg} «На ферму» — Esc.`, res.ok ? HEX.greenDark : HEX.magentaDark);
    game.save();
    events.emit('stats');
  }

  harvest() {
    const n = game.harvestBed(this.bed);
    if (n) { this.garden.harvest(n); sound.play('coin'); this.say(`Собрано ${n} шт. Продайте урожай в лавке Огавы.`, HEX.greenDark); game.save(); events.emit('stats'); }
    else this.say('Урожай собирают только со здорового созревшего растения.', HEX.orangeDark);
  }

  /** Новая страница дневника: листок вылетает и раскрывается. */
  pageUnlocked(key: string) {
    sound.play('page');
    const c = CLASSES.find((x) => x.key === key)!;
    const card = this.add.container(200, 62).setDepth(80)   // над паспортом грядки — не заслоняет растение
     .setScale(0.2).setAlpha(0);
    const g = this.add.graphics(); g.fillStyle(C.ink, 1).fillRect(-124, -44, 248, 88).fillStyle(0xf6e7c1, 1).fillRect(-120, -40, 240, 80).fillStyle(0x8e2230, 1).fillRect(-120, -40, 240, 18);
    card.add([g, text(this, 0, -31, 'НОВАЯ СТРАНИЦА ДНЕВНИКА', 12, HEX.paper).setOrigin(0.5), text(this, 0, -2, c.name, 18).setOrigin(0.5), text(this, 0, 22, `Записей: ${game.data.pages.length}/7 · Tab — открыть`, 12, '#8a6a4a').setOrigin(0.5)]);
    this.tweens.add({ targets: card, scale: 1, alpha: 1, angle: { from: -12, to: 0 }, duration: 450, ease: 'Back.out' });
    this.tweens.add({ targets: card, alpha: 0, y: 40, delay: 3200, duration: 400, onComplete: () => card.destroy() });
  }

  // ---------- эффекты ----------
  glitch() {
    this.cameras.main.flash(120, 63, 208, 201);
    const lines = this.add.graphics().setDepth(100);
    for (let i = 0; i < 18; i++) lines.fillStyle(i % 2 ? C.magenta : C.teal, 0.5).fillRect(0, Math.random() * 540, 960, 2 + Math.random() * 4);
    this.time.delayedCall(180, () => lines.destroy());
  }

  ring(grade: Grade) {
    const r = this.add.circle(this.fuku.x, this.fuku.y + 10, 10).setStrokeStyle(3, grade.color).setDepth(50);
    this.tweens.add({ targets: r, radius: 60, alpha: 0, duration: 400, onComplete: () => r.destroy() });
    const col = '#' + grade.color.toString(16).padStart(6, '0');
    const tag = text(this, this.fuku.x - 30, this.fuku.y + 46, grade.label, 22, col, { stroke: HEX.ink, strokeThickness: 5 }).setOrigin(0.5).setDepth(51);
    this.tweens.add({ targets: tag, y: tag.y - 22, alpha: 0, duration: 750, onComplete: () => tag.destroy() });
  }

  hitStop(ok: boolean) {
    // «стоп-кадр» в духе Katana Zero: краткая заморозка и вспышка
    this.tweens.pauseAll();
    this.cameras.main.flash(90, ok ? 63 : 255, ok ? 208 : 79, ok ? 201 : 154);
    if (!ok) this.cameras.main.shake(160, 0.006);
    this.time.delayedCall(90, () => this.tweens.resumeAll());
  }

  // ---------- интерфейс ----------
  step(): number {
    if (this.treated) return 4;
    if (this.seq.length) return 3;
    if (this.diag) return 2;
    return 1;
  }

  button(x: number, y: number, w: number, key: string, label: string, cmd: Cmd, enabled = true, accent = false) {
    const h = 30;
    const g = this.add.graphics();
    const fill = !enabled ? 0x2a2844 : accent ? 0x3a2f5c : 0x23213d;
    g.fillStyle(fill, 1).fillRect(x, y, w, h);
    g.lineStyle(1, !enabled ? 0x44425e : accent ? C.magenta : C.teal, 1).strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    const kt = text(this, x + 8, y + 7, key, 13, enabled ? HEX.teal : '#55536e');
    const lt = text(this, x + 14 + kt.width, y + 6, label, 15, enabled ? HEX.white : '#66647e');
    const zone = this.add.zone(x, y, w, h).setOrigin(0);
    if (enabled) {
      zone.setInteractive({ useHandCursor: true })
        .on('pointerover', () => g.clear().fillStyle(0x45407a, 1).fillRect(x, y, w, h).lineStyle(1, C.teal, 1).strokeRect(x + 0.5, y + 0.5, w - 1, h - 1))
        .on('pointerout', () => this.redraw())
        .on('pointerdown', () => this.command(cmd));
    }
    [g, kt, lt, zone].forEach((o) => this.ui.add(o));
  }

  redraw() {
    this.ui.removeAll(true);
    const b = this.bed, add = (o: Phaser.GameObjects.GameObject) => this.ui.add(o);
    const sick = !isHealthy(game.cls(b));
    this.garden?.refresh();

    // шаги
    const steps = ['Скан', 'Диагноз', 'Ритуал', 'Результат'], cur = this.step();
    steps.forEach((s, i) => {
      const x = 400 + i * 136, active = i + 1 === cur, done = i + 1 < cur;
      add(text(this, x, 12, `${i + 1}. ${s}`, 15, active ? HEX.magenta : done ? HEX.teal : '#66647e'));
      if (i < 3) add(text(this, x + 112, 12, '›', 15, '#66647e'));
    });

    // паспорт грядки
    add(paperPanel(this, 24, 14, 352, 96));
    add(text(this, 40, 22, `Грядка ${b.id + 1} · ${b.crop ? CROP_NAME[b.crop] : 'пусто'}`, 20));
    if (b.crop) {
      add(text(this, 40, 52, `Здоровье: ${b.health}`, 16));
      add(bar(this, 186, 55, 174, 12, b.health / 100, b.health > 50 ? C.green : C.magenta));
      add(text(this, 40, 76, `${['Росток', 'Растёт', 'Созрело'][b.stage]}${b.watered ? ' · полито' : ''} · линза ${game.data.fukuCharge}/${game.data.fukuMax} · фунгицид ${game.data.fungicide}`, 14, '#555'));
    } else {   // растение удалено: здоровья нет, только подсказка
      add(text(this, 40, 52, 'Растение удалено — соседние грядки в безопасности.', 14, '#555', { wordWrap: { width: 320 } }));
      add(text(this, 40, 76, `Новые семена — в лавке Огавы · фунгицид ${game.data.fungicide}`, 14, '#555'));
    }

    // реплика Фуку — внизу справа
    if (this.msg) {
      const t = text(this, 416, 478, this.msg, 15, this.msgColor, { wordWrap: { width: 510 }, lineSpacing: 2 });
      add(paperPanel(this, 400, 470, 540, Math.max(56, t.height + 16)));
      add(t);
    }

    // карточка листа
    const cx = 420, cy = 40;
    add(neonPanel(this, cx, cy, 240, 240, this.diag ? C.teal : 0x55536e));
    if (this.diag) {
      const img = this.add.image(cx + 120, cy + 120, `card:${b.card}`).setDisplaySize(224, 224);
      if (viewTransform(this.view).flip) img.setFlipX(true);
      add(img);
    } else add(text(this, cx + 120, cy + 120, 'ЛИНЗА\nвыключена', 18, '#8a88b0', { align: 'center' }).setOrigin(0.5));

    // топ-3 диагноза
    const dx = 690, dy = 40;
    add(neonPanel(this, dx, dy, 250, 240, this.diag ? C.teal : 0x55536e));
    add(text(this, dx + 14, dy + 10, 'ДИАГНОЗ · топ-3', 16, HEX.teal));
    if (this.diag) {
      let y = dy + 40;
      this.diag.top.forEach((t, i) => {
        const c = CLASSES[t.id];
        const name = text(this, dx + 14, y, c.name, 15, i === 0 ? HEX.white : '#b9b7d9', { wordWrap: { width: 222 } });
        add(name); y += name.height + 2;
        add(text(this, dx + 14, y, `${CROP_NAME[c.crop]} · ${Math.round(t.p * 100)}%`, 13, '#8a88b0')); y += 18;
        add(bar(this, dx + 14, y, 222, 8, t.p, i === 0 ? (t.p >= 0.6 ? C.teal : C.orange) : 0x6b6990, 0x15132a)); y += 20;
      });
      add(text(this, dx + 14, dy + 218, `Ракурс ${this.view + 1} · ${Math.round(this.diag.ms)} мс`, 13, '#8a88b0'));
    } else add(text(this, dx + 14, dy + 50, 'Нет данных.\nСначала скан.', 15, '#8a88b0'));

    // ритуал + подсказка из дневника
    add(neonPanel(this, 400, 290, 540, 62, C.magenta));
    const seqText = this.seq.length ? this.seq.map((a, i) => `${ACTION_NAME[a]} [${this.grades[i].label}]`).join(' › ') : '— выберите действия ниже —';
    add(text(this, 414, 297, `РИТУАЛ: ${seqText}`, 16, HEX.white, { wordWrap: { width: 512 } }));
    const top = this.diag ? CLASSES[this.diag.top[0].id] : null;
    // весной (обучение) ритуал подсказывается здесь; летом и осенью — только в дневнике (Tab)
    const hint = !top ? 'Дневник Хару: ритуал подскажет диагноз' : game.data.season === 1 ? `Дневник Хару: «${top.name}» › ${ritualText(top)}` : `«${top.name}» — ритуал в дневнике Хару (Tab)`;
    add(text(this, 414, 327, hint, 14, HEX.orange));

    // кнопки
    const on = (c: Cmd) => this.canDo(c) === true;
    this.button(400, 360, 104, '1', 'Скан', 'scan', on('scan'));
    this.button(510, 360, 140, 'R', 'Др. ракурс', 'view', on('view'));
    this.button(656, 360, 92, '2', 'Полив', 'water', on('water'));
    this.button(754, 360, 90, '3', 'Спрей', 'spray', on('spray'));
    this.button(850, 360, 90, '4', 'Обрезка', 'prune', on('prune'));
    this.button(400, 396, 126, '7', 'Удалить', 'remove', on('remove'));
    this.button(532, 396, 132, '0', 'Не лечить', 'none', on('none'));
    this.button(670, 396, 92, 'Bk', 'Сброс', 'reset', on('reset'));
    this.button(768, 396, 172, 'Enter', 'Подтвердить', 'confirm', on('confirm'), true);
    this.button(400, 432, 150, 'H', 'Урожай', 'harvest', on('harvest'));
    this.button(556, 432, 160, 'Esc', 'На ферму', 'back');

    if (this.gestureOn) {
      const pv = this.add.graphics().setDepth(30); pv.fillStyle(C.ink, 1).fillRect(244, 132, 128, 98).lineStyle(2, C.teal, 1).strokeRect(245, 133, 126, 96);
      add(pv);
      if (this.textures.exists('cam-proc')) add(this.add.image(248, 136, 'cam-proc').setOrigin(0).setDepth(31));
      add(text(this, 724, 434, 'G1 скан · G2 полив · G3 спрей\nG4 обрезка · G5 подтвердить', 11, '#b9b7d9', { lineSpacing: 0 }));
    } else add(text(this, 724, 434, gestures.possible ? 'Клавиши: оценка Good ×0,7\nЖесты — меню «Ритуалы рук»' : 'Веб-версия: клавиши и мышь\nЖесты — в версии для ПК', 11, '#8a88b0', { lineSpacing: 0 }));
  }

  closing = false;

  close() {
    if (this.closing) return;
    this.closing = true;
    game.addMinutes(this.treated ? 25 : 10);   // лечение занимает время
    sound.setMood('day');
    this.cameras.main.fadeOut(200, 28, 26, 51);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.wake('World');
      events.emit('refresh-beds');
      events.emit('stats');
    });
  }
}
