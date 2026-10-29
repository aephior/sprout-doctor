// «Тест жестов» — протокол испытаний AI-механики №2 для отчёта.
// Игра показывает случайный жест из словаря, даёт 5 секунд и записывает: что распознано, за сколько, с какой оценкой Q.
// Итог: accuracy, доля ложных срабатываний, средняя задержка, матрица ошибок; результат сохраняется в файл (версия для ПК).
import { gestures } from '../ai/gestureCtl';
import { tracker } from '../ai/hands';
import { GESTURE_INFO, GestureId, GestureEvent, FrameInfo, POSE_NAME } from '../ai/gestures';
import { text, HEX, C, neonPanel, paperPanel } from '../ui/ui';
import { drawHand, cameraTexture } from '../ui/hand';
import { sound } from '../audio/sound';

const IDS: GestureId[] = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'];
const WINDOW_MS = 5000;
const KEY = 'sd-gesture-tests';

interface Trial { target: GestureId; got: GestureId | null; ms: number; q: number; grade: string; light: string; tester: string }

export class GestureTest extends Phaser.Scene {
  trials: Trial[] = [];
  queue: GestureId[] = [];
  target: GestureId | null = null;
  started = 0;
  tester = 'А';
  light = 'день';
  reps = 5;
  ui!: Phaser.GameObjects.Container;
  ghost!: Phaser.GameObjects.Graphics;
  updateCam?: () => void;
  info: FrameInfo | null = null;
  status = '';
  off?: () => void;

  constructor() { super('GestureTest'); }

  create() {
    this.trials = this.load_(); this.queue = []; this.target = null; this.status = ''; this.updateCam = undefined; this.info = null;
    this.add.rectangle(0, 0, 960, 540, 0x1c1a33).setOrigin(0);
    this.ui = this.add.container(0, 0);
    this.ghost = this.add.graphics().setDepth(10);
    this.off = gestures.listen({ frame: (i) => { this.info = i; }, gesture: (e) => this.onGesture(e) });
    this.events.once('shutdown', () => { this.off?.(); this.updateCam = undefined; gestures.stop(); });
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.key(e));
    this.time.addEvent({ delay: 200, loop: true, callback: () => this.redraw() });
    void this.enable();
  }

  async enable() {
    this.status = 'Запускаю камеру…';
    if (await gestures.start()) { this.updateCam = cameraTexture(this, 'cam-test', tracker.video, 320, 240); this.status = ''; }
    else this.status = gestures.error;
  }

  key(e: KeyboardEvent) {
    if (e.key === 'Escape') { if (this.target) { this.queue = []; this.target = null; } else this.scene.start('Menu'); return; }
    if (this.target) return;
    if (e.key === 'Enter') this.startRun();
    if (e.key === 't' || e.key === 'T' || e.key === 'е' || e.key === 'Е') this.tester = this.tester === 'А' ? 'Б' : this.tester === 'Б' ? 'В' : 'А';
    if (e.key === 'l' || e.key === 'L' || e.key === 'д' || e.key === 'Д') this.light = this.light === 'день' ? 'лампа' : this.light === 'лампа' ? 'полумрак' : 'день';
    if (e.key === '+' || e.key === '=') this.reps = Math.min(30, this.reps + 5);
    if (e.key === '-') this.reps = Math.max(5, this.reps - 5);
    if (e.key === 'Delete') { this.trials = []; this.save_(); }
    if (e.key === 's' || e.key === 'S' || e.key === 'ы' || e.key === 'Ы') this.download();
  }

  startRun() {
    if (!gestures.active) { this.status = 'Камера не включена.'; return; }
    const q: GestureId[] = [];
    for (let r = 0; r < this.reps; r++) q.push(...IDS);
    for (let i = q.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [q[i], q[j]] = [q[j], q[i]]; }
    this.queue = q;
    this.next();
  }

  next() {
    this.target = this.queue.shift() ?? null;
    if (!this.target) { sound.play('win'); this.save_(); return; }
    this.time.delayedCall(900, () => { this.started = this.time.now; gestures.resetState(); sound.play('click'); });
    this.started = Number.POSITIVE_INFINITY;
  }

  onGesture(e: GestureEvent) {
    if (!this.target || this.time.now < this.started) return;
    this.record(e.id, e.q, e.grade);
  }

  record(got: GestureId | null, q: number, grade: string) {
    const t = this.target!;
    this.trials.push({ target: t, got, ms: got ? Math.round(this.time.now - this.started) : WINDOW_MS, q, grade, light: this.light, tester: this.tester });
    sound.play(got === t ? (grade === 'Perfect' ? 'perfect' : 'good') : 'miss');
    this.cameras.main.flash(80, got === t ? 63 : 255, got === t ? 208 : 79, got === t ? 201 : 154);
    this.target = null;
    this.time.delayedCall(400, () => this.next());
  }

  update() {
    if (this.target && this.time.now - this.started > WINDOW_MS) this.record(null, 0, '—');
    this.updateCam?.();
    this.ghost.clear();
    if (this.info?.landmarks) drawHand(this.ghost, this.info.landmarks, 24, 64, 320, 240, C.teal, 0.95, 3);
  }

  stats() {
    const n = this.trials.length, ok = this.trials.filter((t) => t.got === t.target);
    const wrong = this.trials.filter((t) => t.got && t.got !== t.target).length;
    const none = this.trials.filter((t) => !t.got).length;
    const per = IDS.map((id) => {
      const tt = this.trials.filter((t) => t.target === id);
      return { id, n: tt.length, acc: tt.length ? tt.filter((t) => t.got === id).length / tt.length : 0 };
    });
    const avgMs = ok.length ? ok.reduce((s, t) => s + t.ms, 0) / ok.length : 0;
    const avgQ = ok.length ? ok.reduce((s, t) => s + t.q, 0) / ok.length : 0;
    return { n, acc: n ? ok.length / n : 0, wrong: n ? wrong / n : 0, none: n ? none / n : 0, per, avgMs, avgQ };
  }

  redraw() {
    this.ui.removeAll(true);
    const add = (o: Phaser.GameObjects.GameObject) => this.ui.add(o);
    add(text(this, 24, 16, 'ТЕСТ ЖЕСТОВ · протокол испытаний «Ритуалов рук»', 22, HEX.teal));
    add(neonPanel(this, 24, 64, 320, 240, gestures.active ? C.teal : 0x55536e));
    if (this.updateCam && this.textures.exists('cam-test')) add(this.add.image(24, 64, 'cam-test').setOrigin(0));
    add(text(this, 24, 312, this.info ? `Поза: ${POSE_NAME[this.info.pose]} · ${gestures.fps} к/с` : (this.status || 'Покажите руку в камеру'), 14, '#b9b7d9'));

    // задание
    add(paperPanel(this, 368, 64, 568, 150));
    if (this.target) {
      const left = Math.max(0, WINDOW_MS - Math.max(0, this.time.now - this.started));
      const wait = this.time.now < this.started;
      add(text(this, 388, 76, wait ? 'Приготовьтесь…' : 'Покажите жест:', 16, '#555'));
      add(text(this, 388, 100, `${this.target} · ${GESTURE_INFO[this.target].name}`, 30));
      add(text(this, 388, 142, GESTURE_INFO[this.target].how, 15, '#3a3550', { wordWrap: { width: 528 } }));
      add(text(this, 388, 184, `Осталось ${(left / 1000).toFixed(1)} с · в очереди ${this.queue.length}`, 15, HEX.orangeDark));
    } else {
      add(text(this, 388, 76, `Испытатель: ${this.tester}   ·   Освещение: ${this.light}   ·   Повторов: ${this.reps} × 7`, 16));
      add(text(this, 388, 104, [
        'Enter — начать серию (жесты в случайном порядке)',
        'T — сменить испытателя (А/Б/В) · L — освещение · +/- — повторы',
        'S — сохранить результаты в файл · Delete — очистить · Esc — меню',
      ].join('\n'), 14, '#3a3550', { lineSpacing: 5 }));
    }

    // итоги
    const s = this.stats();
    add(neonPanel(this, 368, 228, 568, 290, C.magenta));
    add(text(this, 384, 238, `ИТОГИ · попыток ${s.n}`, 16, HEX.white));
    add(text(this, 384, 264, [
      `Точность (accuracy):        ${(s.acc * 100).toFixed(1)}%`,
      `Ложные срабатывания:        ${(s.wrong * 100).toFixed(1)}%`,
      `Не распознано за 5 с:       ${(s.none * 100).toFixed(1)}%`,
      `Средняя задержка:           ${(s.avgMs / 1000).toFixed(2)} с`,
      `Средняя оценка Q (верные):  ${s.avgQ.toFixed(2)}`,
    ].join('\n'), 14, '#d9d7f0', { lineSpacing: 4 }));
    s.per.forEach((p, i) => {
      const y = 380 + Math.floor(i / 2) * 30, x = 384 + (i % 2) * 276;
      add(text(this, x, y, `${p.id} ${GESTURE_INFO[p.id].name}`, 14, '#b9b7d9'));
      add(text(this, x + 200, y, p.n ? `${Math.round(p.acc * 100)}% (${p.n})` : '—', 14, p.n ? (p.acc >= 0.9 ? HEX.teal : p.acc >= 0.7 ? HEX.orange : HEX.magenta) : '#66647e'));
    });
    add(paperPanel(this, 24, 340, 320, 178));
    add(text(this, 40, 350, 'Как проводить испытания', 16));
    add(text(this, 40, 376, [
      '1. Сидеть ~60 см от камеры.',
      '2. 3 человека × 2 вида освещения.',
      '3. На каждого: 30 повторов × 7 жестов',
      '   (можно сериями по 5).',
      '4. Нажать S — прислать файл',
      '   для отчёта.',
    ].join('\n'), 13, '#3a3550', { lineSpacing: 3 }));
  }

  load_(): Trial[] { try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; } }
  save_() { try { localStorage.setItem(KEY, JSON.stringify(this.trials)); } catch { /* ignore */ } }

  download() {
    if (!this.trials.length) return;
    const data = JSON.stringify({ version: 1, window_ms: WINDOW_MS, classifier: gestures.calibrated ? 'knn' : 'rules', stats: this.stats(), trials: this.trials }, null, 1);
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    a.download = `sprout-gesture-test-${new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')}.json`;
    a.click();
    this.status = 'Файл сохранён в папку «Загрузки».';
  }
}
