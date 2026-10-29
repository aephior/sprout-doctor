// «Конец дня» — тихая вечерняя сцена перед сном (вайб The Friends of Ringo Ishikawa):
// широкий кадр с летербоксом, закат над горами, Аой и Фуку на веранде, одна-две строки внутреннего монолога.
import { game } from '../state/game';
import { isHealthy } from '../data/diseases';
import { text, HEX } from '../ui/ui';
import { sound } from '../audio/sound';

const LINES: Record<string, string[]> = {
  good: [
    'Листья снова держат форму. Бабушка говорила: растение слышит, когда к нему возвращаются.',
    'Сегодня всё получилось. Даже Фуку жужжит как-то довольно.',
    'В городе я никогда не замечала, какого цвета вечер. Здесь он почти оранжевый.',
  ],
  mixed: [
    'Не всё удалось. Но завтра автобус снова придёт в 7:40, и день начнётся заново.',
    'Руки пахнут землёй. Кажется, я начинаю понимать её ритуалы.',
    'Фуку молчит. Наверное, тоже считает грядки.',
  ],
  bad: [
    'Плесень расползается быстрее, чем я успеваю. Нужно внимательнее читать листья.',
    'Хару справлялась одна. Значит, справлюсь и я. Наверное.',
    'Серого стало больше. Завтра — сначала скан, потом всё остальное.',
  ],
  autumn: [
    'Споры тянутся от старой теплицы. Скоро придётся туда пойти.',
    'Фестиваль совсем скоро. Деревня ждёт урожай — и ждёт меня.',
  ],
};

export class Evening extends Phaser.Scene {
  private done?: () => void;
  constructor() { super('Evening'); }

  init(data: { done: () => void }) { this.done = data.done; }

  create() {
    const W = 960, H = 540, g = this.add.graphics();
    sound.setMood('evening');
    // небо — полосы заката (без градиентов, пиксельно)
    g.fillStyle(0x2a2443, 1).fillRect(0, 0, W, H);   // сплошной фон: мир под сценой не просвечивает
    const sky = [0x2b2a4c, 0x3e3260, 0x5d3a6e, 0x8a4f7a, 0xb85f6b, 0xd9735a, 0xe8833a, 0xf2a95c];
    sky.forEach((c, i) => g.fillStyle(c, 1).fillRect(0, 60 + i * 40, W, i === sky.length - 1 ? 60 : 41));
    g.fillStyle(0xf6e7c1, 1).fillCircle(680, 318, 34);
    // горы в два плана
    g.fillStyle(0x3b3358, 1).fillTriangle(-40, 402, 220, 230, 500, 402).fillTriangle(280, 402, 560, 250, 840, 402);
    g.fillStyle(0x2a2443, 1).fillTriangle(560, 390, 820, 270, 1060, 390).fillTriangle(-60, 395, 120, 300, 360, 395);
    // провода и столб (Ringo — сельская Япония)
    g.fillStyle(0x1e1b2e, 1).fillRect(180, 160, 6, 260);
    g.lineStyle(2, 0x1e1b2e, 1).lineBetween(0, 205, 183, 175).lineBetween(183, 175, 960, 230).lineBetween(0, 215, 183, 190).lineBetween(183, 190, 960, 245);
    // веранда
    g.fillStyle(0x6a4329, 1).fillRect(0, 400, W, 80);
    g.fillStyle(0x8a5a3b, 1).fillRect(0, 400, W, 8);
    for (let x = 0; x < W; x += 48) g.fillStyle(0x5a3820, 1).fillRect(x, 408, 3, 72);
    g.fillStyle(0x1e1b2e, 0.9).fillRect(40, 250, 14, 160).fillRect(900, 250, 14, 160);   // столбы веранды
    g.fillStyle(0x1e1b2e, 0.85).fillRect(0, 240, W, 12);

    const aoi = this.add.sprite(430, 402, 'aoi', 3).setOrigin(0.5, 1).setScale(5);    // сидит спиной к нам, смотрит на закат
    const fuku = this.add.sprite(500, 330, 'fuku', 0).setScale(3.5).play('fuku-idle');
    this.tweens.add({ targets: fuku, y: 338, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    void aoi;
    // светлячки
    this.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: W }, y: { min: 250, max: 400 }, lifespan: 3000, speedX: { min: -8, max: 8 }, speedY: { min: -6, max: 6 },
      scale: { start: 3, end: 0 }, alpha: { start: 0.9, end: 0 }, frequency: 220, tint: [0xf2c230, 0xf6e7c1],
    });
    // летербокс + зерно
    this.add.rectangle(0, 0, W, 60, 0x000000).setOrigin(0);
    this.add.rectangle(0, H - 60, W, 60, 0x000000).setOrigin(0);
    const grain = this.add.graphics().setAlpha(0.06);
    this.time.addEvent({ delay: 90, loop: true, callback: () => {
      grain.clear().fillStyle(0xffffff, 1);
      for (let i = 0; i < 260; i++) grain.fillRect(Math.random() * W, 60 + Math.random() * (H - 120), 2, 2);
    } });

    const d = game.data;
    const lostToday = d.beds.filter((b) => b.dead).length, sick = d.beds.filter((b) => b.crop && !b.dead && !isHealthy(game.cls(b))).length;
    const mood = d.season === 3 && Math.random() < 0.5 ? 'autumn' : lostToday > 2 || sick > 6 ? 'bad' : sick > 3 ? 'mixed' : 'good';
    const pool = LINES[mood], line = pool[(d.totalDays + d.season) % pool.length];
    const caption = text(this, W / 2, H - 30, '', 18, HEX.paper).setOrigin(0.5);
    const day = text(this, 24, 30, `${['', 'Весна', 'Лето', 'Осень'][d.season]}, день ${d.day}. Вечер.`, 15, '#b9b7d9').setOrigin(0, 0.5);
    void day;
    // текст печатается по буквам
    let i = 0;
    this.time.addEvent({ delay: 38, repeat: line.length - 1, callback: () => caption.setText(line.slice(0, ++i)) });
    text(this, W - 24, 30, 'любая клавиша — дальше', 13, '#77749a').setOrigin(1, 0.5);

    this.cameras.main.fadeIn(700, 0, 0, 0);
    let leaving = false;
    const leave = () => {
      if (leaving) return; leaving = true;
      this.cameras.main.fadeOut(700, 43, 42, 76);
      this.cameras.main.once('camerafadeoutcomplete', () => { const d = this.done; this.scene.stop(); d?.(); });
    };
    this.time.delayedCall(900, () => {
      this.input.keyboard!.once('keydown', leave);
      this.input.once('pointerdown', leave);
    });
    this.time.delayedCall(line.length * 38 + 3500, leave);
  }
}
