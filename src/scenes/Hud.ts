// Интерфейс поверх мира: показатели, подсказки, реплики Фуку, лавка, сон, пауза.
import { sound } from '../audio/sound';
import { game, DAYS_PER_SEASON } from '../state/game';
import { events } from '../state/events';
import { text, HEX, C, paperPanel, bar } from '../ui/ui';
import { CLASSES, CROP_NAME, isHealthy } from '../data/diseases';
import { ritualText } from './Procedure';
import { forecast as weatherForecast } from '../state/director';
import { addRecord } from '../state/records';
import { isLicensed, activate, generateKey, normalizeKey, PRICE } from '../state/license';

export const SEASONS = ['', 'Весна', 'Лето', 'Осень'];
const PLACE_HINT: Record<string, string> = {
  bed: 'E — осмотреть грядку   ·   Tab — дневник', house: 'E — лечь спать (закончить день)', shop: 'E — лавка господина Огавы',
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
    on('diary', () => this.diary());
    on('after-night', (n: string[]) => this.afterNight(n));
    this.input.keyboard!.on('keydown-M', () => this.say(sound.toggle() ? 'Звук включён (M).' : 'Звук выключен (M).', 1800));
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.onKeyTyping(e));

    this.time.delayedCall(700, () => this.say(game.data.day === 1 && game.data.season === 1
      ? 'Аой-сан, я Фуку. На трёх грядках что-то не так: над ними летят споры. Подойдите к грядке и нажмите E. Tab — дневник бабушки с ритуалами.'
      : this.forecast()));
  }

  forecast() {
    return `Доброе утро! День ${game.data.day}. ${weatherForecast(game.data.season, game.data.weather)} Заряд линзы восстановлен.`;
  }

  drawStats() {
    this.stats.removeAll(true);
    const d = game.data;
    const p = paperPanel(this, 14, 14, 270, 100);
    const l1 = text(this, 26, 22, `${SEASONS[d.season]} · день ${d.day}/${DAYS_PER_SEASON}`, 20);
    const l2 = text(this, 26, 50, `Монеты: ${d.coins}   Урожай: ${d.harvest}`, 16);
    const l3 = text(this, 26, 72, `Фунгицид: ${d.fungicide} · влажность ${d.weather.humidity}%`, 15);
    const rep = text(this, 150, 93, 'Реп.', 13, '#555');
    const rb = bar(this, 186, 96, 86, 8, d.reputation / 100, C.orange);
    // заряд Фуку — точки
    const charge = this.add.graphics();
    for (let i = 0; i < d.fukuMax; i++) {
      charge.fillStyle(C.ink, 1).fillRect(26 + i * 12, 96, 9, 8);
      charge.fillStyle(i < d.fukuCharge ? C.teal : 0x55536e, 1).fillRect(27 + i * 12, 97, 7, 6);
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
    const W = 660, c = this.add.container(0, 0);
    // сначала измеряем текст, затем рисуем панель по высоте содержимого
    const body = lines.map((s) => text(this, 0, 0, s || ' ', 16, '#3a3550', { wordWrap: { width: W - 48 } }));
    const opts = options.map(([key, label, fn]) => text(this, 0, 0, `[${key}] ${label}`, 18, '#c8323c').setInteractive({ useHandCursor: true }).on('pointerdown', fn));
    const H = 70 + body.reduce((h, t) => h + t.height + 6, 0) + 16 + opts.length * 34;
    const x = 480 - W / 2, y = Math.max(16, 270 - H / 2);
    const shade = this.add.rectangle(0, 0, 960, 540, 0x000000, 0.45).setOrigin(0).setInteractive();
    c.add([shade, paperPanel(this, x, y, W, H), text(this, x + 24, y + 18, title, 24)]);
    let cy = y + 58;
    body.forEach((t) => { t.setPosition(x + 24, cy); cy += t.height + 6; c.add(t); });
    cy += 12;
    opts.forEach((t) => { t.setPosition(x + 24, cy); cy += 34; c.add(t); });
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
      this.enterInterior('Shop');
    } else if (kind === 'house') {
      this.night();
    } else if (kind === 'vending') {
      this.say('Торговый автомат гудит в сумерках. Холодный чай — 5 монет… может, в другой раз.');
    } else if (kind === 'busstop') {
      this.say('Расписание выцвело. Следующий автобус — вечером. Тихо и спокойно.');
    }
  }

  /** Переход в интерьер: мир спит, интерфейс скрыт. */
  enterInterior(key: string, data?: object) {
    events.emit('lock', true);
    this.scene.sleep('World');
    this.scene.setVisible(false);
    this.scene.launch(key, data);
  }

  night() {
    events.emit('lock', true);
    // сначала «Конец дня», затем ночь
    this.scene.setVisible(false);
    // вечер на веранде → дом → сон → утро
    this.scene.launch('Evening', { done: () => this.enterInterior('Home') });
  }

  afterNight(notes: string[]) {
    this.drawStats();
    if (game.lostRatio() > 0.6 || game.data.reputation <= 0) { this.endScreen(false); return; }
    if (notes.includes('season-end')) { this.endScreen(true); return; }
    this.say(this.forecast(), 6500);
  }

  nightFall() {
    sound.play('night');
    const shade = this.add.rectangle(0, 0, 960, 540, 0x2b2a4c, 0).setOrigin(0);
    const t = text(this, 480, 270, 'Ночь…', 32, HEX.paper).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: [shade], fillAlpha: 1, duration: 600 });
    this.tweens.add({ targets: [t], alpha: 1, duration: 600, onComplete: () => {
      const notes = game.endDay();
      events.emit('refresh-beds');
      this.drawStats();
      this.time.delayedCall(700, () => {
        this.tweens.add({ targets: [shade, t], alpha: 0, duration: 600, onComplete: () => { shade.destroy(); t.destroy(); } });
        events.emit('lock', false); sound.setMood('day');
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
    const d = game.data;
    if (win && d.season === 1 && !isLicensed()) {
      if (!this.recorded) { addRecord(d, 'Демо пройдено', false); this.recorded = true; }
      this.openModal('Весна позади! Демо пройдено', [
        'Лето в теплице, осенняя эпидемия и бой с Хайкаби — в полной версии.',
        `Полная версия — разовая покупка ${PRICE}, без внутриигровых покупок и рекламы.`, '', ...lines,
      ], [
        ['1', 'Ввести ключ полной версии', () => this.keyModal('')],
        ['2', `Купить полную версию (${PRICE})`, () => this.storeModal()],
        ['3', 'В главное меню', () => this.toMenu()],
      ]);
      return;
    }
    if (win && d.season < 3) {
      const next = d.season === 1 ? 'Лето: теплица, влажность, тля-ниндзя. Новые болезни в дневнике.' : 'Осень: эпидемия Хайкаби. Мир выцветает, нужен ритуал удаления (7).';
      this.openModal(`${SEASONS[d.season]} позади!`, [next, '', ...lines], [
        ['1', 'Продолжить', () => { this.closeModal(); game.nextSeason(); events.emit('season'); this.drawStats(); this.say(this.forecast(), 7000); }],
        ['2', 'Сохранить и выйти в меню', () => { game.nextSeason(); this.toMenu(); }],
      ]);
      return;
    }
    if (win && d.season === 3) {
      this.openModal('Источник найден', ['Споры тянутся к заброшенной теплице в конце долины. Хайкаби ждёт.', '', ...lines], [
        ['1', 'Войти в теплицу', () => { this.closeModal(); events.emit('boss'); }],
      ]);
      return;
    }
    if (!this.recorded) { addRecord(d, 'Поражение', false); this.recorded = true; }
    this.openModal('Ферма не выстояла', ['Хайкаби оказалась сильнее. Попробуйте снова — внимательнее к диагнозам.', ...lines], [
      ['1', 'Начать заново', () => { game.newGame(); game.save(); this.toMenu(); }],
    ]);
  }

  // ---------- полная версия ----------
  keyEntry: { key: string; err: string } | null = null;
  recorded = false;

  keyModal(prefill: string) {
    this.keyEntry = { key: normalizeKey(prefill), err: '' };
    this.drawKeyModal();
  }

  drawKeyModal() {
    const k = this.keyEntry!;
    this.openModal('Активация полной версии', [
      'Введите ключ (буквы и цифры, дефисы ставятся сами):',
      `> ${k.key}${k.key.length < 19 ? '_' : ''}`,
      k.err,
    ], [
      ['Enter', 'Активировать', () => {
        if (activate(k.key)) {
          this.keyEntry = null;
          this.openModal('Полная версия активирована', ['Спасибо! Лето уже в пути.'], [
            ['1', 'Продолжить игру', () => { this.closeModal(); game.data.licensed = true; game.nextSeason(); events.emit('season'); this.drawStats(); this.say(this.forecast(), 7000); }],
          ]);
        } else { k.err = 'Ключ не подходит. Проверьте символы (без 0/O и 1/I).'; this.drawKeyModal(); }
      }],
      ['Esc', 'Назад', () => { this.keyEntry = null; this.endScreen(true); }],
    ]);
  }

  /** Ввод символов ключа (подключается один раз в create). */
  onKeyTyping(e: KeyboardEvent) {
    const k = this.keyEntry;
    if (!k) return;
    if (e.key === 'Backspace') k.key = normalizeKey(k.key.replace(/-$/, '').slice(0, -1));
    else if (/^[a-zA-Z0-9]$/.test(e.key)) k.key = normalizeKey(k.key + e.key);
    else return;
    k.err = '';
    this.drawKeyModal();
  }

  storeModal() {
    this.openModal('Магазин · Sprout Doctor (имитация)', [
      `Полная версия: ${PRICE}. Разовая покупка, все три сезона и финал.`,
      'Это учебная имитация: деньги не списываются, магазин выдаёт тестовый ключ.',
    ], [
      ['1', 'Оплатить (тест)', () => {
        const k = generateKey();
        this.openModal('Покупка завершена', ['Ваш ключ полной версии:', k, 'Ключ подставлен в поле активации.'], [
          ['1', 'Перейти к активации', () => this.keyModal(k)],
        ]);
      }],
      ['Esc', 'Назад', () => this.endScreen(true)],
    ]);
  }

  diary() {
    const d = game.data;
    const seen = new Map<string, { name: string; crops: string[]; ritual: string }>();
    for (const c of CLASSES) {
      if (isHealthy(c) || c.season > d.season) continue;
      const e = seen.get(c.key) ?? { name: c.name, crops: [], ritual: ritualText(c) };
      e.crops.push(CROP_NAME[c.crop]); seen.set(c.key, e);
    }
    const lines = [...seen.values()].map((e) => `${e.name} (${e.crops.join(', ')}) → ${e.ritual}`);
    this.openModal('Дневник бабушки Хару', [
      'Порядок: подойти к грядке (E) → скан (1) → ритуал по дневнику → подтвердить (Enter).',
      'Нейросеть Фуку может ошибаться: при уверенности ниже 60% сделайте другой ракурс (R).',
      '',
      ...lines,
      'Здоровое растение не лечат: кнопка «Не лечить» (0).',
    ], [['Esc', 'Закрыть', () => this.closeModal()]]);
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
