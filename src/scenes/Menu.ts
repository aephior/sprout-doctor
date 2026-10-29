import { sound } from '../audio/sound';
import { game } from '../state/game';
import { gestures } from '../ai/gestureCtl';
import { loadRecords } from '../state/records';
import { isLicensed } from '../state/license';
import { text, HEX, C, paperPanel } from '../ui/ui';

export class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    sound.setMood('menu');
    gestures.stop();   // в меню камера выключена
    const { width: W, height: H } = this.scale;
    // закатное небо
    const g = this.add.graphics();
    const sky = [0x2b2a4c, 0x4a3a6b, 0x8a4f7a, 0xc8655e, 0xe8833a, 0xf2b45a];
    sky.forEach((c, i) => g.fillStyle(c, 1).fillRect(0, i * (H * 0.62 / sky.length), W, H * 0.62 / sky.length + 1));
    g.fillStyle(0xf6e7c1, 1).fillCircle(W * 0.72, H * 0.55, 46);
    g.fillStyle(0x2e3a4a, 1).fillTriangle(0, H * 0.62, 260, H * 0.3, 520, H * 0.62);
    g.fillStyle(0x3a4658, 1).fillTriangle(380, H * 0.62, 700, H * 0.36, 980, H * 0.62);
    g.fillStyle(0x2f5f2a, 1).fillRect(0, H * 0.62, W, H * 0.38);
    for (let i = 0; i < 40; i++) g.fillStyle(0x4f8a3c, 1).fillRect((i * 97) % W, H * 0.62 + ((i * 53) % 190), 18, 3);

    const aoi = this.add.sprite(W * 0.5 - 60, H * 0.62 + 40, 'aoi', 0).setScale(5);
    const fuku = this.add.sprite(W * 0.5 + 20, H * 0.62 - 10, 'fuku', 0).setScale(4).play('fuku-idle');
    this.tweens.add({ targets: fuku, y: fuku.y - 8, duration: 900, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    void aoi;

    text(this, W / 2, 70, 'SPROUT DOCTOR', 64, HEX.teal, { stroke: HEX.ink, strokeThickness: 8 }).setOrigin(0.5);
    text(this, W / 2, 128, 'スプラウト・ドクター', 26, HEX.magenta, { stroke: HEX.ink, strokeThickness: 5 }).setOrigin(0.5);
    text(this, W / 2, 162, 'Лечи урожай. Читай листья. Колдуй руками.', 18, HEX.paper, { stroke: HEX.ink, strokeThickness: 4 }).setOrigin(0.5);

    const items: [string, () => void][] = [['Новая игра', () => { game.newGame(); game.save(); this.startGame(); }]];
    if (game.hasSave()) items.unshift(['Продолжить', () => {
      if (game.load()) this.startGame();
      else { game.newGame(); game.save(); this.startGame(); }   // сохранение повреждено — начинаем заново, а не зависаем
    }]);
    items.push(['Ритуалы рук (камера)', () => this.scene.start('GestureSetup')]);
    items.push(['Рекорды', () => this.records()]);
    items.push(['Как играть', () => this.help()]);

    const px = 40, py = H - 60 - items.length * 40;
    paperPanel(this, px, py - 16, 300, items.length * 40 + 24);
    let sel = 0;
    const labels = items.map(([t], i) => text(this, px + 20, py + i * 40, t, 24, HEX.ink).setInteractive({ useHandCursor: true })
      .on('pointerover', () => { sel = i; draw(); }).on('pointerdown', () => items[i][1]()));
    const cursor = text(this, px + 4, py, '›', 24, '#c8323c');
    const draw = () => { labels.forEach((l, i) => l.setColor(i === sel ? '#c8323c' : HEX.ink)); cursor.setY(py + sel * 40); };
    draw();
    this.input.keyboard!.on('keydown-UP', () => { sel = (sel + items.length - 1) % items.length; draw(); });
    this.input.keyboard!.on('keydown-DOWN', () => { sel = (sel + 1) % items.length; draw(); });
    this.input.keyboard!.on('keydown-ENTER', () => items[sel][1]());
    this.input.keyboard!.on('keydown-SPACE', () => items[sel][1]());

    const full = isLicensed();
    const demo = this.add.graphics();
    demo.fillStyle(full ? C.teal : C.magenta, 1).fillRect(W - 170, 20, 150, 30);
    text(this, W - 95, 35, full ? 'ПОЛНАЯ ВЕРСИЯ' : 'ДЕМО', 16, full ? HEX.ink : HEX.white).setOrigin(0.5);
    text(this, W - 16, H - 16, 'v0.2 · бета', 14, HEX.paper).setOrigin(1, 1);
  }

  startGame() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('World'); this.scene.launch('Hud'); });
  }

  records() {
    const rows = loadRecords();
    const { width: W, height: H } = this.scale;
    const box = this.add.container(0, 0);
    const shade = this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive();
    const lines = rows.length ? rows.map((r, i) => `${String(i + 1).padStart(2)}. ${String(r.score).padStart(5)}  ${r.ending.padEnd(18)} ${r.accuracy}%  ${r.days} дн.  ${r.date}`)
      : ['Пока пусто. Пройдите демо-сезон или всю игру.'];
    box.add([shade, paperPanel(this, 140, 70, W - 280, H - 140),
      text(this, 170, 92, 'Рекорды', 26),
      text(this, 170, 134, '    Счёт  Финал              Точн.  Дни   Дата', 15, '#777'),
      text(this, 170, 160, lines.join('\n'), 16, HEX.ink, { lineSpacing: 6 })]);
    const close = text(this, W - 170, H - 100, '[ закрыть ]', 18, '#c8323c').setOrigin(1, 0).setInteractive({ useHandCursor: true });
    box.add(close);
    const done = () => box.destroy();
    close.on('pointerdown', done); shade.on('pointerdown', done);
    this.input.keyboard!.once('keydown-ESC', done);
  }

  help() {
    const { width: W, height: H } = this.scale;
    const box = this.add.container(0, 0);
    const shade = this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive();
    const p = paperPanel(this, 140, 70, W - 280, H - 140);
    const t = text(this, 170, 95, [
      'Как играть',
      '',
      'WASD / стрелки — ходить по ферме',
      'E — осмотреть грядку, войти в дом, лавку',
      'Esc — пауза / выход   ·   M — звук вкл/выкл',
      '',
      'В «Процедурной»:',
      '1 — скан Линзой Фуку (тратит заряд)',
      'R — другой ракурс (повторный скан)',
      '2 полив · 3 спрей · 4 обрезка · 7 удалить',
      '0 — не лечить (растение здорово)',
      'Enter — подтвердить ритуал, Backspace — сбросить',
      'H — собрать урожай (созревшее здоровое растение)',
      '',
      'Нейросеть может ошибаться. Смотрите на уверенность!',
    ].join('\n'), 18, HEX.ink, { lineSpacing: 4 });
    const close = text(this, W - 170, H - 100, '[ закрыть ]', 18, '#c8323c').setOrigin(1, 0).setInteractive({ useHandCursor: true });
    box.add([shade, p, t, close]);
    const done = () => box.destroy();
    close.on('pointerdown', done);
    shade.on('pointerdown', done);
    this.input.keyboard!.once('keydown-ESC', done);
  }
}
