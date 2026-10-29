// Директор сложности (адаптация к игроку) и прогноз Фуку.
// Input: погода (влажность, температура), точность диагнозов/ритуалов, средняя оценка жестов, потери.
// Processing: риск вспышки по типам болезней + правила подстройки.
// Output: прогноз на утро, число и тип вспышек, распространение, появление тли, окно удержания жеста.
import { CLASSES, DiseaseClass, Crop, isHealthy } from '../data/diseases';

export interface Weather { humidity: number; temp: number }
export interface Skill { accuracy: number; gesture: number; losses: number; score: number }

const FUNGAL = new Set(['early_blight', 'late_blight', 'leaf_mold', 'septoria']);

/** Погода сезона: весна умеренная, лето влажное и жаркое, осень сырая и прохладная. */
export function rollWeather(season: number, rnd = Math.random): Weather {
  const base = [null, { h: 55, t: 18 }, { h: 72, t: 28 }, { h: 80, t: 14 }][season]!;
  return { humidity: Math.round(Math.min(95, Math.max(30, base.h + (rnd() - 0.5) * 30))), temp: Math.round(base.t + (rnd() - 0.5) * 8) };
}

/** Риск вспышки (0..1) для класса болезни при данной погоде. */
export function risk(c: DiseaseClass, w: Weather): number {
  const h = w.humidity / 100;
  if (FUNGAL.has(c.key)) return Math.min(1, 0.15 + h * h * (c.key === 'late_blight' && w.temp < 20 ? 1.1 : 0.85));
  if (c.key === 'spider_mites') return Math.min(1, 0.1 + (1 - h) * 0.9 + Math.max(0, w.temp - 25) * 0.03);
  if (c.key === 'bacterial_spot') return 0.25 + h * 0.4;
  if (c.key === 'ylcv') return 0.15 + Math.max(0, w.temp - 18) * 0.03;
  return 0.3;
}

export function skillOf(stats: { correctTreat: number; wrongTreat: number; gradeSum: number; gradeN: number; lost: number }): Skill {
  const accuracy = stats.correctTreat / Math.max(1, stats.correctTreat + stats.wrongTreat);
  const gesture = stats.gradeN ? stats.gradeSum / stats.gradeN : 0.7;
  const losses = stats.lost;
  const score = Math.max(0, Math.min(1, 0.55 * accuracy + 0.35 * gesture - 0.05 * losses + 0.1));
  return { accuracy, gesture, losses, score };
}

/** Число новых вспышек за ночь. */
export function outbreaksFor(season: number, s: Skill): number {
  return Math.max(1, Math.min(5, Math.round(0.6 + season * 0.7 + (s.score - 0.5) * 2.5)));
}

/** Выбор болезни для заражения с учётом погоды (взвешенно по риску). */
export function pickDisease(crop: Crop, season: number, w: Weather, rnd = Math.random): DiseaseClass | null {
  const opts = CLASSES.filter((c) => c.crop === crop && !isHealthy(c) && c.season <= season);
  if (!opts.length) return null;
  const ws = opts.map((c) => risk(c, w));
  let r = rnd() * ws.reduce((a, b) => a + b, 0);
  for (let i = 0; i < opts.length; i++) { r -= ws[i]; if (r <= 0) return opts[i]; }
  return opts[opts.length - 1];
}

/** Параметры, которые директор подкручивает под игрока. */
export function tuning(season: number, s: Skill) {
  return {
    holdBonusMs: s.score < 0.45 ? 300 : s.score > 0.8 ? -100 : 0,
    aphidChance: season < 2 ? 0 : Math.min(0.6, 0.2 + 0.25 * s.score + (season - 2) * 0.1),
    aphidWindowMs: s.score < 0.45 ? 4000 : s.score > 0.8 ? 2500 : 3000,
  };
}

/** Прогноз Фуку: самый вероятный риск сегодня. */
export function forecast(season: number, w: Weather): string {
  const seen = new Map<string, { name: string; r: number }>();
  for (const c of CLASSES) if (!isHealthy(c) && c.season <= season) {
    const r = risk(c, w), prev = seen.get(c.key);
    if (!prev || r > prev.r) seen.set(c.key, { name: c.name, r });
  }
  const top = [...seen.values()].sort((a, b) => b.r - a.r).slice(0, 2);
  return `Влажность ${w.humidity}%, ${w.temp}°C. Риск: ${top.map((t) => `${t.name.toLowerCase()} ${Math.round(t.r * 100)}%`).join(', ')}.`;
}
