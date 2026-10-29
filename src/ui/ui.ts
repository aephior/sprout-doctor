// Общие элементы интерфейса: бумажные панели «полевого дневника», неоновые панели скана, текст.
export const FONT = '"Pixelify Sans", "Courier New", monospace';
export const C = {
  ink: 0x1e1b2e, paper: 0xf6e7c1, paperDark: 0xe2cfa0, wood: 0x8a5a3b, indigo: 0x2b2a4c,
  teal: 0x3fd0c9, magenta: 0xff4f9a, orange: 0xe8833a, green: 0x4f8a3c, blight: 0x6b4e8c,
};
export const HEX = {
  ink: '#1e1b2e', paper: '#f6e7c1', teal: '#3fd0c9', magenta: '#ff4f9a', orange: '#e8833a', white: '#f6f1e6', green: '#4f8a3c',
  // тёмные варианты для текста на бумаге
  greenDark: '#2e6b2a', orangeDark: '#a8531a', magentaDark: '#b0245f',
};

export function text(scene: Phaser.Scene, x: number, y: number, s: string, size = 18, color = HEX.ink, opts: Phaser.Types.GameObjects.Text.TextStyle = {}) {
  return scene.add.text(x, y, s, { fontFamily: FONT, fontSize: `${size}px`, color, resolution: 2, ...opts });
}

/** Бумажная панель с деревянной рамкой. */
export function paperPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number) {
  const g = scene.add.graphics();
  g.fillStyle(C.ink, 1).fillRect(x - 3, y - 3, w + 6, h + 6);
  g.fillStyle(C.wood, 1).fillRect(x - 2, y - 2, w + 4, h + 4);
  g.fillStyle(C.paper, 1).fillRect(x, y, w, h);
  g.fillStyle(C.paperDark, 1).fillRect(x, y + h - 3, w, 3);
  return g;
}

/** Неоновая панель режима скана. */
export function neonPanel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, color = C.teal) {
  const g = scene.add.graphics();
  g.fillStyle(C.indigo, 0.92).fillRect(x, y, w, h);
  g.lineStyle(2, color, 1).strokeRect(x, y, w, h);
  g.lineStyle(1, color, 0.35).strokeRect(x - 3, y - 3, w + 6, h + 6);
  return g;
}

export function bar(scene: Phaser.Scene, x: number, y: number, w: number, h: number, value: number, color: number, back = C.ink) {
  const g = scene.add.graphics();
  g.fillStyle(back, 0.8).fillRect(x, y, w, h);
  g.fillStyle(color, 1).fillRect(x + 1, y + 1, Math.max(0, (w - 2) * Math.min(1, value)), h - 2);
  return g;
}
