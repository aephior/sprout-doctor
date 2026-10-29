// Состояние партии: грядки, ресурсы, день. Сохранение — localStorage (позже — backend).
import { CLASSES, Crop, DiseaseClass, healthyOf, isHealthy, Action } from '../data/diseases';
import { Weather, rollWeather, skillOf, outbreaksFor, pickDisease, risk, tuning } from './director';

export interface Card { file: string; cls: number }

export interface Bed {
  id: number;
  tx: number; ty: number;      // позиция в тайлах
  crop: Crop | null;
  stage: number;               // 0 росток, 1 растёт, 2 созрело
  growth: number;              // дни роста
  health: number;              // 0..100
  cls: number;                 // ИСТИННЫЙ класс (игроку не показывается)
  card: string;                // фото-карточка листа для Линзы
  watered: boolean;
  noWater: boolean;            // запрет полива (кладоспориоз)
  diagnosed: number | null;    // что показала Линза (top-1)
  dead: boolean;
}

export interface GameData {
  version: 1;
  day: number;                 // день сезона, 1..DAYS_PER_SEASON
  season: 1 | 2 | 3;
  coins: number;
  reputation: number;          // 0..100
  fukuCharge: number;
  fukuMax: number;
  fungicide: number;
  harvest: number;             // собранный урожай (шт.)
  beds: Bed[];
  stats: { scans: number; correctTreat: number; wrongTreat: number; cured: number; lost: number; gradeSum: number; gradeN: number; aphids: number };
  licensed: boolean;
  weather: Weather;
  bossDone?: boolean;
  totalDays: number;
}

export const DAYS_PER_SEASON = 5;
const SAVE_KEY = 'sprout-doctor-save-v1';

export class Game {
  data!: GameData;
  cards: Card[] = [];
  log: string[] = [];

  setCards(cards: Card[]) { this.cards = cards; }

  newGame() {
    const beds: Bed[] = [];
    const crops: Crop[] = ['tomato', 'tomato', 'potato', 'pepper'];
    let id = 0;
    for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
      const crop = crops[col];
      beds.push({ id: id++, tx: 9 + col * 2, ty: 9 + row * 2, crop, stage: 1, growth: 1, health: 100,
        cls: healthyOf(crop).id, card: '', watered: false, noWater: false, diagnosed: null, dead: false });
    }
    this.data = { version: 1, day: 1, season: 1, coins: 120, reputation: 50, fukuCharge: 6, fukuMax: 6,
      fungicide: 4, harvest: 0, beds, stats: { scans: 0, correctTreat: 0, wrongTreat: 0, cured: 0, lost: 0, gradeSum: 0, gradeN: 0, aphids: 0 },
      licensed: false, weather: rollWeather(1), totalDays: 1 };
    beds.forEach((b) => this.assignCard(b));
    // стартовая вспышка: 3 больные грядки
    this.infectRandom(3);
  }

  cls(b: Bed): DiseaseClass { return CLASSES[b.cls]; }

  assignCard(b: Bed) {
    const pool = this.cards.filter((c) => c.cls === b.cls);
    b.card = pool.length ? pool[Math.floor(Math.random() * pool.length)].file : '';
    b.diagnosed = null;
  }

  infectRandom(n: number) {
    const healthy = this.data.beds.filter((b) => !b.dead && b.crop && isHealthy(this.cls(b)));
    for (let i = 0; i < n && healthy.length; i++) {
      const b = healthy.splice(Math.floor(Math.random() * healthy.length), 1)[0];
      const c = pickDisease(b.crop!, this.data.season, this.data.weather);
      if (!c) continue;
      b.cls = c.id;
      this.assignCard(b);
    }
  }

  /** Результат ритуала: сравнение с ИСТИННЫМ классом грядки. mult — множитель качества жеста. */
  treat(b: Bed, seq: Action[], mult: number): { ok: boolean; msg: string } {
    const truth = this.cls(b);
    const s = this.data.stats;
    if (seq.length) { s.gradeSum += mult; s.gradeN++; }
    if (seq.includes('spray')) {
      if (this.data.fungicide <= 0) return { ok: false, msg: 'Фунгицид закончился. Купите его в лавке Огавы.' };
      this.data.fungicide--;
    }
    if (seq.length === 1 && seq[0] === 'water') b.watered = true;

    const same = seq.length === truth.cure.length && seq.every((a, i) => a === truth.cure[i]);
    if (isHealthy(truth)) {
      if (seq.length === 0) return { ok: true, msg: 'Растение здорово. Верное решение — не вмешиваться.' };
      if (seq.length === 1 && seq[0] === 'water') return { ok: true, msg: 'Полито. Растение здорово.' };
      b.health = Math.max(0, b.health - 5); s.wrongTreat++;
      return { ok: false, msg: 'Растение было здорово — лечение лишнее. −5 здоровья.' };
    }
    if (same) {
      if (truth.key === 'ylcv') {
        b.dead = true; b.crop = null; s.correctTreat++;
        this.data.reputation = Math.min(100, this.data.reputation + 3);
        return { ok: true, msg: 'Вирус не лечится — растение удалено, соседи в безопасности.' };
      }
      const heal = Math.round(40 * mult);
      b.health = Math.min(100, b.health + heal);
      if (truth.noWaterAfter) b.noWater = true;
      s.correctTreat++;
      if (mult >= 0.7) {
        s.cured++; b.cls = healthyOf(b.crop!).id; this.assignCard(b);
        this.data.reputation = Math.min(100, this.data.reputation + 2);
        return { ok: true, msg: `Лечение сработало! +${heal} здоровья, болезнь отступила.` };
      }
      return { ok: true, msg: `Ритуал верный, но неточный: +${heal} здоровья, болезнь ещё не ушла.` };
    }
    b.health = Math.max(0, b.health - 10); s.wrongTreat++;
    this.data.reputation = Math.max(0, this.data.reputation - 3);
    return { ok: false, msg: 'Лечение не подействовало. −10 здоровья, −3 репутации.' };
  }

  harvestBed(b: Bed): number {
    if (!b.crop || b.stage < 2 || !isHealthy(this.cls(b))) return 0;
    const amount = b.health >= 80 ? 3 : 2;
    this.data.harvest += amount;
    b.stage = 0; b.growth = 0;
    return amount;
  }

  /** Ночь: развитие болезней, рост, новые вспышки (упрощённый директор сложности). */
  endDay(): string[] {
    const d = this.data, notes: string[] = [];
    for (const b of d.beds) {
      if (b.dead || !b.crop) continue;
      const c = this.cls(b);
      if (!isHealthy(c)) {
        b.health = Math.max(0, b.health - c.severity);
        if (b.health === 0) { b.dead = true; d.stats.lost++; notes.push(`Грядка ${b.id + 1}: растение погибло.`); }
      } else {
        b.growth++;
        if (b.stage < 2 && b.growth >= 2 + b.stage * 2) b.stage++;
      }
      b.watered = false; b.noWater = false; b.diagnosed = null;
    }
    // распространение заразных болезней на соседние грядки
    for (const b of d.beds) {
      const c = this.cls(b);
      if (b.dead || !b.crop || !c.spreads) continue;
      for (const n of d.beds) {
        if (n === b || n.dead || !n.crop || !isHealthy(this.cls(n)) || n.crop !== b.crop) continue;
        if (Math.abs(n.tx - b.tx) + Math.abs(n.ty - b.ty) === 2 && Math.random() < risk(c, d.weather) * 0.5) {
          n.cls = c.id; this.assignCard(n); notes.push(`${c.name} перешёл на грядку ${n.id + 1}.`);
        }
      }
    }
    d.weather = rollWeather(d.season);
    this.infectRandom(outbreaksFor(d.season, this.skill()));
    d.fukuCharge = d.fukuMax;
    d.day++; d.totalDays++;
    if (d.day > DAYS_PER_SEASON) notes.push('season-end');
    this.save();
    return notes;
  }

  skill() { return skillOf(this.data.stats); }
  tuning() { return tuning(this.data.season, this.skill()); }

  /** Переход к следующему сезону (полная версия). */
  nextSeason() {
    const d = this.data;
    d.season = (d.season + 1) as 2 | 3; d.day = 1;
    d.weather = rollWeather(d.season);
    d.fukuCharge = d.fukuMax;
    // новые посадки на погибших грядках, урожай сезона продолжает расти
    for (const b of d.beds) {
      if (b.dead || !b.crop) { b.dead = false; b.crop = (['tomato', 'potato', 'pepper'] as Crop[])[b.id % 3]; b.stage = 0; b.growth = 0; b.health = 100; b.cls = healthyOf(b.crop).id; this.assignCard(b); }
    }
    this.infectRandom(2 + d.season);
    this.save();
  }

  lostRatio() { return this.data.beds.filter((b) => b.dead).length / this.data.beds.length; }

  save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch { /* приватный режим */ } }
  hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; } }
  load(): boolean {
    try {
      const s = localStorage.getItem(SAVE_KEY);
      if (!s) return false;
      this.data = JSON.parse(s);
      if (!this.data || !Array.isArray(this.data.beds) || !this.data.stats) return false;
      const st = this.data.stats as any;
      st.gradeSum ??= 0; st.gradeN ??= 0; st.aphids ??= 0;
      this.data.weather ??= rollWeather(this.data.season);
      this.data.totalDays ??= this.data.day;
      return true;
    } catch { return false; }
  }
}

export const game = new Game();
