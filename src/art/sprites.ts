// Временные спрайты (placeholder) в палитре проекта.
// Финальные спрайты 32×48 заменят их без изменения кода: ключи текстур остаются теми же.
import { addSheet, addPainted, Grid } from './pixel';

// ---------- Фуку 14×14 (бумажный фонарь-дрон) ----------
const FUKU = (lens: string, prop: string): Grid => [
  `${prop}${prop}${prop}${prop}......${prop}${prop}${prop}${prop}`,
  '..kk......kk..',
  '...k.kkkk.k...',
  '.....kTTk.....',
  '....kkkkkk....',
  '...kLLLLLLk...',
  '..kLlkkkklLk..',
  `..kLk${lens}${lens}${lens}${lens}kLk..`,
  `..kLk${lens}w${lens}${lens}kLk..`,
  `..kLk${lens}${lens}${lens}${lens}kLk..`,
  '..kLlkkkklLk..',
  '...kLLLLLLk...',
  '....kllllk....',
  '.....kkkk.....',
];
// 0-1 ожидание (пропеллеры мигают), 2 скан, 3 тревога
const FUKU_FRAMES: Grid[] = [FUKU('i', 'c'), FUKU('i', '.'), FUKU('g', 'c'), FUKU('r', 'r')];

export function registerSprites(scene: Phaser.Scene) {
  addSheet(scene, 'fuku', FUKU_FRAMES);   // заглушка, если картинка Фуку не загрузилась

  const a = scene.anims;
  a.create({ key: 'fuku-idle', frames: a.generateFrameNumbers('fuku', { frames: [0, 1] }), frameRate: 4, repeat: -1 });
  // персонажи фермы (16×20): кадр = строка*4 + столбец; столбцы: вниз, вверх, влево, вправо
  for (const k of ['aoi-na', 'ogawa-na', 'fisher-na', 'villager2-na', 'villager16-na', 'villager25-na', 'villager12-na']) {
    if (!scene.textures.exists(k)) continue;
    (['down', 'up', 'left', 'right'] as const).forEach((d, c) =>
      a.create({ key: `${k}-${d}`, frames: a.generateFrameNumbers(k, { frames: [4 + c, 8 + c, 12 + c, c] }), frameRate: 8, repeat: -1 }));
  }
  if (scene.textures.exists('mochi-na')) (['down', 'up', 'left', 'right'] as const).forEach((d, c) =>
    a.create({ key: `mochi-${d}`, frames: a.generateFrameNumbers('mochi-na', { frames: [c, 4 + c] }), frameRate: 6, repeat: -1 }));
  if (scene.textures.exists('fuku-na')) a.create({ key: 'fukuna-idle', frames: a.generateFrameNumbers('fuku-na', { frames: [0, 1] }), frameRate: 6, repeat: -1 });

  registerTiles(scene);
}

// ---------- Тайлы 16×16 и объекты ----------
function registerTiles(scene: Phaser.Scene) {
  addPainted(scene, 'grass', 16, 16, (px, r) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const v = r();
      px(x, y, v < 0.12 ? '#5f9a46' : v < 0.2 ? '#467c35' : '#55913f');
    }
    if (r() < 0.5) { const x = 2 + Math.floor(r() * 12), y = 2 + Math.floor(r() * 12); px(x, y, '#f2a7b8'); }
  }, 7);
  addPainted(scene, 'grass2', 16, 16, (px, r) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, r() < 0.15 ? '#467c35' : '#55913f');
    for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 15), y = 3 + Math.floor(r() * 12); px(x, y, '#6fae4f'); px(x, y - 1, '#6fae4f'); }
  }, 11);
  addPainted(scene, 'path', 16, 16, (px, r) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, r() < 0.15 ? '#c7ad80' : '#d8c194');
    for (let i = 0; i < 2; i++) px(Math.floor(r() * 16), Math.floor(r() * 16), '#9a9a9a');
  }, 3);
  addPainted(scene, 'soil', 16, 16, (px, r) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      const furrow = y % 4 === 3;
      px(x, y, furrow ? '#6a4329' : (r() < 0.2 ? '#7a4f33' : '#8a5a3b'));
    }
  }, 5);
  addPainted(scene, 'soil-wet', 16, 16, (px, r) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, y % 4 === 3 ? '#4a2e1c' : (r() < 0.2 ? '#563622' : '#5e3c26'));
  }, 5);
  addPainted(scene, 'water', 16, 16, (px, r) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, r() < 0.1 ? '#4a7fae' : '#3d6d96');
    for (let i = 0; i < 3; i++) { const x = Math.floor(r() * 12), y = Math.floor(r() * 16); px(x, y, '#8fc1e3'); px(x + 1, y, '#8fc1e3'); }
  }, 9);
  addPainted(scene, 'floor', 16, 16, (px) => {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) px(x, y, y % 5 === 4 ? '#8a5a3b' : '#b08a5a');
  });
  addPainted(scene, 'fence', 16, 16, (px) => {
    for (let x = 0; x < 16; x++) { px(x, 6, '#6a4329'); px(x, 7, '#b08a5a'); px(x, 10, '#6a4329'); px(x, 11, '#b08a5a'); }
    for (const x0 of [2, 12]) for (let y = 3; y < 15; y++) { px(x0, y, '#1e1b2e'); px(x0 + 1, y, '#b08a5a'); px(x0 + 2, y, '#1e1b2e'); }
  });
  addPainted(scene, 'tree', 32, 40, (px, r) => {
    const cx = 16, cy = 15;
    for (let y = 0; y < 30; y++) for (let x = 0; x < 32; x++) {
      const d = Math.hypot((x - cx) / 15, (y - cy) / 14);
      if (d < 1) px(x, y, d > 0.92 ? '#1e1b2e' : (r() < 0.25 ? '#2f5f2a' : (y < cy - 4 && r() < 0.3 ? '#6fae4f' : '#4f8a3c')));
    }
    for (let y = 27; y < 38; y++) for (let x = 13; x < 19; x++) px(x, y, x === 13 || x === 18 ? '#1e1b2e' : '#6a4329');
    for (let x = 9; x < 23; x++) px(x, 38, '#2e5e38');
  }, 21);
  // дом бабушки Хару 64×56
  addPainted(scene, 'house', 64, 56, (px, r) => {
    for (let y = 0; y < 24; y++) for (let x = 0; x < 64; x++) {
      const inset = Math.max(0, 10 - y);
      if (x < inset || x > 63 - inset) continue;
      px(x, y, y === 23 || x === inset || x === 63 - inset ? '#1e1b2e' : (y % 3 === 0 ? '#2b2a4c' : '#3c3a63'));
    }
    for (let y = 24; y < 56; y++) for (let x = 4; x < 60; x++) {
      const edge = x === 4 || x === 59 || y === 55;
      px(x, y, edge ? '#1e1b2e' : (x % 8 === 0 ? '#8a5a3b' : (r() < 0.05 ? '#d9c79e' : '#e2cfa0')));
    }
    for (let y = 36; y < 56; y++) for (let x = 27; x < 37; x++) px(x, y, x === 27 || x === 36 || y === 36 ? '#1e1b2e' : '#6a4329');
    for (const wx of [10, 44]) for (let y = 32; y < 42; y++) for (let x = wx; x < wx + 10; x++)
      px(x, y, x === wx || x === wx + 9 || y === 32 || y === 41 ? '#1e1b2e' : (x === wx + 5 || y === 37 ? '#8a5a3b' : '#f6e7c1'));
  }, 4);
  // лавка Огавы 48×44
  addPainted(scene, 'shop', 48, 44, (px, r) => {
    for (let y = 0; y < 12; y++) for (let x = 0; x < 48; x++) px(x, y, y === 11 ? '#1e1b2e' : ((x >> 2) % 2 ? '#c8323c' : '#f6e7c1'));
    for (let y = 12; y < 44; y++) for (let x = 2; x < 46; x++)
      px(x, y, x === 2 || x === 45 || y === 43 ? '#1e1b2e' : (r() < 0.05 ? '#7a4f33' : '#8a5a3b'));
    for (let y = 18; y < 30; y++) for (let x = 8; x < 40; x++) px(x, y, y === 18 || y === 29 ? '#1e1b2e' : '#f2c230');
    for (let y = 32; y < 44; y++) for (let x = 19; x < 29; x++) px(x, y, x === 19 || x === 28 ? '#1e1b2e' : '#2b2a4c');
  }, 8);
  // торговый автомат 16×28
  addPainted(scene, 'vending', 16, 28, (px) => {
    for (let y = 0; y < 28; y++) for (let x = 0; x < 16; x++) {
      const edge = x === 0 || x === 15 || y === 0 || y === 27;
      px(x, y, edge ? '#1e1b2e' : (y > 3 && y < 15 && x > 2 && x < 13 ? (y % 3 === 0 ? '#ff4f9a' : '#3fd0c9') : '#f6f1e6'));
    }
  });
  // остановка 32×32
  addPainted(scene, 'busstop', 32, 32, (px) => {
    for (let x = 0; x < 32; x++) for (let y = 4; y < 8; y++) px(x, y, y === 7 ? '#1e1b2e' : '#5b8fb9');
    for (const x0 of [2, 28]) for (let y = 8; y < 30; y++) { px(x0, y, '#6e6e6e'); px(x0 + 1, y, '#9a9a9a'); }
    for (let x = 6; x < 26; x++) { px(x, 22, '#8a5a3b'); px(x, 23, '#6a4329'); }
    for (let y = 0; y < 4; y++) for (let x = 12; x < 20; x++) px(x, y, '#f2c230');
  });
  // Спорон 12×12
  addPainted(scene, 'sporon', 12, 12, (px) => {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 12; x++) { const d = Math.hypot((x - 5.5) / 6, (y - 6) / 6); if (d < 1) px(x, y, d > 0.85 ? '#1e1b2e' : '#6b4e8c'); }
    for (let y = 7; y < 12; y++) for (let x = 3; x < 9; x++) px(x, y, x === 3 || x === 8 || y === 11 ? '#1e1b2e' : '#9a9a9a');
    px(4, 8, '#c8323c'); px(7, 8, '#c8323c');
  });
  // карточка-рамка для HUD: заливка панели
  addPainted(scene, 'pixel', 1, 1, (px) => px(0, 0, '#ffffff'));
}
