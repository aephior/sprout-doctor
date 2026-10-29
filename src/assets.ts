// Адреса ресурсов. В обычной сборке — файлы рядом со страницей.
// В автономной версии (один HTML-файл) ресурсы встроены, и сборка заранее кладёт
// в window.__SD_ASSETS их blob-адреса: так игра работает при открытии файла двойным щелчком.
declare global { interface Window { __SD_ASSETS?: Record<string, string>; __SD_STANDALONE?: boolean } }

export function asset(name: string): string {
  const m = typeof window !== 'undefined' ? window.__SD_ASSETS : undefined;
  if (m && m[name]) return m[name];
  return new URL(name, location.href).href;
}

/** Камера доступна только вне артефакта: в автономной версии или на локальном сервере. */
export function cameraPossible(): boolean {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia) && !location.hostname.endsWith('claudeusercontent.com');
}
