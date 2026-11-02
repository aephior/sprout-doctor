import { sound } from '../audio/sound';
import { game } from '../state/game';
import { gestures } from '../ai/gestureCtl';
import { loadRecords } from '../state/records';
import { isLicensed } from '../state/license';
import { text, HEX, C, paperPanel } from '../ui/ui';

export class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    sound.setMood('menu'); sound.setAmbient({ rain: false, night: false, morning: false });
    gestures.stop();   // в меню камера выключена
    const { width: W, height: H } = this.scale;
    // заставка: деревня в горах на закате, Аой и Фуку на огороде
    const bg = this.add.image(W / 2, H / 2, 'g-title').setScale(2.02);
    this.tweens.add({ targets: bg, scale: 2.08, duration: 18000, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.add.rectangle(0, 0, W, 190, 0x1e1b2e, 0.25).setOrigin(0);
    this.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: W }, y: { min: 250, max: H }, lifespan: 3500, speedX: { min: -6, max: 6 }, speedY: { min: -5, max: 5 },
      scale: { start: 2.4, end: 0 }, alpha: { start: 0.9, end: 0 }, frequency: 260, tint: [0xf2e070, 0xd8f080], blendMode: 'ADD',
    });

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
    text(this, W - 16, H - 16, 'v0.6 · бета', 14, HEX.paper).setOrigin(1, 1);
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
    const p = paperPanel(this, 140, 40, W - 280, H - 80);
    const t = text(this, 170, 60, [
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
      'Графика: LPC (CC-BY-SA/GPL) и ИИ — авторы в CREDITS.md',
    ].join('\n'), 18, HEX.ink, { lineSpacing: 4 });
    const close = text(this, W - 170, H - 72, '[ закрыть ]', 18, '#c8323c').setOrigin(1, 0).setInteractive({ useHandCursor: true });
    box.add([shade, p, t, close]);
    const done = () => box.destroy();
    close.on('pointerdown', done);
    shade.on('pointerdown', done);
    this.input.keyboard!.once('keydown-ESC', done);
  }
}
