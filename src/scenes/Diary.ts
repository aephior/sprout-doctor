// Дневник бабушки Хару: раскрытая книга. Слева — оглавление болезней (открытые страницы и «???»),
// справа — страница: фото листа, симптомы словами Хару, ритуал лечения. Страница открывается
// при первом успешном лечении болезни; все 7 страниц — достижение «Полный дневник».
import { game, PAGES } from '../state/game';
import { CLASSES, CROP_NAME, isHealthy } from '../data/diseases';
import { events } from '../state/events';
import { text, C } from '../ui/ui';
import { ritualText } from './Procedure';
import { sound } from '../audio/sound';

const KEYS = Object.keys(PAGES);

export class Diary extends Phaser.Scene {
  returnTo: 'World' | 'Home' | 'Procedure' = 'World';
  sel = 0;
  page!: Phaser.GameObjects.Container;
  list!: Phaser.GameObjects.Container;

  constructor() { super('Diary'); }
  init(data: { returnTo?: 'World' | 'Home' | 'Procedure'; open?: string }) {
    this.returnTo = data?.returnTo ?? 'World';
    this.sel = data?.open ? Math.max(0, KEYS.indexOf(data.open)) : Math.max(0, KEYS.findIndex((k) => game.data.pages.includes(k)));
  }

  create() {
    // стол Хару (кисть, веер, счёты) — фон под раскрытым дневником
    this.add.image(0, 0, 'g-diary_book').setOrigin(0).setScale(2);
    const g = this.add.graphics();
    g.fillStyle(0x1e1b2e, 0.45).fillRect(0, 0, 960, 540);
    // обложка и две страницы
    g.fillStyle(0x5a2a2a, 1).fillRoundedRect(50, 30, 860, 480, 10);
    g.fillStyle(0x8e2230, 1).fillRoundedRect(56, 36, 848, 468, 8);
    g.fillStyle(0xf6e7c1, 1).fillRect(76, 50, 400, 440).fillRect(484, 50, 400, 440);
    g.fillStyle(0xe2cfa0, 1).fillRect(468, 50, 8, 440).fillRect(484, 50, 8, 440);
    g.fillStyle(0xc9ab74, 1).fillRect(476, 46, 8, 448);
    for (let i = 0; i < KEYS.length; i++) g.fillStyle(0xd9c79e, 1).fillRect(96, 130 + i * 48 + 38, 360, 1);   // линейка — под каждой строкой списка
    g.fillStyle(0xc8323c, 1).fillRect(860, 30, 14, 70).fillTriangle(860, 100, 874, 100, 867, 92);   // закладка
    this.list = this.add.container(0, 0);
    this.page = this.add.container(0, 0);
    text(this, 276, 66, 'Дневник Хару', 24, '#5a2a2a').setOrigin(0.5, 0);
    text(this, 276, 96, `Страниц: ${game.data.pages.length} из ${KEYS.length}`, 14, '#8a6a4a').setOrigin(0.5, 0);
    text(this, 480, 520, 'W/S или стрелки — листать · Esc — закрыть', 13, '#c9ab74').setOrigin(0.5);
    this.input.keyboard!.on('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); this.close(); }
      if (e.key === 'ArrowUp' || e.code === 'KeyW') this.go(-1);      // e.code — физическая клавиша, работает и в русской раскладке
      if (e.key === 'ArrowDown' || e.code === 'KeyS') this.go(1);
    });
    this.drawList(); this.drawPage();
    this.cameras.main.fadeIn(250, 0, 0, 0);
    sound.play('page');
  }

  go(d: number) { this.sel = (this.sel + d + KEYS.length) % KEYS.length; sound.play('page'); this.drawList(); this.drawPage(); }

  drawList() {
    this.list.removeAll(true);
    KEYS.forEach((k, i) => {
      const open = game.data.pages.includes(k), c = CLASSES.find((x) => x.key === k)!;
      const y = 130 + i * 48, sel = i === this.sel;
      if (sel) { const h = this.add.graphics(); h.fillStyle(0xf2d39a, 1).fillRect(92, y - 6, 368, 40); this.list.add(h); }
      this.list.add(text(this, 104, y, open ? c.name : '? ? ?', 18, open ? '#3a2a1a' : '#b8a888'));
      this.list.add(text(this, 104, y + 21, open ? CLASSES.filter((x) => x.key === k).map((x) => CROP_NAME[x.crop]).join(', ') : 'ещё не встречалась', 12, '#8a6a4a'));
      if (open) { const ck = this.add.graphics(); ck.lineStyle(3, 0x2e6b2a, 1).beginPath(); ck.moveTo(430, y + 16); ck.lineTo(436, y + 22); ck.lineTo(446, y + 8); ck.strokePath(); this.list.add(ck); }
      const z = this.add.zone(92, y - 6, 368, 40).setOrigin(0).setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.sel = i; sound.play('page'); this.drawList(); this.drawPage(); });
      this.list.add(z);
    });
  }

  drawPage() {
    this.page.removeAll(true);
    const k = KEYS[this.sel], open = game.data.pages.includes(k);
    const cls = CLASSES.filter((x) => x.key === k && !isHealthy(x));
    const add = (o: Phaser.GameObjects.GameObject) => this.page.add(o);
    if (!open) {
      const g = this.add.graphics(); g.fillStyle(0xe2cfa0, 1).fillRect(584, 90, 200, 200); g.lineStyle(2, 0xc9ab74, 1).strokeRect(584, 90, 200, 200);
      add(g);
      add(text(this, 684, 190, '?', 72, '#c9ab74').setOrigin(0.5));
      add(text(this, 684, 320, 'Страница пока пуста.', 18, '#8a6a4a').setOrigin(0.5));
      add(text(this, 684, 350, 'Найдите эту болезнь Линзой Фуку —\nи бабушкина запись проявится.', 14, '#8a6a4a', { align: 'center' }).setOrigin(0.5, 0));
      return;
    }
    // фото листа, приклеенное «скотчем»
    const card = game.cards.find((c) => cls.some((x) => x.id === c.cls));
    // фото с белой рамкой и тенью поворачиваются вместе; полоски скотча — полупрозрачные, с краем
    const photo = this.add.container(684, 162).setAngle(-1.5);
    const ph = this.add.graphics();
    ph.fillStyle(0x6b4a2a, 0.25).fillRect(-88, -88, 184, 184).fillStyle(0xffffff, 1).fillRect(-92, -92, 184, 184);
    photo.add(ph);
    if (card) photo.add(this.add.image(0, 0, `card:${card.file}`).setDisplaySize(172, 172));
    for (const [tx, ang] of [[-84, -32], [84, 32]] as [number, number][]) {
      const tape = this.add.rectangle(tx, -88, 56, 16, 0xe9dcb4, 0.8).setStrokeStyle(1, 0xb8a476, 0.9).setAngle(ang);
      photo.add(tape);
    }
    add(photo);
    const c = cls[0];
    add(text(this, 684, 268, c.name, 22, '#3a2a1a').setOrigin(0.5, 0));
    add(text(this, 684, 296, cls.map((x) => CROP_NAME[x.crop]).join(' · '), 13, '#8a6a4a').setOrigin(0.5, 0));
    add(text(this, 508, 322, `«${PAGES[k]}»`, 15, '#4a3a2a', { wordWrap: { width: 352 }, lineSpacing: 4, fontStyle: 'italic' }));
    const g2 = this.add.graphics(); g2.fillStyle(0x8e2230, 0.12).fillRect(504, 436, 360, 40); add(g2);
    add(text(this, 516, 444, `Ритуал: ${ritualText(c)}`, 15, '#8e2230', { wordWrap: { width: 340 } }));
    add(text(this, 864, 412, '— Хару', 14, '#8a6a4a').setOrigin(1, 0));
    // засушенный цветок в углу
    const f = this.add.graphics();
    f.fillStyle(C.green, 1).fillRect(840, 260, 2, 30);
    [[841, 258], [835, 262], [847, 262], [841, 266]].forEach(([x, y]) => f.fillStyle(0xf2a7b8, 1).fillCircle(x, y, 4));
    add(f);
  }

  close() {
    sound.play('page');
    this.cameras.main.fadeOut(200, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      if (this.returnTo === 'Home') { events.emit('diary-closed'); return; }
      if (this.returnTo === 'Procedure') { const p = this.scene.get('Procedure'); this.scene.resume('Procedure'); p.input.keyboard!.enabled = true; return; }
      this.scene.wake('World'); this.scene.setVisible(true, 'Hud');
      events.emit('lock', false);
    });
  }
}

