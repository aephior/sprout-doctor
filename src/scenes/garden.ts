// «Окно» с грядкой для Процедурной: проработанная грядка, растение по культуре/стадии/болезни, Фуку
// и анимации всех действий прямо на растении (скан, полив, спрей, обрезка, удаление, исцеление, урожай).
import type { Bed } from '../state/game';
import { game } from '../state/game';
import { isHealthy, Action } from '../data/diseases';
import { registerTools, PlantState } from '../art/plants';

const CROP_ROW: Record<string, number> = { tomato: 0, potato: 1, pepper: 2 };
const PS = 4;   // растение 48×60 (crops_hd) ×4 — та же сетка пикселей, что у фона грядки ×4
import { C } from '../ui/ui';

export const GW = 352, GH = 396, GS = 4;   // окно 88×99 в родном разрешении, масштаб ×4

export class GardenView {
  bg: Phaser.GameObjects.Image;
  plant: Phaser.GameObjects.Image;
  fuku: Phaser.GameObjects.Sprite;
  fx: Phaser.GameObjects.Container;
  frame: Phaser.GameObjects.Graphics;
  private sway?: Phaser.Tweens.Tween;
  readonly baseX: number; readonly baseY: number;

  constructor(private scene: Phaser.Scene, public x: number, public y: number, private bed: Bed) {
    registerTools(scene);
    this.baseX = x + 44 * GS; this.baseY = y + 77 * GS;
    this.bg = scene.add.image(x, y, '__DEFAULT').setOrigin(0).setScale(GS);
    this.plant = scene.add.image(this.baseX, this.baseY + 10, 'crops-hd', 0).setOrigin(0.5, 1).setScale(PS);
    this.fx = scene.add.container(0, 0).setDepth(20);
    // маску не используем: она дорогая в отрисовке; эффекты рассчитаны так, чтобы оставаться в окне
    this.fuku = scene.add.sprite(x + GW - 46, y + 74, 'fuku-na', 0).setScale(GS).play('fukuna-idle').setDepth(21);   // тот же Фуку, что на ферме, сетка ×4
    scene.tweens.add({ targets: this.fuku, y: this.fuku.y + 8, duration: 1100, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    this.frame = scene.add.graphics().setDepth(22);
    this.frame.lineStyle(4, C.ink, 1).strokeRect(x - 2, y - 2, GW + 4, GH + 4).lineStyle(2, C.wood, 1).strokeRect(x - 5, y - 5, GW + 10, GH + 10);
    this.refresh();
  }

  state(): PlantState {
    const b = this.bed;
    if (b.dead) return 'dead';
    if (!b.crop) return 'dead';
    if (!isHealthy(game.cls(b))) return b.health > 50 ? 'sick' : 'severe';
    return b.stage === 0 ? 'sprout' : b.stage === 2 ? 'mature' : 'young';
  }

  refresh() {
    const b = this.bed, st = this.state();
    this.bg.setTexture(b.watered ? 'closeup-wet' : 'closeup-dry');
    if (game.data.season === 3) this.bg.setTint(0xf0d8b0); else if (game.data.season === 2) this.bg.setTint(0xfff6d8); else this.bg.clearTint();
    if (b.crop) {   // удалённое растение (crop = null) — пустая грядка
      const row = CROP_ROW[b.crop] * 8;
      const f = st === 'dead' ? 7 : st === 'severe' ? 6 : st === 'sick' ? 5 : st === 'sprout' ? 1 : st === 'mature' ? 4 : 3;
      this.plant.setVisible(true).setTexture('crops-hd', row + f);
      if (!this.sway) this.sway = this.scene.tweens.add({ targets: this.plant, scaleY: { from: PS, to: PS * 1.025 }, duration: 1600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    } else this.plant.setVisible(false);
  }

  private bbCache = new Map<number, { l: number; t: number; r: number; b: number }>();
  /** Непрозрачные границы текущего кадра растения (в пикселях кадра 48×60), без земляного холмика. */
  bounds() {
    const f = Number(this.plant.frame.name);
    let bb = this.bbCache.get(f);
    if (!bb) {
      bb = { l: 48, t: 60, r: 0, b: 0 };
      const tex = this.scene.textures;
      for (let y = 0; y < 52; y++) for (let x = 0; x < 48; x++) {
        const p = tex.getPixel(x, y, 'crops-hd', f);
        if (p && p.alpha > 0) { bb.l = Math.min(bb.l, x); bb.r = Math.max(bb.r, x); bb.t = Math.min(bb.t, y); bb.b = Math.max(bb.b, y); }
      }
      if (bb.r < bb.l) bb = { l: 16, t: 40, r: 32, b: 52 };
      this.bbCache.set(f, bb);
    }
    // экранные координаты: origin (0.5, 1) в точке (baseX, baseY + 10), масштаб PS
    const x0 = this.baseX - 24 * PS, y0 = this.baseY + 10 - 60 * PS;
    return { l: x0 + bb.l * PS, r: x0 + (bb.r + 1) * PS, t: y0 + bb.t * PS, b: y0 + (bb.b + 1) * PS };
  }
  /** Случайная точка на листве текущего растения (экранные координаты). */
  leafPoint() {
    const b = this.bounds();
    return { x: b.l + 8 + Math.random() * Math.max(4, b.r - b.l - 16), y: b.t + 6 + Math.random() * Math.max(4, (b.b - b.t) * 0.7) };
  }

  private particles(px: number, py: number, cfg: Phaser.Types.GameObjects.Particles.ParticleEmitterConfig, ms: number) {
    const e = this.scene.add.particles(px, py, cfg.texture as string ?? 'pixel', cfg);
    this.fx.add(e);
    if (cfg.frequency === -1) e.explode(Number(cfg.quantity ?? 10));   // «взрывные» эмиттеры сами не стреляют
    this.scene.time.delayedCall(ms, () => e.stop());
    this.scene.time.delayedCall(ms + 2500, () => e.destroy());
    return e;
  }

  // ---------- анимации ----------
  /** Фуку подлетает к листу, бирюзовый луч сканирует растение сверху вниз. */
  scan(): Promise<void> {
    const sc = this.scene, home = { x: this.fuku.x, y: this.fuku.y };
    return new Promise((done) => {
      sc.tweens.add({ targets: this.fuku, x: this.baseX + 50, y: this.baseY - 250, duration: 250, ease: 'Quad.out', onComplete: () => {
        this.fuku.setFrame(2).anims.stop();
        const beam = sc.add.graphics().setBlendMode(Phaser.BlendModes.ADD); this.fx.add(beam);
        const line = sc.add.rectangle(this.baseX, this.baseY - 235, 200, 4, C.teal, 0.9).setBlendMode(Phaser.BlendModes.ADD); this.fx.add(line);
        const draw = (ly: number) => beam.clear().fillStyle(C.teal, 0.16).fillTriangle(this.fuku.x, this.fuku.y + 12, this.baseX - 100, ly, this.baseX + 100, ly);
        sc.tweens.addCounter({ from: this.baseY - 235, to: this.baseY, duration: 900, onUpdate: (t) => { const v = t.getValue() ?? 0; line.y = v; draw(v); },
          onComplete: () => { beam.destroy(); line.destroy(); this.fuku.play('fukuna-idle'); sc.tweens.add({ targets: this.fuku, x: home.x, y: home.y, duration: 300, ease: 'Quad.inOut' }); done(); } });
      } });
    });
  }

  /** Анимация действия ухода. Возвращает длительность в мс. */
  act(a: Action): number {
    const sc = this.scene, bx = this.baseX, by = this.baseY, pb = this.bounds(), mid = (pb.t + pb.b) / 2;
    if (a === 'water') {
      const can = sc.add.image(pb.l - 50, pb.t - 40, 'tool-can').setScale(GS).setAngle(0); this.fx.add(can);
      sc.tweens.add({ targets: can, angle: 32, x: pb.l - 26, duration: 300, ease: 'Quad.out' });
      sc.time.delayedCall(250, () => this.particles(pb.l - 4, pb.t - 34, { texture: 'drop', speedY: { min: 220, max: 300 }, speedX: { min: -40, max: 40 }, gravityY: 400, lifespan: 700, frequency: 18, quantity: 2, scale: GS / 1.5 }, 900));
      sc.time.delayedCall(1100, () => { sc.tweens.add({ targets: can, angle: 0, alpha: 0, x: bx - 140, duration: 300, onComplete: () => can.destroy() }); this.bed.watered = true; this.refresh(); });
      return 1400;
    }
    if (a === 'spray') {
      const bottle = sc.add.sprite(pb.r + 40, mid, 'tool-spray', 0).setScale(GS).setFlipX(true); this.fx.add(bottle);
      for (let i = 0; i < 4; i++) sc.time.delayedCall(150 + i * 220, () => {
        bottle.setFrame(1); sc.time.delayedCall(100, () => bottle.setFrame(0));
        this.particles(pb.r + 14, mid - 4 - i * 12, { texture: 'pixel', speedX: { min: -200, max: -110 }, speedY: { min: -40, max: 40 }, lifespan: 900, quantity: 14, frequency: -1, scale: { start: 7, end: 1 }, alpha: { start: 0.7, end: 0 }, tint: [0xf2a7b8, 0xffffff, 0xff4f9a] }, 50);
      });
      sc.time.delayedCall(1200, () => sc.tweens.add({ targets: bottle, alpha: 0, x: pb.r + 80, duration: 250, onComplete: () => bottle.destroy() }));
      return 1400;
    }
    if (a === 'prune') {
      const pt = this.leafPoint();
      const sc1 = sc.add.sprite(pt.x + 60, pt.y - 30, 'tool-scissors', 0).setScale(GS).setFlipX(true); this.fx.add(sc1);
      sc.tweens.add({ targets: sc1, x: pt.x + 22, y: pt.y, duration: 250 });
      for (let i = 0; i < 2; i++) sc.time.delayedCall(300 + i * 260, () => { sc1.setFrame(1); sc.time.delayedCall(120, () => sc1.setFrame(0)); });
      sc.time.delayedCall(560, () => {
        for (let k = 0; k < 3; k++) {
          const lb = sc.add.image(pt.x + k * 8, pt.y + k * 4, 'leaf-bit').setScale(GS); this.fx.add(lb);
          sc.tweens.add({ targets: lb, y: by - 6, x: lb.x + (Math.random() - 0.5) * 60, angle: 360 + Math.random() * 180, duration: 900 + k * 150, ease: 'Quad.in', onComplete: () => sc.tweens.add({ targets: lb, alpha: 0, duration: 600, onComplete: () => lb.destroy() }) });
        }
      });
      sc.time.delayedCall(1000, () => sc.tweens.add({ targets: sc1, alpha: 0, duration: 250, onComplete: () => sc1.destroy() }));
      return 1300;
    }
    // remove: растение вытягивается из земли с корнями
    const root = sc.add.image(bx, by + 4, 'root').setOrigin(0.5, 0).setScale(GS).setAlpha(0); this.fx.add(root);
    this.sway?.pause();
    sc.tweens.add({ targets: this.plant, x: { from: bx - 4, to: bx + 4 }, duration: 60, yoyo: true, repeat: 5 });
    sc.time.delayedCall(700, () => {
      root.setAlpha(1);
      sc.tweens.add({ targets: [this.plant, root], y: '-=160', angle: -18, alpha: 0, duration: 900, ease: 'Quad.in' });
      this.particles(bx, by, { texture: 'pixel', speedX: { min: -90, max: 90 }, speedY: { min: -160, max: -60 }, gravityY: 300, lifespan: 800, quantity: 20, frequency: -1, scale: { start: 6, end: 2 }, tint: [0x5e3c26, 0x7a4f33, 0x3a2416] }, 50);
    });
    sc.time.delayedCall(1800, () => { this.plant.setPosition(bx, by + 10).setAngle(0).setAlpha(1); this.sway?.resume(); this.refresh(); });
    return 1800;
  }

  /** Исцеление: искры и мягкое «вздрагивание» обновлённого растения. */
  heal() {
    const sc = this.scene;
    this.refresh();
    if (!this.bed.crop) return;   // растение удалено — искры над пустой землёй не нужны
    sc.tweens.add({ targets: this.plant, scaleX: PS * 1.06, scaleY: PS * 0.95, duration: 120, yoyo: true, repeat: 1 });
    this.particles(this.baseX, this.baseY - 110, { texture: 'sparkle', x: { min: -90, max: 90 }, y: { min: -90, max: 90 }, speedY: { min: -60, max: -20 }, lifespan: 1100, quantity: 2, frequency: 40, scale: { start: GS, end: 0 } }, 700);
  }

  /** Неудача: растение вздрагивает, вылетают серые споры. */
  fail() {
    const sc = this.scene;
    this.refresh();
    sc.tweens.add({ targets: this.plant, x: { from: this.baseX - 6, to: this.baseX + 6 }, duration: 50, yoyo: true, repeat: 4, onComplete: () => this.plant.setX(this.baseX) });
    this.particles(this.baseX, this.baseY - 110, { texture: 'pixel', speed: { min: 30, max: 90 }, lifespan: 1100, quantity: 26, frequency: -1, scale: { start: 7, end: 2 }, alpha: { start: 0.8, end: 0 }, tint: [0x6b4e8c, 0x9a9a9a, 0x4b3766] }, 50);
  }

  /** Урожай: плоды вылетают из куста. */
  harvest(n: number) {
    const sc = this.scene, tint = this.bed.crop === 'pepper' ? 0xe8833a : this.bed.crop === 'potato' ? 0xd9b36a : 0xe95f5f;
    for (let i = 0; i < n; i++) {
      const pt = this.leafPoint();
      const f = sc.add.circle(pt.x, pt.y, 10, tint).setStrokeStyle(3, C.ink); this.fx.add(f);
      sc.tweens.add({ targets: f, x: this.x + 20, y: this.y - 120, scale: 0.4, duration: 700 + i * 120, ease: 'Quad.in', onComplete: () => f.destroy() });
    }
    this.scene.time.delayedCall(400, () => this.refresh());
  }
}
