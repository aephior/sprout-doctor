/// <reference path="../vendor/phaser/types/phaser.d.ts" />
import { Boot } from './scenes/Boot';
import { Menu } from './scenes/Menu';
import { World } from './scenes/World';
import { Hud } from './scenes/Hud';
import { Procedure } from './scenes/Procedure';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  pixelArt: true,
  backgroundColor: '#1c1a33',
  physics: { default: 'arcade', arcade: { debug: false } },
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [Boot, Menu, World, Hud, Procedure],
});
