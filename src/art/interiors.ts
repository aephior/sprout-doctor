// Интерьеры (родное разрешение 320×180, на экране ×3): лавка Огавы и дом бабушки Хару.
// Всё нарисовано кодом: стены, полки, свет, мебель, персонажи и кошка Моти.
import { Painter, paintSheet, K } from './paint';

// ---------- ЛАВКА ----------
export function paintShop(scene: Phaser.Scene) {
  makeGlow(scene);
  if (scene.textures.exists('shop-bg')) return;
  // фон: стена, окно с закатом, полки, фонарь
  const p = new Painter(320, 180, 31);
  p.rect(0, 0, 320, 180, K.wood3);
  for (let x = 0; x < 320; x += 12) { p.vline(x, 0, 180, K.wood2); p.noise(x + 1, 0, 11, 180, [K.wood4, K.wood2], 0.05); }
  p.rect(0, 0, 320, 6, K.wood1).rect(0, 6, 320, 2, K.wood2);                        // потолочная балка
  // окно слева: закат над горами
  p.rect(14, 22, 62, 50, K.wood1).bands(17, 25, 56, 44, ['#5d3a6e', '#8a4f7a', '#b85f6b', '#d9735a', '#e8833a', '#f2a95c']);
  p.ellipse(56, 58, 6, 6, K.paper);
  for (let x = 17; x < 73; x++) { const h = 8 + Math.round(5 * Math.sin(x / 7) + 3 * Math.sin(x / 3)); p.vline(x, 69 - h, h, '#3b3358'); }
  p.vline(45, 25, 44, K.wood1).hline(17, 46, 56, K.wood1);                           // рама-сёдзи
  p.rect(12, 72, 66, 4, K.wood1).rect(12, 72, 66, 1, K.wood4);                        // подоконник
  p.rect(20, 64, 9, 8, K.red).rect(21, 61, 7, 3, K.green2).px(24, 59, K.green3);       // горшок с ростком на окне
  // доска-меню на стене справа «お品書き»
  p.rect(232, 14, 76, 92, K.wood1).rect(234, 16, 72, 88, K.wood2);
  p.rect(234, 16, 72, 10, K.red2);
  // полки за прилавком
  const shelf = (y: number) => { p.rect(92, y, 132, 4, K.wood1).hline(92, y, 132, K.wood4).rect(94, y + 4, 3, 3, K.wood1).rect(219, y + 4, 3, 3, K.wood1); };
  shelf(44); shelf(78);
  // банки, мешочки семян, бутылки
  const jar = (x: number, y: number, c: string) => { p.rect(x, y - 12, 9, 12, '#bfe3e0').rect(x + 1, y - 10, 7, 9, c).rect(x, y - 14, 9, 2, K.wood2).px(x + 1, y - 11, K.white); };
  const bag = (x: number, y: number, c: string) => { p.rect(x, y - 11, 10, 11, c).rect(x + 2, y - 13, 6, 2, c).rect(x + 3, y - 8, 4, 3, K.paper).px(x + 4, y - 7, K.green2); };
  const bottle = (x: number, y: number, c: string) => { p.rect(x, y - 14, 6, 14, c).rect(x + 2, y - 18, 2, 4, c).rect(x + 1, y - 10, 4, 5, K.paper); };
  [[96, '#e8833a'], [108, '#c8323c'], [120, '#9ccc65']].forEach(([x, c]) => jar(x as number, 44, c as string));
  [[134, '#d9b36a'], [146, '#b08a45'], [158, '#d9b36a'], [170, '#8a5a3b']].forEach(([x, c]) => bag(x as number, 44, c as string));
  [[186, '#2f5f2a'], [194, '#5b8fb9'], [202, '#2f5f2a'], [210, '#8e2230']].forEach(([x, c]) => bottle(x as number, 44, c as string));
  for (let i = 0; i < 6; i++) { const x = 96 + i * 21; p.rect(x, 64, 16, 14, i % 2 ? K.paper2 : K.paper).frame(x, 64, 16, 14, K.paper3).rect(x + 4, 68, 8, 5, [K.green2, K.red, K.lamp3, K.green3, K.sakura, K.lamp2][i]); }  // пакетики семян
  // календарь и часы
  p.rect(84, 92, 1, 1, K.ink);
  p.ellipse(298, 124, 6, 6, K.paper, K.wood1).vline(298, 120, 4, K.ink).hline(298, 124, 3, K.ink);
  // фонарь-тётин под потолком
  p.vline(160, 6, 6, K.ink).ellipse(160, 20, 9, 9, K.red, K.red2).hline(152, 13, 17, K.ink).hline(152, 27, 17, K.ink);
  for (let y = 15; y < 26; y += 3) p.hline(153, y, 15, K.red2);
  p.rect(157, 17, 6, 7, K.paper);
  p.toTexture(scene, 'shop-bg');

  // прилавок (передний план, перекрывает Огаву снизу)
  const f = new Painter(320, 180, 32);
  f.rect(0, 120, 320, 60, K.wood2);
  for (let x = 0; x < 320; x += 20) f.vline(x, 128, 52, K.wood1);
  f.noise(0, 128, 320, 52, [K.wood3, K.wood1], 0.06);
  f.rect(0, 116, 320, 12, K.wood4).hline(0, 116, 320, K.wood5).hline(0, 127, 320, K.wood1);   // столешница
  f.rect(0, 160, 320, 20, K.wood1).noise(0, 160, 320, 20, [K.wood2], 0.1);
  // на прилавке: касса, счёты, колокольчик, горшок
  f.rect(22, 96, 34, 20, K.gray1).rect(24, 98, 30, 8, K.gray2).rect(26, 100, 26, 4, '#2a3a2a').rect(29, 101, 8, 2, K.green4);
  for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) f.rect(26 + i * 7, 108 + j * 4, 5, 3, K.gray3);
  f.rect(250, 104, 44, 12, K.wood1).rect(251, 105, 42, 10, K.wood3);
  for (let r = 0; r < 3; r++) { f.hline(251, 107 + r * 3, 42, K.ink); for (let b = 0; b < 8; b++) f.rect(253 + b * 5 + (r % 2), 106 + r * 3, 3, 2, r === 1 ? K.red : K.ink); }
  f.ellipse(78, 112, 4, 4, K.lamp, K.lamp3).vline(78, 106, 3, K.ink);
  f.toTexture(scene, 'shop-fg');

  // Огава: 0 — обычный, 1 — моргает, 2 — говорит, 3 — радуется
  paintSheet(scene, 'ogawa', 48, 64, 4, (q, fr) => {
    // плечи, рубашка, фартук
    q.ellipse(24, 60, 21, 14, '#e2cfa0', K.ink);
    q.rect(10, 48, 28, 16, '#2b3a6a').rect(14, 48, 20, 16, '#24315a');
    q.rect(12, 46, 24, 4, K.white).rect(10, 47, 4, 6, K.white).rect(34, 47, 4, 6, K.white);   // полотенце на шее
    // голова
    q.ellipse(24, 30, 12, 14, K.skin, K.ink).rect(21, 42, 6, 5, K.skin2);
    q.rect(12, 30, 2, 5, K.skin2).rect(34, 30, 2, 5, K.skin2);                                // уши
    // кепка
    q.ellipse(24, 18, 13, 7, '#3a4a7a', K.ink).rect(10, 20, 28, 3, '#2b3a6a').rect(30, 21, 12, 3, '#2b3a6a').hline(30, 24, 12, K.ink);
    // седые виски и брови
    q.rect(12, 24, 3, 6, K.gray3).rect(33, 24, 3, 6, K.gray3).hline(17, 27, 5, K.gray2).hline(26, 27, 5, K.gray2);
    // очки
    q.frame(16, 29, 7, 5, K.ink).frame(25, 29, 7, 5, K.ink).hline(23, 31, 2, K.ink);
    if (fr === 1 || fr === 3) { q.hline(18, 32, 3, K.ink).hline(27, 32, 3, K.ink); if (fr === 3) { q.px(17, 31, K.ink).px(21, 31, K.ink).px(26, 31, K.ink).px(30, 31, K.ink); } }
    else { q.rect(19, 31, 2, 2, K.ink).rect(28, 31, 2, 2, K.ink).px(19, 31, K.white).px(28, 31, K.white); }
    q.px(24, 34, K.skin2).px(24, 35, K.skin2);                                              // нос
    q.hline(19, 37, 10, K.gray3).hline(20, 38, 8, K.gray3);                                  // усы
    if (fr === 2) q.rect(22, 39, 4, 2, K.red2); else q.hline(21, 40, 6, K.red2);
    q.px(15, 35, K.sakura).px(32, 35, K.sakura);                                              // румянец
  }, 7);

  // кошка Моти, спит на прилавке: 2 кадра (хвост)
  paintSheet(scene, 'mochi', 26, 14, 2, (q, fr) => {
    q.ellipse(13, 9, 10, 5, K.white, K.ink).rect(6, 6, 6, 4, K.lamp3).rect(15, 9, 5, 3, K.ink);
    q.ellipse(5, 7, 4, 4, K.white, K.ink).px(2, 3, K.ink).px(3, 2, K.ink).px(7, 2, K.ink).px(8, 3, K.ink).px(4, 7, K.ink).px(6, 7, K.ink);
    if (fr === 0) q.rect(21, 11, 5, 2, K.lamp3); else q.rect(22, 8, 2, 4, K.lamp3);
  }, 9);
}

// ---------- ДОМ ----------
export function paintHome(scene: Phaser.Scene) {
  if (scene.textures.exists('home-bg')) return;
  const p = new Painter(320, 180, 41);
  // стены: штукатурка + деревянный каркас
  p.rect(0, 0, 320, 120, '#d9c79e').noise(0, 0, 320, 120, ['#cdb98c', '#e2d2ab'], 0.08);
  for (const x of [0, 60, 200, 300]) p.rect(x, 0, 6, 120, K.wood2).vline(x, 0, 120, K.wood3);
  p.rect(0, 0, 320, 8, K.wood1).rect(0, 112, 320, 8, K.wood2).hline(0, 112, 320, K.wood3);
  // токонома (ниша) с картиной-свитком и цветком
  p.rect(12, 18, 42, 92, '#c4b184').rect(24, 22, 18, 52, K.paper).frame(24, 22, 18, 52, K.wood1);
  p.vline(33, 30, 30, K.ink).px(32, 34, K.ink).px(34, 40, K.ink).ellipse(33, 63, 3, 3, K.red);                  // каллиграфия и печать
  p.rect(14, 96, 38, 14, K.wood1).rect(26, 86, 10, 10, '#5b8fb9').vline(31, 76, 10, K.green2).ellipse(29, 78, 3, 2, K.sakura).ellipse(34, 75, 3, 2, K.sakura);
  // окно-сёдзи: ночь, луна, ветка сакуры
  p.rect(72, 16, 120, 82, K.wood1);
  p.bands(75, 19, 114, 76, ['#1c1a33', '#2b2a4c', '#3e3a66', '#56508a']);
  p.ellipse(160, 38, 9, 9, '#f6e7c1');
  p.noise(75, 19, 114, 40, ['#f6f1e6'], 0.012);
  for (let x = 75; x < 189; x++) { const h = 10 + Math.round(6 * Math.sin(x / 11) + 3 * Math.sin(x / 4)); p.vline(x, 95 - h, h, '#1e1b2e'); }
  for (let i = 0; i < 40; i++) { const x = 76 + i * 1.8, y = 22 + Math.sin(i / 5) * 6 + i * 0.4; p.px(x, y, K.wood1); if (i % 4 === 0) p.ellipse(x, y + 2, 2, 1, K.sakura); }
  for (const x of [113, 151]) p.vline(x, 19, 76, K.wood2);
  for (const y of [44, 70]) p.hline(75, y, 114, K.wood2);
  p.rect(70, 98, 124, 4, K.wood2);
  // полка: фото бабушки Хару, дневник, станция Фуку
  p.rect(214, 52, 78, 4, K.wood1).hline(214, 52, 78, K.wood4);
  p.rect(222, 36, 14, 16, K.wood1).rect(224, 38, 10, 12, '#e2cfa0').ellipse(229, 43, 3, 3, K.skin).rect(226, 46, 6, 4, '#6b4e8c').rect(226, 39, 6, 2, K.gray3);
  p.rect(242, 44, 16, 8, '#8e2230').rect(243, 45, 14, 1, K.paper).rect(260, 46, 12, 6, '#5a3820');
  p.rect(276, 46, 14, 6, K.gray1).hline(278, 47, 10, K.teal);                                                  // зарядка Фуку
  // пол: татами
  p.rect(0, 120, 320, 60, K.tatami);
  for (let y = 120; y < 180; y += 2) p.hline(0, y, 320, (y / 2) % 2 ? K.tatami : '#b0a866');
  for (const x of [0, 106, 213, 319]) p.rect(x, 120, 3, 60, '#3b5a3a');
  p.rect(0, 148, 320, 2, '#3b5a3a');
  p.toTexture(scene, 'home-bg');

  // футон (передний план)
  const f = new Painter(320, 180, 42);
  f.rect(140, 128, 140, 38, K.white).frame(140, 128, 140, 38, K.gray3);                           // матрас
  f.rect(148, 132, 30, 12, '#f6f1e6').frame(148, 132, 30, 12, K.gray3);                            // подушка
  f.rect(176, 130, 102, 34, '#5b7fb9').frame(176, 130, 102, 34, '#3d5d96');                        // одеяло
  for (let x = 180; x < 276; x += 10) for (let y = 134; y < 162; y += 10) f.ellipse(x + 3, y + 3, 2, 2, '#f6f1e6');   // узор асанoha-горошек
  f.rect(176, 130, 102, 4, '#3d5d96');
  // низкий столик, чашка чая, лампа-андон (сам свет — отдельно)
  f.rect(40, 140, 60, 6, K.wood2).rect(44, 146, 4, 14, K.wood1).rect(92, 146, 4, 14, K.wood1).hline(40, 140, 60, K.wood4);
  f.rect(56, 134, 8, 6, K.white).rect(57, 135, 6, 3, '#9ccc65');
  f.rect(76, 136, 16, 4, '#8e2230');                                                                 // дневник Хару
  f.rect(110, 118, 4, 28, K.wood1).rect(122, 118, 4, 28, K.wood1).rect(108, 96, 20, 24, K.paper).frame(108, 96, 20, 24, K.wood1).hline(108, 108, 20, K.wood2).rect(106, 94, 24, 3, K.wood1);
  f.toTexture(scene, 'home-fg');

  // Аой: 0 — стоит, 1 — спит под одеялом (только голова на подушке)
  paintSheet(scene, 'aoi-home', 40, 40, 2, (q, fr) => {
    if (fr === 1) {
      q.ellipse(14, 22, 9, 8, '#6b3e26', K.ink).ellipse(16, 25, 6, 5, K.skin, K.ink);
      q.hline(13, 25, 3, K.ink).hline(18, 25, 2, K.ink).px(15, 28, K.skin2);
      return;
    }
    q.ellipse(20, 10, 7, 7, '#6b3e26', K.ink).ellipse(20, 12, 5, 5, K.skin, K.ink).rect(18, 12, 1, 1, K.ink).rect(22, 12, 1, 1, K.ink);
    q.rect(13, 18, 14, 14, '#e8833a').rect(15, 18, 10, 14, '#f2a95c');                              // домашняя кофта
    q.rect(14, 32, 5, 7, '#3d5d96').rect(21, 32, 5, 7, '#3d5d96');
  }, 3);

  makeGlow(scene);
}

/** Мягкий тёплый свет (радиальное пятно) для ламп и фонарей. */
export function makeGlow(scene: Phaser.Scene) {
  if (!scene.textures.exists('glow')) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128;
    const ctx = cv.getContext('2d')!, g = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,210,122,0.85)'); g.addColorStop(0.35, 'rgba(242,169,92,0.35)'); g.addColorStop(1, 'rgba(242,169,92,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    scene.textures.addCanvas('glow', cv);
  }
}
