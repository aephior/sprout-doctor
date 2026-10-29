import { registerSprites } from '../art/sprites';
import { game, Card } from '../state/game';
import { text, HEX } from '../ui/ui';
import { asset } from '../assets';

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const label = text(this, 480, 270, 'Загрузка…', 20, HEX.paper).setOrigin(0.5);
    this.load.on('progress', (v: number) => label.setText(`Загрузка… ${Math.round(v * 100)}%`));
    this.load.json('cards', asset('cards/cards.json'));
    this.load.json('classes', asset('classes.json'));
    this.load.on('filecomplete-json-cards', (_k: string, _t: string, data: Card[]) => {
      data.forEach((c) => this.load.image(`card:${c.file}`, asset(`cards/${c.file}`)));
    });
  }

  async create() {
    registerSprites(this);
    game.setCards(this.cache.json.get('cards'));
    try {
      await Promise.race([document.fonts.load('16px "Pixelify Sans"'), new Promise((r) => setTimeout(r, 1500))]);
    } catch { /* шрифт не обязателен */ }
    this.scene.start('Menu');
  }
}
