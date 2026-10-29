// Web Worker: нейросеть «Линзы Фуку» считается в отдельном потоке, игра не замирает.
// Модель и веса присылает основная страница (сообщение init), сам воркер ничего не скачивает.
import { Net } from './engine';

let net: Net | null = null;

self.onmessage = (e: MessageEvent) => {
  const { id, type } = e.data;
  try {
    if (type === 'init') {
      net = new Net(e.data.spec, e.data.bin);
      (self as any).postMessage({ id, ok: true });
      return;
    }
    if (!net) throw new Error('модель ещё не загружена');
    const out = net.run(e.data.input as Float32Array);
    (self as any).postMessage({ id, ok: true, logits: out }, [out.buffer]);
  } catch (err) {
    (self as any).postMessage({ id, ok: false, error: String((err as Error).message || err) });
  }
};
