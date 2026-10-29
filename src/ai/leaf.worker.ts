// Web Worker: нейросеть «Линзы Фуку» считается в отдельном потоке, игра не замирает.
import { Net } from './engine';

let net: Net | null = null;
let loading: Promise<Net> | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { id, type, input, base } = e.data;
  try {
    if (!loading) loading = Net.load(base + 'leaf_model.json', base + 'leaf_weights.b64.txt');
    net = await loading;
    if (type === 'load') { (self as any).postMessage({ id, ok: true }); return; }
    const out = net.run(input as Float32Array);
    (self as any).postMessage({ id, ok: true, logits: out }, [out.buffer]);
  } catch (err) {
    loading = null;
    (self as any).postMessage({ id, ok: false, error: String((err as Error).message || err) });
  }
};
