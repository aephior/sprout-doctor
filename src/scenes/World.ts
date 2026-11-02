// Мир фермы (вид сверху, клавиатура). Камера выключена — жесты только в «Процедурной».
import { sound } from '../audio/sound';
import { game, Bed } from '../state/game';
import { isHealthy } from '../data/diseases';
import { events } from '../state/events';
import { FarmLife } from '../world/life';
import { LAYOUT } from '../world/layout';

const T = 16, MW = LAYOUT.MW, MH = LAYOUT.MH;
const CROP_ROW: Record<string, number> = { tomato: 0, potato: 1, pepper: 2 };
/** Позиция грядки в мире (левый верх клетки). */
export const bedXY = (b: Bed) => ({ x: (b.tx + LAYOUT.bedOffset[0]) * T, y: (b.ty + LAYOUT.bedOffset[1]) * T });

type Interact = { kind: 'bed'; bed: Bed } | { kind: 'mochi' } | { kind: 'fisher' } | { kind: 'house' } | { kind: 'shop' } | { kind: 'busstop' } | { kind: 'vending' };

export class World extends Phaser.Scene {
  aoi!: Phaser.Physics.Arcade.Sprite;
  fuku!: Phaser.GameObjects.Sprite;
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

  constructor() { super('World'); }

  create() {
    sound.setMood('day');
    this.cameras.main.fadeIn(400);
    this.solids = this.physics.add.staticGroup();
    this.buildMap();

    // Аой — LPC-спрайт 64×64, в мире масштаб 0.5 (1 ед. мира = 2 px арта)
    this.aoi = this.physics.add.sprite(LAYOUT.doorHouse[0], LAYOUT.doorHouse[1] + 22, 'aoi-lpc', 2 * 9).setOrigin(0.5, 62 / 64).setScale(0.5);
    (this.aoi.body as Phaser.Physics.Arcade.Body).setSize(20, 10).setOffset(22, 52);
    this.aoi.setCollideWorldBounds(true);
    this.physics.world.setBounds(0, 0, MW * T, MH * T);
    this.physics.add.collider(this.aoi, this.solids);
    this.fuku = this.add.sprite(this.aoi.x + 14, this.aoi.y - 30, 'fuku-s', 0).setScale(0.5).play('fukus-idle').setDepth(8500);
    this.life = new FarmLife(this, this.aoi);

    this.marker = this.add.graphics().setDepth(9600);

    const cam = this.cameras.main;
    cam.setZoom(4).setBounds(0, 0, MW * T, MH * T).startFollow(this.aoi, true, 0.12, 0.12).setRoundPixels(true);
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
    this.events.on('wake', () => { this.refreshBeds(); this.life.apply(); this.locked = false; });
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
    // фон (земля, трава, тропы, огород, пруд) — одна картинка; объекты — отдельно, с сортировкой по глубине
    this.add.image(0, 0, 'ground').setOrigin(0).setScale(0.5).setDepth(-10);
    for (const o of LAYOUT.objs) {
      this.add.image(o.x, o.y, 'w-' + o.key).setOrigin(0).setScale(0.5).setDepth(o.depth);
      if (o.solid) this.solid(o.solid[0], o.solid[1], o.solid[2], o.solid[3]);
    }
    const [px, py, pw, ph] = LAYOUT.pond;
    this.solid(px + 6, py + 6, pw - 12, ph - 12);
    // торговый автомат и остановка (свои спрайты)
    const [vx, vy] = LAYOUT.vending;
    this.add.image(vx, vy, 'vending-hd').setOrigin(0).setScale(0.5).setDepth(vy + 28);
    this.solid(vx, vy + 16, 16, 12);
    const [bx, by] = LAYOUT.busstop;
    this.add.image(bx, by, 'busstop-hd').setOrigin(0).setScale(0.5).setDepth(by + 32);
    this.solid(bx + 3, by + 26, 24, 6);
    // грядки
    for (const b of game.data.beds) {
      const { x, y } = bedXY(b);
      const soil = this.add.image(x, y, 'bed-soil-wet').setOrigin(0).setScale(0.5).setDepth(-5).setAlpha(0.85);
      const plant = this.add.sprite(x + 8, y + 15, 'crops', 1).setOrigin(0.5, 1).setScale(0.5).setDepth(y + 15);
      const spores = this.add.particles(x + 8, y + 2, 'pixel', {
        speed: { min: 3, max: 10 }, angle: { min: 230, max: 310 }, lifespan: 1800, frequency: 140, quantity: 1,
        scale: { start: 1.6, end: 0.4 }, alpha: { start: 0.9, end: 0 }, tint: [0x6b4e8c, 0x9a9a9a, 0xff4f9a],
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
    const fy = this.aoi.y - 4 + (this.facing === 'down' ? 10 : this.facing === 'up' ? -12 : 0);
    let best: Bed | null = null, bd = 14;
    for (const b of game.data.beds) {
      const p = bedXY(b);
      const d = Math.hypot(p.x + 8 - fx, p.y + 8 - fy);
      if (d < bd) { bd = d; best = b; }
    }
    if (best) return { kind: 'bed', bed: best };
    const near = (x: number, y: number, rad = 18) => Math.hypot(x - this.aoi.x, y - this.aoi.y) < rad;
    if (this.life.nearMochi(this.aoi.x, this.aoi.y)) return { kind: 'mochi' };
    if (this.life.fisher.visible && near(this.life.fisher.x, this.life.fisher.y, 30)) return { kind: 'fisher' };
    if (near(LAYOUT.doorHouse[0], LAYOUT.doorHouse[1] + 6, 20)) return { kind: 'house' };
    if (near(LAYOUT.doorShop[0], LAYOUT.doorShop[1] + 6, 20)) return { kind: 'shop' };
    if (near(LAYOUT.vending[0] + 8, LAYOUT.vending[1] + 34, 16)) return { kind: 'vending' };
    if (near(LAYOUT.busstop[0] + 16, LAYOUT.busstop[1] + 34, 24)) return { kind: 'busstop' };
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
    } else if (it.kind === 'mochi') events.emit('toast', this.life.petMochi());
    else if (it.kind === 'fisher') events.emit('fisher');
    else events.emit('place', it.kind);
  }

  update(_t: number, dt: number) {
    // Фуку парит рядом с Аой
    const tx = this.aoi.x + (this.facingSide === 'left' ? 14 : -14), ty = this.aoi.y - 34 + Math.sin(this.time.now / 300) * 2;
    this.fuku.x += (tx - this.fuku.x) * Math.min(1, dt / 220);
    this.fuku.y += (ty - this.fuku.y) * Math.min(1, dt / 220);

    if (this.locked) { this.aoi.setVelocity(0); this.aoi.anims.stop(); return; }
    this.life.update(dt, !!(this.keys.A.isDown || this.keys.D.isDown || this.keys.W.isDown || this.keys.S.isDown || this.keys.LEFT.isDown || this.keys.RIGHT.isDown || this.keys.UP.isDown || this.keys.DOWN.isDown));
    const k = this.keys;
    const vx = (k.A.isDown || k.LEFT.isDown ? -1 : 0) + (k.D.isDown || k.RIGHT.isDown ? 1 : 0);
    const vy = (k.W.isDown || k.UP.isDown ? -1 : 0) + (k.S.isDown || k.DOWN.isDown ? 1 : 0);
    const sp = 72, n = vx && vy ? Math.SQRT1_2 : 1;
    this.aoi.setVelocity(vx * sp * n, vy * sp * n);
    if (vx || vy) {
      if (this.time.now - this.lastStep > 300) { this.lastStep = this.time.now; sound.play('step'); this.life.footstep(); }
      if (vx) { this.facing = 'side'; this.facingSide = vx < 0 ? 'left' : 'right'; this.aoi.anims.play('aoil-' + this.facingSide, true); }
      else if (vy < 0) { this.facing = 'up'; this.aoi.anims.play('aoil-up', true); }
      else { this.facing = 'down'; this.aoi.anims.play('aoil-down', true); }
    } else {
      this.aoi.anims.stop();
      this.aoi.setFrame((this.facing === 'down' ? 2 : this.facing === 'up' ? 0 : this.facingSide === 'left' ? 1 : 3) * 9);
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
