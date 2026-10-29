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
  private busy = false;
  last: HandFrame = { landmarks: null, handed: 'Right', t: 0 };
  fps = 0;
  private listeners = new Set<(f: HandFrame) => void>();

  onFrame(f: (fr: HandFrame) => void) { this.listeners.add(f); return () => this.listeners.delete(f); }

  async start() {
    if (this.running) return;
    await loadScript();
    if (!this.hands) {
      this.hands = new Hands({ locateFile: (f: string) => asset('mediapipe/' + f) });
      this.hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.6, minTrackingConfidence: 0.5, selfieMode: false });
      this.hands.onResults((r: any) => {
        const lm = r.multiHandLandmarks?.[0] ?? null;
        // MediaPipe называет руку как на неотзеркаленном изображении
        const label = r.multiHandedness?.[0]?.label === 'Left' ? 'Left' : 'Right';
        this.last = { landmarks: lm, handed: label, t: performance.now() };
        this.listeners.forEach((f) => f(this.last));
      });
      await this.hands.initialize();
    }
    this.stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
    this.video.srcObject = this.stream;
    this.video.muted = true; this.video.playsInline = true;
    await this.video.play();
    this.running = true;
    let frames = 0, t0 = performance.now();
    const loop = async () => {
      if (!this.running) return;
      if (!this.busy && this.video.readyState >= 2) {
        this.busy = true;
        try { await this.hands.send({ image: this.video }); } catch { /* пропуск кадра */ }
        this.busy = false;
        frames++;
        const now = performance.now();
        if (now - t0 > 1000) { this.fps = Math.round(frames * 1000 / (now - t0)); frames = 0; t0 = now; }
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  /** Распознавание на одном изображении (для тестов и отчёта). */
  async detectImage(img: HTMLImageElement | HTMLCanvasElement): Promise<HandFrame> {
    await loadScript();
    if (!this.hands) {
      this.hands = new Hands({ locateFile: (f: string) => asset('mediapipe/' + f) });
      this.hands.setOptions({ maxNumHands: 1, modelComplexity: 1, minDetectionConfidence: 0.5, staticImageMode: true });
      await this.hands.initialize();
    }
    return new Promise((res) => {
      this.hands.onResults((r: any) => res({ landmarks: r.multiHandLandmarks?.[0] ?? null, handed: r.multiHandedness?.[0]?.label === 'Left' ? 'Left' : 'Right', t: performance.now() }));
      this.hands.send({ image: img });
    });
  }

  stop() {
    this.running = false;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    this.last = { landmarks: null, handed: 'Right', t: 0 };
  }

  get active() { return this.running; }
}

export const tracker = new HandTracker();

// Скелет руки для отрисовки «призрака»
export const BONES: [number, number][] = [
  [0, 1], [1, 2], [2, 3], [3, 4], [0, 5], [5, 6], [6, 7], [7, 8], [5, 9], [9, 10], [10, 11], [11, 12],
  [9, 13], [13, 14], [14, 15], [15, 16], [13, 17], [17, 18], [18, 19], [19, 20], [0, 17],
];
