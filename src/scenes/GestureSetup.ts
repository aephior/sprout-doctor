// «Ритуалы рук»: включение камеры, калибровка (запись образцов поз для kNN) и проверка жестов с оценкой Q.
import { gestures } from '../ai/gestureCtl';
import { tracker } from '../ai/hands';
import { POSES, POSE_NAME, Pose, GESTURE_INFO, GestureId, FrameInfo, GestureEvent } from '../ai/gestures';
import { text, HEX, C, neonPanel, paperPanel, bar } from '../ui/ui';
import { drawHand, cameraTexture } from '../ui/hand';

const RECORD_MS = 2500;

export class GestureSetup extends Phaser.Scene {
  ui!: Phaser.GameObjects.Container;
  ghost!: Phaser.GameObjects.Graphics;
  cam?: Phaser.GameObjects.Image;
  updateCam?: () => void;
  info: FrameInfo | null = null;
  lastEvent: GestureEvent | null = null;
  status = '';
  recPose: Pose | null = null;
  recUntil = 0;
  countdownUntil = 0;
  off?: () => void;

  constructor() { super('GestureSetup'); }

  create() {
    this.updateCam = undefined; this.info = null; this.lastEvent = null; this.status = ''; this.recPose = null;
    this.add.rectangle(0, 0, 960, 540, 0x1c1a33).setOrigin(0);
    this.ui = this.add.container(0, 0);
    this.ghost = this.add.graphics().setDepth(10);
    this.off = gestures.listen({
      frame: (i) => { this.info = i; },
      gesture: (e) => { this.lastEvent = e; this.flash(e); },
    });
    this.events.once('shutdown', () => { this.off?.(); this.updateCam = undefined; gestures.record(null); gestures.stop(); });
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') this.back();
      const n = Number(e.key);
      if (n >= 1 && n <= POSES.length) this.startRecord(POSES[n - 1]);
    });
    if (gestures.wanted && gestures.possible) void this.enable();
    this.time.addEvent({ delay: 250, loop: true, callback: () => this.redraw() });
    this.redraw();
  }

  async enable() {
    this.status = 'Запускаю камеру и модель руки…'; this.redraw();
    const ok = await gestures.start();
    if (ok) {
      gestures.wanted = true;
      this.updateCam = cameraTexture(this, 'cam-setup', tracker.video, 400, 300);
      this.status = '';
    } else this.status = gestures.error;
    this.redraw();
  }

  disable() { gestures.wanted = false; gestures.stop(); this.updateCam = undefined; this.redraw(); }

  startRecord(p: Pose) {
    if (!gestures.active) { this.status = 'Сначала включите камеру.'; this.redraw(); return; }
    this.recPose = p;
    this.countdownUntil = this.time.now + 1500;
    this.recUntil = this.countdownUntil + RECORD_MS;
  }

  flash(e: GestureEvent) {
    const col = e.grade === 'Perfect' ? C.teal : e.grade === 'Good' ? C.orange : C.magenta;
    this.cameras.main.flash(80, (col >> 16) & 255, (col >> 8) & 255, col & 255);
  }

  update() {
    // запись образцов с обратным отсчётом
    if (this.recPose) {
      const now = this.time.now;
      if (now >= this.countdownUntil && !gestures.recording) gestures.record(this.recPose);
      if (now >= this.recUntil) { gestures.record(null); gestures.saveCalibration(); this.recPose = null; this.redraw(); }
    }
    this.updateCam?.();
    this.ghost.clear();
    if (this.info?.landmarks) {
      drawHand(this.ghost, this.info.landmarks, 24, 70, 400, 300);
      // кольцо удержания
      const w = this.info.landmarks[0];
      const cx = 24 + (1 - w.x) * 400, cy = 70 + w.y * 300;
      this.ghost.lineStyle(4, C.orange, 0.9).beginPath();
      this.ghost.arc(cx, cy, 22, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * this.info.hold, false).strokePath();
    }
  }

  redraw() {
    this.ui.removeAll(true);
    const add = (o: Phaser.GameObjects.GameObject) => this.ui.add(o);
    add(text(this, 24, 18, 'РИТУАЛЫ РУК · камера и калибровка', 24, HEX.teal));

    // превью камеры
    add(neonPanel(this, 24, 70, 400, 300, gestures.active ? C.teal : 0x55536e));
    if (gestures.active && this.textures.exists('cam-setup')) add(this.add.image(24, 70, 'cam-setup').setOrigin(0));
    else if (!this.status) add(text(this, 224, 200, gestures.possible ? 'Камера выключена' : 'Камера недоступна\nв веб-версии', 18, '#8a88b0', { align: 'center' }).setOrigin(0.5));

    // распознавание
    const i = this.info;
    add(paperPanel(this, 24, 386, 400, 116));
    add(text(this, 40, 396, `Поза: ${i ? POSE_NAME[i.pose] : '—'}`, 18));
    add(text(this, 40, 422, `Уверенность ${i ? Math.round(i.conf * 100) : 0}%`, 15, '#555'));
    add(bar(this, 200, 425, 210, 10, i?.conf ?? 0, C.teal));
    add(text(this, 40, 444, `Классификатор: ${gestures.calibrated ? 'kNN по вашей калибровке' : 'базовые правила'} · ${gestures.fps} к/с`, 14, '#555'));
    const e = this.lastEvent;
    add(text(this, 40, 470, e ? `Жест ${e.id} «${GESTURE_INFO[e.id].name}»: Q = ${e.q.toFixed(2)} → ${e.grade}` : 'Сделайте любой жест из списка справа', 16,
      e ? (e.grade === 'Perfect' ? HEX.greenDark : e.grade === 'Good' ? HEX.orangeDark : HEX.magentaDark) : HEX.ink));

    // калибровка
    add(neonPanel(this, 448, 70, 488, 300, C.magenta));
    add(text(this, 462, 80, 'КАЛИБРОВКА: покажите позу и нажмите её номер', 15, HEX.white));
    POSES.forEach((p, k) => {
      const y = 112 + k * 34, n = gestures.count(p), rec = this.recPose === p;
      const t = text(this, 462, y, `${k + 1}. ${POSE_NAME[p]}`, 16, rec ? HEX.magenta : HEX.white).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => this.startRecord(p));
      add(t);
      const left = Math.max(0, this.countdownUntil - this.time.now);
      add(text(this, 720, y, rec ? (left > 0 ? `через ${Math.ceil(left / 500) / 2} с…` : 'запись…') : `${n} образцов`, 15, n >= 30 ? HEX.teal : '#b9b7d9'));
    });
    add(text(this, 462, 352, 'Для «Нет жеста» — расслабленная рука, случайные движения.', 13, '#8a88b0'));

    // словарь жестов
    add(paperPanel(this, 448, 386, 488, 116));
    const ids: GestureId[] = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'];
    ids.forEach((id, k) => add(text(this, 462 + (k % 2) * 240, 396 + Math.floor(k / 2) * 25, `${id} ${GESTURE_INFO[id].name}`, 14, HEX.ink)));   // 4 строки помещаются в панель
    

    // кнопки
    const btn = (x: number, label: string, fn: () => void, on = true) => {
      const t = text(this, x, 534, `[ ${label} ]`, 15, on ? '#ff4f9a' : '#55536e').setOrigin(0, 1);
      if (on) t.setInteractive({ useHandCursor: true }).on('pointerdown', fn);
      add(t);
    };
    btn(24, gestures.active ? 'Выключить камеру' : 'Включить камеру', () => (gestures.active ? this.disable() : void this.enable()), gestures.possible);
    btn(240, 'Сбросить калибровку', () => { gestures.resetCalibration(); this.redraw(); }, gestures.calibrated);
    btn(480, 'Скачать датасет', () => this.download(), gestures.rec.knn.samples.length > 0 && !!window.__SD_STANDALONE);
    btn(700, 'Тест жестов', () => this.scene.start('GestureTest'), gestures.possible);
    btn(850, 'Назад', () => this.back());
    if (this.status) add(text(this, 224, 200, this.status, 14, HEX.orange, { wordWrap: { width: 380 }, align: 'center' }).setOrigin(0.5));   // внутри окна камеры, с переносом
  }

  download() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([gestures.exportDataset()], { type: 'application/json' }));
    a.download = `sprout-gestures-${Date.now()}.json`;
    a.click();
  }

  back() { this.scene.start('Menu'); }
}
