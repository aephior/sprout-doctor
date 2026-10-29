// Таблица рекордов и итоговый счёт партии (хранится в браузере игрока).
import type { GameData } from './game';

export interface RecordRow { date: string; score: number; ending: string; days: number; accuracy: number; cured: number }
const KEY = 'sd-records';
export const FESTIVAL_GOAL = 300;   // выручка к фестивалю урожая

export function scoreOf(d: GameData, bossWon: boolean): number {
  const s = d.stats;
  return Math.max(0, Math.round(s.cured * 50 + s.correctTreat * 10 - s.wrongTreat * 10 - s.lost * 30 + s.aphids * 15 + d.coins + d.reputation * 5 + (bossWon ? 500 : 0)));
}

export function loadRecords(): RecordRow[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? '[]'); } catch { return []; }
}

export function addRecord(d: GameData, ending: string, bossWon: boolean): { row: RecordRow; place: number } {
  const s = d.stats;
  const row: RecordRow = {
    date: new Date().toLocaleDateString('ru-RU'), score: scoreOf(d, bossWon), ending, days: d.totalDays,
    accuracy: Math.round(100 * s.correctTreat / Math.max(1, s.correctTreat + s.wrongTreat)), cured: s.cured,
  };
  const rows = [...loadRecords(), row].sort((a, b) => b.score - a.score).slice(0, 10);
  try { localStorage.setItem(KEY, JSON.stringify(rows)); } catch { /* ignore */ }
  return { row, place: rows.indexOf(row) + 1 };
}
