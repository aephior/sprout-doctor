// Отрисовка «призрака руки» и превью камеры.
import { BONES } from '../ai/hands';
import type { Pt } from '../ai/gestures';
import { C } from './ui';

/** Рисует скелет руки в прямоугольнике (x, y, w, h). Изображение зеркалится, как в зеркале. */
export function drawHand(g: Phaser.GameObjects.Graphics, L: Pt[] | null, x: number, y: number, w: number, h: number,
  color = C.teal, alpha = 0.9, dot = 4) {
  if (!L) return;
  const P = L.map((p) => ({ x: x + (1 - p.x) * w, y: y + p.y * h }));
  g.lineStyle(Math.max(2, dot - 1), color, alpha * 0.8);
  for (const [a, b] of BONES) g.lineBetween(P[a].x, P[a].y, P[b].x, P[b].y);
  g.fillStyle(color, alpha);
  P.forEach((p, i) => g.fillCircle(p.x, p.y, i % 4 === 0 && i > 0 ? dot + 1 : dot));
}

/** Текстура-превью веб-камеры (зеркально). Возвращает функцию обновления кадра. */
export function cameraTexture(scene: Phaser.Scene, key: string, video: HTMLVideoElement, w: number, h: number) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const tex = scene.textures.createCanvas(key, w, h)!;
  const ctx = tex.getContext();
  return () => {
    if (video.readyState < 2) return;
    ctx.save();
    ctx.translate(w, 0); ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, w, h);
    ctx.restore();
    ctx.fillStyle = 'rgba(43,42,76,0.35)';
    ctx.fillRect(0, 0, w, h);
    tex.refresh();
  };
}
