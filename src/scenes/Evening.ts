// «Конец дня» — тихая вечерняя сцена перед сном (вайб The Friends of Ringo Ishikawa):
// широкий кадр с летербоксом, закат над горами, Аой и Фуку на веранде, одна-две строки внутреннего монолога.
import { game } from '../state/game';
import { isHealthy } from '../data/diseases';
import { text, HEX } from '../ui/ui';
import { sound } from '../audio/sound';
import { makeGlow } from '../art/interiors';

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
    makeGlow(this);
    // веранда на закате: Аой сидит спиной к нам, рядом парит Фуку-фонарик
    g.fillStyle(0x2a2443, 1).fillRect(0, 0, W, H);   // сплошной фон: мир под сценой не просвечивает
    const bg = this.add.image(W / 2, H / 2, 'g-evening').setScale(2.04);
    this.tweens.add({ targets: bg, scale: 2.1, x: W / 2 - 14, duration: 16000, ease: 'Sine.inOut' });   // медленный «наезд» камеры
    const lamp = this.add.image(525, 322, 'glow').setScale(2.6).setAlpha(0.55).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffd27a);
    this.tweens.add({ targets: lamp, alpha: 0.35, scale: 2.4, duration: 1300, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
    // светлячки
    this.add.particles(0, 0, 'pixel', {
      x: { min: 0, max: W }, y: { min: 250, max: 400 }, lifespan: 3000, speedX: { min: -8, max: 8 }, speedY: { min: -6, max: 6 },
      scale: { start: 3, end: 0 }, alpha: { start: 0.9, end: 0 }, frequency: 220, tint: [0xf2c230, 0xf6e7c1],
    });
    // летербокс + зерно
    this.add.rectangle(0, 0, W, 48, 0x000000).setOrigin(0);
    this.add.rectangle(0, H - 56, W, 56, 0x000000).setOrigin(0);
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
