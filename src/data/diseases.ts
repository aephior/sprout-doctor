// Классы модели «Линза Фуку» и правила лечения (проектный базис v3, Lab8 п. 8).

export type Crop = 'tomato' | 'potato' | 'pepper';
export type Action = 'water' | 'spray' | 'prune' | 'remove';

export interface DiseaseClass {
  id: number;          // индекс выхода модели
  crop: Crop;
  key: string;         // healthy, early_blight, ...
  name: string;        // короткое название для игрока
  cure: Action[];      // правильный ритуал (последовательность)
  noWaterAfter?: boolean;
  season: 1 | 2 | 3;   // с какого сезона встречается
  severity: number;    // урон здоровью за ночь без лечения
  spreads?: boolean;   // может перейти на соседние грядки
}

export const CROP_NAME: Record<Crop, string> = { tomato: 'Томат', potato: 'Картофель', pepper: 'Перец' };

export const ACTION_NAME: Record<Action, string> = {
  water: 'Полив', spray: 'Спрей', prune: 'Обрезка', remove: 'Удалить растение',
};
/** Клавиша в режиме без камеры = номер жеста G1–G7 из словаря. */
export const ACTION_KEY: Record<Action, string> = { water: '2', spray: '3', prune: '4', remove: '7' };

export const CLASSES: DiseaseClass[] = [
  { id: 0, crop: 'tomato', key: 'healthy', name: 'Здоров', cure: [], season: 1, severity: 0 },
  { id: 1, crop: 'tomato', key: 'early_blight', name: 'Альтернариоз', cure: ['spray'], season: 1, severity: 12 },
  { id: 2, crop: 'tomato', key: 'late_blight', name: 'Фитофтороз', cure: ['prune', 'spray'], season: 3, severity: 22, spreads: true },
  { id: 3, crop: 'tomato', key: 'bacterial_spot', name: 'Бактериальная пятнистость', cure: ['prune'], season: 1, severity: 10 },
  { id: 4, crop: 'tomato', key: 'leaf_mold', name: 'Кладоспориоз', cure: ['spray'], noWaterAfter: true, season: 2, severity: 12 },
  { id: 5, crop: 'tomato', key: 'septoria', name: 'Септориоз', cure: ['prune', 'spray'], season: 2, severity: 14 },
  { id: 6, crop: 'tomato', key: 'spider_mites', name: 'Паутинный клещ', cure: ['water'], season: 2, severity: 10 },
  { id: 7, crop: 'tomato', key: 'ylcv', name: 'Вирус жёлтой курчавости', cure: ['remove'], season: 3, severity: 25, spreads: true },
  { id: 8, crop: 'potato', key: 'healthy', name: 'Здоров', cure: [], season: 1, severity: 0 },
  { id: 9, crop: 'potato', key: 'early_blight', name: 'Альтернариоз', cure: ['spray'], season: 1, severity: 12 },
  { id: 10, crop: 'potato', key: 'late_blight', name: 'Фитофтороз', cure: ['prune', 'spray'], season: 3, severity: 22, spreads: true },
  { id: 11, crop: 'pepper', key: 'healthy', name: 'Здоров', cure: [], season: 1, severity: 0 },
  { id: 12, crop: 'pepper', key: 'bacterial_spot', name: 'Бактериальная пятнистость', cure: ['prune'], season: 1, severity: 10 },
];

export const isHealthy = (c: DiseaseClass) => c.key === 'healthy';
export const healthyOf = (crop: Crop) => CLASSES.find((c) => c.crop === crop && isHealthy(c))!;
export const diseasesFor = (crop: Crop, season: number) =>
  CLASSES.filter((c) => c.crop === crop && !isHealthy(c) && c.season <= season);
