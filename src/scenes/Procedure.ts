// «Процедурная»: крупный план грядки. Скан Линзой Фуку → диагноз (нейросеть) → ритуал → результат.
// Этап 1: ритуал вводится клавишами 1–7 (режим без камеры, оценка всегда Good ×0,7).
// Этап 2: те же действия будут приходить от модуля жестов (камера), с оценкой Perfect/Good/Miss.
import { game, Bed } from '../state/game';
import { CLASSES, CROP_NAME, ACTION_NAME, Action, isHealthy } from '../data/diseases';
import { diagnose, loadLeafModel, Diagnosis, viewTransform } from '../ai/leaf';
import { events } from '../state/events';
import { text, HEX, C, paperPanel, neonPanel, bar, FONT } from '../ui/ui';

const KEY_ACTION: Record<string, Action> = { '2': 'water', '3': 'spray', '4': 'prune', '7': 'remove' };
const GRADE = { label: 'Good', mult: 0.7, color: C.orange };   // режим без камеры

export class Procedure extends Phaser.Scene {
  bed!: Bed;
  seq: Action[] = [];
  diag: Diagnosis | null = null;
  view = 0;
  busy = false;
  treated = false;
  ui!: Phaser.GameObjects.Container;
  plant!: Phaser.GameObjects.Sprite;
  fuku!: Phaser.GameObjects.Sprite;
  msg!: Phaser.GameObjects.Text;

  constructor() { super('Procedure'); }

  init(data: { bedId: number }) {
    this.bed = game.data.beds[data.bedId];
    this.seq = []; this.diag = null; this.view = 0; this.busy = false; this.treated = false;
  }

  create() {
    const g = this.add.graphics();
    const grad = [0x1c1a33, 0x232141, 0x2b2a4c, 0x34315a];
    grad.forEach((c, i) => g.fillStyle(c, 1).fillRect(0, i * 110, 960, 111));
    g.fillStyle(0x6a4329, 1).fillRect(0, 440, 960, 100);
    g.fillStyle(0x8a5a3b, 1).fillRect(0, 440, 960, 8);
    for (let i = 0; i < 60; i++) g.fillStyle(0x4a2e1c, 1).fillRect((i * 131) % 960, 456 + ((i * 37) % 70), 14, 4);

    this.plant = this.add.sprite(190, 452, 'plant', 1).setOrigin(0.5, 1).setScale(15);
    this.tweens.add({ targets: this.plant, angle: { from: -1.2, to: 1.2 }, duration: 2200, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.fuku = this.add.sprite(360, 110, 'fuku', 0).setScale(4).play('fuku-idle');
    this.tweens.add({ targets: this.fuku, y: 118, duration: 1000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    this.ui = this.add.container(0, 0);
    this.msg = text(this, 400, 406, '', 17, HEX.paper, { wordWrap: { width: 540 }, lineSpacing: 3 });
    this.redraw();
    this.cameras.main.fadeIn(250, 28, 26, 51);

    const kb = this.input.keyboard!;
    kb.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    loadLeafModel().catch(() => { /* ошибка покажется при скане */ });
    this.say(this.bed.diagnosed === null ? 'Нажмите 1 — я просканирую лист.' : 'Лист уже просканирован сегодня.');
  }

  say(s: string, color = HEX.paper) { this.msg.setText(s).setColor(color); }

  onKey(e: KeyboardEvent) {
    if (this.busy) return;
    const k = e.key;
    if (k === 'Escape') return this.close();
    if (k === '1') return void this.scan(0);
    if (k === 'r' || k === 'R' || k === 'к' || k === 'К') return void this.scan(this.view + 1);
    if (this.treated) return;
    if (KEY_ACTION[k]) {
      if (this.seq.length >= 3) return;
      this.seq.push(KEY_ACTION[k]);
      this.ring(GRADE.color);
      this.redraw();
    } else if (k === 'Backspace') { this.seq = []; this.redraw(); }
    else if (k === '0') { this.seq = []; this.confirm(); }
    else if (k === 'Enter' || k === '5') this.confirm();
    else if (k === 'h' || k === 'H' || k === 'р' || k === 'Р') this.harvest();
  }

  async scan(view: number) {
    const d = game.data;
    if (d.fukuCharge <= 0) { this.say('Заряд линзы на нуле. Он восстановится ночью.', HEX.magenta); return; }
    this.busy = true;
    this.fuku.setFrame(2).anims.stop();
    this.glitch();
    try {
      const img = this.textures.get(`card:${this.bed.card}`).getSourceImage() as HTMLImageElement;
      const res = await diagnose(img, view);
      d.fukuCharge--; d.stats.scans++;
      this.diag = res; this.view = view;
      this.bed.diagnosed = res.top[0].id;
      const top = res.top[0];
      const name = `${CLASSES[top.id].name}`;
      if (top.p < 0.6) this.say(`Уверенность низкая — ${Math.round(top.p * 100)}%. Похоже на «${name}», но лучше проверить другой ракурс (R).`, HEX.orange);
      else this.say(`Диагноз: «${name}» — ${Math.round(top.p * 100)}%. ${isHealthy(CLASSES[top.id]) ? 'Можно не лечить: нажмите 0.' : 'Соберите ритуал и подтвердите Enter.'}`, HEX.teal);
    } catch (err) {
      this.say(`Линза не отвечает: ${(err as Error).message}`, HEX.magenta);
    }
    this.fuku.play('fuku-idle');
    this.busy = false;
    events.emit('stats');
    this.redraw();
  }

  confirm() {
    if (this.treated) return;
    if (this.seq.includes('water') && this.bed.noWater) { this.say('Сегодня поливать нельзя: после спрея от кладоспориоза нужна сухость.', HEX.magenta); return; }
    const res = game.treat(this.bed, this.seq, GRADE.mult);
    this.treated = true;
    this.hitStop(res.ok);
    this.say(`${res.ok ? '✓' : '✗'} ${res.msg}`, res.ok ? HEX.teal : HEX.magenta);
    game.save();
    events.emit('stats');
    this.redraw();
  }

  harvest() {
    const n = game.harvestBed(this.bed);
    if (n) { this.say(`Собрано ${n} шт. Продайте урожай в лавке Огавы.`, HEX.teal); game.save(); events.emit('stats'); }
    else this.say('Урожай можно собрать только со здорового созревшего растения.', HEX.orange);
    this.redraw();
  }

  // ---------- эффекты ----------
  glitch() {
    const cam = this.cameras.main;
    cam.flash(120, 63, 208, 201);
    const lines = this.add.graphics().setDepth(100);
    for (let i = 0; i < 18; i++) {
      lines.fillStyle(i % 2 ? C.magenta : C.teal, 0.5).fillRect(0, Math.random() * 540, 960, 2 + Math.random() * 4);
    }
    this.time.delayedCall(180, () => lines.destroy());
  }

  ring(color: number) {
    const r = this.add.circle(this.fuku.x, this.fuku.y + 10, 10).setStrokeStyle(3, color).setDepth(50);
    this.tweens.add({ targets: r, radius: 60, alpha: 0, duration: 400, onComplete: () => r.destroy() });
    const tag = text(this, this.fuku.x, this.fuku.y - 50, GRADE.label, 20, '#e8833a', { stroke: HEX.ink, strokeThickness: 4 }).setOrigin(0.5);
    this.tweens.add({ targets: tag, y: tag.y - 20, alpha: 0, duration: 700, onComplete: () => tag.destroy() });
  }

  hitStop(ok: boolean) {
    // «стоп-кадр» в духе Katana Zero: краткая заморозка и вспышка
    this.tweens.pauseAll();
    this.cameras.main.flash(90, ok ? 63 : 255, ok ? 208 : 79, ok ? 201 : 154);
    if (!ok) this.cameras.main.shake(160, 0.006);
    this.time.delayedCall(90, () => this.tweens.resumeAll());
  }

  // ---------- интерфейс ----------
  redraw() {
    this.ui.removeAll(true);
    const b = this.bed, add = (o: Phaser.GameObjects.GameObject) => this.ui.add(o);
    // растение
    const sick = !isHealthy(game.cls(b));
    this.plant.setFrame(b.dead ? 4 : sick ? (b.health > 50 ? 2 : 3) : b.stage === 0 ? 0 : 1);

    // паспорт грядки
    add(paperPanel(this, 24, 24, 300, 120));
    add(text(this, 40, 34, `Грядка ${b.id + 1} · ${b.crop ? CROP_NAME[b.crop] : '—'}`, 20));
    add(text(this, 40, 66, `Здоровье: ${b.health}`, 16));
    add(bar(this, 176, 69, 134, 12, b.health / 100, b.health > 50 ? C.green : C.magenta));
    add(text(this, 40, 90, `Стадия: ${['росток', 'растёт', 'созрело'][b.stage]}${b.watered ? ' · полито' : ''}`, 16));
    add(text(this, 40, 112, `Заряд линзы: ${game.data.fukuCharge}/${game.data.fukuMax} · Фунгицид: ${game.data.fungicide}`, 14, '#555'));

    // карточка листа (видна через линзу после скана)
    const cx = 420, cy = 40;
    add(neonPanel(this, cx, cy, 240, 240, this.diag ? C.teal : 0x55536e));
    if (this.diag) {
      const img = this.add.image(cx + 120, cy + 120, `card:${b.card}`).setDisplaySize(224, 224);
      if (viewTransform(this.view).flip) img.setFlipX(true);
      add(img);
      add(text(this, 690 + 14, 40 + 218, `Ракурс ${this.view + 1} · ${Math.round(this.diag.ms)} мс`, 13, '#8a88b0'));
    } else add(text(this, cx + 120, cy + 120, 'ЛИНЗА\nвыключена\n\n[1] скан', 18, '#8a88b0', { align: 'center' }).setOrigin(0.5));

    // топ-3 диагноза
    const dx = 690, dy = 40;
    add(neonPanel(this, dx, dy, 250, 240, this.diag ? C.teal : 0x55536e));
    add(text(this, dx + 14, dy + 10, 'ДИАГНОЗ · топ-3', 16, HEX.teal));
    if (this.diag) {
      let y = dy + 40;
      this.diag.top.forEach((t, i) => {
        const c = CLASSES[t.id];
        const name = text(this, dx + 14, y, `${c.name}`, 15, i === 0 ? HEX.white : '#b9b7d9', { wordWrap: { width: 222 } });
        add(name); y += name.height + 2;
        add(text(this, dx + 14, y, `${CROP_NAME[c.crop]} · ${Math.round(t.p * 100)}%`, 13, '#8a88b0')); y += 18;
        add(bar(this, dx + 14, y, 222, 8, t.p, i === 0 ? (t.p >= 0.6 ? C.teal : C.orange) : 0x6b6990, 0x15132a)); y += 20;
      });
    }
    else add(text(this, dx + 14, dy + 50, 'Нет данных.\nСначала скан.', 15, '#8a88b0'));

    // ритуал
    add(neonPanel(this, 400, 296, 540, 100, C.magenta));
    const seqText = this.seq.length ? this.seq.map((a) => ACTION_NAME[a]).join(' → ') : '—';
    add(text(this, 414, 304, `РИТУАЛ: ${seqText}`, 18, HEX.white));
    add(text(this, 414, 332, '[2] Полив  [3] Спрей  [4] Обрезка  [7] Удалить  [0] Не лечить', 14, '#b9b7d9', { fontFamily: FONT }));
    add(text(this, 414, 352, '[Enter] Подтвердить   [Backspace] Сброс   [R] Другой ракурс', 14, '#b9b7d9'));
    add(text(this, 414, 372, '[H] Собрать урожай   [Esc] Вернуться на ферму', 14, '#b9b7d9'));

    // режим управления
    add(text(this, 24, 520, 'Режим без камеры: каждый жест = Good ×0,7. Управление жестами — следующий этап.', 13, '#8a88b0').setOrigin(0, 1));
  }

  close() {
    this.cameras.main.fadeOut(200, 28, 26, 51);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.wake('World');
      events.emit('refresh-beds');
      events.emit('stats');
    });
  }
}
