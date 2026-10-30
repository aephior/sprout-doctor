// Промпты для генерации арта и музыки Sprout Doctor. Из этого файла собираются страница и prompts.md.
const STYLE = 'cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing';
const ISO = 'isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it';
const BGSTYLE = 'cozy pixel art game background, looks like a 320x180 pixel image scaled up, Japanese countryside, Stardew Valley meets The Friends of Ringo Ishikawa, limited warm palette (indigo #2B2A4C, sunset orange #E8833A, sakura pink #F2A7B8, cream #F6E7C1, forest green #4F8A3C), subtle dithering, crisp pixels, no anti-aliasing';
const NEG = 'text, letters, numbers, watermark, signature, logo, frame, border, UI, blurry, smooth gradient, 3D render, photorealistic, extra limbs, cropped, multiple characters';

const AOI = 'Aoi, a 23-year-old Japanese woman agronomist, shoulder-length chestnut-brown hair, yellow raincoat over green overalls and a white t-shirt, straw hat with a red ribbon, goggles with teal lenses resting on the hat brim, red rubber boots, friendly and determined';
const FUKU = 'Fuku, a small flying robot drone shaped like a Japanese paper lantern (chouchin), woven beige paper body with dark ribs, one large round camera lens as its single eye, four tiny teal propellers on top, soft teal glow outline, cute, NOT an owl, NOT a bird';
const OGAWA = 'Mr. Ogawa, a kind elderly Japanese village shopkeeper about 70 years old, navy blue cap, round glasses, gray sideburns and a small gray mustache, dark blue work apron over a white shirt, white towel around his neck';
const MOCHI = 'Mochi, a small plump white cat with orange calico patches';

const c = (s) => `${s}, ${STYLE}, ${ISO}`;
const bg = (s) => `${s}, ${BGSTYLE}`;

module.exports = {
  STYLE, ISO, BGSTYLE, NEG,
  sections: [
    {
      id: 'characters', title: 'Персонажи', intro: 'Начните с листа Аой и используйте его как референс для остальных её поз (функция «референс персонажа» / загрузка картинки в генератор) — так лицо и одежда останутся одинаковыми.',
      items: [
        { id: 'aoi_sheet', title: 'Аой — лист персонажа (4 стороны)', file: 'characters/aoi_sheet.png', size: '1536×1024, 4 вида в ряд', pr: 1,
          prompt: c(`character reference sheet of ${AOI}, four full-body views in one row with equal spacing: front, back, left side, right side, standing idle, same scale, same pixel size`),
          note: 'Из него вырежу стойки «вниз / вверх / вбок» для фермы. Это главный референс для всех её поз.' },
        { id: 'aoi_walk', title: 'Аой — шаг (анимация)', file: 'characters/aoi_walk_side.png', size: '1536×512, 4 кадра в ряд', pr: 2,
          prompt: c(`walk cycle animation sprite sheet of ${AOI}, side view facing right, 4 frames in one row, evenly spaced, same scale, legs clearly alternating`),
          note: 'Если генератор путает кадры — пропустите, я дорисую шаги сам.' },
        ...[['scan', 'holding up a small lantern-shaped drone that glows teal, scanning a leaf, teal light on her face'], ['water', 'watering plants with a tin watering can, water drops falling'], ['victory', 'jumping with both arms raised in joy, sakura petals and coins around'], ['damage', 'sneezing, covering her face, small gray spore clouds around her']].map(([k, d]) => ({
          id: `aoi_${k}`, title: `Аой — поза «${{ scan: 'скан', water: 'полив', victory: 'победа', damage: 'урон' }[k]}»`, file: `characters/aoi_${k}.png`, size: '1024×1024', pr: 2,
          prompt: c(`${AOI}, ${d}, full body, front three-quarter view`),
          note: 'Для заставок, финального экрана и листа персонажа в отчёте.' })),
        { id: 'aoi_home', title: 'Аой дома (без шляпы)', file: 'characters/aoi_home.png', size: '1024×1024', pr: 2,
          prompt: c('Aoi, a 23-year-old Japanese woman with shoulder-length chestnut-brown hair, cozy orange knitted cardigan, blue home trousers, barefoot, holding a cup of tea, standing, full body, front view'),
          note: 'Для сцены «Дом бабушки Хару».' },
        { id: 'aoi_sleep', title: 'Аой спит под одеялом', file: 'characters/aoi_sleep.png', size: '1024×1024', pr: 3,
          prompt: c('top-down view of a young woman with chestnut-brown hair sleeping on a white pillow, only her head visible above a blue futon blanket with a white flower pattern, eyes closed, peaceful'),
          note: 'Необязательно: сейчас это нарисовано кодом.' },
        ...[['idle', 'hovering calmly, lens dark blue'], ['scan', 'lens glowing bright teal, a teal scanning beam cone pointing down'], ['alert', 'lens glowing red, red outline, a small red warning light on top'], ['happy', 'a cute smiling eye shape on the lens, little leaves and sparkles around'], ['damaged', 'darkened gray, propellers drooping, a small puff of smoke, low battery']].map(([k, d], i) => ({
          id: `fuku_${k}`, title: `Фуку — «${['ожидание', 'скан', 'тревога', 'радость', 'повреждение'][i]}»`, file: `characters/fuku_${k}.png`, size: '1024×1024', pr: i < 3 ? 1 : 2,
          prompt: c(`${FUKU}, ${d}, front view`),
          note: i === 0 ? 'Сгенерируйте первым и используйте как референс для остальных четырёх.' : '' })),
        ...[['neutral', 'gentle smile, eyes open'], ['talk', 'talking, mouth open, one hand raised'], ['happy', 'laughing with eyes closed in a happy curve']].map(([k, d], i) => ({
          id: `ogawa_${k}`, title: `Огава — ${['спокоен', 'говорит', 'радуется'][i]}`, file: `characters/ogawa_${k}.png`, size: '1024×1024', pr: 1,
          prompt: c(`${OGAWA}, ${d}, bust portrait from the chest up, front view, as if standing behind a shop counter`),
          note: i === 0 ? 'Встанет за прилавок в лавке. Остальные два — референсом с этого.' : '' })),
        ...[['walk', 'walking, side view facing right'], ['sit', 'sitting upright, tail curled around paws, front view'], ['sleep', 'sleeping curled into a ball']].map(([k, d], i) => ({
          id: `mochi_${k}`, title: `Кошка Моти — ${['идёт', 'сидит', 'спит'][i]}`, file: `characters/mochi_${k}.png`, size: '1024×1024', pr: 2,
          prompt: c(`${MOCHI}, ${d}`), note: '' })),
        { id: 'fisher', title: 'Рыбак у пруда', file: 'characters/fisher.png', size: '1024×1024', pr: 3,
          prompt: c('old Japanese fisherman in a beige bucket hat and a faded blue jacket sitting on a small folding stool, holding a long bamboo fishing rod with a red float, a small blue bucket next to him, side view facing right, calm'),
          note: '' },
        { id: 'haru_photo', title: 'Бабушка Хару (фото в рамке)', file: 'characters/haru_photo.png', size: '1024×1024', pr: 3,
          prompt: c('small framed photograph of grandmother Haru, an elderly Japanese woman with a gray hair bun, purple cardigan, gentle wise smile, standing in a vegetable garden, wooden photo frame'),
          note: 'Для полки в доме и титров.' },
      ],
    },
    {
      id: 'enemies', title: 'Противники', intro: 'Стиль тот же: милые, но зловещие. Размер в игре: тля и спороны маленькие, Хайкаби — крупный босс.',
      items: [
        ...[['idle', 'standing, ready'], ['dash', 'dashing fast to the right with a teal speed trail']].map(([k, d], i) => ({
          id: `aphid_${k}`, title: `Тля-ниндзя — ${['стойка', 'рывок'][i]}`, file: `enemies/aphid_${k}.png`, size: '1024×1024', pr: 2,
          prompt: c(`Ninja Aphid, a small round green aphid insect dressed as a ninja, dark outfit, purple headband, tiny katana on its back, big shiny black eyes, ${d}`), note: '' })),
        ...[['idle', 'standing'], ['attack', 'puffing a cloud of gray-purple spores']].map(([k, d], i) => ({
          id: `sporon_${k}`, title: `Спорон — ${['стойка', 'атака'][i]}`, file: `enemies/sporon_${k}.png`, size: '1024×1024', pr: 2,
          prompt: c(`Sporon, a tiny cute but sinister mushroom creature, gray-purple cap with pale speckles, small red eyes, stubby legs, ${d}`), note: '' })),
        ...[['idle', 'floating menacingly, glowing pale core, teal outline'], ['rage', 'enraged, core glowing hot orange, red outline, tentacles spread wide, spore burst'], ['defeated', 'withered and faded to gray, collapsing, losing color']].map(([k, d], i) => ({
          id: `haikabi_${k}`, title: `Хайкаби — ${['стойка', 'ярость', 'поражение'][i]}`, file: `enemies/haikabi_${k}.png`, size: '1024×1024', pr: 1,
          prompt: c(`Haikabi, a giant gray-purple jellyfish-like mushroom boss with a wide speckled cap, a glowing core in the center and many long curling tentacles, drifting spores, ${d}`),
          note: i === 0 ? 'Главный босс — сгенерируйте первым, остальные два референсом.' : '' })),
      ],
    },
    {
      id: 'world', title: 'Ферма: здания и предметы', intro: 'Вид сверху под углом, как в Stardew Valley. Каждый предмет — отдельной картинкой на зелёном фоне.',
      items: [
        { id: 'house', title: 'Дом бабушки Хару', file: 'world/house.png', size: '1024×1024', pr: 1, prompt: c('small traditional Japanese countryside house, dark gray kawara tiled roof, cream plaster walls with dark wooden beams, a sliding wooden entrance door, two paper windows glowing warmly, a small engawa veranda with a potted plant'), note: '' },
        { id: 'shop', title: 'Лавка Огавы (снаружи)', file: 'world/shop.png', size: '1024×1024', pr: 1, prompt: c('tiny rural Japanese general store, red-and-cream striped fabric awning, wooden facade, a blank sign board without any text, sliding glass door, crates of vegetables and potted plants in front'), note: '' },
        { id: 'vending', title: 'Торговый автомат', file: 'world/vending.png', size: '1024×1024', pr: 2, prompt: c('white Japanese drink vending machine, rows of colorful bottles behind glass, glowing teal and pink buttons, slightly worn'), note: '' },
        { id: 'busstop', title: 'Остановка', file: 'world/busstop.png', size: '1024×1024', pr: 2, prompt: c('small rural Japanese bus stop shelter, light blue metal roof, wooden bench, a blank round bus stop sign on a pole without text'), note: '' },
        { id: 'bus', title: 'Автобус', file: 'world/bus.png', size: '1536×768', pr: 3, prompt: c('small rural Japanese community bus, cream and light-blue livery with a thin red stripe, side view facing left, rounded retro shape'), note: '' },
        { id: 'lamp', title: 'Уличный фонарь', file: 'world/lamp.png', size: '768×1024', pr: 3, prompt: c('old street lamp on a dark metal pole, square lamp head glowing warm yellow'), note: '' },
        ...[['spring', 'lush green leaves with a few pink sakura blossoms'], ['summer', 'dense deep green leaves'], ['autumn', 'orange and red maple leaves, a few falling']].map(([k, d], i) => ({
          id: `tree_${k}`, title: `Дерево — ${['весна', 'лето', 'осень'][i]}`, file: `world/tree_${k}.png`, size: '1024×1024', pr: 2, prompt: c(`round deciduous tree, ${d}, thick brown trunk`), note: '' })),
        { id: 'fence', title: 'Забор (секция)', file: 'world/fence.png', size: '1024×512', pr: 3, prompt: c('one section of a weathered wooden picket fence, two posts and two horizontal rails'), note: '' },
        { id: 'raised_bed', title: 'Грядка (на карте)', file: 'world/raised_bed.png', size: '1024×1024', pr: 2, prompt: c('small square raised garden bed with a wooden border and dark tilled soil with straw mulch, empty, seen from 3/4 top-down'), note: '' },
        ...[['grass', 'short green grass with a few tiny flowers'], ['path', 'packed sandy dirt path with small pebbles'], ['soil_dry', 'dry tilled brown soil in neat furrows'], ['soil_wet', 'wet dark tilled soil in furrows, slightly shiny'], ['water', 'calm pond water with small light ripples']].map(([k, d], i) => ({
          id: `tile_${k}`, title: `Тайл — ${['трава', 'тропинка', 'земля сухая', 'земля мокрая', 'вода'][i]}`, file: `tiles/${k}.png`, size: '1024×1024', pr: 3,
          prompt: `seamless tileable top-down texture of ${d}, 16x16 pixel art tile scaled up, ${STYLE}, fills the whole image edge to edge, no background`,
          note: 'Тайлы генераторы делают хуже всего. Если швы видны — оставим мои.' })),
      ],
    },
    {
      id: 'plants', title: 'Растения крупным планом', intro: 'Для окна «Процедурной». Сначала 9 здоровых (3 культуры × 3 стадии), потом больные — по одному на каждую болезнь из таблицы.',
      items: [
        ...[['tomato', 'tomato plant tied to a wooden stake'], ['potato', 'bushy potato plant'], ['pepper', 'bell pepper plant']].flatMap(([k, d], ci) =>
          [['sprout', 'tiny sprout with two leaves'], ['young', 'young plant without fruit'], ['mature', k === 'potato' ? 'mature plant with small white-yellow flowers' : `mature plant with ripe ${k === 'tomato' ? 'red tomatoes' : 'red, green and orange bell peppers'}`]].map(([s, sd], si) => ({
            id: `plant_${k}_${s}`, title: `${['Томат', 'Картофель', 'Перец'][ci]} — ${['росток', 'растёт', 'созрел'][si]}`, file: `plants/${k}_${s}.png`, size: '768×1024 (вертикально)', pr: si === 2 ? 1 : 2,
            prompt: c(`close-up of a ${d}, ${sd}, growing from soil, side view`), note: '' }))),
        ...[['early_blight', 'tomato', 'brown leaf spots with concentric rings and yellow halos (early blight)'], ['late_blight', 'tomato', 'large dark brown water-soaked blotches, wilting leaves (late blight)'], ['bacterial_spot', 'tomato', 'many small dark spots with yellow edges (bacterial spot)'], ['leaf_mold', 'tomato', 'yellow patches on leaves with olive-gray fuzzy mold underneath (leaf mold)'], ['septoria', 'tomato', 'many small round spots with dark borders and pale centers (septoria leaf spot)'], ['spider_mites', 'tomato', 'stippled pale speckled leaves with fine white spider webs (spider mites)'], ['ylcv', 'tomato', 'curled, cupped, yellow-edged small leaves, stunted (yellow leaf curl virus)']].map(([k, crop, d]) => ({
          id: `plant_sick_${k}`, title: `Больной томат — ${{ early_blight: 'альтернариоз', late_blight: 'фитофтороз', bacterial_spot: 'бакт. пятнистость', leaf_mold: 'кладоспориоз', septoria: 'септориоз', spider_mites: 'паутинный клещ', ylcv: 'вирус YLCV' }[k]}`,
          file: `plants/sick_${k}.png`, size: '768×1024', pr: 3, prompt: c(`close-up of a young ${crop} plant with ${d}, growing from soil, side view`),
          note: 'Тот же промпт подходит для картофеля и перца — замените «tomato».' })),
        ...[['bed_spring', 'spring sunset, sakura petals in the air'], ['bed_summer', 'bright clear summer day, blue sky, puffy clouds'], ['bed_autumn', 'misty autumn evening, orange leaves, low fog']].map(([k, d], i) => ({
          id: k, title: `Фон грядки — ${['весна', 'лето', 'осень'][i]}`, file: `backgrounds/${k}.png`, size: '1024×1152 (почти квадрат)', pr: 2,
          prompt: bg(`close-up of an empty raised wooden garden bed with dark soil and straw mulch in the foreground, a weathered picket fence and green field behind, distant mountains, ${d}, no plants in the bed`), note: 'Фон окна «Процедурной»; растение я поставлю поверх.' })),
      ],
    },
    {
      id: 'scenes', title: 'Сцены и интерьеры', intro: 'Формат 16:9, без зелёного фона. Где персонаж или предмет должен быть отдельно — указано, что оставить пустым.',
      items: [
        { id: 'title_bg', title: 'Заставка главного меню', file: 'backgrounds/title.png', size: '1920×1080', pr: 1, prompt: bg(`wide key art: Japanese mountain village at sunset, terraced vegetable garden in the foreground, a small traditional house, ${AOI} standing in the garden with a lantern-shaped flying drone beside her, power lines, warm nostalgic mood, large empty sky area in the upper half for the game logo`), note: 'Логотип и меню я наложу сверху.' },
        { id: 'shop_bg', title: 'Лавка — помещение (без продавца и прилавка)', file: 'backgrounds/shop_bg.png', size: '1920×1080', pr: 1, prompt: bg('interior of a tiny cozy rural Japanese general store seen from the customer side, wooden plank walls, shelves with glass jars, seed packets and bottles, a red paper lantern hanging from the ceiling in the center, a window with sunset mountains on the left, a blank wooden menu board without text on the right, the center area empty for a shopkeeper, the bottom quarter is plain wooden wall'), note: 'Огава и прилавок встанут поверх.' },
        { id: 'shop_counter', title: 'Прилавок (отдельно)', file: 'backgrounds/shop_counter.png', size: '1920×640', pr: 1, prompt: c('front view of a long wooden shop counter spanning the full width, a vintage cash register on the left, an abacus on the right, a small brass bell'), note: '' },
        { id: 'home_bg', title: 'Комната бабушки Хару — ночь', file: 'backgrounds/home_bg.png', size: '1920×1080', pr: 1, prompt: bg('interior of a grandmother\'s traditional Japanese room at night, tatami floor, a shoji window showing a full moon and a sakura branch, a tokonoma alcove with a hanging scroll and a vase with a flower, a wall shelf with a framed photo, an old red diary and a small charging dock, warm lamp light, empty floor area in the lower right for a futon'), note: '' },
        { id: 'home_fg', title: 'Футон, столик и лампа-андон (отдельно)', file: 'backgrounds/home_fg.png', size: '1920×1080', pr: 2, prompt: c('a cozy Japanese futon with a white pillow and a blue blanket with white flower pattern, a low wooden table with a cup of green tea and a red book, a paper floor lamp (andon) glowing softly, seen from 3/4 above'), note: '' },
        { id: 'home_morning', title: 'Та же комната — утро', file: 'backgrounds/home_morning.png', size: '1920×1080', pr: 3, prompt: bg('same traditional Japanese room in early morning, soft golden sun rays coming through the shoji window, dust in the light, peaceful'), note: 'Сделайте по референсу home_bg.' },
        { id: 'evening', title: 'Вечер на веранде (Ringo-вайб)', file: 'backgrounds/evening.png', size: '1920×1080', pr: 1, prompt: bg('wide cinematic view from a wooden engawa veranda at sunset, a young woman in a yellow raincoat and straw hat sitting with her back to the viewer, a small lantern-shaped drone hovering next to her, layered mountains, power lines and a wooden pole, fireflies, melancholic but warm mood'), note: '' },
        { id: 'boss_bg', title: 'Заброшенная теплица (бой)', file: 'backgrounds/boss_bg.png', size: '1920×1080', pr: 1, prompt: bg('interior of an abandoned greenhouse at dusk, broken glass panes, rusty metal frame, overgrown dead plants, drifting gray-purple spores, eerie purple and teal light, empty center for a giant boss'), note: '' },
        { id: 'festival', title: 'Фестиваль урожая (финал)', file: 'backgrounds/festival.png', size: '1920×1080', pr: 2, prompt: bg('Japanese village harvest festival at night, red paper lanterns on strings, food stalls with baskets of tomatoes and peppers, villagers silhouettes, fireworks in the sky, a girl in a yellow raincoat with a lantern drone celebrating'), note: 'Для экрана победы.' },
        { id: 'diary_book', title: 'Раскрытый дневник (для экрана дневника)', file: 'ui/diary_book.png', size: '1920×1080', pr: 2, prompt: bg('top-down view of an old open notebook with a dark red cloth cover and a red ribbon bookmark, blank cream paper pages with faint lines, a pressed sakura flower and a pencil lying on it, on a wooden desk'), note: 'Страницы должны быть пустыми — текст наложу сам.' },
      ],
    },
    {
      id: 'ui', title: 'Интерфейс и иконки', intro: 'Маленькие предметы: генерируйте крупно, я уменьшу до 16–32 пикселей.',
      items: [
        ...[['coin', 'a golden Japanese coin with a square hole'], ['fungicide', 'a small pink spray bottle of plant medicine'], ['fertilizer', 'a small burlap sack of compost'], ['seeds', 'a paper seed packet with a sprout drawing'], ['lens', 'a small teal glowing battery cell'], ['heart', 'a small pink heart'], ['rain', 'a blue raindrop'], ['sun', 'a warm yellow sun'], ['moon', 'a pale crescent moon'], ['page', 'a torn diary page with a pressed leaf']].map(([k, d]) => ({
          id: `icon_${k}`, title: `Иконка — ${{ coin: 'монета', fungicide: 'фунгицид', fertilizer: 'удобрение', seeds: 'семена', lens: 'заряд линзы', heart: 'сердечко', rain: 'дождь', sun: 'солнце', moon: 'луна', page: 'страница дневника' }[k]}`,
          file: `ui/icon_${k}.png`, size: '512×512', pr: 3, prompt: c(`single game inventory icon of ${d}, bold simple shape, readable at 32x32 pixels`), note: '' })),
        ...[['can', 'a gray tin watering can'], ['spray', 'a pink plastic spray bottle'], ['shears', 'garden pruning shears with red handles']].map(([k, d], i) => ({
          id: `tool_${k}`, title: `Инструмент — ${['лейка', 'спрей', 'ножницы'][i]}`, file: `ui/tool_${k}.png`, size: '512×512', pr: 2, prompt: c(`${d}, side view`), note: 'Для анимаций в «Процедурной».' })),
        { id: 'logo', title: 'Логотип (по желанию)', file: 'ui/logo.png', size: '1536×768', pr: 3, prompt: c('game logo artwork: a small green sprout inside a round magnifying glass, teal and green glossy pixel style, with a red Japanese hanko stamp seal next to it, no letters'), note: 'Буквы SPROUT DOCTOR и катакану наложу сам: генераторы пишут текст с ошибками.' },
      ],
    },
    {
      id: 'music', title: 'Музыка (по желанию)', intro: 'Сейчас музыка синтезируется кодом и работает без файлов. Если хотите «живую» — сгенерируйте в Suno или Udio (инструментал, без голоса), формат mp3/ogg, 1–2 минуты, чтобы трек можно было зациклить.',
      items: [
        { id: 'm_day', title: 'День на ферме', file: 'music/day.mp3', size: '1–2 мин, цикл', pr: 3, prompt: 'lofi city pop instrumental, 82 bpm, warm Rhodes electric piano, soft round bass, brushed drums, gentle guitar, Japanese countryside summer afternoon, nostalgic and cozy, seamless loop, no vocals', note: '' },
        { id: 'm_evening', title: 'Вечер на веранде', file: 'music/evening.mp3', size: '1–2 мин, цикл', pr: 3, prompt: 'ambient lofi instrumental, 64 bpm, soft warm pads, sparse clean guitar, distant cicadas, melancholic but warm, quiet Japanese village at dusk, seamless loop, no vocals', note: '' },
        { id: 'm_scan', title: 'Скан Линзой', file: 'music/scan.mp3', size: '30–60 с, цикл', pr: 3, prompt: 'synthwave instrumental, 112 bpm, analog arpeggios, punchy synth bass, neon retro-futuristic, tense but stylish, short seamless loop, no vocals', note: '' },
        { id: 'm_shop', title: 'Лавка Огавы', file: 'music/shop.mp3', size: '1 мин, цикл', pr: 3, prompt: 'cozy shop music, 70 bpm, music box melody, acoustic guitar, soft bass, warm and friendly, small Japanese store, seamless loop, no vocals', note: '' },
        { id: 'm_boss', title: 'Бой с Хайкаби', file: 'music/boss.mp3', size: '1–2 мин, цикл', pr: 3, prompt: 'dark synthwave chiptune boss battle, 128 bpm, minor key, driving bass, glitchy arpeggios, ominous choir pads, intense, seamless loop, no vocals', note: '' },
        { id: 'm_festival', title: 'Фестиваль (победа)', file: 'music/festival.mp3', size: '30–60 с', pr: 3, prompt: 'joyful Japanese matsuri festival chiptune, taiko drums and shamisen with 8-bit synths, celebratory and bright, triumphant ending, no vocals', note: '' },
      ],
    },
  ],
};
