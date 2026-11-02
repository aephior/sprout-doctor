import { registerSprites } from '../art/sprites';
import { game, Card } from '../state/game';
import { text, HEX } from '../ui/ui';
import { asset } from '../assets';
import { LAYOUT } from '../world/layout';

/** Картинки из генератора (обработаны: фон вырезан, приведены к пиксельной сетке). */
export const GEN = ['title', 'shop_bg', 'shop_counter', 'home_bg', 'home_fg', 'evening', 'diary_book', 'aoi_sleep', 'aoi_sheet', 'aoi_home', 'aoi_chibi',
  'ogawa_neutral', 'ogawa_talk', 'ogawa_happy', 'haru_photo', 'fisher', 'mochi_sit', 'mochi_walk', 'mochi_sleep',
  'haikabi_idle', 'haikabi_rage', 'haikabi_defeated', 'aphid_idle', 'aphid_dash'];

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const label = text(this, 480, 270, 'Загрузка…', 20, HEX.paper).setOrigin(0.5);
    this.load.on('progress', (v: number) => label.setText(`Загрузка… ${Math.round(v * 100)}%`));
    this.load.json('cards', asset('cards/cards.json'));
    this.load.json('classes', asset('classes.json'));
    // ферма из LPC-тайлов и персонажи (см. CREDITS.md), сгенерированные сцены и портреты
    this.load.image('ground', asset('art/world/ground.png'));
    for (const k of new Set(LAYOUT.objs.map((o) => o.key))) this.load.image('w-' + k, asset(`art/world/${k}.png`));
    this.load.spritesheet('crops', asset('art/world/crops.png'), { frameWidth: 32, frameHeight: 64 });
    this.load.image('vending-hd', asset('art/world/vending_hd.png'));
    this.load.image('busstop-hd', asset('art/world/busstop_hd.png'));
    this.load.image('lamppost-hd', asset('art/world/lamppost_hd.png'));
    this.load.spritesheet('bus-hd', asset('art/world/bus_hd.png'), { frameWidth: 96, frameHeight: 52 });
    this.load.image('bed-soil-wet', asset('art/world/soil_wet.png'));
    this.load.spritesheet('aoi-lpc', asset('art/chars/aoi_walk.png'), { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('aoi-water', asset('art/chars/aoi_water.png'), { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('fisher', asset('art/chars/fisher_sit.png'), { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('ogawa-lpc', asset('art/chars/ogawa_walk.png'), { frameWidth: 64, frameHeight: 64 });
    this.load.spritesheet('mochi-walk', asset('art/chars/mochi_small.png'), { frameWidth: 36, frameHeight: 24 });
    this.load.spritesheet('fuku-s', asset('art/chars/fuku_small.png'), { frameWidth: 28, frameHeight: 34 });
    this.load.spritesheet('fuku', asset('art/chars/fuku_hd.png'), { frameWidth: 112, frameHeight: 136 });
    for (const g of GEN) this.load.image('g-' + g, asset(`art/gen/${g}.png`));
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
