// Трекинг руки с веб-камеры: MediaPipe Hands (Google, Apache-2.0), файлы модели лежат вместе с игрой.
// Видео обрабатывается только в браузере, никуда не отправляется и не сохраняется.
import { asset } from '../assets';
import type { Pt } from './gestures';

declare const Hands: any;

export interface HandFrame { landmarks: Pt[] | null; handed: 'Left' | 'Right'; t: number }

let scriptLoading: Promise<void> | null = null;
function loadScript(): Promise<void> {
  if (typeof Hands !== 'undefined') return Promise.resolve();
  if (!scriptLoading) scriptLoading = new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = asset('mediapipe/hands.js');
    s.onload = () => res();
    s.onerror = () => { scriptLoading = null; rej(new Error('не удалось загрузить MediaPipe Hands')); };
    document.head.appendChild(s);
  });
  return scriptLoading;
}

export class HandTracker {
  video: HTMLVideoElement = document.createElement('video');
  private hands: any = null;
  private stream: MediaStream | null = null;
  private running = false;
  private paused = false;
  private busySince = 0;          // момент начала обработки кадра (0 — свободно)
  private gen = 0;                // поколение цикла: старый цикл завершается сам
  private starting: Promise<void> | null = null;
  last: HandFrame = { landmarks: null, handed: 'Right', t: 0 };
  fps = 0;
  private listeners = new Set<(f: HandFrame) => void>();

  onFrame(f: (fr: HandFrame) => void) { this.listeners.add(f); return () => this.listeners.delete(f); }

  /** Запуск камеры. Повторные вызовы во время запуска ждут тот же запуск. */
  start(): Promise<void> {
    if (this.running) { this.paused = false; return Promise.resolve(); }
    if (!this.starting) this.starting = this.doStart().finally(() => { this.starting = null; });
    return this.starting;
  }

  private async doStart() {
    await loadScript();
    if (!this.hands) {
      // MediaPipe считает руку на видеокарте (WebGL). Если браузер не даёт WebGL (выключено аппаратное
      // ускорение, видеокарта в чёрном списке, исчерпан лимит контекстов), библиотека показывает системное
      // окно alert и молча ломается. Проверяем заранее и подменяем alert на понятную ошибку.
      if (!webglAvailable()) throw new Error(WEBGL_MSG);
      let failed = false;
      const alert0 = window.alert;
      window.alert = (m?: unknown) => { failed = true; console.warn('[MediaPipe]', m); };
      try {
        this.hands = new Hands({ locateFile: (f: string) => asset('mediapipe/' + f) });
        this.hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5, selfieMode: false });
        this.hands.onResults((r: any) => this.onResults(r));
        await this.hands.initialize();
      } finally { window.alert = alert0; }
      if (failed) { try { this.hands.close(); } catch { /* ignore */ } this.hands = null; throw new Error(WEBGL_MSG); }
    }
    await this.openCamera();
    this.video.muted = true; this.video.playsInline = true;
    await this.video.play();
    this.running = true; this.paused = false; this.busySince = 0;
    const gen = ++this.gen;
    let frames = 0, t0 = performance.now();
    const loop = () => {
      if (gen !== this.gen || !this.running) return;          // цикл устарел — выходим
      const now = performance.now();
      if (this.busySince && now - this.busySince > 1500) this.busySince = 0;   // сторож: кадр «завис»
      if (!this.paused && !this.busySince && this.video.readyState >= 2) {
        this.busySince = now;
        Promise.resolve().then(() => this.hands.send({ image: this.video })).catch(() => { /* пропуск кадра */ })
          .finally(() => {
            if (gen !== this.gen) return;
            this.busySince = 0; frames++;
            const t = performance.now();
            if (t - t0 > 1000) { this.fps = Math.round(frames * 1000 / (t - t0)); frames = 0; t0 = t; }
          });
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /** Список камер (названия видны только после первого разрешения на доступ). */
  cameras: { id: string; label: string }[] = [];
  camLabel = '';

  /** Открывает камеру: сохранённую, иначе — встроенную/реальную, а не виртуальную (OBS и т.п.). */
  private async openCamera(want?: string) {
    const saved = want ?? lsGet(CAM_KEY);
    this.stream = await getCam(saved || undefined);
    await this.refreshCameras();
    if (!want && !saved) {
      const cur = this.stream.getVideoTracks()[0]?.getSettings().deviceId;
      const best = pickReal(this.cameras);
      if (best && best.id !== cur) {
        this.stream.getTracks().forEach((t) => t.stop());
        try { this.stream = await getCam(best.id); } catch { this.stream = await getCam(cur); }
      }
    }
    const tr = this.stream.getVideoTracks()[0];
    const id = tr?.getSettings().deviceId ?? '';
    this.camLabel = this.cameras.find((c) => c.id === id)?.label || tr?.label || 'камера';
    this.video.srcObject = this.stream;
  }

  private async refreshCameras() {
    try {
      const ds = await navigator.mediaDevices.enumerateDevices();
      this.cameras = ds.filter((d) => d.kind === 'videoinput').map((d, i) => ({ id: d.deviceId, label: d.label || `Камера ${i + 1}` }));
    } catch { this.cameras = []; }
  }

  /** Переключение на следующую камеру из списка; выбор запоминается. */
  async nextCamera(): Promise<void> {
    await this.refreshCameras();
    if (this.cameras.length < 2 || !this.stream) return;
    const cur = this.stream.getVideoTracks()[0]?.getSettings().deviceId;
    const k = this.cameras.findIndex((c) => c.id === cur);
    const next = this.cameras[(k + 1) % this.cameras.length];
    this.stream.getTracks().forEach((t) => t.stop());
    try {
      await this.openCamera(next.id);
      lsSet(CAM_KEY, next.id);
    } catch (e) {
      await this.openCamera(cur);          // не открылась — возвращаемся к прежней
      throw e;
    }
    await this.video.play();
  }

  private onResults(r: any) {
    if (this.paused) return;
    const lm = r.multiHandLandmarks?.[0] ?? null;
    // MediaPipe называет руку как на неотзеркаленном изображении
    const label = r.multiHandedness?.[0]?.label === 'Left' ? 'Left' : 'Right';
    this.last = { landmarks: lm, handed: label, t: performance.now() };
    this.listeners.forEach((f) => { try { f(this.last); } catch (e) { console.error(e); } });
  }

  /** Пауза без выключения камеры: кадры не обрабатываются (между визитами на грядки). */
  pause() { this.paused = true; this.last = { landmarks: null, handed: 'Right', t: 0 }; this.fps = 0; }

  /** Распознавание на одном изображении (для тестов и отчёта). */
  async detectImage(img: HTMLImageElement | HTMLCanvasElement): Promise<HandFrame> {
    await loadScript();
    if (!this.hands) {
      this.hands = new Hands({ locateFile: (f: string) => asset('mediapipe/' + f) });
      this.hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, staticImageMode: true });
      await this.hands.initialize();
    }
    return new Promise((res) => {
      this.hands.onResults((r: any) => {
        this.hands.onResults((rr: any) => this.onResults(rr));
        res({ landmarks: r.multiHandLandmarks?.[0] ?? null, handed: r.multiHandedness?.[0]?.label === 'Left' ? 'Left' : 'Right', t: performance.now() });
      });
      this.hands.send({ image: img });
    });
  }

  stop() {
    this.running = false; this.paused = false; this.gen++; this.busySince = 0;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.last = { landmarks: null, handed: 'Right', t: 0 };
  }

  get active() { return this.running && !this.paused; }
}

const CAM_KEY = 'sd-camera';
const VIRTUAL = /obs|virtual|droidcam|manycam|xsplit|snap ?camera|nvidia broadcast|iriun|epoccam|camo|streamlabs|vcam/i;
function lsGet(k: string) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k: string, v: string) { try { localStorage.setItem(k, v); } catch { /* приватный режим */ } }
/** Встроенная или обычная USB-камера предпочтительнее виртуальных. */
function pickReal(cams: { id: string; label: string }[]) {
  const real = cams.filter((c) => !VIRTUAL.test(c.label));
  return real.find((c) => /integrated|built-?in|встро|facetime|webcam|hd|usb/i.test(c.label)) ?? real[0];
}
async function getCam(deviceId?: string): Promise<MediaStream> {
  const base = { width: { ideal: 640 }, height: { ideal: 480 } };
  try {
    return await navigator.mediaDevices.getUserMedia({ video: deviceId ? { ...base, deviceId: { exact: deviceId } } : { ...base, facingMode: 'user' }, audio: false });
  } catch (e) {
    const n = (e as Error).name;
    if (deviceId && (n === 'OverconstrainedError' || n === 'NotFoundError')) return getCam();   // сохранённой камеры больше нет
    throw e;
  }
}

const WEBGL_MSG = 'Трекинг рук не запустился: браузер не дал WebGL. Включите «Аппаратное ускорение» в настройках браузера (Chrome: Настройки › Система) и перезапустите его. Играть можно клавишами.';
/** Есть ли у браузера свободный WebGL-контекст (проверочный холст сразу освобождается). */
function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch { return false; }
}

export const tracker = new HandTracker();

// Скелет руки для отрисовки «призрака»
export const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];
