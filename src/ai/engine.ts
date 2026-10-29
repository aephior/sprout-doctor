// Минимальный движок нейросети на чистом TypeScript (без ONNX Runtime, без CDN, работает офлайн).
// Поддерживает операции MobileNetV2: свёртка (в т.ч. depthwise), ReLU6, сложение, усреднение, полносвязный слой.
// Формат модели создаётся скриптом ml/export_js_model.py из ONNX-файла.

interface Op {
  op: 'conv' | 'relu6' | 'add' | 'gap' | 'gemm';
  in: string; in2?: string; out: string; free: string[];
  cout?: number; cin?: number; k?: number; s?: number; p?: number; g?: number;
  nout?: number; nin?: number;
  w?: [number, number]; b?: [number, number];
}
interface ModelSpec { input: string; output: string; size: number; ops: Op[] }
interface T { c: number; h: number; w: number; d: Float32Array }

/** float16 → float32 */
function halfToFloat(src: Uint16Array, off: number, n: number): Float32Array {
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const h = src[off + i], s = h & 0x8000 ? -1 : 1, e = (h >> 10) & 0x1f, f = h & 0x3ff;
    out[i] = e === 0 ? s * 5.960464477539063e-8 * f : e === 31 ? (f ? NaN : s * Infinity) : s * Math.pow(2, e - 15) * (1 + f / 1024);
  }
  return out;
}

export class Net {
  private weights = new Map<Op, { w: Float32Array; b: Float32Array }>();
  constructor(private spec: ModelSpec, raw: ArrayBuffer) {
    const half = new Uint16Array(raw);
    for (const o of spec.ops) if (o.w && o.b) {
      this.weights.set(o, { w: halfToFloat(half, o.w[0], o.w[1]), b: halfToFloat(half, o.b[0], o.b[1]) });
    }
  }

  static async load(jsonUrl: string, binUrl: string) {
    const [spec, bin] = await Promise.all([
      fetch(jsonUrl).then((r) => { if (!r.ok) throw new Error(`${jsonUrl}: ${r.status}`); return r.json(); }),
      fetch(binUrl).then(async (r) => {
        if (!r.ok) throw new Error(`${binUrl}: ${r.status}`);
        if (!binUrl.endsWith('.txt')) return r.arrayBuffer();
        // веса в base64 (хостинг артефактов не раздаёт .bin)
        const b64 = (await r.text()).trim(), bin = atob(b64), out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        return out.buffer;
      }),
    ]);
    return new Net(spec, bin);
  }

  /** input: CHW float32 (3×224×224, уже нормализованный). Возвращает выход последнего слоя. */
  run(input: Float32Array): Float32Array {
    const S = this.spec.size;
    const env = new Map<string, T>([[this.spec.input, { c: 3, h: S, w: S, d: input }]]);
    for (const o of this.spec.ops) {
      const x = env.get(o.in)!;
      let y: T;
      if (o.op === 'conv') y = this.conv(o, x);
      else if (o.op === 'relu6') { const d = x.d; for (let i = 0; i < d.length; i++) d[i] = d[i] < 0 ? 0 : d[i] > 6 ? 6 : d[i]; y = x; }
      else if (o.op === 'add') { const z = env.get(o.in2!)!, d = new Float32Array(x.d.length); for (let i = 0; i < d.length; i++) d[i] = x.d[i] + z.d[i]; y = { ...x, d }; }
      else if (o.op === 'gap') {
        const n = x.h * x.w, d = new Float32Array(x.c);
        for (let c = 0; c < x.c; c++) { let s = 0; for (let i = 0; i < n; i++) s += x.d[c * n + i]; d[c] = s / n; }
        y = { c: x.c, h: 1, w: 1, d };
      } else {
        const { w, b } = this.weights.get(o)!, nin = o.nin!, d = new Float32Array(o.nout!);
        for (let j = 0; j < o.nout!; j++) { let s = b[j]; for (let i = 0; i < nin; i++) s += w[j * nin + i] * x.d[i]; d[j] = s; }
        y = { c: o.nout!, h: 1, w: 1, d };
      }
      env.set(o.out, y);
      for (const f of o.free) if (f !== o.out) env.delete(f);
    }
    return env.get(this.spec.output)!.d;
  }

  private conv(o: Op, x: T): T {
    const { w, b } = this.weights.get(o)!;
    const k = o.k!, s = o.s!, p = o.p!, g = o.g!, cout = o.cout!;
    const H = x.h, W = x.w, oh = Math.floor((H + 2 * p - k) / s) + 1, ow = Math.floor((W + 2 * p - k) / s) + 1;
    const out = new Float32Array(cout * oh * ow), inp = x.d, n = oh * ow;
    if (k === 1 && s === 1 && g === 1) {
      // поточечная свёртка 1×1: матричное умножение [cout×cin]·[cin×HW]
      const cin = x.c;
      for (let co = 0; co < cout; co++) {
        const o0 = co * n, bias = b[co];
        for (let i = 0; i < n; i++) out[o0 + i] = bias;
        for (let ci = 0; ci < cin; ci++) {
          const wv = w[co * cin + ci], i0 = ci * n;
          if (wv === 0) continue;
          for (let i = 0; i < n; i++) out[o0 + i] += wv * inp[i0 + i];
        }
      }
    } else if (g === x.c && g === cout) {
      // depthwise k×k: у каждого канала своё ядро
      for (let c = 0; c < cout; c++) {
        const i0 = c * H * W, o0 = c * n, w0 = c * k * k, bias = b[c];
        for (let oy = 0; oy < oh; oy++) for (let ox = 0; ox < ow; ox++) {
          let sum = bias;
          const iy0 = oy * s - p, ix0 = ox * s - p;
          for (let ky = 0; ky < k; ky++) {
            const iy = iy0 + ky; if (iy < 0 || iy >= H) continue;
            for (let kx = 0; kx < k; kx++) {
              const ix = ix0 + kx; if (ix < 0 || ix >= W) continue;
              sum += w[w0 + ky * k + kx] * inp[i0 + iy * W + ix];
            }
          }
          out[o0 + oy * ow + ox] = sum;
        }
      }
    } else {
      // общая свёртка (первый слой 3×3, stride 2)
      const cinG = x.c / g, coutG = cout / g;
      for (let co = 0; co < cout; co++) {
        const grp = Math.floor(co / coutG), o0 = co * n;
        for (let oy = 0; oy < oh; oy++) for (let ox = 0; ox < ow; ox++) {
          let sum = b[co];
          for (let ci = 0; ci < cinG; ci++) {
            const cIn = grp * cinG + ci, i0 = cIn * H * W, w0 = (co * cinG + ci) * k * k;
            for (let ky = 0; ky < k; ky++) {
              const iy = oy * s - p + ky; if (iy < 0 || iy >= H) continue;
              for (let kx = 0; kx < k; kx++) {
                const ix = ox * s - p + kx; if (ix < 0 || ix >= W) continue;
                sum += w[w0 + ky * k + kx] * inp[i0 + iy * W + ix];
              }
            }
          }
          out[o0 + oy * ow + ox] = sum;
        }
      }
    }
    return { c: cout, h: oh, w: ow, d: out };
  }
}
