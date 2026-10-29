// Пиксель-арт из строковых сеток: каждый символ — цвет из палитры, '.' — прозрачный.

export type Grid = string[];
export type Pal = Record<string, string>;

export const PAL: Pal = {
  k: '#1e1b2e', // контур
  h: '#d9b36a', H: '#b08a45', // солома
  r: '#c8323c', R: '#a82a32', // красный (лента, сапоги)
  s: '#f2c9a0', S: '#d9a27e', // кожа
  b: '#6b3e26', // волосы
  g: '#3fd0c9', // бирюзовый неон
  y: '#f2c230', Y: '#c99a1e', // дождевик
  o: '#3e7d4a', O: '#2e5e38', // комбинезон
  w: '#f6f1e6', // белый
  L: '#e8d3a6', l: '#c9ab74', // бумажный фонарь
  c: '#3fd0c9', // пропеллеры
  G: '#4f8a3c', v: '#6fae4f', V: '#2f5f2a', // листья
  t: '#e8833a', T: '#8a5a3b', // томат (спелый — оранжево-красный), стебель
  m: '#ff4f9a', // маджента
  p: '#6b4e8c', P: '#4b3766', // болезнь
  n: '#8a5a3b', N: '#6a4329', // земля
  e: '#f6e7c1', E: '#e2cfa0', // сливочный
  i: '#2b2a4c', // индиго
  u: '#5b8fb9', U: '#3d6d96', // вода
  q: '#9a9a9a', Q: '#6e6e6e', // камень
  z: '#e95f5f', // спелый томат
  f: '#a8a04a', F: '#7d7a34', // увядающие листья
};

/** Нормализует сетку до ширины w (дополняет точками). */
export function norm(grid: Grid, w: number): Grid {
  return grid.map((row) => (row + '.'.repeat(w)).slice(0, w));
}

export function gridToCanvas(grid: Grid, pal: Pal = PAL): HTMLCanvasElement {
  const h = grid.length, w = Math.max(...grid.map((r) => r.length));
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d')!;
  grid.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.' || ch === ' ') continue;
      ctx.fillStyle = pal[ch] ?? '#ff00ff';
      ctx.fillRect(x, y, 1, 1);
    }
  });
  return cv;
}

/** Склеивает несколько сеток одинакового размера в горизонтальный спрайт-лист. */
export function addSheet(scene: Phaser.Scene, key: string, frames: Grid[], pal: Pal = PAL) {
  const fw = Math.max(...frames[0].map((r) => r.length)), fh = frames[0].length;
  const cv = document.createElement('canvas');
  cv.width = fw * frames.length; cv.height = fh;
  const ctx = cv.getContext('2d')!;
  frames.forEach((f, i) => ctx.drawImage(gridToCanvas(norm(f, fw), pal), i * fw, 0));
  scene.textures.addSpriteSheet(key, cv as unknown as HTMLImageElement, { frameWidth: fw, frameHeight: fh });
}

/** Детерминированный генератор случайных чисел (одинаковые тайлы при каждом запуске). */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/** Тайл, нарисованный функцией по пикселям. */
export function addPainted(scene: Phaser.Scene, key: string, w: number, h: number,
  paint: (px: (x: number, y: number, c: string) => void, r: () => number) => void, seed = 1) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d')!;
  const r = rng(seed);
  paint((x, y, c) => { ctx.fillStyle = PAL[c] ?? c; ctx.fillRect(x, y, 1, 1); }, r);
  scene.textures.addCanvas(key, cv);
}
