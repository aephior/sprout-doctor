// Мир фермы (вид сверху, клавиатура). Камера выключена — жесты только в «Процедурной».
import { sound } from '../audio/sound';
import { game, Bed } from '../state/game';
import { isHealthy } from '../data/diseases';
import { events, uiBlocks } from '../state/events';
import { FarmLife } from '../world/life';
import { LAYOUT } from '../world/layout';
import { SEASONAL } from './Boot';
import { registerTools } from '../art/plants';

const T = 16, MW = LAYOUT.MW, MH = LAYOUT.MH;
const CROP_ROW: Record<string, number> = { tomato: 0, potato: 1, pepper: 2 };
/** Позиция грядки в мире (левый верх клетки). */
export const bedXY = (b: Bed) => ({ x: (b.tx + LAYOUT.bedOffset[0]) * T, y: (b.ty + LAYOUT.bedOffset[1]) * T });

type Interact = { kind: 'bed'; bed: Bed } | { kind: 'villager'; who: string } | { kind: 'mochi' } | { kind: 'fisher' } | { kind: 'house' } | { kind: 'shop' } | { kind: 'busstop' } | { kind: 'vending' };

export class World extends Phaser.Scene {
  aoi!: Phaser.Physics.Arcade.Sprite;
  fuku!: Phaser.GameObjects.Sprite;
  fukuShadow!: Phaser.GameObjects.Ellipse;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  beds = new Map<number, { plant: Phaser.GameObjects.Sprite; soil: Phaser.GameObjects.Image; spores: Phaser.GameObjects.Particles.ParticleEmitter }>();
  facingSide: 'left' | 'right' = 'right';
  solids!: Phaser.Physics.Arcade.StaticGroup;
  facing: 'down' | 'up' | 'side' = 'down';
  marker!: Phaser.GameObjects.Graphics;
  current: Interact | null = null;
  locked = false;
  lastStep = 0;
  fx?: Phaser.FX.ColorMatrix;
  life!: FarmLife;
  seasonal: { img: Phaser.GameObjects.Image; key: string }[] = [];

  constructor() { super('World'); }

  create() {
    this.seasonal = [];
    registerTools(this);   // искорки и др. мелкие текстуры
    if (!this.textures.exists('tea-can')) {   // баночка холодного чая 4×6
      const cv = this.textures.createCanvas('tea-can', 4, 6)!; const c = cv.getContext();
      c.fillStyle = '#18121c'; c.fillRect(0, 0, 4, 6); c.fillStyle = '#3fd0c9'; c.fillRect(1, 1, 2, 4); c.fillStyle = '#f6e7c1'; c.fillRect(1, 2, 2, 1); c.fillStyle = '#c0c8d0'; c.fillRect(1, 0, 2, 1); cv.refresh();
    }
    sound.setMood('day');
    this.cameras.main.fadeIn(400);
    this.solids = this.physics.add.staticGroup();
    this.buildMap();

    // Аой — спрайт 16×20 (стиль Ninja Adventure), 1 ед. мира = 1 px арта
    this.aoi = this.physics.add.sprite(LAYOUT.doorHouse[0], LAYOUT.doorHouse[1] + 18, 'aoi-na', 0).setOrigin(0.5, 1);
    (this.aoi.body as Phaser.Physics.Arcade.Body).setSize(10, 5).setOffset(3, 15);
    this.aoi.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, MW * T, MH * T);
    this.physics.add.collider(this.aoi, this.solids);
    this.fuku = this.add.sprite(this.aoi.x + 12, this.aoi.y - 24, 'fuku-na', 0).play('fukuna-idle').setDepth(8500);
    this.fukuShadow = this.add.ellipse(this.aoi.x, this.aoi.y, 8, 3, 0x000000, 0.22);   // тень Фуку на земле
    this.life = new FarmLife(this, this.aoi);

    this.marker = this.add.graphics().setDepth(9600);

    const cam = this.cameras.main;
    cam.setZoom(3).setBounds(0, 0, MW * T, MH * T).startFollow(this.aoi, true, 0.12, 0.12).setRoundPixels(true);
    cam.setBackgroundColor('#5a9e2b');
    // эффект выцветания доступен только с видеоускорением (WebGL); без него игра работает без эффекта
    if (this.game.renderer.type === Phaser.WEBGL) {
      try { this.fx = cam.postFX.addColorMatrix(); } catch { this.fx = undefined; }
    }

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E') as Record<string, Phaser.Input.Keyboard.Key>;
    kb.on('keydown-E', () => this.interact());
    // Esc (пауза) обрабатывает Hud — в одном месте, чтобы клавиша не открывала и не закрывала окно одновременно
    kb.on('keydown-TAB', (e: KeyboardEvent) => { e.preventDefault(); if (!this.frozen()) events.emit('diary'); });

    events.on('lock', this.lockHandler, this);
    events.on('refresh-beds', this.refreshBeds, this);
    events.on('season', this.refreshBeds, this);
    events.on('boss', this.startBoss, this);
    events.on('drink', this.drink, this);
    this.events.once('shutdown', () => {
      events.off('lock', this.lockHandler, this); events.off('refresh-beds', this.refreshBeds, this);
      events.off('season', this.refreshBeds, this); events.off('boss', this.startBoss, this); events.off('drink', this.drink, this);
    });
    this.events.on('wake', () => { this.refreshBeds(); this.life.apply(); this.locked = false; });
    this.refreshBeds();
  }

  /** Холодный чай из автомата: Аой поворачивается, пьёт из баночки, бодрость — шаг быстрее на час. */
  boostUntil = 0;
  drink() {
    this.locked = true; this.aoi.setVelocity(0); this.aoi.anims.stop(); this.aoi.setFrame(0); this.facing = 'down';
    const can = this.add.image(this.aoi.x + 5, this.aoi.y - 7, 'tea-can').setDepth(this.aoi.depth + 1);
    sound.play('coin');
    this.tweens.add({ targets: can, x: this.aoi.x + 2, y: this.aoi.y - 12, angle: -70, duration: 350, delay: 300, ease: 'Quad.out' });
    this.time.delayedCall(700, () => { sound.play('water'); this.tweens.add({ targets: this.aoi, y: this.aoi.y - 1, duration: 120, yoyo: true, repeat: 3 }); });
    this.time.delayedCall(1500, () => {
      can.destroy();
      for (let i = 0; i < 6; i++) {
        const p = this.add.image(this.aoi.x + (Math.random() - 0.5) * 14, this.aoi.y - 14 - Math.random() * 8, 'sparkle').setDepth(9600).setScale(0.6);
        this.tweens.add({ targets: p, y: p.y - 10, alpha: 0, duration: 700, delay: i * 60, onComplete: () => p.destroy() });
      }
      this.boostUntil = game.data.totalDays * 1440 + game.data.minutes + 60;
      this.locked = false;
      events.emit('toast', 'Аой: «Ах, холодный улун!» Бодрость: шаг быстрее на час.');
      events.emit('stats');
    });
  }

  startBoss() {
    this.locked = true;
    this.cameras.main.fadeOut(600, 30, 20, 40);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.sleep(); this.scene.launch('Boss'); });
  }

  /** Сезонная палитра и выцветание мира от болезни (визуальная механика «Хайкаби»). */
  applySeasonLook() {
    // летняя/осенняя трава и листва — отдельные текстуры
    const se = game.data.season;
    for (const { img, key } of this.seasonal) img.setTexture(se >= 2 ? `${key}_s${se}` : key);
    if (!this.fx) return;
    const beds = game.data.beds, sick = beds.filter((b) => b.crop && !b.dead && !isHealthy(game.cls(b))).length + beds.filter((b) => b.dead).length;
    const ratio = sick / beds.length, season = game.data.season;
    this.fx.reset();
    if (season === 2) this.fx.brightness(1.03, true);
    this.fx.saturate(-Math.min(0.5, ratio * (season === 3 ? 0.9 : 0.6)), true);   // выцветание от болезни — заметно, но без серого мира
  }

  /** Мир стоит: интерьер/процедурная (locked) или модальное окно Hud. */
  frozen() { return this.locked || uiBlocks(); }

  lockHandler(v: boolean) { this.locked = v; if (v) this.aoi.setVelocity(0); }

  solid(x: number, y: number, w: number, h: number) {
    const r = this.add.rectangle(x, y, w, h).setOrigin(0).setVisible(false);
    this.solids.add(r);
  }

  buildMap() {
    // фон (песок, травяные уступы, поле, пруд) — одна картинка; объекты — отдельно, сортировка по нижнему краю
    this.seasonal.push({ img: this.add.image(0, 0, 'ground').setOrigin(0).setDepth(-10), key: 'ground' });
    for (const o of LAYOUT.objs) {
      if (!o.hidden) {
        const img = this.add.image(o.x, o.y, 'w-' + o.key).setOrigin(0).setDepth(o.depth);
        if (SEASONAL.includes(o.key)) this.seasonal.push({ img, key: 'w-' + o.key });
      }
      if (o.solid) this.solid(o.solid[0], o.solid[1], o.solid[2], o.solid[3]);
    }
    for (const b of LAYOUT.blocks) this.solid(b[0], b[1], b[2], b[3]);   // травяные уступы с обрывом
    const [px, py, pw, ph] = LAYOUT.pond;
    this.solid(px, py, pw, ph);
    // торговый автомат и остановка
    const [vx, vy] = LAYOUT.vending;
    this.add.image(vx - 1, vy - 1, 'vending-px').setOrigin(0).setDepth(vy + 29);
    this.solid(vx + 1, vy + 18, 15, 10);
    const [bx, by] = LAYOUT.busstop;
    this.add.image(bx, by + 2, 'busstop-px').setOrigin(0).setDepth(by + 36);   // знак на столбе и скамейка
    this.solid(bx + 4, by + 31, 6, 5); this.solid(bx + 16, by + 26, 30, 9);
    // грядки
    for (const b of game.data.beds) {
      const { x, y } = bedXY(b);
      const soil = this.add.image(x, y, 'bed-wet').setOrigin(0).setDepth(-5).setAlpha(0.9);
      const plant = this.add.sprite(x + 8, y + 16, 'crops', 1).setOrigin(0.5, 1).setDepth(y + 16);
      this.solid(x + 4, y + 11, 8, 5);   // куст — препятствие, грядку осматривают стоя рядом
      const spores = this.add.particles(x + 8, y + 2, 'pixel', {
        speed: { min: 3, max: 9 }, angle: { min: 240, max: 300 }, lifespan: 1700, frequency: 110, quantity: 1,
        scale: 2, alpha: { start: 1, end: 0 }, tint: [0x8a5cc0, 0xb070e0, 0xff4f9a],   // целый размер пикселя
      }).setDepth(y + 20);
      this.beds.set(b.id, { plant, soil, spores });
    }
  }

  refreshBeds() {
    this.applySeasonLook();
    for (const b of game.data.beds) {
      const v = this.beds.get(b.id); if (!v) continue;
      v.soil.setVisible(b.watered);
      const sick = b.crop && !b.dead && !isHealthy(game.cls(b));
      v.spores.emitting = !!sick;
      // кадры crops: 0 лунка, 1 росток, 2 молодое, 3 растёт, 4 созрело, 5 больное, 6 тяжело больное, 7 погибшее
      const row = CROP_ROW[b.crop || 'tomato'] * 8;
      if (!b.crop) { v.plant.setFrame(0).setVisible(true); continue; }
      v.plant.setVisible(true);
      if (b.dead) v.plant.setFrame(row + 7);
      else if (sick) v.plant.setFrame(row + (b.health > 50 ? 5 : 6));
      else v.plant.setFrame(row + (b.stage === 0 ? 1 : b.stage === 1 ? 3 : 4));
    }
  }

  findInteract(): Interact | null {
    const fx = this.aoi.x + (this.facing === 'side' ? (this.facingSide === 'left' ? -10 : 10) : 0);
    const fy = this.aoi.y - 3 + (this.facing === 'down' ? 10 : this.facing === 'up' ? -12 : 0);
    let best: Bed | null = null, bd = 14;
    for (const b of game.data.beds) {
      const p = bedXY(b);
      const d = Math.hypot(p.x + 8 - fx, p.y + 8 - fy);
      if (d < bd) { bd = d; best = b; }
    }
    if (best) return { kind: 'bed', bed: best };
    const near = (x: number, y: number, rad = 18) => Math.hypot(x - this.aoi.x, y - this.aoi.y) < rad;
    if (this.life.nearMochi(this.aoi.x, this.aoi.y)) return { kind: 'mochi' };
    if (this.life.fisher.visible && near(this.life.fisher.x, this.life.fisher.y, 40)) return { kind: 'fisher' };
    if (near(LAYOUT.doorHouse[0], LAYOUT.doorHouse[1] + 6, 20)) return { kind: 'house' };
    if (near(LAYOUT.doorShop[0], LAYOUT.doorShop[1] + 6, 20)) return { kind: 'shop' };
    if (near(LAYOUT.vending[0] + 8, LAYOUT.vending[1] + 34, 14)) return { kind: 'vending' };
    if (near(LAYOUT.busstop[0] + 20, LAYOUT.busstop[1] + 42, 22)) return { kind: 'busstop' };
    const v = this.life.nearVillager(this.aoi.x, this.aoi.y);
    if (v) return { kind: 'villager', who: v };
    return null;
  }

  interact() {
    if (this.frozen() || !this.current) return;
    const it = this.current;
    if (it.kind === 'bed') {
      if (!it.bed.crop && !it.bed.dead) { events.emit('toast', 'Пустая грядка. Семена можно купить у Огавы.'); return; }
      if (it.bed.dead && !it.bed.crop) { events.emit('toast', 'Грядка пуста — растение удалено, соседи в безопасности. Новые семена — в лавке Огавы.'); return; }
      if (it.bed.dead) { events.emit('toast', 'Растение погибло. Новые семена — в лавке Огавы.'); return; }
      this.locked = true;
      this.aoi.setVelocity(0);
      this.scene.sleep();
      this.scene.launch('Procedure', { bedId: it.bed.id });
    } else if (it.kind === 'mochi') events.emit('toast', this.life.petMochi());
    else if (it.kind === 'fisher') events.emit('fisher');
    else if (it.kind === 'villager') events.emit('toast', this.life.talkVillager(it.who));
    else events.emit('place', it.kind);
  }

  update(_t: number, dt: number) {
    // Фуку парит рядом с Аой
    const tx = this.aoi.x + (this.facingSide === 'left' ? 12 : -12), ty = this.aoi.y - 24 + Math.sin(this.time.now / 300) * 2;
    this.fuku.x += (tx - this.fuku.x) * Math.min(1, dt / 220);
    this.fuku.y += (ty - this.fuku.y) * Math.min(1, dt / 220);
    this.fukuShadow.setPosition(Math.round(this.fuku.x), Math.round(this.aoi.y - 1)).setDepth(this.aoi.y - 2);

    if (this.frozen()) { this.aoi.setVelocity(0); this.aoi.anims.stop(); return; }
    this.life.update(dt, !!(this.keys.A.isDown || this.keys.D.isDown || this.keys.W.isDown || this.keys.S.isDown || this.keys.LEFT.isDown || this.keys.RIGHT.isDown || this.keys.UP.isDown || this.keys.DOWN.isDown));
    const k = this.keys;
    const vx = (k.A.isDown || k.LEFT.isDown ? -1 : 0) + (k.D.isDown || k.RIGHT.isDown ? 1 : 0);
    const vy = (k.W.isDown || k.UP.isDown ? -1 : 0) + (k.S.isDown || k.DOWN.isDown ? 1 : 0);
    const boosted = game.data.totalDays * 1440 + game.data.minutes < this.boostUntil;
    const sp = boosted ? 90 : 72, n = vx && vy ? Math.SQRT1_2 : 1;
    let mvx = vx * sp * n, mvy = vy * sp * n;
    // люди — препятствия: шаг навстречу соседу ближе 10 px гасится
    for (const b of this.life.blockers()) {
      const dx = b.x - this.aoi.x, dy = (b.y - this.aoi.y) * 1.6;
      if (Math.hypot(dx, dy) < 11) { if (dx * mvx > 0) mvx = 0; if (dy * mvy > 0) mvy = 0; }
    }
    this.aoi.setVelocity(mvx, mvy);
    if (vx || vy) {
      if (this.time.now - this.lastStep > 300) { this.lastStep = this.time.now; sound.play('step'); this.life.footstep(); }
      // направление взгляда — по последней нажатой оси (по диагонали — горизонталь)
      if (vx) { this.facing = 'side'; this.facingSide = vx < 0 ? 'left' : 'right'; this.aoi.anims.play('aoi-na-' + this.facingSide, true); }
      else if (vy < 0) { this.facing = 'up'; this.aoi.anims.play('aoi-na-up', true); }
      else { this.facing = 'down'; this.aoi.anims.play('aoi-na-down', true); }
    } else {
      this.aoi.anims.stop();
      this.aoi.setFrame(this.facing === 'down' ? 0 : this.facing === 'up' ? 1 : this.facingSide === 'left' ? 2 : 3);
    }
    this.aoi.setDepth(this.aoi.y);

    // подсветка объекта взаимодействия
    this.current = this.findInteract();
    this.marker.clear();
    if (this.current?.kind === 'bed') {
      const p = bedXY(this.current.bed);
      this.marker.lineStyle(1, 0x3fd0c9, 0.9).strokeRect(p.x + 0.5, p.y + 0.5, T - 1, T - 1);
    }
    events.emit('hint', this.current);
  }
}
