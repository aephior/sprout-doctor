/// <reference path="../vendor/phaser/types/phaser.d.ts" />
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { World } from './scenes/World';
import { Hud } from './scenes/Hud';
import { Procedure } from './scenes/Procedure';
import { GestureSetup } from './scenes/GestureSetup';
import { Boss } from './scenes/Boss';
import { Evening } from './scenes/Evening';
import { GestureTest } from './scenes/GestureTest';
import { Shop } from './scenes/Shop';
import { Home } from './scenes/Home';
import { tracker } from './ai/hands';
import { gestures } from './ai/gestureCtl';
import { features, rulePose } from './ai/gestures';
import { game } from './state/game';
import { events } from './state/events';

// отладочный доступ для автотестов и отчёта по тестированию AI


const app = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  pixelArt: true,
  backgroundColor: '#1c1a33',
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Menu, World, Hud, Procedure, GestureSetup, Boss, Evening, GestureTest, Shop, Home],
});

// отладочный доступ для автотестов и отчёта по тестированию AI
(window as any).__SD_DEBUG = { app, game, events, tracker, gestures, features, rulePose };

// Ошибки показываются на экране, чтобы их можно было сообщить разработчику
function showError(msg: string) {
  let el = document.getElementById('sd-error');
  if (!el) {
    el = document.createElement('div'); el.id = 'sd-error';
    el.style.cssText = 'position:fixed;left:8px;bottom:8px;max-width:70vw;padding:6px 10px;background:#2b2a4c;color:#ff4f9a;font:12px monospace;border:1px solid #ff4f9a;z-index:9;white-space:pre-wrap';
    el.onclick = () => el!.remove();
    document.body.appendChild(el);
  }
  el.textContent = 'Ошибка (щелчок — скрыть): ' + msg.slice(0, 300);
}
window.addEventListener('error', (e) => showError(`${e.message} @ ${e.filename?.split('/').pop()}:${e.lineno}`));
window.addEventListener('unhandledrejection', (e) => showError(String((e.reason && e.reason.stack) || e.reason)));
