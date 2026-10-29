// AI-механика №2 «Ритуалы рук»: классификация позы руки по 21 ключевой точке MediaPipe
// и распознавание жестов во времени (удержание, движение) с оценкой качества Q.
//
// Input: 21 точка руки (x, y в долях кадра, z) на каждом кадре камеры.
// Processing: нормализация (относительно запястья, размер ладони, поворот) → классификатор позы
//   (kNN по калибровочным образцам игрока; без калибровки — базовые правила по сгибу пальцев)
//   → сглаживание по окну кадров → автомат жестов G1–G7.
// Output: событие жеста { id, action, Q, grade }.
// Q = 0,5·уверенность + 0,3·стабильность + 0,2·выдержка (Lab8 v3, Часть II п. 9).

export type Pt = { x: number; y: number; z: number };
export type Pose = 'palm' | 'point' | 'victory' | 'pinch' | 'thumbs_up' | 'fist' | 'none';
export const POSES: Pose[] = ['palm', 'point', 'victory', 'pinch', 'thumbs_up', 'fist', 'none'];
export const POSE_NAME: Record<Pose, string> = {
  palm: 'Открытая ладонь', point: 'Указательный палец', victory: 'V-ножницы', pinch: 'Щепотка',
  thumbs_up: 'Большой палец вверх', fist: 'Кулак', none: 'Нет жеста',
};

export type GestureId = 'G1' | 'G2' | 'G3' | 'G4' | 'G5' | 'G6' | 'G7';
export const GESTURE_INFO: Record<GestureId, { name: string; action: string; how: string }> = {
  G1: { name: 'Щепотка', action: 'scan', how: 'соедините большой и указательный, держите 0,6 с' },
  G2: { name: 'Открытая ладонь', action: 'water', how: 'раскрытая ладонь, держите неподвижно 0,6 с' },
  G3: { name: 'Прицел', action: 'spray', how: 'вытяните указательный палец, держите 0,5 с' },
  G4: { name: 'Ножницы', action: 'prune', how: 'покажите V, затем сведите пальцы — «щёлк»' },
  G5: { name: 'Большой палец', action: 'confirm', how: 'большой палец вверх, держите 0,5 с' },
  G6: { name: 'Взмах', action: 'swipe', how: 'ладонью быстро махните в сторону' },
  G7: { name: 'Вырвать', action: 'remove', how: 'сожмите кулак и резко поднимите руку' },
};

const WRIST = 0, THUMB = [1, 2, 3, 4], INDEX = [5, 6, 7, 8], MIDDLE = [9, 10, 11, 12], RING = [13, 14, 15, 16], PINKY = [17, 18, 19, 20];
const d2 = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y);
const d3 = (a: Pt, b: Pt) => Math.hypot(a.x - b.x, a.y - b.y, (a.z - b.z));

/** Размер ладони: запястье → основание среднего пальца. */
export const palmSize = (L: Pt[]) => d3(L[WRIST], L[MIDDLE[0]]) || 1e-6;

/** Насколько палец выпрямлен: 0 — согнут, 1 — прямой (по отношению расстояний от запястья). */
function extension(L: Pt[], f: number[]): number {
  const [mcp, pip, , tip] = f.map((i) => L[i]);
  const r = d3(L[WRIST], tip) / (d3(L[WRIST], pip) + 1e-6);
  const straight = d3(mcp, tip) / (d3(mcp, pip) + d3(pip, L[f[2]]) + d3(L[f[2]], tip) + 1e-6);
  return Math.max(0, Math.min(1, (r - 0.9) / 0.5)) * 0.6 + Math.max(0, Math.min(1, (straight - 0.6) / 0.35)) * 0.4;
}

export interface Features { vec: number[]; ext: number[]; pinch: number; thumbUp: number; reach: number; size: number }

/** Признаки: 63 нормализованные координаты + сгиб пальцев + щепотка. */
export function features(L: Pt[], handedness: 'Left' | 'Right' = 'Right'): Features {
  const size = palmSize(L);
  const w = L[WRIST], m = L[MIDDLE[0]];
  // поворот: ось запястье → основание среднего пальца становится «вверх»
  const ang = Math.atan2(m.x - w.x, -(m.y - w.y));
  const cos = Math.cos(-ang), sin = Math.sin(-ang), mirror = handedness === 'Left' ? -1 : 1;
  const vec: number[] = [];
  for (const p of L) {
    const x = (p.x - w.x) / size, y = (p.y - w.y) / size;
    vec.push(mirror * (x * cos - y * sin), x * sin + y * cos, (p.z - w.z) / size);
  }
  const ext = [THUMB, INDEX, MIDDLE, RING, PINKY].map((f, i) => i === 0
    ? Math.max(0, Math.min(1, (d3(L[4], L[INDEX[0]]) / size - 0.35) / 0.45))
    : extension(L, f));
  const pinch = d3(L[4], L[8]) / size;
  // большой палец «вверх» в кадре: кончик выше основания и выше остальных пальцев
  const thumbUp = Math.max(0, Math.min(1, ((L[2].y - L[4].y) / size - 0.25) / 0.4));
  // насколько далеко кончик указательного от запястья (в кулаке он прижат к ладони)
  const reach = d3(L[WRIST], L[8]) / size;
  return { vec, ext, pinch, thumbUp, reach, size };
}

export interface PoseGuess { pose: Pose; conf: number }

/** Базовый классификатор на правилах (работает без калибровки). */
export function rulePose(f: Features): PoseGuess {
  const [th, ix, md, rg, pk] = f.ext;
  const hi = (v: number) => v, lo = (v: number) => 1 - v;
  const others3 = (lo(md) + lo(rg) + lo(pk)) / 3;
  const scores: Record<Pose, number> = {
    pinch: f.pinch < 0.33 && f.reach > 1.15 ? 0.6 + 0.4 * (1 - f.pinch / 0.33) : 0,
    palm: (hi(ix) + hi(md) + hi(rg) + hi(pk)) / 4 * (f.pinch > 0.45 ? 1 : 0.5),
    point: hi(ix) * others3 * (f.pinch > 0.4 ? 1 : 0.6),
    victory: (hi(ix) + hi(md)) / 2 * (lo(rg) + lo(pk)) / 2,
    thumbs_up: hi(th) * (lo(ix) + others3 * 3) / 4 * (0.75 + 0.25 * f.thumbUp),
    fist: lo(ix) * others3 * lo(th * 0.9),
    none: 0.35,
  };
  let best: Pose = 'none';
  for (const p of POSES) if (scores[p] > scores[best]) best = p;
  return { pose: best, conf: Math.min(1, scores[best]) };
}

/** kNN по калибровочным образцам игрока (персональная модель). */
export class KnnPose {
  samples: { vec: number[]; pose: Pose }[] = [];
  constructor(public k = 7) {}
  get trained() { return new Set(this.samples.map((s) => s.pose)).size >= 4; }
  add(vec: number[], pose: Pose) { this.samples.push({ vec, pose }); }
  predict(vec: number[]): PoseGuess {
    const ds = this.samples.map((s) => {
      let d = 0; for (let i = 0; i < vec.length; i++) { const t = vec[i] - s.vec[i]; d += t * t; }
      return { d: Math.sqrt(d), pose: s.pose };
    }).sort((a, b) => a.d - b.d).slice(0, this.k);
    const votes = new Map<Pose, number>();
    let total = 0;
    for (const n of ds) { const w = 1 / (n.d + 0.05); votes.set(n.pose, (votes.get(n.pose) ?? 0) + w); total += w; }
    let best: Pose = 'none', bw = -1;
    votes.forEach((w, p) => { if (w > bw) { bw = w; best = p; } });
    // далеко от всех образцов — это не жест из словаря
    if (ds.length && ds[0].d > 1.6) return { pose: 'none', conf: 0.5 };
    return { pose: best, conf: total ? bw / total : 0 };
  }
  toJSON() { return this.samples.map((s) => ({ p: s.pose, v: s.vec.map((x) => Math.round(x * 1000) / 1000) })); }
  load(data: { p: Pose; v: number[] }[]) { this.samples = data.map((d) => ({ pose: d.p, vec: d.v })); }
}

export interface GestureEvent { id: GestureId; action: string; q: number; grade: 'Perfect' | 'Good' | 'Miss' }
export interface FrameInfo { pose: Pose; conf: number; hold: number; need: number; wrist: Pt | null; landmarks: Pt[] | null }

interface Hist { t: number; pose: Pose; conf: number; wrist: Pt; tipGap: number }

/** Автомат жестов: удержание статичных поз и распознавание движений. */
export class GestureRecognizer {
  knn = new KnnPose();
  private hist: Hist[] = [];
  private holdPose: Pose = 'none';
  private holdStart = 0;
  private cooldownUntil = 0;
  private needRelease = false;
  enabled: Set<GestureId> = new Set(['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7']);
  holdBonus = 0;   // директор сложности может удлинять/укорачивать окно

  classify(f: Features): PoseGuess { return this.knn.trained ? this.knn.predict(f.vec) : rulePose(f); }

  /** Обработка кадра. now — мс. Возвращает информацию для интерфейса и, если сработал, жест. */
  frame(L: Pt[] | null, handed: 'Left' | 'Right', now: number): { info: FrameInfo; event: GestureEvent | null } {
    if (!L) {
      this.hist = []; this.holdPose = 'none'; this.needRelease = false;
      return { info: { pose: 'none', conf: 0, hold: 0, need: 1, wrist: null, landmarks: null }, event: null };
    }
    const f = features(L, handed);
    const g = this.classify(f);
    this.hist.push({ t: now, pose: g.pose, conf: g.conf, wrist: L[0], tipGap: d3(L[8], L[12]) / f.size });
    while (this.hist.length && now - this.hist[0].t > 1200) this.hist.shift();

    // сглаженная поза — голосование по последним ~300 мс
    const recent = this.hist.filter((h) => now - h.t < 300);
    const counts = new Map<Pose, number>();
    recent.forEach((h) => counts.set(h.pose, (counts.get(h.pose) ?? 0) + 1));
    let pose: Pose = 'none', c = 0;
    counts.forEach((n, p) => { if (n > c) { c = n; pose = p; } });
    if (pose !== this.holdPose) { this.holdPose = pose; this.holdStart = now; this.needRelease = false; }
    const held = now - this.holdStart;

    let event: GestureEvent | null = null;
    if (now >= this.cooldownUntil && !this.needRelease) event = this.detect(pose, held, now);
    if (event) { this.cooldownUntil = now + 700; this.needRelease = true; }

    const need = this.needFor(pose);
    return { info: { pose, conf: g.conf, hold: Math.min(1, held / need), need, wrist: L[0], landmarks: L }, event };
  }

  private needFor(pose: Pose) {
    const base: Partial<Record<Pose, number>> = { pinch: 600, palm: 600, point: 500, thumbs_up: 500, victory: 300, fist: 200 };
    return (base[pose] ?? 600) + this.holdBonus;
  }

  private quality(pose: Pose, since: number, now: number, holdRatio: number): number {
    const win = this.hist.filter((h) => h.t >= since && h.t <= now);
    if (!win.length) return 0;
    const same = win.filter((h) => h.pose === pose);
    const conf = same.reduce((s, h) => s + h.conf, 0) / Math.max(1, same.length);
    const stability = same.length / win.length;
    return 0.5 * conf + 0.3 * stability + 0.2 * Math.min(1, holdRatio);
  }

  private make(id: GestureId, q: number): GestureEvent | null {
    if (!this.enabled.has(id)) return null;
    const grade = q >= 0.85 ? 'Perfect' : q >= 0.6 ? 'Good' : 'Miss';
    return { id, action: GESTURE_INFO[id].action, q: Math.round(q * 100) / 100, grade };
  }

  private detect(pose: Pose, held: number, now: number): GestureEvent | null {
    const H = this.hist;
    // G6 взмах: ладонь + быстрое горизонтальное движение запястья (за 450 мс ≥ 25% ширины кадра)
    const palmWin = H.filter((h) => now - h.t < 450 && (h.pose === 'palm' || h.pose === 'none'));
    if (palmWin.length >= 4 && H.filter((h) => now - h.t < 450 && h.pose === 'palm').length >= 2) {
      const dx = palmWin[palmWin.length - 1].wrist.x - palmWin[0].wrist.x;
      if (Math.abs(dx) >= 0.25) return this.make('G6', this.quality('palm', now - 450, now, Math.min(1, Math.abs(dx) / 0.35)));
    }
    // G7 вырвать: был кулак, затем запястье резко вверх (≥ 18% высоты кадра за 600 мс)
    const fistWin = H.filter((h) => now - h.t < 600);
    const firstFist = fistWin.findIndex((h) => h.pose === 'fist');
    if (firstFist >= 0) {
      const dy = fistWin[fistWin.length - 1].wrist.y - fistWin[firstFist].wrist.y;
      if (dy <= -0.18) return this.make('G7', this.quality('fist', fistWin[firstFist].t, now, Math.min(1, -dy / 0.28)));
    }
    // G4 ножницы: V (пальцы разведены), затем за 900 мс кончики сведены
    const vWin = H.filter((h) => now - h.t < 900);
    const vIdx = vWin.findIndex((h) => h.pose === 'victory' && h.tipGap > 0.45);
    if (vIdx >= 0) {
      const after = vWin.slice(vIdx + 2);
      const closed = after.find((h) => h.tipGap < 0.25);
      if (closed) return this.make('G4', this.quality('victory', vWin[vIdx].t, closed.t, Math.min(1, (vWin[vIdx].tipGap - closed.tipGap) / 0.35)));
    }
    // статичные позы с удержанием
    const map: Partial<Record<Pose, GestureId>> = { pinch: 'G1', point: 'G3', thumbs_up: 'G5', palm: 'G2' };
    const id = map[pose];
    if (id && held >= this.needFor(pose)) {
      if (id === 'G2') {   // полив — ладонь неподвижна (иначе это взмах)
        const w = H.filter((h) => now - h.t < 400);
        if (w.length && Math.abs(w[w.length - 1].wrist.x - w[0].wrist.x) > 0.08) return null;
      }
      return this.make(id, this.quality(pose, now - this.needFor(pose), now, held / this.needFor(pose)));
    }
    return null;
  }
}
