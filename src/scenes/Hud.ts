// Интерфейс поверх мира: показатели, подсказки, реплики Фуку, лавка, сон, пауза.
import { sound } from '../audio/sound';
import { game, DAYS_PER_SEASON } from '../state/game';
import { events, ui } from '../state/events';
import { text, HEX, C, paperPanel, bar } from '../ui/ui';
import { clockText, hourNow } from '../world/life';
import { forecast as weatherForecast } from '../state/director';
import { addRecord } from '../state/records';
import { isLicensed, activate, generateKey, normalizeKey, PRICE } from '../state/license';

export const SEASONS = ['', 'Весна', 'Лето', 'Осень'];
const PLACE_HINT: Record<string, string> = {
  bed: 'E — осмотреть грядку   ·   Tab — дневник',
  mochi: 'E — погладить Моти', villager: 'E — поговорить', fisher: 'E — поговорить с рыбаком', house: 'E — зайти домой', shop: 'E — лавка господина Огавы',
  vending: 'E — торговый автомат', busstop: 'E — автобусная остановка',
};

const SPEAKERS: [RegExp, string, number][] = [
  [/^Рыбак/, 'fisher-na', 0], [/^Юки/, 'villager16-na', 0], [/^Кэндзи/, 'villager2-na', 0], [/^Хина/, 'villager25-na', 0],
  [/^Моти/, 'mochi-na', 8], [/^Огава/, 'ogawa-na', 0],
];

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
    // общий обработчик клавиш регистрируется первым: Esc/пауза, M, ввод ключа — в одном месте
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => this.onKey(e));
    ui.modal = false; this.modal = null; this.keyEntry = null;
    this.stats = this.add.container(0, 0);
    this.hintBg = this.add.graphics();
    this.hint = text(this, 480, 512, '', 18, HEX.paper, { stroke: HEX.ink, strokeThickness: 4 }).setOrigin(0.5);
    // подложка подсказки — тёмная плашка по ширине текста
    const setText0 = this.hint.setText.bind(this.hint);
    this.hint.setText = ((v: string | string[]) => {
      const r = setText0(v); this.hintBg.clear();
      if (this.hint.text) { const w = this.hint.width + 28; this.hintBg.fillStyle(0x1e1b2e, 0.72).fillRoundedRect(480 - w / 2, 497, w, 30, 8); }
      return r;
    }) as typeof this.hint.setText;
    this.bubble = this.add.container(0, 0).setVisible(false);
    this.drawStats();

    const on = (e: string, f: (...a: any[]) => void) => { events.on(e, f, this); this.events.once('shutdown', () => events.off(e, f, this)); };
    on('hint', (it: { kind: string } | null) => this.hint.setText(it && !this.modal ? (it.kind === 'house' && hourNow() >= 18 ? 'E — домой, спать (закончить день)' : PLACE_HINT[it.kind]) : ''));
    on('toast', (s: string) => this.say(s));
    on('stats', () => this.drawStats());
    on('place', (k: string) => this.place(k));
    on('diary', () => this.enterInterior('Diary', { returnTo: 'World' }));
    on('midnight', () => { this.say('Аой-сан, уже полночь… Глаза слипаются. Пора домой.', 3000); this.time.delayedCall(1800, () => this.night(true)); });
    on('fisher', () => this.fisherTalk());
    on('after-night', (n: string[]) => this.afterNight(n));

    // демо уже пройдено, а ключа нет — сразу экран демо (дальше весны играть нельзя)
    if (game.data.demoEnded && !isLicensed()) { this.time.delayedCall(400, () => this.endScreen(true)); return; }
    this.time.delayedCall(700, () => this.say(game.data.day === 1 && game.data.season === 1
      ? 'Аой-сан, я Фуку. На трёх грядках что-то не так: над ними летят споры. Подойдите к грядке и нажмите E. Tab — дневник бабушки: записи появляются, когда Линза находит болезнь.'
      : this.forecast()));
  }

  keyTs = -1;
  modalTs = -2;
  /** Единственная точка обработки «глобальных» клавиш интерфейса. */
  onKey(e: KeyboardEvent) {
    this.keyTs = e.timeStamp;
    if (this.keyEntry) { this.onKeyTyping(e); return; }          // в поле ключа горячие клавиши не работают
    if (this.modal) return;                                       // клавиши модалки обрабатывает сама модалка
    if (e.key === 'Escape' && this.worldActive()) { this.pauseMenu(); return; }
    if ((e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') && this.scene.isVisible()) this.say(sound.toggle() ? 'Звук включён (M).' : 'Звук выключен (M).', 1800);
  }

  /** Мир на экране и управляем (не интерьер, не процедурная, не бой). */
  worldActive() {
    const w = this.scene.get('World') as Phaser.Scene & { locked?: boolean };
    return this.scene.isVisible() && this.scene.isActive('World') && !this.scene.isSleeping('World') && !w.locked;
  }

  forecast() {
    return `Доброе утро! День ${game.data.day}. ${weatherForecast(game.data.season, game.data.weather)} Заряд линзы восстановлен.`;
  }

  drawStats() {
    this.stats.removeAll(true);
    const d = game.data;
    const p = paperPanel(this, 14, 14, 270, 100);
    const l1 = text(this, 26, 22, `${SEASONS[d.season]} · ${Math.min(d.day, DAYS_PER_SEASON)}/${DAYS_PER_SEASON} · ${clockText()}`, 20);
    const l2 = text(this, 26, 50, `Монеты: ${d.coins}   Урожай: ${d.harvest}`, 16);
    const l3 = text(this, 26, 72, `Фунгицид: ${d.fungicide} · ${d.rain ? 'дождь' : 'влажн.'} ${d.weather.humidity}%`, 15);
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
    // портрет говорящего: житель/рыбак/кошка — их спрайт из мира, иначе Фуку
    const who = SPEAKERS.find(([re]) => re.test(s));
    const icon = who
      ? this.add.sprite(960 - 14 - w + 28, 14 + 32, who[1], who[2]).setScale(3)
      : this.add.sprite(960 - 14 - w + 28, 14 + 30, 'fuku-px', 0).setScale(2);   // пиксельный Фуку без «лесенки» от уменьшения
    this.bubble.add([g, icon, t]).setVisible(true).setAlpha(0);
    this.tweens.add({ targets: this.bubble, alpha: 1, duration: 150 });
    this.bubbleTimer?.remove();
    this.bubbleTimer = this.time.delayedCall(ms, () => this.tweens.add({ targets: this.bubble, alpha: 0, duration: 300 }));
  }

  // ---------- модальные окна ----------
  openModal(title: string, lines: string[], options: [string, string, () => void][], art?: string): Phaser.GameObjects.Text[] {
    this.closeModal();
    ui.modal = true; this.hint.setText('');
    this.modalTs = this.keyTs;   // клавиша, открывшая окно, в этом окне не срабатывает
    const AW = art ? 170 : 0, c = this.add.container(0, 0);
    // сначала измеряем текст, затем рисуем панель по размеру содержимого (короткие окна — узкие)
    const wrap = 612 - AW;
    const body = lines.map((s) => text(this, 0, 0, s || ' ', 16, '#3a3550', { wordWrap: { width: wrap } }));
    const opts = options.map(([key, label, fn]) => text(this, 0, 0, `[${key}] ${label}`, 18, '#c8323c').setInteractive({ useHandCursor: true }).on('pointerdown', fn));
    const ttl = text(this, 0, 0, title, 24);
    const inner = Math.max(ttl.width, ...body.map((t) => t.width), ...opts.map((t) => t.width));
    const W = Math.min(660, Math.max(art ? 560 : 400, inner + 48 + AW));
    const H = Math.max(art ? 200 : 0, 70 + body.reduce((h, t) => h + t.height + 6, 0) + 16 + opts.length * 34);
    const x = 480 - W / 2, y = Math.max(16, 270 - H / 2);
    const shade = this.add.rectangle(0, 0, 960, 540, 0x000000, 0.45).setOrigin(0).setInteractive();
    c.add([shade, paperPanel(this, x, y, W, H), ttl.setPosition(x + 24, y + 18)]);
    if (art) {   // портрет Фуку справа: радуется / тревожится / повреждён
      const im = this.add.image(x + W - AW / 2 - 12, y + H / 2 + 6, art);
      const k = Math.min(1, (H - 40) / im.height, (AW - 10) / im.width); im.setScale(k >= 1 ? 1 : k);
      c.add(im);
    }
    let cy = y + 58;
    body.forEach((t) => { t.setPosition(x + 24, cy); cy += t.height + 6; c.add(t); });
    cy += 12;
    opts.forEach((t) => { t.setPosition(x + 24, cy); cy += 34; c.add(t); });
    this.modal = c;
    const kb = this.input.keyboard!;
    const handler = (e: KeyboardEvent) => {
      if (e.timeStamp === this.modalTs || this.modal !== c) return;
      const opt = options.find(([k]) => k.toLowerCase() === e.key.toLowerCase() || (k === 'Esc' && e.key === 'Escape'));
      if (opt) opt[2]();
    };
    kb.on('keydown', handler);
    c.once('destroy', () => kb.off('keydown', handler));
    return body;
  }

  closeModal() {
    if (!this.modal) return;
    this.modal.destroy(); this.modal = null; this.keyTexts = null;
    ui.modal = false; ui.closedAt = performance.now();
    this.drawStats();
  }

  place(kind: string) {
    const d = game.data;
    if (kind === 'shop') {
      const h = hourNow();
      if (h < 8) this.say('Лавка закрыта. Огава откроет в 8:00.');
      else if (h >= 19) this.say('Лавка уже закрыта — Огава работает с 8:00 до 19:00.');
      else this.enterInterior('Shop');
    } else if (kind === 'house') {
      if (hourNow() >= 18) this.night(); else this.enterInterior('Home', { early: true });
    } else if (kind === 'vending') {
      this.say('Торговый автомат гудит в сумерках. Холодный чай — 5 монет… может, в другой раз.');
    } else if (kind === 'busstop') {
      this.say('Расписание выцвело. Следующий автобус — вечером. Тихо и спокойно.');
    }
  }

  /** Переход в интерьер: мир спит, интерфейс скрыт. */
  enterInterior(key: string, data?: object) {
    if (this.modal) this.closeModal();
    events.emit('lock', true);
    this.hint.setText('');
    this.scene.sleep('World');
    this.scene.setVisible(false);
    this.scene.launch(key, data ?? {});   // без данных Phaser повторно отдал бы прошлые (например, {early:true})
  }

  fisherIdx = 0;
  fisherTalk() {
    const lines = [
      'Рыбак: «Клюёт плохо. Зато вечер хороший». Он не отрывает взгляда от поплавка.',
      'Рыбак: «Хару тоже приходила сюда. Говорила, что вода лечит голову лучше любого чая».',
      'Рыбак: «В тумане плесень любит теплицы. Ты держи их открытыми, дочка».',
      'Рыбак: «Автобус опять опоздал. Здесь всё опаздывает — и это хорошо».',
      'Рыбак молча протягивает термос. Чай пахнет дымом и яблоками.',
    ];
    this.say(lines[this.fisherIdx++ % lines.length], 6000);
  }

  night(auto = false) {
    events.emit('lock', true);
    // сначала «Конец дня», затем ночь
    this.scene.setVisible(false);
    // вечер на веранде → дом → сон → утро
    if (auto) { this.enterInterior('Home', { auto: true }); return; }
    this.scene.launch('Evening', { done: () => this.enterInterior('Home') });
  }

  afterNight(notes: string[]) {
    this.drawStats();
    if (game.lostRatio() > 0.6 || game.data.reputation <= 0) { this.endScreen(false); return; }
    if (notes.includes('season-end')) { this.endScreen(true); return; }
    this.say(this.forecast(), 6500);
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
      if (!d.demoEnded) { d.demoEnded = true; game.save(); }
      if (!this.recorded) { addRecord(d, 'Демо пройдено', false); this.recorded = true; }
      this.openModal('Весна позади! Демо пройдено', [
        'Лето в теплице, осенняя эпидемия и бой с Хайкаби — в полной версии.',
        `Полная версия — разовая покупка ${PRICE}, без внутриигровых покупок и рекламы.`, '', ...lines,
      ], [
        ['1', 'Ввести ключ полной версии', () => this.keyModal('')],
        ['2', `Купить полную версию (${PRICE})`, () => this.storeModal()],
        ['3', 'В главное меню', () => this.toMenu()],
      ], 'g-fuku_happy');
      return;
    }
    if (win && d.season < 3) {
      const next = d.season === 1 ? 'Лето: теплица, влажность, тля-ниндзя. Новые болезни в дневнике.' : 'Осень: эпидемия Хайкаби. Мир выцветает, нужен ритуал удаления (7).';
      this.openModal(`${SEASONS[d.season]} позади!`, [next, '', ...lines], [
        ['1', 'Продолжить', () => { this.closeModal(); game.nextSeason(); events.emit('season'); this.drawStats(); this.say(this.forecast(), 7000); }],
        ['2', 'Сохранить и выйти в меню', () => { game.nextSeason(); this.toMenu(); }],
      ], 'g-fuku_happy');
      return;
    }
    if (win && d.season === 3) {
      this.openModal('Источник найден', ['Споры тянутся к заброшенной теплице в конце долины. Хайкаби ждёт.', '', ...lines], [
        ['1', 'Войти в теплицу', () => { this.closeModal(); events.emit('boss'); }],
      ], 'g-fuku_alert');
      return;
    }
    if (!this.recorded) { addRecord(d, 'Поражение', false); this.recorded = true; }
    const why = d.season === 3 ? 'Хайкаби оказалась сильнее.' : 'Болезни захватили огород: больше половины грядок погибло или репутация упала до нуля.';
    this.openModal('Ферма не выстояла', [`${why} Попробуйте снова — внимательнее к диагнозам.`, ...lines], [
      ['1', 'Начать заново', () => { game.newGame(); game.save(); this.toMenu(); }],
    ], 'g-fuku_damaged');
  }

  // ---------- полная версия ----------
  keyEntry: { key: string; err: string } | null = null;
  recorded = false;

  keyModal(prefill: string) {
    this.keyEntry = { key: normalizeKey(prefill), err: '' };
    this.drawKeyModal();
  }

  keyTexts: Phaser.GameObjects.Text[] | null = null;
  drawKeyModal() {
    const k = this.keyEntry!;
    const field = `> ${k.key}${k.key.length < 19 ? '_' : ''}`;
    if (this.keyTexts && this.modal) { this.keyTexts[1].setText(field); this.keyTexts[2].setText(k.err || ' '); return; }   // перерисовка без переоткрытия окна
    this.keyTexts = this.openModal('Активация полной версии', [
      'Введите ключ (буквы и цифры, дефисы ставятся сами):',
      field,
      k.err || ' ',
    ], [
      ['Enter', 'Активировать', () => {
        if (activate(k.key)) {
          this.keyEntry = null; game.data.demoEnded = false;
          this.openModal('Полная версия активирована', ['Спасибо! Лето уже в пути.'], [
            ['1', 'Продолжить игру', () => { this.closeModal(); game.data.licensed = true; game.nextSeason(); events.emit('season'); this.drawStats(); this.say(this.forecast(), 7000); }],
          ]);
        } else { k.err = 'Ключ не подходит. Проверьте символы.'; this.drawKeyModal(); }
      }],
      ['Esc', 'Назад', () => { this.keyEntry = null; this.endScreen(true); }],
    ]);
    // поле ввода — на подложке, ошибка — красным
    const f = this.keyTexts[1], box = this.add.graphics();
    box.fillStyle(0xfffaf0, 1).fillRect(f.x - 6, f.y - 4, 300, f.height + 8).lineStyle(2, 0x3a3550, 1).strokeRect(f.x - 6, f.y - 4, 300, f.height + 8);
    this.modal!.addAt(box, this.modal!.getIndex(f));
    this.keyTexts[2].setColor('#c8323c');
  }

  /** Ввод символов ключа (подключается один раз в create). */
  onKeyTyping(e: KeyboardEvent) {
    const k = this.keyEntry;
    if (!k) return;
    if (e.key === 'Escape' || e.key === 'Enter') return;   // обрабатывает модалка
    if (e.key === 'Backspace') k.key = normalizeKey(k.key.replace(/-$/, '').slice(0, -1));
    else if (/^[A-HJ-NP-Za-hj-np-z2-9]$/.test(e.key) && k.key.length < 19) k.key = normalizeKey(k.key + e.key);   // алфавит ключа: без 0/O, 1/I
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
