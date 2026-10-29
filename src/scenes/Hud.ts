// Интерфейс поверх мира: показатели, подсказки, реплики Фуку, лавка, сон, пауза.
import { game, DAYS_PER_SEASON } from '../state/game';
import { events } from '../state/events';
import { text, HEX, C, paperPanel, bar } from '../ui/ui';

const SEASONS = ['', 'Весна', 'Лето', 'Осень'];
const PLACE_HINT: Record<string, string> = {
  bed: 'E — осмотреть грядку', house: 'E — лечь спать (закончить день)', shop: 'E — лавка господина Огавы',
  vending: 'E — торговый автомат', busstop: 'E — автобусная остановка',
};

export class Hud extends Phaser.Scene {
  stats!: Phaser.GameObjects.Container;
  hint!: Phaser.GameObjects.Text;
  hintBg!: Phaser.GameObjects.Graphics;
  bubble!: Phaser.GameObjects.Container;
  bubbleText!: Phaser.GameObjects.Text;
  modal: Phaser.GameObjects.Container | null = null;
  bubbleTimer?: Phaser.Time.TimerEvent;

  constructor() { super('Hud'); }

  create() {
    this.stats = this.add.container(0, 0);
    this.hintBg = this.add.graphics();
    this.hint = text(this, 480, 512, '', 18, HEX.paper, { stroke: HEX.ink, strokeThickness: 4 }).setOrigin(0.5);
    this.bubble = this.add.container(0, 0).setVisible(false);
    this.drawStats();

    const on = (e: string, f: (...a: any[]) => void) => { events.on(e, f, this); this.events.once('shutdown', () => events.off(e, f, this)); };
    on('hint', (it: { kind: string } | null) => this.hint.setText(it && !this.modal ? PLACE_HINT[it.kind] : ''));
    on('toast', (s: string) => this.say(s));
    on('stats', () => this.drawStats());
    on('place', (k: string) => this.place(k));
    on('pause', () => this.pauseMenu());

    this.time.delayedCall(700, () => this.say(game.data.day === 1 && game.data.season === 1
      ? 'Аой-сан, я Фуку. Бабушка Хару оставила мне её записи. На трёх грядках что-то не так — подойдите и нажмите E.'
      : this.forecast()));
  }

  forecast() {
    const sick = game.data.beds.filter((b) => b.crop && !b.dead && game.cls(b).key !== 'healthy').length;
    const lvl = sick >= 5 ? 'высокий' : sick >= 3 ? 'средний' : 'низкий';
    return `Доброе утро! День ${game.data.day}. Риск болезней сегодня — ${lvl}. Заряд линзы восстановлен.`;
  }

  drawStats() {
    this.stats.removeAll(true);
    const d = game.data;
    const p = paperPanel(this, 14, 14, 250, 92);
    const l1 = text(this, 26, 22, `${SEASONS[d.season]} · день ${d.day}/${DAYS_PER_SEASON}`, 20);
    const l2 = text(this, 26, 50, `Монеты: ${d.coins}   Урожай: ${d.harvest}`, 16);
    const l3 = text(this, 26, 72, `Фунгицид: ${d.fungicide}`, 16);
    const rep = text(this, 150, 72, 'Репутация', 14, '#555');
    const rb = bar(this, 150, 90, 100, 8, d.reputation / 100, C.orange);
    // заряд Фуку — точки
    const charge = this.add.graphics();
    for (let i = 0; i < d.fukuMax; i++) {
      charge.fillStyle(C.ink, 1).fillRect(26 + i * 14, 92, 10, 8);
      charge.fillStyle(i < d.fukuCharge ? C.teal : 0x55536e, 1).fillRect(27 + i * 14, 93, 8, 6);
    }
    this.stats.add([p, l1, l2, l3, rep, rb, charge]);
  }

  say(s: string, ms = 5200) {
    this.bubble.removeAll(true);
    const w = 400;
    const t = text(this, 960 - 14 - w + 54, 24, s, 16, HEX.ink, { wordWrap: { width: w - 70 }, lineSpacing: 2 });
    const h = Math.max(56, t.height + 20);
    const g = paperPanel(this, 960 - 14 - w, 14, w, h);
    const icon = this.add.sprite(960 - 14 - w + 26, 14 + 28, 'fuku', 0).setScale(2.4).play('fuku-idle');
    this.bubble.add([g, icon, t]).setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.bubble, alpha: 1, duration: 150 });
    this.bubbleTimer?.remove();
    this.bubbleTimer = this.time.delayedCall(ms, () => this.tweens.add({ targets: this.bubble, alpha: 0, duration: 300 }));
  }

  // ---------- модальные окна ----------
  openModal(title: string, lines: string[], options: [string, string, () => void][]) {
    this.closeModal();
    events.emit('lock', true);
    const W = 520, H = 120 + lines.length * 24 + options.length * 34;
    const x = 480 - W / 2, y = 270 - H / 2;
    const c = this.add.container(0, 0);
    const shade = this.add.rectangle(0, 0, 960, 540, 0x000000, 0.45).setOrigin(0).setInteractive();
    c.add([shade, paperPanel(this, x, y, W, H), text(this, x + 24, y + 18, title, 24)]);
    lines.forEach((s, i) => c.add(text(this, x + 24, y + 58 + i * 24, s, 16, '#3a3550', { wordWrap: { width: W - 48 } })));
    const oy = y + 70 + lines.length * 24;
    options.forEach(([key, label, fn], i) => {
      const t = text(this, x + 24, oy + i * 34, `[${key}] ${label}`, 18, '#c8323c').setInteractive({ useHandCursor: true }).on('pointerdown', fn);
      c.add(t);
    });
    this.modal = c;
    const kb = this.input.keyboard!;
    const handler = (e: KeyboardEvent) => {
      const opt = options.find(([k]) => k.toLowerCase() === e.key.toLowerCase() || (k === 'Esc' && e.key === 'Escape'));
      if (opt) opt[2]();
    };
    kb.on('keydown', handler);
    c.once('destroy', () => kb.off('keydown', handler));
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.destroy(); this.modal = null;
    this.time.delayedCall(50, () => events.emit('lock', false));
    this.drawStats();
  }

  place(kind: string) {
    const d = game.data;
    if (kind === 'shop') {
      const shop = () => this.openModal('Лавка господина Огавы', [
        `«Хару тоже начинала с одной грядки». Урожай: ${d.harvest} шт. Монеты: ${d.coins}.`,
      ], [
        ['1', `Продать урожай (${d.harvest} × 15 монет)`, () => { d.coins += d.harvest * 15; d.harvest = 0; game.save(); shop(); }],
        ['2', 'Купить фунгицид (20 монет)', () => { if (d.coins >= 20) { d.coins -= 20; d.fungicide++; game.save(); } shop(); }],
        ['3', `Улучшить заряд Фуку +1 (${40 + d.fukuMax * 10} монет)`, () => {
          const cost = 40 + d.fukuMax * 10;
          if (d.coins >= cost && d.fukuMax < 10) { d.coins -= cost; d.fukuMax++; d.fukuCharge++; game.save(); } shop();
        }],
        ['Esc', 'Уйти', () => this.closeModal()],
      ]);
      shop();
    } else if (kind === 'house') {
      this.openModal('Дом бабушки Хару', ['Закончить день? Ночью болезни развиваются, а заряд Фуку восстанавливается.'], [
        ['1', 'Лечь спать', () => { this.closeModal(); this.night(); }],
        ['Esc', 'Ещё не время', () => this.closeModal()],
      ]);
    } else if (kind === 'vending') {
      this.say('Торговый автомат гудит в сумерках. Холодный чай — 5 монет… может, в другой раз.');
    } else if (kind === 'busstop') {
      this.say('Расписание выцвело. Следующий автобус — вечером. Тихо и спокойно.');
    }
  }

  night() {
    events.emit('lock', true);
    const shade = this.add.rectangle(0, 0, 960, 540, 0x2b2a4c, 0).setOrigin(0);
    const t = text(this, 480, 270, 'Ночь…', 32, HEX.paper).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [shade], fillAlpha: 1, duration: 600 });
    this.tweens.add({ targets: [t], alpha: 1, duration: 600, onComplete: () => {
      const notes = game.endDay();
      events.emit('refresh-beds');
      this.drawStats();
      this.time.delayedCall(700, () => {
        this.tweens.add({ targets: [shade, t], alpha: 0, duration: 600, onComplete: () => { shade.destroy(); t.destroy(); } });
        events.emit('lock', false);
        if (game.lostRatio() > 0.6 || game.data.reputation <= 0) { this.endScreen(false); return; }
        if (notes.includes('season-end')) { this.endScreen(true); return; }
        const lost = notes.filter((n) => n !== 'season-end');
        this.say(lost.length ? `${lost.join(' ')} ${this.forecast()}` : this.forecast(), 6500);
      });
    } });
  }

  endScreen(win: boolean) {
    const s = game.data.stats;
    const lines = [
      `Верных ритуалов: ${s.correctTreat}, ошибок: ${s.wrongTreat}`,
      `Вылечено грядок: ${s.cured}, потеряно: ${s.lost}`,
      `Сканов Линзой: ${s.scans}`,
    ];
    if (win) this.openModal('Весна позади!', ['Демо-сезон пройден. Лето и осень — в полной версии.', ...lines], [
      ['1', 'В главное меню', () => this.toMenu()],
    ]);
    else this.openModal('Ферма не выстояла', ['Хайкаби оказалась сильнее. Попробуйте снова — внимательнее к диагнозам.', ...lines], [
      ['1', 'Начать заново', () => { game.newGame(); game.save(); this.toMenu(); }],
    ]);
  }

  pauseMenu() {
    if (this.modal) { this.closeModal(); return; }
    this.openModal('Пауза', ['Игра сохраняется каждую ночь.'], [
      ['Esc', 'Продолжить', () => this.closeModal()],
      ['2', 'Сохранить и выйти в меню', () => { game.save(); this.toMenu(); }],
    ]);
  }

  toMenu() {
    this.closeModal();
    this.scene.stop('Procedure');
    this.scene.stop('World');
    this.scene.start('Menu');
  }
}
