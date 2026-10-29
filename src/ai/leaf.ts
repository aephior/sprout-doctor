// AI-механика №1 «Линза Фуку»: MobileNetV2, дообученная на PlantVillage (13 классов).
// Input: фото-карточка листа → Processing: 224×224, нормализация ImageNet, нейросеть в Web Worker
// → Output: топ-3 класса с вероятностями. Работает офлайн, без внешних библиотек.

export interface Diagnosis { top: { id: number; p: number }[]; ms: number }

const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
let worker: Worker | null = null;
let ready: Promise<void> | null = null;
let seq = 0;
const pending = new Map<number, (d: any) => void>();

import { asset } from '../assets';
import { Net } from './engine';

function resetWorker(reason: string) {
  worker?.terminate(); worker = null; ready = null;
  pending.forEach((f) => f({ ok: false, error: reason })); pending.clear();
}

function call(msg: object, transfer: Transferable[] = [], timeoutMs = 20000): Promise<any> {
  if (!worker) {
    worker = new Worker(asset('leaf-worker.js'));
    worker.onmessage = (e) => { const f = pending.get(e.data.id); pending.delete(e.data.id); f?.(e.data); };
    worker.onerror = (e) => resetWorker(e.message || 'ошибка потока нейросети');
  }
  const id = ++seq;
  return new Promise((res, rej) => {
    // сторож: если поток не ответил, перезапускаем его — игра не должна зависать
    const timer = setTimeout(() => resetWorker('нейросеть не ответила вовремя, попробуйте ещё раз'), timeoutMs);
    pending.set(id, (d) => { clearTimeout(timer); d.ok ? res(d) : rej(new Error(d.error)); });
    worker!.postMessage({ id, ...msg }, transfer);
  });
}

/** Страница загружает модель и передаёт её воркеру (один раз). */
export function loadLeafModel(): Promise<void> {
  if (!ready) {
    ready = Net.fetchPayload(asset('leaf_model.json'), asset('leaf_weights.b64.txt'))
      .then(({ spec, bin }) => call({ type: 'init', spec, bin }, [bin]))
      .then(() => undefined);
    ready.catch(() => { ready = null; });
  }
  return ready;
}

/**
 * view = 0 — исходный кадр; view > 0 — «другой ракурс»:
 * тот же лист с другим кадрированием/отражением (test-time augmentation).
 */
export async function diagnose(img: HTMLImageElement | HTMLCanvasElement, view = 0): Promise<Diagnosis> {
  const t0 = performance.now();
  const cv = document.createElement('canvas');
  cv.width = 224; cv.height = 224;
  const ctx = cv.getContext('2d', { willReadFrequently: true })!;
  const w = (img as HTMLImageElement).naturalWidth || img.width, h = (img as HTMLImageElement).naturalHeight || img.height;
  if (view === 0) ctx.drawImage(img, 0, 0, 224, 224);
  else {
    const crop = [0.84, 0.8, 0.88][view % 3], cw = w * crop, ch = h * crop;
    const ox = [0, w - cw, (w - cw) / 2][view % 3], oy = [h - ch, 0, (h - ch) / 2][(view + 1) % 3];
    if (view % 2 === 1) { ctx.translate(224, 0); ctx.scale(-1, 1); }
    ctx.drawImage(img, ox, oy, cw, ch, 0, 0, 224, 224);
  }
  const px = ctx.getImageData(0, 0, 224, 224).data;
  const data = new Float32Array(3 * 224 * 224);
  for (let i = 0; i < 224 * 224; i++) for (let c = 0; c < 3; c++) data[c * 224 * 224 + i] = (px[i * 4 + c] / 255 - MEAN[c]) / STD[c];
  await loadLeafModel();
  const { logits } = await call({ type: 'run', input: data }, [data.buffer]);
  const max = Math.max(...logits);
  const exps: number[] = Array.from(logits as Float32Array, (v) => Math.exp(v - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  const probs = exps.map((e, id) => ({ id, p: e / sum })).sort((a, b) => b.p - a.p);
  return { top: probs.slice(0, 3), ms: performance.now() - t0 };
}

/** Кадр карточки так, как его видит линза при данном ракурсе (для показа игроку). */
export function viewTransform(view: number) { return { flip: view > 0 && view % 2 === 1 }; }
