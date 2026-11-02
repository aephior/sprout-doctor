// Модель продаж buy-to-play: демо (весна) → полная версия по ключу SPRT-XXXX-XXXX-XXXX.
// Проверка офлайн по контрольной сумме (как у многих инди-игр без DRM).
// В реальном продукте ключ дополнительно проверялся бы сервером магазина (itch.io / Steam).

const ALPHA = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // без 0/O и 1/I, чтобы ключ не путали при вводе
const SALT = 'kiri-no-sato';
const KEY = 'sd-license';
export const PRICE = '2 490 тенге';

function fnv(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
function checksum(a: string, b: string): string {
  let h = fnv(a + b + SALT), out = '';
  for (let i = 0; i < 4; i++) { out += ALPHA[h & 31]; h >>>= 5; }
  return out;
}

export function normalizeKey(raw: string): string {
  const s = raw.toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^SPRT/, '').slice(0, 12);
  return 'SPRT' + (s ? '-' + (s.match(/.{1,4}/g) ?? []).join('-') : '');
}

export function isValidKey(key: string): boolean {
  const m = /^SPRT-([A-Z2-9]{4})-([A-Z2-9]{4})-([A-Z2-9]{4})$/.exec(key.trim().toUpperCase());
  return !!m && [...m[1] + m[2] + m[3]].every((c) => ALPHA.includes(c)) && checksum(m[1], m[2]) === m[3];
}

/** Выдача тестового ключа «магазином» (имитация покупки, без оплаты). */
export function generateKey(rnd = Math.random): string {
  const part = () => Array.from({ length: 4 }, () => ALPHA[Math.floor(rnd() * 32)]).join('');
  const a = part(), b = part();
  return `SPRT-${a}-${b}-${checksum(a, b)}`;
}

export function isLicensed(): boolean {
  try { return isValidKey(localStorage.getItem(KEY) ?? ''); } catch { return false; }
}
export function activate(key: string): boolean {
  const k = normalizeKey(key);
  if (!isValidKey(k)) return false;
  try { localStorage.setItem(KEY, k); } catch { /* приватный режим: действует до перезапуска */ }
  return true;
}
export function deactivate() { try { localStorage.removeItem(KEY); } catch { /* ignore */ } }
