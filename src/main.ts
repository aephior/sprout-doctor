/// <reference path="../vendor/phaser/types/phaser.d.ts" />
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { World } from './scenes/World';
import { Hud } from './scenes/Hud';
import { Procedure } from './scenes/Procedure';
import { GestureSetup } from './scenes/GestureSetup';
import { Boss } from './scenes/Boss';
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
  scene: [Boot, Menu, World, Hud, Procedure, GestureSetup, Boss],
});

// отладочный доступ для автотестов и отчёта по тестированию AI
(window as any).__SD_DEBUG = { app, game, events, tracker, gestures, features, rulePose };
