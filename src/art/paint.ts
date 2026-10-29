// Рисование пиксель-арта в «родном» низком разрешении (обычно 320×180), затем сцена увеличивается ×3.
import { rng } from './pixel';

export class Painter {
  cv: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  r: () => number;
  constructor(public w: number, public h: number, seed = 1) {
    this.cv = document.createElement('canvas');
    this.cv.width = w; this.cv.height = h;
    this.ctx = this.cv.getContext('2d')!;
    this.ctx.imageSmoothingEnabled = false;
    this.r = rng(seed);
  }
  rect(x: number, y: number, w: number, h: number, c: string) { this.ctx.fillStyle = c; this.ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); return this; }
  px(x: number, y: number, c: string) { return this.rect(x, y, 1, 1, c); }
  /** Рамка в 1 пиксель. */
  frame(x: number, y: number, w: number, h: number, c: string) {
    return this.rect(x, y, w, 1, c).rect(x, y + h - 1, w, 1, c).rect(x, y, 1, h, c).rect(x + w - 1, y, 1, h, c);
  }
  hline(x: number, y: number, w: number, c: string) { return this.rect(x, y, w, 1, c); }
  vline(x: number, y: number, h: number, c: string) { return this.rect(x, y, 1, h, c); }
  /** Заполненный эллипс с необязательным контуром. */
  ellipse(cx: number, cy: number, rx: number, ry: number, c: string, outline?: string) {
    for (let y = -ry; y <= ry; y++) for (let x = -rx; x <= rx; x++) {
      const d = (x * x) / (rx * rx + 0.01) + (y * y) / (ry * ry + 0.01);
      if (d <= 1) this.px(cx + x, cy + y, outline && d > 0.72 ? outline : c);
    }
    return this;
  }
  /** Дизеринг двумя цветами (шахматка) в прямоугольнике. */
  dither(x: number, y: number, w: number, h: number, a: string, b: string) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, (i + j) % 2 ? a : b);
    return this;
  }
  /** Шум из нескольких оттенков. */
  noise(x: number, y: number, w: number, h: number, colors: string[], density = 0.15) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.r() < density) this.px(x + i, y + j, colors[Math.floor(this.r() * colors.length)]);
    return this;
  }
  /** Горизонтальные полосы (небо, градиент без сглаживания). */
  bands(x: number, y: number, w: number, h: number, colors: string[]) {
    const bh = h / colors.length;
    colors.forEach((c, i) => {
      this.rect(x, y + i * bh, w, bh + 1, c);
      if (i > 0) for (let k = 0; k < w; k += 2) this.px(x + k + (i % 2), y + i * bh, colors[i - 1]);   // дизеринг на стыке
    });
    return this;
  }
  /** Сетка строк → пиксели (как в pixel.ts), с палитрой. */
  grid(x: number, y: number, rows: string[], pal: Record<string, string>) {
    rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const c = pal[row[i]]; if (c) this.px(x + i, y + j, c); } });
    return this;
  }
  toTexture(scene: Phaser.Scene, key: string) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    scene.textures.addCanvas(key, this.cv);
  }
}

/** Добавляет текстуру-лист из нескольких кадров, нарисованных функцией. */
export function paintSheet(scene: Phaser.Scene, key: string, w: number, h: number, frames: number, draw: (p: Painter, f: number) => void, seed = 1) {
  if (scene.textures.exists(key)) return;
  const sheet = document.createElement('canvas');
  sheet.width = w * frames; sheet.height = h;
  const ctx = sheet.getContext('2d')!;
  for (let f = 0; f < frames; f++) { const p = new Painter(w, h, seed); draw(p, f); ctx.drawImage(p.cv, f * w, 0); }
  scene.textures.addSpriteSheet(key, sheet as unknown as HTMLImageElement, { frameWidth: w, frameHeight: h });
}

export const K = {
  ink: '#1e1b2e', wood1: '#4a2e1c', wood2: '#6a4329', wood3: '#8a5a3b', wood4: '#b07a4c', wood5: '#d29a5f',
  paper: '#f6e7c1', paper2: '#e2cfa0', paper3: '#c9ab74', red: '#c8323c', red2: '#8e2230',
  indigo: '#2b2a4c', indigo2: '#3e3a66', indigo3: '#56508a', night: '#1c1a33',
  green1: '#2f5f2a', green2: '#4f8a3c', green3: '#6fae4f', green4: '#9ccc65',
  lamp: '#ffd27a', lamp2: '#f2a95c', lamp3: '#e8833a', teal: '#3fd0c9', magenta: '#ff4f9a', sakura: '#f2a7b8',
  skin: '#f2c9a0', skin2: '#d9a27e', gray1: '#4a4a5a', gray2: '#77778a', gray3: '#a8a8b8', white: '#f6f1e6',
  blight: '#6b4e8c', blight2: '#4b3766', soil1: '#3a2416', soil2: '#5e3c26', soil3: '#7a4f33', tatami: '#b8b070', tatami2: '#9c9455',
};
