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
    this.add.image(W / 2, H / 2, 'g-title').setScale(2);   // ровно ×2 — без «плавающих» пикселей
    // мягкое затемнение под заголовком: ступенчатый градиент (без резкой границы)
    const band = this.add.graphics();
    for (let i = 0; i < 12; i++) band.fillStyle(0x1e1b2e, 0.34 * (1 - i / 12)).fillRect(0, i * 18, W, 18);
    this.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: W }, y: { min: 250, max: H }, lifespan: 3500, speedX: { min: -6, max: 6 }, speedY: { min: -5, max: 5 },
      scale: { start: 2.4, end: 0 }, alpha: { start: 0.9, end: 0 }, frequency: 260, tint: [0xf2e070, 0xd8f080], blendMode: 'ADD',
    });

    text(this, W / 2, 70, 'SPROUT DOCTOR', 64, HEX.teal, { stroke: HEX.ink, strokeThickness: 8 }).setOrigin(0.5);
    text(this, W / 2, 128, 'スプラウト・ドクター', 26, HEX.magenta, { stroke: HEX.ink, strokeThickness: 5 }).setOrigin(0.5);
    text(this, W / 2, 162, 'Лечи урожай. Читай листья. Колдуй руками.', 18, HEX.paper, { stroke: HEX.ink, strokeThickness: 4 }).setOrigin(0.5);

    const items: [string, () => void][] = [['Новая игра', () => { game.newGame(); game.save(); this.startGame(); }]];
    if (game.hasSave() && !game.saveCompleted()) items.unshift(['Продолжить', () => {
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
    // пока открыт оверлей («Как играть», «Рекорды»), меню позади не управляется
    this.overlay = false;
    this.input.keyboard!.on('keydown-UP', () => { if (!this.overlay) { sel = (sel + items.length - 1) % items.length; draw(); } });
    this.input.keyboard!.on('keydown-DOWN', () => { if (!this.overlay) { sel = (sel + 1) % items.length; draw(); } });
    this.input.keyboard!.on('keydown-ENTER', () => { if (!this.overlay) items[sel][1](); });
    this.input.keyboard!.on('keydown-SPACE', () => { if (!this.overlay) items[sel][1](); });

    const full = isLicensed();
    const demo = this.add.graphics();
    demo.fillStyle(full ? C.teal : C.magenta, 1).fillRect(W - 170, 20, 150, 30);
    text(this, W - 95, 35, full ? 'ПОЛНАЯ ВЕРСИЯ' : 'ДЕМО', 16, full ? HEX.ink : HEX.white).setOrigin(0.5);
    text(this, W - 16, H - 16, 'v0.8 · бета', 14, HEX.paper).setOrigin(1, 1);
  }

  overlay = false;

  startGame() {
    this.cameras.main.fadeOut(300, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.start('World'); this.scene.launch('Hud'); });
  }

  records() {
    const rows = loadRecords();
    const { width: W, height: H } = this.scale;
    const box = this.add.container(0, 0);
    const shade = this.add.rectangle(0, 0, W, H, 0x000000, 0.6).setOrigin(0).setInteractive();
    // таблица — отдельные колонки (пропорциональный шрифт не выравнивается пробелами); панель по высоте содержимого
    const COLS: [string, number, number][] = [['#', 0, 0], ['Счёт', 70, 1], ['Финал', 92, 0], ['Точн.', 380, 1], ['Дни', 440, 1], ['Дата', 470, 0]];
    const n = Math.max(1, rows.length), ph = 150 + n * 30, py = Math.max(30, (H - ph) / 2), x0 = 190;
    box.add([shade, paperPanel(this, 150, py, W - 300, ph), text(this, 174, py + 18, 'Рекорды', 26)]);
    COLS.forEach(([h, dx, right]) => box.add(text(this, x0 + dx, py + 62, h, 15, '#8a7a6a').setOrigin(right, 0)));
    const line = this.add.graphics().lineStyle(1, 0xc9b48f, 1).lineBetween(174, py + 84, W - 174, py + 84); box.add(line);
    if (!rows.length) box.add(text(this, x0, py + 96, 'Пока пусто. Пройдите демо-сезон или всю игру.', 16, HEX.ink));
    rows.forEach((r, i) => {
      const y = py + 94 + i * 30;
      const cells = [`${i + 1}.`, String(r.score), r.ending, r.cured || r.accuracy ? r.accuracy + '%' : '—', String(r.days), r.date];
      cells.forEach((c, j) => box.add(text(this, x0 + COLS[j][1], y, c, 16, i === 0 ? '#8e2230' : HEX.ink).setOrigin(COLS[j][2], 0)));
    });
    const close = text(this, W - 174, py + ph - 36, '[ закрыть ]', 18, '#c8323c').setOrigin(1, 0).setInteractive({ useHandCursor: true });
    box.add(close);
    this.overlay = true;
    const done = () => { if (!box.active) return; box.destroy(); this.time.delayedCall(0, () => { this.overlay = false; }); };
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
      'WASD / стрелки — ходить · E — грядка, дом, лавка, разговор',
      'Tab — дневник Хару · Esc — пауза · M — звук',
      '',
      'В «Процедурной»:',
      '1 — скан Линзой Фуку (тратит заряд)',
      'R — другой ракурс (повторный скан)',
      '2 полив · 3 спрей · 4 обрезка · 7 удалить',
      '0 — не лечить (растение здорово)',
      'Enter — подтвердить ритуал, Backspace — сбросить',
      '6 — смахнуть тлю · Tab — дневник с ритуалами',
      'H — урожай (только созревшее здоровое растение)',
      '',
      'Нейросеть может ошибаться. Смотрите на уверенность!',
      'Графика: Ninja Adventure (CC0) и ИИ — авторы в CREDITS.md',
    ].join('\n'), 18, HEX.ink, { lineSpacing: 4 });
    const close = text(this, W - 170, H - 72, '[ закрыть ]', 18, '#c8323c').setOrigin(1, 0).setInteractive({ useHandCursor: true });
    box.add([shade, p, t, close]);
    this.overlay = true;
    const done = () => { if (!box.active) return; box.destroy(); this.time.delayedCall(0, () => { this.overlay = false; }); };
    close.on('pointerdown', done);
    shade.on('pointerdown', done);
    this.input.keyboard!.once('keydown-ESC', done);
  }
}
