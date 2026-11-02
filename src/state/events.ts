// Общая шина событий между сценами (мир ↔ интерфейс ↔ процедурная).
export const events = new Phaser.Events.EventEmitter();

/** Состояние интерфейса: пока открыта модалка Hud, мир стоит (не ходит Аой, не идут часы). */
export const ui = { modal: false, closedAt: 0 };
/** Мир заморожен модалкой (или только что закрытой — чтобы та же клавиша не сработала в мире). */
export const uiBlocks = () => ui.modal || performance.now() - ui.closedAt < 150;
