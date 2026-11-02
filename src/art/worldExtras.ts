// Спрайты «жизни» на ферме: кошка Моти, рыбак у пруда, автобус, фонарь, бабочки, лепестки, следы, лужи, туман.
import { paintSheet, K } from './paint';

export function registerWorldExtras(scene: Phaser.Scene) {
  // Моти 14×10: 0-1 идёт, 2 сидит, 3 спит
  paintSheet(scene, 'mochi-walk', 14, 10, 4, (p, f) => {
    const W = K.white, O = K.lamp3, I = K.ink;
    if (f === 3) { p.ellipse(7, 7, 6, 3, W, I).rect(3, 5, 3, 2, O).ellipse(3, 6, 3, 3, W, I).px(1, 3, I).px(4, 3, I).hline(2, 6, 2, I).rect(11, 8, 3, 1, O); return; }
    if (f === 2) { p.ellipse(7, 7, 4, 3, W, I).rect(6, 5, 3, 2, O).ellipse(7, 3, 3, 3, W, I).px(5, 0, I).px(9, 0, I).px(6, 3, I).px(8, 3, I).rect(10, 7, 3, 1, O); return; }
    p.ellipse(7, 5, 5, 3, W, I).rect(5, 3, 3, 2, O);
    p.ellipse(2, 3, 3, 3, W, I).px(0, 0, I).px(3, 0, I).px(1, 3, I).px(3, 3, I);
    p.rect(12, f ? 1 : 3, 2, 3, O);                                                    // хвост
    const legs = f ? [[4, 8], [9, 9]] : [[4, 9], [9, 8]];
    legs.forEach(([x, y]) => p.rect(x, 8, 1, y - 7, I));
  }, 3);

  // Рыбак 16×22, сидит на складном стуле, удочка: 0-1 (поклёвка)
  paintSheet(scene, 'fisher', 30, 24, 2, (p, f) => {
    p.rect(3, 16, 10, 2, K.wood2).rect(4, 18, 1, 5, K.wood1).rect(11, 18, 1, 5, K.wood1);   // стул
    p.rect(4, 9, 8, 8, '#4a6a8a').rect(5, 10, 6, 6, '#5b7fa0');                            // куртка
    p.rect(4, 17, 3, 4, '#3a3a4a').rect(9, 17, 3, 4, '#3a3a4a').rect(3, 21, 4, 2, K.ink).rect(9, 21, 4, 2, K.ink);
    p.ellipse(8, 6, 3, 3, K.skin, K.ink);
    p.rect(3, 1, 10, 3, '#d9b36a').rect(5, 0, 6, 2, '#d9b36a').hline(3, 3, 10, '#b08a45');   // панама
    p.px(7, 6, K.ink).px(9, 6, K.ink);
    for (let i = 0; i < 16; i++) p.px(11 + i, 11 - Math.floor(i * 0.6) - (f && i > 12 ? 1 : 0), K.wood1);   // удочка
    for (let y = 1; y < 22; y++) p.px(27 + (f ? 1 : 0), y, '#c8d4e0');                                        // леска
    p.rect(26 + (f ? 1 : 0), 21 - (f ? 1 : 0), 3, 2, K.red);                                                   // поплавок
    p.rect(14, 19, 6, 4, '#3d6d96').hline(14, 19, 6, K.ink);                                                   // ведро
  }, 11);

  // Автобус 44×22 (вид сбоку-сверху), 2 кадра колёс
  paintSheet(scene, 'bus', 46, 24, 2, (p, f) => {
    p.rect(1, 4, 44, 15, '#f6e7c1').frame(1, 4, 44, 15, K.ink);
    p.rect(2, 13, 42, 5, '#5b8fb9').hline(2, 12, 42, K.red);
    for (let x = 6; x < 40; x += 7) p.rect(x, 6, 5, 5, '#8fbfd9').px(x, 6, K.white);
    p.rect(39, 6, 5, 6, '#8fbfd9').rect(2, 2, 42, 3, '#e2cfa0').frame(2, 2, 42, 3, K.ink);
    p.rect(17, 0, 10, 3, K.ink).rect(18, 1, 8, 1, K.lamp);                                   // табличка маршрута
    for (const x of [9, 35]) { p.ellipse(x, 19, 3, 3, K.ink); p.px(x + (f ? 1 : -1), 19, K.gray3); }
    p.rect(43, 15, 2, 2, K.lamp);
  }, 13);

  // Фонарь 8×28 и его свет
  paintSheet(scene, 'lamppost', 9, 30, 1, (p) => {
    p.rect(4, 6, 2, 22, K.gray1).rect(2, 27, 6, 3, K.gray1);
    p.rect(1, 1, 8, 6, K.ink).rect(2, 2, 6, 4, K.lamp).hline(0, 0, 10, K.ink);
  });
  // Бабочка 5×4, 2 кадра
  paintSheet(scene, 'butterfly', 5, 4, 2, (p, f) => {
    if (f === 0) p.rect(0, 0, 2, 3, K.white).rect(3, 0, 2, 3, K.white).vline(2, 0, 4, K.ink);
    else p.rect(1, 1, 1, 2, K.white).rect(3, 1, 1, 2, K.white).vline(2, 0, 4, K.ink);
  });
  paintSheet(scene, 'petal', 3, 2, 1, (p) => { p.rect(0, 0, 3, 2, K.sakura).px(2, 0, '#ffd6e0'); });
  paintSheet(scene, 'leaf-fall', 3, 3, 1, (p) => { p.rect(0, 1, 3, 1, K.lamp3).px(1, 0, '#c8323c').px(1, 2, '#d29a5f'); });
  paintSheet(scene, 'step', 5, 2, 1, (p) => { p.rect(0, 0, 2, 1, '#4a3a24').rect(3, 1, 2, 1, '#4a3a24'); });   // два следа-отпечатка (тёмные — видны и на траве, и на песке)
  paintSheet(scene, 'raindrop', 1, 4, 1, (p) => { p.rect(0, 0, 1, 4, '#9cc4e4'); });
  paintSheet(scene, 'puddle', 12, 5, 1, (p) => { p.ellipse(6, 2, 5, 2, '#5b8fb9').hline(4, 1, 3, '#9cc4e4'); });
  paintSheet(scene, 'shadow', 12, 4, 1, (p) => { p.ellipse(6, 2, 5, 1, '#1e1b2e'); });
  // клочок тумана — мягкое белое пятно
  if (!scene.textures.exists('fog')) {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 64;
    // эллипс с мягкими краями: круговой градиент, сжатый по вертикали (без обрезанных краёв)
    const ctx = cv.getContext('2d')!; ctx.setTransform(1, 0, 0, 0.5, 0, 0);
    const g = ctx.createRadialGradient(64, 64, 2, 64, 64, 63);
    g.addColorStop(0, 'rgba(246,241,230,0.5)'); g.addColorStop(0.6, 'rgba(246,241,230,0.22)'); g.addColorStop(1, 'rgba(246,241,230,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 128, 128);
    scene.textures.addCanvas('fog', cv);
  }
  // пиксельное сердечко (символ ♥ есть не во всех шрифтах)
  if (!scene.textures.exists('heart-px')) {
    const rows = ['.oo.oo.', 'oppopp o'.replace(' ', ''), 'opppppo', '.opppo.', '..opo..', '...o...'];
    const cv = document.createElement('canvas'); cv.width = 7; cv.height = 6;
    const ctx = cv.getContext('2d')!;
    rows.forEach((r, y) => [...r].forEach((c, x) => { if (c !== '.') { ctx.fillStyle = c === 'o' ? '#1e1b2e' : '#ff4f9a'; ctx.fillRect(x, y, 1, 1); } }));
    scene.textures.addCanvas('heart-px', cv);
  }
}
