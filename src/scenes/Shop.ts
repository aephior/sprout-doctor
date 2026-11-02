// Лавка господина Огавы: отдельный экран. Огава за прилавком, кошка Моти спит на прилавке,
// товары — на деревянной доске-меню справа, реплики Огавы печатаются в окне диалога.
import { game } from '../state/game';
import { events } from '../state/events';
import { text, HEX, C } from '../ui/ui';
import { sound } from '../audio/sound';
import { makeGlow } from '../art/interiors';
import { hourNow } from '../world/life';

const S = 3;   // сетка раскладки меню (исторически 320×180 ×3)
// Огава стоит за прилавком (прилавок из фона рисуется поверх него); правый край портретов совпадает
const OG_S = 2,   // портрет пересэмплирован под сетку фона (tools/art/regrid.py)
  OG_X = 470 + 165 / 2, OG_Y = 400;
const OGAWA: Record<number, string> = { 0: 'g-ogawa_neutral_px', 2: 'g-ogawa_talk_px', 3: 'g-ogawa_happy_px' };

interface Item { key: string; name: string; price: () => number | null; note: () => string; buy: () => string | null }

export class Shop extends Phaser.Scene {
  ogawa!: Phaser.GameObjects.Sprite;
  mood = 0;
  ui!: Phaser.GameObjects.Container;
  say!: Phaser.GameObjects.Text;
  sel = 0;
  items: Item[] = [];
  typing?: Phaser.Time.TimerEvent;
  talk?: Phaser.Time.TimerEvent;

  constructor() { super('Shop'); }

  create() {
    sound.setMood('evening'); makeGlow(this);
    // за окном — небо по времени суток: до 17:00 день, потом закат
    const bgKey = hourNow() < 17 ? 'g-shop_bg_day' : 'g-shop_bg';
    this.add.image(0, 0, bgKey).setOrigin(0).setScale(2);
    // тёплый свет красного фонаря
    const day = bgKey === 'g-shop_bg_day';
    const glow = this.add.image(486, 165, 'glow').setScale(3.4).setAlpha(day ? 0.16 : 0.5).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffb070);
    this.tweens.add({ targets: glow, alpha: day ? 0.1 : 0.36, duration: 1800, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // Огава за прилавком: портреты «спокоен / говорит / радуется», правый край совпадает
    this.ogawa = this.add.sprite(OG_X, OG_Y, 'g-ogawa_neutral_px').setOrigin(1, 1).setScale(OG_S).setTint(0xffe8cc);
    this.tweens.add({ targets: this.ogawa, y: OG_Y - 2, duration: 1700, yoyo: true, repeat: -1, ease: 'Stepped' });
    // прилавок из того же фона — поверх Огавы, чтобы он стоял за ним
    this.add.image(0, 0, bgKey).setOrigin(0).setScale(2).setCrop(168, 176, 230, 50);
    // днём комната светлее, вечером — тёплый полумрак (слой под интерфейсом, поверх сцены)
    if (day) this.add.rectangle(0, 0, 960, 540, 0xfff4e0, 0.06).setOrigin(0).setBlendMode(Phaser.BlendModes.ADD);
    else this.add.rectangle(0, 0, 960, 540, 0x2a1830, 0.16).setOrigin(0);
    // тень под прилавком и тёплый свет на лице
    // кошка Моти дремлет на табурете (она нарисована в фоне) — её можно погладить
    const mochi = this.add.zone(140, 365, 100, 60).setOrigin(0).setInteractive({ useHandCursor: true });
    mochi.on('pointerdown', () => { sound.play('meow'); this.speak('Моти любит, когда её гладят. Видишь — мурчит.', 3); });
    // пылинки в свете
    this.add.particles(0, 0, 'pixel', {
      x: { min: 360, max: 620 }, y: { min: 90, max: 330 }, lifespan: 5000, speedY: { min: -3, max: 3 }, speedX: { min: -3, max: 3 },
      scale: { start: 2, end: 0 }, alpha: { start: 0.5, end: 0 }, frequency: 300, tint: 0xffd27a,
    });

    this.ui = this.add.container(0, 0);
    // окно диалога
    const g = this.add.graphics();
    g.fillStyle(C.ink, 0.9).fillRect(24, 412, 600, 112);
    g.fillStyle(C.paper, 1).fillRect(28, 416, 592, 104);
    g.fillStyle(C.paperDark, 1).fillRect(28, 516, 592, 4);
    g.fillStyle(0x8e2230, 1).fillRect(40, 404, 132, 22);
    text(this, 106, 415, 'Господин Огава', 15, HEX.paper).setOrigin(0.5);
    this.say = text(this, 46, 438, '', 18, HEX.ink, { wordWrap: { width: 556 }, lineSpacing: 4 });
    text(this, 612, 514, 'Esc — выйти из лавки', 12, '#8a7a5a').setOrigin(1, 1);

    const d = game.data;
    this.items = [
      { key: '1', name: 'Продать урожай', price: () => null, note: () => `${d.harvest} шт. × 15 = ${d.harvest * 15} мон.`,
        buy: () => { if (!d.harvest) return 'Корзина пуста. Приноси спелые овощи — куплю все.'; d.coins += d.harvest * 15; const n = d.harvest; d.harvest = 0; sound.play('coin'); return n >= 6 ? `Вот это урожай! ${n * 15} монет — заслуженно.` : `Свежие, хорошие. Держи ${n * 15} монет.`; } },
      { key: '2', name: 'Фунгицид', price: () => 20, note: () => `есть: ${d.fungicide}`,
        buy: () => { d.fungicide++; return 'Распыляй на листья, не на землю. Хару всегда так говорила.'; } },
      { key: '3', name: 'Семена', price: () => { const n = d.beds.filter((b) => b.dead).length; return n ? n * 15 : null; }, note: () => `погибших грядок: ${d.beds.filter((b) => b.dead).length}`,
        buy: () => { const n = game.replantDead(); return n ? `Посажено ростков: ${n}. Дай им пару дней.` : 'Все грядки живы — семена не нужны.'; } },
      { key: '4', name: 'Удобрение', price: () => (d.fertilized ? null : 25), note: () => (d.fertilized ? 'уже внесено сегодня' : 'ночью рост ×2'),
        buy: () => { d.fertilized = true; return 'Компост с горного склона. Утром не узнаешь грядки.'; } },
      { key: '5', name: 'Линза Фуку +1', price: () => (d.fukuMax < 10 ? 40 + d.fukuMax * 10 : null), note: () => `заряд: ${d.fukuMax}/10`,
        buy: () => { d.fukuMax++; d.fukuCharge++; return 'Батарейку для твоего фонарика я достал у внука в Осаке.'; } },
    ];

    const kb = this.input.keyboard!;
    kb.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape') return this.leave();
      const i = this.items.findIndex((it) => it.key === e.key);
      if (i >= 0) { this.sel = i; this.buy(i); }
      if (e.key === 'ArrowUp' || e.code === 'KeyW') { this.sel = (this.sel + this.items.length - 1) % this.items.length; sound.play('click'); this.drawMenu(); }
      if (e.key === 'ArrowDown' || e.code === 'KeyS') { this.sel = (this.sel + 1) % this.items.length; sound.play('click'); this.drawMenu(); }
      if (e.key === 'Enter' || e.key === ' ') this.buy(this.sel);
    });

    this.drawMenu();
    const greet = d.season === 3 ? 'Осень в этом году тревожная… Но ты держишься, Аой-сан.'
      : d.day === 1 && d.season === 1 ? 'О, внучка Хару! Добро пожаловать. Чем богаты — тем и рады.'
        : ['Ирассяймасэ! Заходи, заходи.', 'Вечер добрый. Как грядки?', 'Чай остыл, а покупателей всё нет. Хорошо, что ты зашла.'][d.totalDays % 3];
    this.speak(greet, 2);
    this.cameras.main.fadeIn(400, 30, 20, 20);
  }

  /** Реплика Огавы печатается по буквам; кадр «говорит»/«радуется». */
  speak(s: string, mood: 2 | 3 = 2) {
    this.typing?.remove(); this.talk?.remove();
    let i = 0;
    this.say.setText('');
    this.typing = this.time.addEvent({ delay: 24, repeat: s.length - 1, callback: () => this.say.setText(s.slice(0, ++i)) });
    this.talk = this.time.addEvent({ delay: 260, repeat: Math.min(14, Math.floor(s.length / 5)), callback: () => this.face(this.mood === 2 ? 0 : 2) });
    this.time.delayedCall(s.length * 24 + 300, () => this.face(mood === 3 ? 3 : 0));
    this.time.delayedCall(s.length * 24 + 1600, () => this.mood === 3 && this.face(0));
  }

  face(m: number) { this.mood = m; this.ogawa.setTexture(OGAWA[m]); }

  buy(i: number) {
    const it = this.items[i], d = game.data, price = it.price();
    if (it.key !== '1' && price === null) { sound.play('miss'); this.speak(it.key === '4' ? 'Удобрение уже внесено. Больше — только навредит.' : it.key === '3' ? 'Все грядки живы — семена не нужны.' : 'Линза и так на пределе, Аой-сан.'); return; }
    if (price !== null && d.coins < price) { sound.play('miss'); this.speak(`Не хватает монет: нужно ${price}. Продай урожай — и приходи.`); return; }
    if (price !== null) d.coins -= price;
    const msg = it.buy();
    if (msg) { if (it.key !== '1') sound.play('coin'); this.speak(msg, 3); }
    game.save(); events.emit('stats');
    this.drawMenu();
  }

  drawMenu() {
    this.ui.removeAll(true);
    const add = (o: Phaser.GameObjects.GameObject) => this.ui.add(o);
    const d = game.data;
    // заголовок доски
    add(text(this, 270 * S, 21 * S, 'お品書き · ТОВАРЫ', 15, HEX.paper).setOrigin(0.5));
    this.items.forEach((it, i) => {
      const x = 237 * S, y = 30 * S + i * 46, sel = i === this.sel, price = it.price();
      const can = it.key === '1' ? d.harvest > 0 : price !== null && d.coins >= price;
      const g = this.add.graphics();
      g.fillStyle(sel ? 0xfff3d4 : C.paper, 1).fillRect(x, y, 66 * S, 40);
      g.lineStyle(2, sel ? C.red : 0xc9ab74, 1).strokeRect(x + 1, y + 1, 66 * S - 2, 38);
      if (sel) g.fillStyle(C.red, 1).fillRect(x - 10, y + 12, 6, 16);
      add(g);
      add(text(this, x + 8, y + 3, `${it.key} ${it.name}`, 16, can ? HEX.ink : '#9a8a6a'));
      add(text(this, x + 8, y + 22, it.note(), 12, '#6a5a3a'));
      if (price !== null) add(text(this, x + 66 * S - 8, y + 4, `${price}`, 16, can ? '#8e2230' : '#9a8a6a').setOrigin(1, 0));
      const z = this.add.zone(x, y, 66 * S, 40).setOrigin(0).setInteractive({ useHandCursor: true })
        .on('pointerover', () => { if (this.sel !== i) { this.sel = i; this.drawMenu(); } })
        .on('pointerdown', () => this.buy(i));
      add(z);
    });
    // кошелёк
    const wg = this.add.graphics();
    wg.fillStyle(C.ink, 0.85).fillRect(14, 12, 226, 46).fillStyle(C.paper, 1).fillRect(17, 15, 220, 40);
    add(wg);
    add(text(this, 28, 18, `Монеты: ${d.coins}`, 17));
    add(text(this, 28, 38, `Урожай ${d.harvest} · фунгицид ${d.fungicide}`, 12, '#6a5a3a'));
  }

  leave() {
    game.addMinutes(15);
    sound.play('click');
    this.speak('Заходи ещё! И передай привет Фуку.', 3);
    this.input.keyboard!.removeAllListeners();
    this.time.delayedCall(700, () => {
      this.cameras.main.fadeOut(350, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop();
        this.scene.wake('World'); this.scene.setVisible(true, 'Hud');
        events.emit('lock', false); events.emit('refresh-beds'); events.emit('stats');
      });
    });
  }
}
