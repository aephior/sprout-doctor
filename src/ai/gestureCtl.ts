// Связка камеры, классификатора и автомата жестов + настройки игрока (вкл/выкл, калибровка).
import { tracker, HandFrame } from './hands';
import { GestureRecognizer, GestureEvent, FrameInfo, features, Pose } from './gestures';
import { cameraPossible } from '../assets';

const KEY_ON = 'sd-gestures-on', KEY_KNN = 'sd-gesture-knn';
type Listener = { frame?: (i: FrameInfo, f: HandFrame) => void; gesture?: (e: GestureEvent) => void };

class GestureController {
  rec = new GestureRecognizer();
  private ls = new Set<Listener>();
  private unsub: (() => void) | null = null;
  error = '';
  recording: Pose | null = null;
  recorded = 0;

  constructor() {
    try { const s = localStorage.getItem(KEY_KNN); if (s) this.rec.knn.load(JSON.parse(s)); } catch { /* нет хранилища */ }
  }

  get wanted() { try { return localStorage.getItem(KEY_ON) === '1'; } catch { return false; } }
  set wanted(v: boolean) { try { localStorage.setItem(KEY_ON, v ? '1' : '0'); } catch { /* ignore */ } }
  get possible() { return cameraPossible(); }
  get active() { return tracker.active; }
  get calibrated() { return this.rec.knn.trained; }
  get fps() { return tracker.fps; }

  listen(l: Listener) { this.ls.add(l); return () => { this.ls.delete(l); }; }

  async start(): Promise<boolean> {
    if (!this.possible) { this.error = 'Камера недоступна в веб-версии. Откройте версию для ПК.'; return false; }
    try {
      await tracker.start();
      if (!this.unsub) this.unsub = tracker.onFrame((f) => this.onFrame(f));
      this.error = '';
      return true;
    } catch (e) {
      const msg = (e as Error).name === 'NotAllowedError' ? 'Доступ к камере запрещён. Разрешите его в настройках браузера.' : (e as Error).message;
      this.error = msg;
      return false;
    }
  }

  stop() { tracker.stop(); this.unsub?.(); this.unsub = null; }
  /** Пауза между визитами на грядки: камера остаётся включённой, кадры не обрабатываются. */
  pause() { tracker.pause(); this.resetState(); }
  /** Сброс истории кадров и удержания: жест, начатый раньше, отсчитывается заново. */
  resetState() { this.rec.frame(null, 'Right', performance.now()); }

  private onFrame(f: HandFrame) {
    if (this.recording && f.landmarks) {
      this.rec.knn.add(features(f.landmarks, f.handed).vec, this.recording);
      this.recorded++;
    }
    const { info, event } = this.rec.frame(f.landmarks, f.handed, f.t);
    this.ls.forEach((l) => l.frame?.(info, f));
    if (event && !this.recording) this.ls.forEach((l) => l.gesture?.(event));
  }

  /** Запись образцов позы для калибровки (kNN). */
  record(pose: Pose | null) { this.recording = pose; this.recorded = 0; }
  clearPose(pose: Pose) { this.rec.knn.samples = this.rec.knn.samples.filter((s) => s.pose !== pose); }
  count(pose: Pose) { return this.rec.knn.samples.filter((s) => s.pose === pose).length; }
  saveCalibration() { try { localStorage.setItem(KEY_KNN, JSON.stringify(this.rec.knn.toJSON())); } catch { /* ignore */ } }
  resetCalibration() { this.rec.knn.samples = []; this.saveCalibration(); }
  /** Датасет для обучения MLP и отчёта по тестированию. */
  exportDataset() {
    return JSON.stringify({ version: 1, features: 'normalized-63', samples: this.rec.knn.toJSON() });
  }
}

export const gestures = new GestureController();
