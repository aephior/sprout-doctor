import { registerSprites } from '../art/sprites';
import { game, Card } from '../state/game';
import { text, HEX } from '../ui/ui';
import { asset } from '../assets';
import { LAYOUT } from '../world/layout';

/** Картинки из генератора (обработаны: фон вырезан, приведены к пиксельной сетке). */
/** Персонажи фермы 16×20: столбцы — вниз/вверх/влево/вправо, строки — кадры шага. */
export const CHARS = ['aoi-na', 'ogawa-na', 'fisher-na', 'villager2-na', 'villager16-na', 'villager25-na', 'villager12-na'];

export const GEN = ['haikabi_idle_px', 'haikabi_rage_px', 'haikabi_defeated_px', 'home_fg_px', 'aoi_home_px', 'title', 'shop_bg', 'shop_bg_day', 'home_bg_day', 'shop_counter', 'home_bg', 'home_fg', 'evening', 'diary_book', 'aoi_sleep', 'aoi_sheet', 'aoi_home', 'aoi_chibi',
  'ogawa_neutral', 'ogawa_talk', 'ogawa_happy', 'haru_photo', 'fisher', 'mochi_sit', 'mochi_walk', 'mochi_sleep',
  'haikabi_idle', 'haikabi_rage', 'haikabi_defeated', 'aphid_idle', 'aphid_dash', 'fuku_happy', 'fuku_alert', 'fuku_damaged'];

/** Объекты мира, у которых есть летний и осенний вариант. */
export const SEASONAL = ['ground', 'grove', 'pines', 'sakura', 'bush', 'flowers'];

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const label = text(this, 480, 270, 'Загрузка…', 20, HEX.paper).setOrigin(0.5);
    this.load.on('progress', (v: number) => label.setText(`Загрузка… ${Math.round(v * 100)}%`));
    this.load.json('cards', asset('cards/cards.json'));
    this.load.json('classes', asset('classes.json'));
    // ферма в стиле Ninja Adventure (16 px, CC0) + свои спрайты Аой, Моти, Фуку, растений (см. CREDITS.md)
    this.load.image('ground', asset('art/naw/ground.png'));
    for (const k of new Set(LAYOUT.objs.filter((o) => !o.hidden).map((o) => o.key))) this.load.image('w-' + k, asset(`art/naw/${k}.png`));
    // летние и осенние варианты травы и листвы (tools/art/build_world_na.py)
    for (const k of SEASONAL) for (const s of [2, 3]) this.load.image(`${k === 'ground' ? 'ground' : 'w-' + k}_s${s}`, asset(`art/naw/${k}_s${s}.png`));
    this.load.spritesheet('crops', asset('art/na/crops.png'), { frameWidth: 16, frameHeight: 20 });
    this.load.spritesheet('crops-hd', asset('art/na/crops_hd.png'), { frameWidth: 48, frameHeight: 60 });
    this.load.image('bed-wet', asset('art/naw/bed_wet.png'));
    this.load.image('closeup-dry', asset('art/naw/closeup_dry.png'));
    this.load.image('closeup-wet', asset('art/naw/closeup_wet.png'));
    this.load.image('boss-arena', asset('art/world/boss_arena.png'));
    // лавка Огавы (tools/art/shop_import.py): слои сцены и товары
    for (const p of ['idle', 'talk', 'happy', 'coins']) this.load.image(`shop-og-${p}`, asset(`art/shop/ogawa_${p}.png`));
    this.load.image('shop-counter', asset('art/shop/counter_body.png'));
    this.load.image('shop-drawer', asset('art/shop/drawer.png'));
    this.load.image('shop-tag', asset('art/shop/tag.png'));
    for (const m of ['0', '1']) this.load.image(`shop-mochi${m}`, asset(`art/shop/mochi${m}.png`));
    for (const it of ['harvest', 'fungicide', 'seeds', 'fertilizer', 'lens']) {
      this.load.image(`shop-item-${it}`, asset(`art/shop/item_${it}.png`));
      this.load.image(`shop-item-${it}-s`, asset(`art/shop/item_${it}_s.png`));
    }
    this.load.image('vending-px', asset('art/world/vending.png'));
    this.load.image('busstop-px', asset('art/world/busstop.png'));
    this.load.spritesheet('bus-px', asset('art/world/bus.png'), { frameWidth: 50, frameHeight: 28 });
    for (const k of CHARS) this.load.spritesheet(k, asset(`art/na/${k.replace('-na', '')}.png`), { frameWidth: 16, frameHeight: 20 });
    this.load.spritesheet('mochi-na', asset('art/na/mochi.png'), { frameWidth: 16, frameHeight: 14 });
    this.load.spritesheet('fuku-na', asset('art/na/fuku.png'), { frameWidth: 12, frameHeight: 14 });
    this.load.spritesheet('fuku', asset('art/chars/fuku_hd.png'), { frameWidth: 112, frameHeight: 136 });
    this.load.spritesheet('fuku-px', asset('art/chars/fuku_px.png'), { frameWidth: 24, frameHeight: 29 });   // для интерьеров ×2
    for (const g of GEN) this.load.image('g-' + g, asset(`art/gen/${g}.png`));
    this.load.on('filecomplete-json-cards', (_k: string, _t: string, data: Card[]) => {
      data.forEach((c) => this.load.image(`card:${c.file}`, asset(`cards/${c.file}`)));
    });
  }

  async create() {
    registerSprites(this);
    game.setCards(this.cache.json.get('cards'));
    try {
      await Promise.race([Promise.all([document.fonts.load('600 16px "Nunito"', 'Aой'), document.fonts.load('800 16px "Nunito"', 'Aой')]), new Promise((r) => setTimeout(r, 1500))]);
    } catch { /* шрифт не обязателен */ }
    this.scene.start('Menu');
  }
}
