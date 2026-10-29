// Растения крупным планом (для «Процедурной»), грядка и инструменты ухода.
// Растение рисуется процедурно по культуре, стадии и болезни: у каждой болезни свои симптомы.
import { Painter, paintSheet, K } from './paint';
import type { Crop } from '../data/diseases';

export type PlantState = 'sprout' | 'young' | 'mature' | 'sick' | 'severe' | 'dead';
const PW = 64, PH = 80;   // холст растения (родное разрешение)

// Симптомы: цвет пятен, ореол, желтизна листа
const SYMPTOM: Record<string, { spot: string; halo?: string; leaf?: string; curl?: boolean; web?: boolean; mold?: boolean }> = {
  early_blight: { spot: '#4a2e1c', halo: '#c9b34a' },
  late_blight: { spot: '#3a3328', halo: '#6b6a3a', leaf: '#5d6a3a' },
  bacterial_spot: { spot: '#1e1b2e', halo: '#a8a04a' },
  leaf_mold: { spot: '#8a7a3a', leaf: '#a8a04a', mold: true },
  septoria: { spot: '#6a4329', halo: '#e2cfa0' },
  spider_mites: { spot: '#c9b34a', web: true },
  ylcv: { spot: '#c9b34a', leaf: '#b8c24a', curl: true },
};

function leaf(p: Painter, x: number, y: number, rx: number, ry: number, fill: string, hi: string, ill?: { spot: string; halo?: string; leaf?: string; mold?: boolean } | null, dense = 0.3) {
  p.ellipse(x, y, rx, ry, ill?.leaf ?? fill, K.green1);
  p.px(x - 1, y - 1, hi).px(x, y - 1, hi);
  if (ill && p.r() < dense + 0.4) {
    const sx = x + Math.round((p.r() - 0.5) * rx), sy = y + Math.round((p.r() - 0.5) * ry);
    if (ill.halo) { p.px(sx - 1, sy, ill.halo).px(sx + 1, sy, ill.halo).px(sx, sy - 1, ill.halo).px(sx, sy + 1, ill.halo); }
    p.px(sx, sy, ill.spot);
    if (ill.mold) p.px(sx + 1, sy + 1, '#9a9a9a');
  }
}

/** Рисует растение и возвращает ключ текстуры (создаётся один раз). */
export function plantTexture(scene: Phaser.Scene, crop: Crop, state: PlantState, disease = 'healthy', grown = true): string {
  const key = `pl-${crop}-${state}-${disease}-${grown ? 'g' : 'y'}`;
  if (scene.textures.exists(key)) return key;
  const p = new Painter(PW, PH, crop.length * 7 + state.length * 3);
  const sick = state === 'sick' || state === 'severe';
  const ill = sick ? (SYMPTOM[disease] ?? SYMPTOM.early_blight) : null;
  const dead = state === 'dead';
  const fill = dead ? '#7a5a3a' : state === 'severe' ? '#7d8a3a' : K.green2;
  const hi = dead ? '#9a7a4a' : K.green3;
  const stem = dead ? '#5a3820' : '#3f7a34';
  const droop = state === 'severe' ? 3 : dead ? 5 : 0;
  const baseX = 32, baseY = 78;
  const dens = state === 'severe' ? 0.6 : 0.3;
  const L = (x: number, y: number, rx: number, ry: number) => leaf(p, x, y + droop * (y < 50 ? 1 : 0.5), ill?.curl ? rx - 1 : rx, ill?.curl ? ry + 1 : ry, fill, hi, ill, dens);

  if (state === 'sprout') {
    p.vline(baseX, 64, 14, stem);
    leaf(p, baseX - 5, 63, 5, 2, K.green3, K.green4); leaf(p, baseX + 5, 62, 5, 2, K.green3, K.green4);
    p.toTexture(scene, key); return key;
  }
  const tall = state === 'young' || ((sick || dead) && !grown) ? 0.7 : 1;

  if (crop === 'tomato') {
    if (tall === 1) { p.rect(46, 8, 3, 72, K.wood3).vline(46, 8, 72, K.wood4).hline(45, 24, 5, K.paper2).hline(45, 44, 5, K.paper2); }   // колышек и подвязки
    const top = Math.round(baseY - 66 * tall);
    let x = baseX;
    for (let y = baseY; y > top; y--) { x += Math.sin(y / 9) * 0.25; p.rect(Math.round(x), y, 2, 1, stem); }
    for (let i = 0, y = baseY - 10; y > top + 4; y -= 9, i++) {
      const side = i % 2 ? 1 : -1, len = 12 - Math.floor(i / 2);
      for (let k = 0; k < len; k++) p.px(baseX + side * k, y - Math.floor(k / 3) + (k > 6 ? droop : 0), stem);
      for (let k = 3; k < len; k += 3) { L(baseX + side * k, y - Math.floor(k / 3) - 3, 3, 2); L(baseX + side * k, y - Math.floor(k / 3) + 3, 3, 2); }
      L(baseX + side * (len + 1), y - Math.floor(len / 3), 4, 3);
      if (state === 'mature' && i % 2 === 0 && i < 5) for (let f = 0; f < 3; f++) p.ellipse(baseX + side * (4 + f * 3), y + 6 + (f % 2) * 2, 3, 3, f === 2 ? K.lamp3 : '#e95f5f', K.red2).px(baseX + side * (4 + f * 3) - 1, y + 5 + (f % 2) * 2, '#ffb3a8');
      if ((sick || dead) && i % 2 === 1 && i < 4) p.ellipse(baseX + side * 6, y + 6, 3, 3, dead ? '#5a3820' : '#9a7a3a', K.wood1);   // больные плоды
    }
    L(baseX, top, 4, 3);
  } else if (crop === 'potato') {
    for (let s = -2; s <= 2; s++) {
      const top = Math.round(baseY - (34 + (2 - Math.abs(s)) * 8) * tall);
      for (let y = baseY; y > top; y--) p.px(baseX + s * 5 + Math.round((baseY - y) * s * 0.18), y, stem);
      for (let y = baseY - 8; y > top; y -= 6) { const cx = baseX + s * 5 + Math.round((baseY - y) * s * 0.18); L(cx - 4, y, 4, 3); L(cx + 4, y - 2, 4, 3); }
      if (state === 'mature' && Math.abs(s) < 2) {
        const cx = baseX + s * 5 + Math.round((baseY - top) * s * 0.18);
        for (let f = 0; f < 3; f++) p.ellipse(cx - 2 + f * 2, top - 2 - (f % 2) * 2, 2, 2, K.white, '#b0a0d0').px(cx - 2 + f * 2, top - 2 - (f % 2) * 2, K.lamp);
      }
    }
  } else {   // перец
    const top = Math.round(baseY - 58 * tall);
    for (let y = baseY; y > top; y--) p.rect(baseX, y, 2, 1, stem);
    for (let i = 0, y = baseY - 12; y > top + 2; y -= 10, i++) {
      for (let k = 0; k < 9; k++) { p.px(baseX - k, y - Math.floor(k / 2), stem); p.px(baseX + 1 + k, y - Math.floor(k / 2), stem); }
      L(baseX - 10, y - 5, 6, 3); L(baseX + 11, y - 5, 6, 3); L(baseX - 4, y - 7, 4, 2); L(baseX + 5, y - 7, 4, 2);
      if (state === 'mature' && i < 3) {
        const c = i === 1 ? '#3f7a34' : '#c8323c', d = i === 1 ? K.green1 : K.red2;
        p.rect(baseX - 8, y - 2, 4, 9, c).vline(baseX - 8, y - 2, 9, d).px(baseX - 7, y - 1, '#ff8a80').px(baseX - 6, y - 3, stem);
        p.rect(baseX + 7, y - 1, 4, 8, i === 2 ? '#e8833a' : c).vline(baseX + 10, y - 1, 8, d).px(baseX + 8, y - 2, stem);
      }
    }
    L(baseX, top - 2, 5, 3);
  }
  if (ill?.web) for (let i = 0; i < 6; i++) { const x = 14 + Math.floor(p.r() * 36), y = 18 + Math.floor(p.r() * 40); p.hline(x, y, 6, '#e2e2e8').vline(x + 3, y - 2, 5, '#e2e2e8'); }
  p.toTexture(scene, key);
  return key;
}

/** Фон «окна» с грядкой (родное разрешение 88×99). wet — влажная почва. */
export function bedTexture(scene: Phaser.Scene, crop: Crop | null, season: number, wet: boolean): string {
  const key = `bed-${crop}-${season}-${wet ? 'w' : 'd'}`;
  if (scene.textures.exists(key)) return key;
  const p = new Painter(88, 99, 77 + season);
  const sky = season === 3 ? ['#3e3260', '#6b4e7a', '#a85f5f', '#d9735a', '#e8a45c'] : season === 2 ? ['#3e5a8a', '#5b8fb9', '#8fbfd9', '#f2d39a', '#f2b45a'] : ['#5d3a6e', '#8a4f7a', '#b85f6b', '#d9735a', '#f2a95c'];
  p.bands(0, 0, 88, 34, sky);
  for (let x = 0; x < 88; x++) { const h = 6 + Math.round(4 * Math.sin(x / 9) + 2 * Math.sin(x / 4)); p.vline(x, 34 - h, h, '#3b3358'); }
  p.rect(0, 34, 88, 30, season === 3 ? '#6a7a3a' : '#4f8a3c').noise(0, 34, 88, 30, ['#3f7a34', '#5f9a46', '#6fae4f'], 0.18);
  // забор на заднем плане
  for (let x = 2; x < 88; x += 9) p.rect(x, 30, 3, 14, K.wood3).vline(x, 30, 14, K.wood4).px(x + 1, 29, K.wood3);
  p.rect(0, 34, 88, 2, K.wood2).rect(0, 40, 88, 2, K.wood2);
  // приподнятая грядка: почва, мульча, деревянный бортик
  const s1 = wet ? '#2a1a10' : K.soil1, s2 = wet ? '#3e2818' : K.soil2, s3 = wet ? '#4e3420' : K.soil3;
  p.rect(4, 70, 80, 14, s2).noise(4, 70, 80, 14, [s1, s3], 0.35);
  for (let x = 6; x < 84; x += 5) p.hline(x, 72 + (x % 3), 3, '#d9b36a');   // солома-мульча
  if (wet) p.noise(4, 70, 80, 6, ['#5b8fb9'], 0.03);
  p.rect(2, 82, 84, 17, K.wood3).hline(2, 82, 84, K.wood4).hline(2, 90, 84, K.wood2).hline(2, 98, 84, K.wood1);
  for (const x of [2, 43, 83]) p.rect(x, 80, 3, 19, K.wood2);
  // камешки и табличка
  p.ellipse(10, 78, 2, 1, K.gray3).ellipse(76, 77, 2, 1, K.gray2);
  if (crop) { p.vline(74, 60, 14, K.wood2); p.rect(68, 56, 14, 7, K.paper).frame(68, 56, 14, 7, K.wood1); p.rect(70, 58, 3, 3, crop === 'tomato' ? '#e95f5f' : crop === 'pepper' ? '#e8833a' : '#d9b36a'); }
  p.toTexture(scene, key);
  return key;
}

/** Инструменты и мелкие частицы. */
export function registerTools(scene: Phaser.Scene) {
  paintSheet(scene, 'tool-can', 20, 14, 1, (p) => {
    p.rect(4, 4, 11, 9, '#9aa8b8').frame(4, 4, 11, 9, K.gray1).hline(5, 5, 9, '#c8d4e0');
    p.rect(6, 1, 7, 2, K.gray1);                                               // ручка
    for (let i = 0; i < 5; i++) p.px(15 + i, 8 - i, K.gray1).px(15 + i, 9 - i, '#9aa8b8');   // носик
    p.rect(18, 2, 2, 3, K.gray1);
  });
  paintSheet(scene, 'tool-spray', 12, 18, 2, (p, f) => {
    p.rect(3, 7, 7, 11, '#f2a7b8').frame(3, 7, 7, 11, '#b0245f').rect(4, 10, 5, 4, K.white);
    p.rect(4, 4, 5, 3, K.gray1).rect(0, 4, 4, 2, K.gray1);
    p.rect(8, 5 + f, 3, 4 - f, K.gray2);                                        // курок
  });
  paintSheet(scene, 'tool-scissors', 16, 12, 2, (p, f) => {
    const o = f ? 0 : 2;
    for (let i = 0; i < 9; i++) { p.px(6 + i, 5 - Math.floor(i * o / 8), K.gray3); p.px(6 + i, 6 + Math.floor(i * o / 8), K.gray3); }
    p.ellipse(3, 3, 2, 2, '#c8323c', K.ink).ellipse(3, 8, 2, 2, '#c8323c', K.ink).px(6, 5, K.ink);
  });
  paintSheet(scene, 'leaf-bit', 6, 5, 1, (p) => { p.ellipse(3, 2, 2, 1, '#9a7a3a', K.green1).px(2, 2, '#4a2e1c'); });
  paintSheet(scene, 'drop', 2, 3, 1, (p) => { p.rect(0, 0, 2, 3, '#8fc1e3').px(0, 0, K.white); });
  paintSheet(scene, 'sparkle', 5, 5, 1, (p) => { p.hline(0, 2, 5, K.white).vline(2, 0, 5, K.white).px(2, 2, K.lamp); });
  paintSheet(scene, 'root', 24, 12, 1, (p) => { for (let i = 0; i < 7; i++) { let x = 12; for (let y = 0; y < 12; y++) { x += (i - 3) * 0.35 + (p.r() - 0.5); p.px(Math.round(x), y, '#c9ab74'); } } });
}
