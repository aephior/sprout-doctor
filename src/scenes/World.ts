// Мир фермы (вид сверху, клавиатура). Камера выключена — жесты только в «Процедурной».
import { sound } from '../audio/sound';
import { game, Bed } from '../state/game';
import { isHealthy } from '../data/diseases';
import { rng } from '../art/pixel';
import { events } from '../state/events';

const T = 16, MW = 30, MH = 20;

type Interact = { kind: 'bed'; bed: Bed } | { kind: 'house' } | { kind: 'shop' } | { kind: 'busstop' } | { kind: 'vending' };

export class World extends Phaser.Scene {
  aoi!: Phaser.Physics.Arcade.Sprite;
  fuku!: Phaser.GameObjects.Sprite;
  keys!: Record<string, Phaser.Input.Keyboard.Key>;
  beds = new Map<number, { plant: Phaser.GameObjects.Sprite; soil: Phaser.GameObjects.Image; spores: Phaser.GameObjects.Particles.ParticleEmitter }>();
  solids!: Phaser.Physics.Arcade.StaticGroup;
  facing: 'down' | 'up' | 'side' = 'down';
  marker!: Phaser.GameObjects.Graphics;
  current: Interact | null = null;
  locked = false;
  lastStep = 0;
  fx?: Phaser.FX.ColorMatrix;

  constructor() { super('World'); }

  create() {
    sound.setMood('day');
    this.cameras.main.fadeIn(400);
    this.solids = this.physics.add.staticGroup();
    this.buildMap();

    this.aoi = this.physics.add.sprite(12 * T + 8, 16 * T + 4, 'aoi', 0).setOrigin(0.5, 1);
    (this.aoi.body as Phaser.Physics.Arcade.Body).setSize(10, 6).setOffset(3, 17);
    this.aoi.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, MW * T, MH * T);
    this.physics.add.collider(this.aoi, this.solids);
    this.fuku = this.add.sprite(this.aoi.x + 14, this.aoi.y - 30, 'fuku', 0).play('fuku-idle').setDepth(10000);

    this.marker = this.add.graphics().setDepth(9999);

    const cam = this.cameras.main;
    cam.setZoom(3).setBounds(0, 0, MW * T, MH * T).startFollow(this.aoi, true, 0.12, 0.12).setRoundPixels(true);
    cam.setBackgroundColor('#2f5f2a');
    // эффект выцветания доступен только с видеоускорением (WebGL); без него игра работает без эффекта
    if (this.game.renderer.type === Phaser.WEBGL) {
      try { this.fx = cam.postFX.addColorMatrix(); } catch { this.fx = undefined; }
    }

    const kb = this.input.keyboard!;
    this.keys = kb.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,E') as Record<string, Phaser.Input.Keyboard.Key>;
    kb.on('keydown-E', () => this.interact());
    kb.on('keydown-ESC', () => { if (!this.locked) events.emit('pause'); });
    kb.on('keydown-TAB', (e: KeyboardEvent) => { e.preventDefault(); if (!this.locked) events.emit('diary'); });

    events.on('lock', this.lockHandler, this);
    events.on('refresh-beds', this.refreshBeds, this);
    events.on('season', this.refreshBeds, this);
    events.on('boss', this.startBoss, this);
    this.events.once('shutdown', () => {
      events.off('lock', this.lockHandler, this); events.off('refresh-beds', this.refreshBeds, this);
      events.off('season', this.refreshBeds, this); events.off('boss', this.startBoss, this);
    });
    this.events.on('wake', () => { this.refreshBeds(); this.locked = false; });
    this.refreshBeds();
  }

  startBoss() {
    this.locked = true;
    this.cameras.main.fadeOut(600, 30, 20, 40);
    this.cameras.main.once('camerafadeoutcomplete', () => { this.scene.sleep(); this.scene.launch('Boss'); });
  }

  /** Сезонная палитра и выцветание мира от болезни (визуальная механика «Хайкаби»). */
  applySeasonLook() {
    if (!this.fx) return;
    const beds = game.data.beds, sick = beds.filter((b) => b.crop && !b.dead && !isHealthy(game.cls(b))).length + beds.filter((b) => b.dead).length;
    const ratio = sick / beds.length, season = game.data.season;
    this.fx.reset();
    if (season === 2) this.fx.saturate(0.15, true).brightness(1.04, true);
    if (season === 3) this.fx.hue(-12, true).brightness(0.95, true);
    this.fx.saturate(-Math.min(0.85, ratio * (season === 3 ? 1.3 : 0.7)), true);
  }

  lockHandler(v: boolean) { this.locked = v; if (v) this.aoi.setVelocity(0); }

  solid(x: number, y: number, w: number, h: number) {
    const r = this.add.rectangle(x, y, w, h).setOrigin(0).setVisible(false);
    this.solids.add(r);
  }

  buildMap() {
    const r = rng(42);
    const isPath = (x: number, y: number) => (y === 16 && x >= 3) || (x === 12 && y >= 6 && y <= 16) || (x === 23 && y >= 6 && y <= 16) || (y === 6 && x >= 4 && x <= 25);
    const isWater = (x: number, y: number) => Math.hypot((x - 4.5) / 3.2, (y - 12.5) / 2.4) < 1;
    for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
      const key = isWater(x, y) ? 'water' : isPath(x, y) ? 'path' : (r() < 0.3 ? 'grass2' : 'grass');
      this.add.image(x * T, y * T, key).setOrigin(0).setDepth(-10);
      if (key === 'water') this.solid(x * T, y * T, T, T);
    }
    // ограда огорода (проход снизу по тропе x=12)
    for (let x = 7; x <= 17; x++) for (const y of [7, 15]) {
      if (y === 15 && (x === 12)) continue;
      if (y === 7 && x === 12) continue;
      this.add.image(x * T, y * T, 'fence').setOrigin(0).setDepth(y * T + 12);
      this.solid(x * T, y * T + 6, T, 6);
    }
    for (let y = 8; y <= 14; y++) for (const x of [7, 17]) {
      this.add.image(x * T, y * T, 'fence').setOrigin(0).setDepth(y * T + 12);
      this.solid(x * T + 4, y * T, 8, T);
    }
    // дом бабушки Хару
    this.add.image(2 * T, 0, 'house').setOrigin(0).setDepth(56);
    this.solid(2 * T + 4, 24, 56, 30);
    // лавка Огавы, автомат, остановка
    this.add.image(20 * T, 0, 'shop').setOrigin(0).setDepth(44);
    this.solid(20 * T + 2, 12, 44, 30);
    this.add.image(26 * T, 1 * T, 'vending').setOrigin(0).setDepth(1 * T + 28);
    this.solid(26 * T, 1 * T + 16, 16, 12);
    this.add.image(24 * T, 14 * T, 'busstop').setOrigin(0).setDepth(14 * T + 30);
    // деревья по краям
    const trees = [[0, 3], [8, 1], [15, 0], [17, 3], [27, 6], [28, 11], [26, 17], [18, 17], [0, 16], [8, 17], [14, 17]];
    for (const [tx, ty] of trees) {
      this.add.image(tx * T, ty * T, 'tree').setOrigin(0).setDepth(ty * T + 38);
      this.solid(tx * T + 12, ty * T + 30, 8, 8);
    }
    // грядки
    for (const b of game.data.beds) {
      const soil = this.add.image(b.tx * T, b.ty * T, 'soil').setOrigin(0).setDepth(-5);
      const plant = this.add.sprite(b.tx * T + 8, b.ty * T + 14, 'plant', 1).setOrigin(0.5, 1).setDepth(b.ty * T + 14);
      const spores = this.add.particles(b.tx * T + 8, b.ty * T + 4, 'pixel', {
        speed: { min: 3, max: 10 }, angle: { min: 230, max: 310 }, lifespan: 1800, frequency: 140, quantity: 1,
        scale: { start: 2.2, end: 0.6 }, alpha: { start: 0.9, end: 0 }, tint: [0x6b4e8c, 0x9a9a9a, 0xff4f9a],
      }).setDepth(b.ty * T + 20);
      this.beds.set(b.id, { plant, soil, spores });
    }
  }

  refreshBeds() {
    this.applySeasonLook();
    for (const b of game.data.beds) {
      const v = this.beds.get(b.id); if (!v) continue;
      v.soil.setTexture(b.watered ? 'soil-wet' : 'soil');
      const sick = b.crop && !b.dead && !isHealthy(game.cls(b));
      v.spores.emitting = !!sick;
      if (b.dead || !b.crop) { v.plant.setFrame(4).setVisible(!!b.dead && !!b.crop); continue; }
      v.plant.setVisible(true);
      if (sick) v.plant.setFrame(b.health > 50 ? 2 : 3);
      else v.plant.setFrame(b.stage === 0 ? 0 : 1);
      v.plant.setScale(b.stage === 2 ? 1.1 : 1);
    }
  }

  findInteract(): Interact | null {
    const fx = this.aoi.x + (this.facing === 'side' ? (this.aoi.flipX ? -10 : 10) : 0);
    const fy = this.aoi.y - 4 + (this.facing === 'down' ? 10 : this.facing === 'up' ? -12 : 0);
    let best: Bed | null = null, bd = 14;
    for (const b of game.data.beds) {
      const d = Math.hypot(b.tx * T + 8 - fx, b.ty * T + 8 - fy);
      if (d < bd) { bd = d; best = b; }
    }
    if (best) return { kind: 'bed', bed: best };
    const near = (x: number, y: number, rad = 18) => Math.hypot(x - this.aoi.x, y - this.aoi.y) < rad;
    if (near(2 * T + 32, 58)) return { kind: 'house' };
    if (near(20 * T + 24, 46)) return { kind: 'shop' };
    if (near(26 * T + 8, 1 * T + 32)) return { kind: 'vending' };
    if (near(24 * T + 16, 14 * T + 30, 22)) return { kind: 'busstop' };
    return null;
  }

  interact() {
    if (this.locked || !this.current) return;
    const it = this.current;
    if (it.kind === 'bed') {
      if (!it.bed.crop && !it.bed.dead) { events.emit('toast', 'Пустая грядка. Семена можно купить у Огавы.'); return; }
      if (it.bed.dead) { events.emit('toast', 'Растение погибло. Грядку нужно расчистить (скоро).'); return; }
      this.locked = true;
      this.aoi.setVelocity(0);
      this.scene.sleep();
      this.scene.launch('Procedure', { bedId: it.bed.id });
    } else events.emit('place', it.kind);
  }

  update(_t: number, dt: number) {
    // Фуку парит рядом с Аой
    const tx = this.aoi.x + (this.aoi.flipX ? 14 : -14), ty = this.aoi.y - 30 + Math.sin(this.time.now / 300) * 2;
    this.fuku.x += (tx - this.fuku.x) * Math.min(1, dt / 220);
    this.fuku.y += (ty - this.fuku.y) * Math.min(1, dt / 220);

    if (this.locked) { this.aoi.setVelocity(0); this.aoi.anims.stop(); return; }
    const k = this.keys;
    const vx = (k.A.isDown || k.LEFT.isDown ? -1 : 0) + (k.D.isDown || k.RIGHT.isDown ? 1 : 0);
    const vy = (k.W.isDown || k.UP.isDown ? -1 : 0) + (k.S.isDown || k.DOWN.isDown ? 1 : 0);
    const sp = 72, n = vx && vy ? Math.SQRT1_2 : 1;
    this.aoi.setVelocity(vx * sp * n, vy * sp * n);
    if (vx || vy) {
      if (this.time.now - this.lastStep > 300) { this.lastStep = this.time.now; sound.play('step'); }
      if (vx) { this.facing = 'side'; this.aoi.setFlipX(vx < 0); this.aoi.anims.play('aoi-side', true); }
      else if (vy < 0) { this.facing = 'up'; this.aoi.setFlipX(false); this.aoi.anims.play('aoi-up', true); }
      else { this.facing = 'down'; this.aoi.setFlipX(false); this.aoi.anims.play('aoi-down', true); }
    } else {
      this.aoi.anims.stop();
      this.aoi.setFrame(this.facing === 'down' ? 0 : this.facing === 'up' ? 3 : 6);
    }
    this.aoi.setDepth(this.aoi.y);

    // подсветка объекта взаимодействия
    this.current = this.findInteract();
    this.marker.clear();
    if (this.current?.kind === 'bed') {
      const b = this.current.bed;
      this.marker.lineStyle(1, 0x3fd0c9, 0.9).strokeRect(b.tx * T + 0.5, b.ty * T + 0.5, T - 1, T - 1);
    }
    events.emit('hint', this.current);
  }
}
