// Лавка господина Огавы в духе магазина из Cuphead: Огава крупно за прилавком, перед ним выдвигается ящик
// с товарами на бархате; выбранный товар приподнимается и показывается на витрине-карточке с ценником.
// Слои (все на сетке фона ×2): комната → Огава → прилавок → ящик с товарами → Моти → свет → интерфейс.
import { game } from '../state/game';
import { events } from '../state/events';
import { text, HEX, C, paperPanel } from '../ui/ui';
import { sound } from '../audio/sound';
import { makeGlow } from '../art/interiors';
import { hourNow } from '../world/life';

const K = 2;                                   // масштаб всех слоёв лавки (сетка фона 480×270 ×2)
const CX = 150, CY = 262;                      // прилавок 330×149 → 660×298, левый верх
const DR_X = CX + 95 * K, DR_Y = CY + 73 * K;  // ящик в открытом положении
const DR_SHUT = 29 * K;                        // насколько ящик «задвинут» в закрытом положении
const SLOT_X = [20, 44.5, 69, 93, 118].map((x) => x * K);   // центры ячеек (от левого края ящика)
const SLOT_Y = 30 * K;                         // низ товара в ячейке
const OG = { x: 378, y: 300 };                 // Огава: низ — задний край прилавка
const POSE = { idle: 'shop-og-idle', talk: 'shop-og-talk', happy: 'shop-og-happy', coins: 'shop-og-coins' } as const;
type Pose = keyof typeof POSE;

interface Item { key: string; icon: string; name: string; price: () => number | null; note: () => string; why: () => string; buy: () => string | null }

export class Shop extends Phaser.Scene {
  ogawa!: Phaser.GameObjects.Image;
  pose: Pose = 'idle';
  hold = 0;                                     // до какого времени держать «эмоцию» (радость/монеты)
  tray!: Phaser.GameObjects.Container;
  icons: Phaser.GameObjects.Image[] = [];
  badges: Phaser.GameObjects.Text[] = [];
  bubble!: Phaser.GameObjects.Container;
  sayText!: Phaser.GameObjects.Text;
  show!: Phaser.GameObjects.Container;
  purse!: Phaser.GameObjects.Container;
  mochi!: Phaser.GameObjects.Image;
  sel = 0;
  items: Item[] = [];
  typing?: Phaser.Time.TimerEvent;
  flap?: Phaser.Time.TimerEvent;
  leaving = false;

  constructor() { super('Shop'); }

  create() {
    sound.setMood('evening'); makeGlow(this);
    this.leaving = false; this.sel = 0; this.icons = []; this.badges = []; this.pose = 'idle'; this.hold = 0;
    const day = hourNow() < 17;
    const bgKey = day ? 'g-shop_bg_day' : 'g-shop_bg';
    this.add.image(0, 0, bgKey).setOrigin(0).setScale(K);
    // тёплый свет красного фонаря
    const glow = this.add.image(486, 165, 'glow').setScale(3.4).setAlpha(day ? 0.18 : 0.5).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffb070);
    this.tweens.add({ targets: glow, alpha: day ? 0.12 : 0.36, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });

    // Огава: дышит (шаг в 1 пиксель сетки), говорит, радуется, считает монеты
    this.ogawa = this.add.image(OG.x, OG.y, POSE.idle).setOrigin(0.5, 1).setScale(K);
    this.tweens.add({ targets: this.ogawa, y: OG.y - K, duration: 1700, yoyo: true, repeat: -1, ease: 'Stepped' });

    // прилавок (в нём ниша под ящик) и колокольчик — по нему можно позвонить
    this.add.image(CX, CY, 'shop-counter').setOrigin(0).setScale(K);
    this.add.zone(CX + 20 * K, CY + 26 * K, 30 * K, 24 * K).setOrigin(0).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { sound.play('bell'); this.speak(['Да-да, я здесь! Не так громко — Моти спит.', 'Иду-иду! Колокольчик ещё дедушкин.'][Math.floor(Math.random() * 2)]); });
    // пар над чаем
    this.add.particles(CX + 260 * K, CY + 18 * K, 'pixel', {
      speedY: { min: -16, max: -9 }, speedX: { min: -3, max: 3 }, lifespan: 1700, frequency: 240, scale: { start: 3, end: 1 },
      alpha: { start: 0.45, end: 0 }, tint: 0xffffff, quantity: 1,
    });

    // ящик с товарами: выезжает из прилавка; виден только ниже кромки столешницы
    this.tray = this.add.container(DR_X, DR_Y - DR_SHUT);
    this.tray.add(this.add.image(0, 0, 'shop-drawer').setOrigin(0).setScale(K));
    const mask = this.make.graphics({}, false); mask.fillStyle(0xffffff).fillRect(CX, DR_Y, 700, 200);
    this.tray.setMask(mask.createGeometryMask());

    // Моти дремлет на подушке на прилавке; иногда приоткрывает глаз; её можно погладить
    this.mochi = this.add.image(CX + 218 * K, CY + 56 * K, 'shop-mochi0').setOrigin(0.5, 1).setScale(K).setInteractive({ useHandCursor: true });
    this.mochi.on('pointerdown', () => this.petMochi());
    const doze = () => {
      if (!this.scene.isActive()) return;
      this.mochi.setTexture('shop-mochi1');
      this.time.delayedCall(1600 + Math.random() * 1200, () => this.mochi.active && this.mochi.setTexture('shop-mochi0'));
      this.time.delayedCall(6000 + Math.random() * 6000, doze);
    };
    this.time.delayedCall(4000, doze);

    // пылинки в луче фонаря
    this.add.particles(0, 0, 'pixel', {
      x: { min: 360, max: 640 }, y: { min: 70, max: 300 }, lifespan: 5000, speedY: { min: -3, max: 3 }, speedX: { min: -3, max: 3 },
      scale: { start: 2, end: 0 }, alpha: { start: 0.5, end: 0 }, frequency: 300, tint: 0xffd27a,
    });
    // время суток: днём светлее, вечером тёплый полумрак и ярче фонарь
    if (day) this.add.rectangle(0, 0, 960, 540, 0xeaf4ff, 0.08).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD);
    else { this.add.rectangle(0, 0, 960, 540, 0x2a1830, 0.26).setOrigin(0); this.add.image(486, 165, 'glow').setScale(4.2).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD).setTint(0xff9a50); }

    this.buildItems();
    this.buildUi();

    const kb = this.input.keyboard!;
    kb.on('keydown', (e: KeyboardEvent) => {
      if (this.leaving) return;
      if (e.key === 'Escape') return this.leave();
      const i = this.items.findIndex((it) => it.key === e.key);
      if (i >= 0) { this.select(i); this.buy(i); return; }
      const n = this.items.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.code === 'KeyA' || e.code === 'KeyW') this.select((this.sel + n - 1) % n, true);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.code === 'KeyD' || e.code === 'KeyS') this.select((this.sel + 1) % n, true);
      if (e.key === 'Enter' || e.key === ' ') this.buy(this.sel);
    });

    // вход: камера проявляется, ящик выезжает, Огава здоровается
    this.cameras.main.fadeIn(400, 30, 20, 20);
    this.time.delayedCall(350, () => {
      sound.play('drawer');
      this.tweens.add({ targets: this.tray, y: DR_Y, duration: 520, ease: 'Back.out' });
    });
    const d = game.data;
    const greet = d.season === 3 ? 'Осень в этом году тревожная… Но ты держишься, Аой-сан.'
      : d.day === 1 && d.season === 1 ? 'О, внучка Хару! Добро пожаловать. Чем богаты — тем и рады.'
        : day ? ['Ирассяймасэ! Заходи, заходи.', 'Доброе утро! Свежий товар только привезли.', 'Чай ещё горячий. Выбирай не спеша.'][d.totalDays % 3]
          : ['Вечер добрый. Как грядки?', 'Чай остыл, а покупателей всё нет. Хорошо, что ты зашла.', 'Успела до закрытия! Заходи.'][d.totalDays % 3];
    this.time.delayedCall(500, () => this.speak(greet));
    this.select(0);
  }

  // ---------- товары ----------
  buildItems() {
    const d = game.data;
    this.items = [
      { key: '1', icon: 'harvest', name: 'Продать урожай', price: () => null, note: () => `${d.harvest} шт. × 15 = ${d.harvest * 15} мон.`,
        why: () => 'Огава купит всё, что вы вырастили.',
        buy: () => { if (!d.harvest) return null; const n = d.harvest; d.coins += n * 15; d.harvest = 0; return n >= 6 ? `Вот это урожай! ${n * 15} монет — заслуженно.` : `Свежие, хорошие. Держи ${n * 15} монет.`; } },
      { key: '2', icon: 'fungicide', name: 'Фунгицид', price: () => 20, note: () => `есть: ${d.fungicide}`,
        why: () => 'Для ритуала «Спрей» против грибных болезней.',
        buy: () => { d.fungicide++; return 'Распыляй на листья, не на землю. Хару всегда так говорила.'; } },
      { key: '3', icon: 'seeds', name: 'Семена', price: () => { const n = d.beds.filter((b) => b.dead).length; return n ? n * 15 : null; },
        note: () => `погибших грядок: ${d.beds.filter((b) => b.dead).length}`, why: () => 'Пересадка на погибшие и пустые грядки.',
        buy: () => { const n = game.replantDead(); return n ? `Посажено ростков: ${n}. Дай им пару дней.` : null; } },
      { key: '4', icon: 'fertilizer', name: 'Удобрение', price: () => (d.fertilized ? null : 25), note: () => (d.fertilized ? 'уже внесено сегодня' : 'ночью рост ×2'),
        why: () => 'Компост с горного склона: растения растут вдвое быстрее.',
        buy: () => { d.fertilized = true; return 'Компост с горного склона. Утром не узнаешь грядки.'; } },
      { key: '5', icon: 'lens', name: 'Линза Фуку +1', price: () => (d.fukuMax < 10 ? 40 + d.fukuMax * 10 : null), note: () => `заряд: ${d.fukuMax}/10`,
        why: () => 'Ещё один скан Линзой в день.',
        buy: () => { d.fukuMax++; d.fukuCharge++; return 'Батарейку для твоего фонарика я достал у внука в Осаке.'; } },
    ];
    this.items.forEach((it, i) => {
      const ic = this.add.image(SLOT_X[i], SLOT_Y, `shop-item-${it.icon}-s`).setOrigin(0.5, 1).setScale(K);
      this.tray.add(ic); this.icons.push(ic);
      const b = text(this, SLOT_X[i], -6, it.key, 13, HEX.paper, { stroke: HEX.ink, strokeThickness: 4 }).setOrigin(0.5, 1);
      this.tray.add(b); this.badges.push(b);
      // наведение и щелчок по ячейке
      const z = this.add.zone(DR_X + SLOT_X[i] - 23, DR_Y, 46, 58).setOrigin(0).setInteractive({ useHandCursor: true })
        .on('pointerover', () => this.select(i, true)).on('pointerdown', () => { this.select(i); this.buy(i); });
      z.setDepth(5);
    });
  }

  available(i: number) {
    const it = this.items[i], d = game.data, p = it.price();
    return it.key === '1' ? d.harvest > 0 : p !== null && d.coins >= p;
  }

  /** Выбор товара: он приподнимается в ячейке, витрина показывает его крупно. */
  select(i: number, clickSound = false) {
    if (clickSound && i !== this.sel) sound.play('click');
    const changed = i !== this.sel || !this.show.length;
    this.sel = i;
    this.icons.forEach((ic, k) => {
      this.tweens.killTweensOf(ic);
      ic.setY(SLOT_Y).setAlpha(this.available(k) || k === i ? 1 : 0.55);
      if (k === i) { ic.setY(SLOT_Y - 3 * K); this.tweens.add({ targets: ic, y: SLOT_Y - 5 * K, duration: 500, yoyo: true, repeat: -1, ease: 'Stepped' }); }
    });
    this.badges.forEach((b, k) => b.setColor(k === i ? '#ffd27a' : HEX.paper));
    this.drawShowcase(changed);
  }

  // ---------- интерфейс ----------
  buildUi() {
    // реплика Огавы — облачко слева от него
    this.bubble = this.add.container(0, 0).setDepth(10);
    this.sayText = text(this, 30, 102, '', 16, HEX.ink, { wordWrap: { width: 186 }, lineSpacing: 3 }).setDepth(11);
    this.show = this.add.container(0, 0).setDepth(10);
    this.purse = this.add.container(0, 0).setDepth(10);
    text(this, 946, 530, 'Esc — выйти · ←→ выбор · Enter — купить', 12, '#f6e7c1', { stroke: HEX.ink, strokeThickness: 3 }).setOrigin(1, 1).setDepth(10);
    this.drawPurse();
  }

  drawBubble(h: number) {
    this.bubble.removeAll(true);
    const tail = this.add.graphics();
    tail.fillStyle(C.ink, 1).fillTriangle(236, 96, 236, 124, 262, 104);
    tail.fillStyle(C.paper, 1).fillTriangle(234, 100, 234, 119, 254, 105);
    this.bubble.add([paperPanel(this, 14, 74, 224, h), tail]);
    const tg = this.add.graphics(); tg.fillStyle(0x8e2230, 1).fillRect(26, 64, 132, 20);
    this.bubble.add([tg, text(this, 92, 74, 'Господин Огава', 13, HEX.paper).setOrigin(0.5)]);
  }

  drawShowcase(pop = true) {
    this.show.removeAll(true);
    const it = this.items[this.sel], d = game.data, p = it.price(), ok = this.available(this.sel);
    const x = 708, y = 14, w = 238, h = 256;
    this.show.add(paperPanel(this, x, y, w, h));
    this.show.add(text(this, x + w / 2, y + 12, `${it.key} · ${it.name}`, 17).setOrigin(0.5, 0));
    // крупный товар на «бархате» с мягкой тенью
    const pad = this.add.graphics();
    pad.fillStyle(0x5a0e1c, 1).fillRoundedRect(x + 18, y + 42, w - 36, 112, 10).fillStyle(0x8e1a2e, 1).fillRoundedRect(x + 22, y + 46, w - 44, 104, 8);
    pad.fillStyle(0x000000, 0.28).fillEllipse(x + w / 2, y + 142, 130, 14);
    this.show.add(pad);
    const big = this.add.image(x + w / 2 - 12, y + 146, `shop-item-${it.icon}`).setOrigin(0.5, 1).setScale(K).setAlpha(ok ? 1 : 0.65);
    const fit = Math.min(1, (w - 84) / big.displayWidth, 100 / big.displayHeight);
    big.setScale(K * fit);
    this.show.add(big);
    if (pop) { const s0 = big.scale; big.setScale(s0 * 0.8); this.tweens.add({ targets: big, scale: s0, duration: 260, ease: 'Back.out' }); }
    // ценник на верёвочке — покачивается
    const tag = this.add.container(x + w - 36, y + 48);
    tag.add(this.add.image(0, 0, 'shop-tag').setOrigin(0.5, 0.06).setScale(K));
    const pt = it.key === '1' ? (d.harvest ? `+${d.harvest * 15}` : '0') : p === null ? '—' : String(p);
    tag.add(text(this, -3, 44, pt, 15, ok ? '#8e2230' : '#7a6a5a').setOrigin(0.5));
    this.show.add(tag);
    if (pop) { tag.setAngle(-16); this.tweens.add({ targets: tag, angle: 8, duration: 600, yoyo: true, ease: 'Sine.inOut' }); }
    this.tweens.add({ targets: tag, angle: { from: -4, to: 4 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut', delay: pop ? 1200 : 0 });
    this.show.add(text(this, x + 16, y + 162, it.why(), 13, '#4a3a2a', { wordWrap: { width: w - 32 }, lineSpacing: 2 }));
    this.show.add(text(this, x + 16, y + 204, it.note(), 13, '#6a5a3a'));
    const act = it.key === '1' ? (d.harvest ? '[Enter] Продать' : 'Корзина пуста')
      : p === null ? 'Сейчас не нужно' : d.coins < p ? `Не хватает ${p - d.coins} мон.` : '[Enter] Купить';
    this.show.add(text(this, x + w / 2, y + h - 26, act, 16, ok ? '#c8323c' : '#8a7a6a').setOrigin(0.5));
  }

  drawPurse() {
    this.purse.removeAll(true);
    const d = game.data;
    this.purse.add(paperPanel(this, 14, 474, 128, 54));
    const coin = this.add.graphics(); coin.fillStyle(C.ink, 1).fillCircle(32, 494, 8).fillStyle(0xf2c230, 1).fillCircle(32, 494, 6).fillStyle(0xfff0a0, 1).fillRect(29, 490, 2, 3);
    this.purse.add([coin, text(this, 46, 483, `${d.coins}`, 18), text(this, 24, 508, `урожай ${d.harvest} · фунг. ${d.fungicide}`, 11, '#6a5a3a')]);
  }

  // ---------- Огава ----------
  setPose(p: Pose) { this.pose = p; this.ogawa.setTexture(POSE[p]); }

  /** Реплика печатается по буквам, Огава «говорит» (смена кадров рта); эмоция держится после. */
  speak(s: string, after: Pose = 'idle', holdMs = 1600) {
    this.typing?.remove(); this.flap?.remove();
    let i = 0;
    this.sayText.setText(s);
    this.drawBubble(Math.max(64, this.sayText.height + 34));
    this.sayText.setText('');
    this.typing = this.time.addEvent({ delay: 22, repeat: s.length - 1, callback: () => this.sayText.setText(s.slice(0, ++i)) });
    if (after === 'idle') {
      this.flap = this.time.addEvent({ delay: 170, repeat: Math.max(2, Math.floor(s.length * 22 / 170)), callback: () => { if (this.time.now >= this.hold) this.setPose(this.pose === 'talk' ? 'idle' : 'talk'); } });
      this.time.delayedCall(s.length * 22 + 240, () => this.time.now >= this.hold && this.setPose('idle'));
    } else {
      this.hold = this.time.now + holdMs;
      this.setPose(after);
      this.time.delayedCall(holdMs + 20, () => this.time.now >= this.hold && this.setPose('idle'));
    }
  }

  petMochi() {
    sound.play('meow');
    this.mochi.setTexture('shop-mochi1');
    const h = this.add.image(this.mochi.x, this.mochi.y - 96, 'heart-px').setScale(K * 2).setDepth(9);
    this.tweens.add({ targets: h, y: h.y - 30, alpha: 0, duration: 1000, onComplete: () => h.destroy() });
    this.time.delayedCall(2000, () => this.mochi.active && this.mochi.setTexture('shop-mochi0'));
    this.speak('Моти любит, когда её гладят. Видишь — мурчит.');
  }

  // ---------- покупка ----------
  coinsFly(from: { x: number; y: number }, to: { x: number; y: number }, n: number) {
    for (let k = 0; k < n; k++) {
      const c = this.add.graphics().setDepth(12);
      c.fillStyle(C.ink, 1).fillCircle(0, 0, 7).fillStyle(0xf2c230, 1).fillCircle(0, 0, 5).fillStyle(0xfff0a0, 1).fillRect(-2, -3, 2, 2);
      c.setPosition(from.x + (Math.random() - 0.5) * 20, from.y).setVisible(false);
      const top = Math.min(from.y, to.y) - 60;
      this.time.delayedCall(k * 70, () => {
        c.setVisible(true);
        this.tweens.add({ targets: c, x: to.x, duration: 520, ease: 'Sine.inOut' });
        this.tweens.add({ targets: c, y: top, duration: 260, ease: 'Quad.out',
          onComplete: () => this.tweens.add({ targets: c, y: to.y, duration: 260, ease: 'Quad.in', onComplete: () => { c.destroy(); if (k === n - 1) sound.play('coin'); } }) });
      });
    }
  }

  floatText(x: number, y: number, s: string, col: string) {
    const t = text(this, x, y, s, 20, col, { stroke: HEX.ink, strokeThickness: 5 }).setOrigin(0.5).setDepth(13);
    this.tweens.add({ targets: t, y: y - 36, alpha: 0, delay: 300, duration: 900, onComplete: () => t.destroy() });
  }

  buy(i: number) {
    if (this.leaving) return;
    const it = this.items[i], d = game.data, price = it.price();
    const ic = this.icons[i], slot = { x: DR_X + SLOT_X[i], y: DR_Y + SLOT_Y - 16 };
    const purse = { x: 60, y: 490 };
    const nope = (msg: string) => {
      sound.play('miss');
      this.tweens.add({ targets: ic, x: { from: SLOT_X[i] - 4, to: SLOT_X[i] + 4 }, duration: 50, yoyo: true, repeat: 3, onComplete: () => ic.setX(SLOT_X[i]) });
      this.speak(msg);
    };
    if (it.key === '1') {
      if (!d.harvest) return nope('Корзина пуста. Приноси спелые овощи — куплю все.');
      const n = d.harvest, msg = it.buy()!;
      this.coinsFly({ x: OG.x + 40, y: 300 }, purse, Math.min(8, 2 + n));
      this.floatText(purse.x + 30, 460, `+${n * 15}`, '#7ad06a');
      this.speak(msg, 'coins', 1500);
      this.time.delayedCall(1520, () => { this.hold = this.time.now + 1200; this.setPose('happy'); });
    } else {
      if (price === null) return nope(it.key === '4' ? 'Удобрение уже внесено. Больше — только навредит.' : it.key === '3' ? 'Все грядки живы — семена не нужны.' : 'Линза и так на пределе, Аой-сан.');
      if (d.coins < price) return nope(`Не хватает монет: нужно ${price}. Продай урожай — и приходи.`);
      d.coins -= price;
      const msg = it.buy();
      this.coinsFly(purse, { x: OG.x + 60, y: 320 }, 3);
      this.floatText(purse.x + 30, 460, `−${price}`, '#ff8a8a');
      // копия товара перелетает из ящика к кошельку Аой
      const fly = this.add.image(slot.x, slot.y, `shop-item-${it.icon}`).setScale(K * 0.5).setDepth(12);
      this.tweens.add({ targets: fly, x: purse.x, y: purse.y - 10, scale: K * 0.35, angle: 360, duration: 700, ease: 'Quad.in', onComplete: () => { fly.destroy(); sound.play('ok'); } });
      if (msg) this.speak(msg, 'happy', 1800);
    }
    game.save(); events.emit('stats');
    this.drawPurse(); this.select(this.sel);
  }

  leave() {
    if (this.leaving) return;
    this.leaving = true;
    game.addMinutes(15);
    sound.play('click');
    this.speak('Заходи ещё! И передай привет Фуку.', 'happy', 2000);
    this.time.delayedCall(500, () => { sound.play('drawer'); this.tweens.add({ targets: this.tray, y: DR_Y - DR_SHUT, duration: 300, ease: 'Quad.in' }); });
    this.time.delayedCall(900, () => {
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.input.keyboard!.removeAllListeners();
        this.scene.stop();
        this.scene.wake('World'); this.scene.setVisible(true, 'Hud');
        events.emit('lock', false); events.emit('refresh-beds'); events.emit('stats');
      });
    });
  }
}
