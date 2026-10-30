# Sprout Doctor — промпты для генерации

Всего: 93. Приоритет: 1 — важно, 2 — желательно, 3 — по желанию.

**Негативный промпт:** text, letters, numbers, watermark, signature, logo, frame, border, UI, blurry, smooth gradient, 3D render, photorealistic, extra limbs, cropped, multiple characters

## Персонажи

Начните с листа Аой и используйте его как референс для остальных её поз (функция «референс персонажа» / загрузка картинки в генератор) — так лицо и одежда останутся одинаковыми.

### Аой — лист персонажа (4 стороны) (приоритет 1)

Файл: `characters/aoi_sheet.png` · 1536×1024, 4 вида в ряд

```
character reference sheet of Aoi, a 23-year-old Japanese woman agronomist, shoulder-length chestnut-brown hair, yellow raincoat over green overalls and a white t-shirt, straw hat with a red ribbon, goggles with teal lenses resting on the hat brim, red rubber boots, friendly and determined, four full-body views in one row with equal spacing: front, back, left side, right side, standing idle, same scale, same pixel size, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Из него вырежу стойки «вниз / вверх / вбок» для фермы. Это главный референс для всех её поз.

### Аой — шаг (анимация) (приоритет 2)

Файл: `characters/aoi_walk_side.png` · 1536×512, 4 кадра в ряд

```
walk cycle animation sprite sheet of Aoi, a 23-year-old Japanese woman agronomist, shoulder-length chestnut-brown hair, yellow raincoat over green overalls and a white t-shirt, straw hat with a red ribbon, goggles with teal lenses resting on the hat brim, red rubber boots, friendly and determined, side view facing right, 4 frames in one row, evenly spaced, same scale, legs clearly alternating, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Если генератор путает кадры — пропустите, я дорисую шаги сам.

### Аой — поза «скан» (приоритет 2)

Файл: `characters/aoi_scan.png` · 1024×1024

```
Aoi, a 23-year-old Japanese woman agronomist, shoulder-length chestnut-brown hair, yellow raincoat over green overalls and a white t-shirt, straw hat with a red ribbon, goggles with teal lenses resting on the hat brim, red rubber boots, friendly and determined, holding up a small lantern-shaped drone that glows teal, scanning a leaf, teal light on her face, full body, front three-quarter view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Для заставок, финального экрана и листа персонажа в отчёте.

### Аой — поза «полив» (приоритет 2)

Файл: `characters/aoi_water.png` · 1024×1024

```
Aoi, a 23-year-old Japanese woman agronomist, shoulder-length chestnut-brown hair, yellow raincoat over green overalls and a white t-shirt, straw hat with a red ribbon, goggles with teal lenses resting on the hat brim, red rubber boots, friendly and determined, watering plants with a tin watering can, water drops falling, full body, front three-quarter view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Для заставок, финального экрана и листа персонажа в отчёте.

### Аой — поза «победа» (приоритет 2)

Файл: `characters/aoi_victory.png` · 1024×1024

```
Aoi, a 23-year-old Japanese woman agronomist, shoulder-length chestnut-brown hair, yellow raincoat over green overalls and a white t-shirt, straw hat with a red ribbon, goggles with teal lenses resting on the hat brim, red rubber boots, friendly and determined, jumping with both arms raised in joy, sakura petals and coins around, full body, front three-quarter view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Для заставок, финального экрана и листа персонажа в отчёте.

### Аой — поза «урон» (приоритет 2)

Файл: `characters/aoi_damage.png` · 1024×1024

```
Aoi, a 23-year-old Japanese woman agronomist, shoulder-length chestnut-brown hair, yellow raincoat over green overalls and a white t-shirt, straw hat with a red ribbon, goggles with teal lenses resting on the hat brim, red rubber boots, friendly and determined, sneezing, covering her face, small gray spore clouds around her, full body, front three-quarter view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Для заставок, финального экрана и листа персонажа в отчёте.

### Аой дома (без шляпы) (приоритет 2)

Файл: `characters/aoi_home.png` · 1024×1024

```
Aoi, a 23-year-old Japanese woman with shoulder-length chestnut-brown hair, cozy orange knitted cardigan, blue home trousers, barefoot, holding a cup of tea, standing, full body, front view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Для сцены «Дом бабушки Хару».

### Аой спит под одеялом (приоритет 3)

Файл: `characters/aoi_sleep.png` · 1024×1024

```
top-down view of a young woman with chestnut-brown hair sleeping on a white pillow, only her head visible above a blue futon blanket with a white flower pattern, eyes closed, peaceful, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Необязательно: сейчас это нарисовано кодом.

### Фуку — «ожидание» (приоритет 1)

Файл: `characters/fuku_idle.png` · 1024×1024

```
Fuku, a small flying robot drone shaped like a Japanese paper lantern (chouchin), woven beige paper body with dark ribs, one large round camera lens as its single eye, four tiny teal propellers on top, soft teal glow outline, cute, NOT an owl, NOT a bird, hovering calmly, lens dark blue, front view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Сгенерируйте первым и используйте как референс для остальных четырёх.

### Фуку — «скан» (приоритет 1)

Файл: `characters/fuku_scan.png` · 1024×1024

```
Fuku, a small flying robot drone shaped like a Japanese paper lantern (chouchin), woven beige paper body with dark ribs, one large round camera lens as its single eye, four tiny teal propellers on top, soft teal glow outline, cute, NOT an owl, NOT a bird, lens glowing bright teal, a teal scanning beam cone pointing down, front view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Фуку — «тревога» (приоритет 1)

Файл: `characters/fuku_alert.png` · 1024×1024

```
Fuku, a small flying robot drone shaped like a Japanese paper lantern (chouchin), woven beige paper body with dark ribs, one large round camera lens as its single eye, four tiny teal propellers on top, soft teal glow outline, cute, NOT an owl, NOT a bird, lens glowing red, red outline, a small red warning light on top, front view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Фуку — «радость» (приоритет 2)

Файл: `characters/fuku_happy.png` · 1024×1024

```
Fuku, a small flying robot drone shaped like a Japanese paper lantern (chouchin), woven beige paper body with dark ribs, one large round camera lens as its single eye, four tiny teal propellers on top, soft teal glow outline, cute, NOT an owl, NOT a bird, a cute smiling eye shape on the lens, little leaves and sparkles around, front view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Фуку — «повреждение» (приоритет 2)

Файл: `characters/fuku_damaged.png` · 1024×1024

```
Fuku, a small flying robot drone shaped like a Japanese paper lantern (chouchin), woven beige paper body with dark ribs, one large round camera lens as its single eye, four tiny teal propellers on top, soft teal glow outline, cute, NOT an owl, NOT a bird, darkened gray, propellers drooping, a small puff of smoke, low battery, front view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Огава — спокоен (приоритет 1)

Файл: `characters/ogawa_neutral.png` · 1024×1024

```
Mr. Ogawa, a kind elderly Japanese village shopkeeper about 70 years old, navy blue cap, round glasses, gray sideburns and a small gray mustache, dark blue work apron over a white shirt, white towel around his neck, gentle smile, eyes open, bust portrait from the chest up, front view, as if standing behind a shop counter, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Встанет за прилавок в лавке. Остальные два — референсом с этого.

### Огава — говорит (приоритет 1)

Файл: `characters/ogawa_talk.png` · 1024×1024

```
Mr. Ogawa, a kind elderly Japanese village shopkeeper about 70 years old, navy blue cap, round glasses, gray sideburns and a small gray mustache, dark blue work apron over a white shirt, white towel around his neck, talking, mouth open, one hand raised, bust portrait from the chest up, front view, as if standing behind a shop counter, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Огава — радуется (приоритет 1)

Файл: `characters/ogawa_happy.png` · 1024×1024

```
Mr. Ogawa, a kind elderly Japanese village shopkeeper about 70 years old, navy blue cap, round glasses, gray sideburns and a small gray mustache, dark blue work apron over a white shirt, white towel around his neck, laughing with eyes closed in a happy curve, bust portrait from the chest up, front view, as if standing behind a shop counter, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Кошка Моти — идёт (приоритет 2)

Файл: `characters/mochi_walk.png` · 1024×1024

```
Mochi, a small plump white cat with orange calico patches, walking, side view facing right, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Кошка Моти — сидит (приоритет 2)

Файл: `characters/mochi_sit.png` · 1024×1024

```
Mochi, a small plump white cat with orange calico patches, sitting upright, tail curled around paws, front view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Кошка Моти — спит (приоритет 2)

Файл: `characters/mochi_sleep.png` · 1024×1024

```
Mochi, a small plump white cat with orange calico patches, sleeping curled into a ball, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Рыбак у пруда (приоритет 3)

Файл: `characters/fisher.png` · 1024×1024

```
old Japanese fisherman in a beige bucket hat and a faded blue jacket sitting on a small folding stool, holding a long bamboo fishing rod with a red float, a small blue bucket next to him, side view facing right, calm, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Бабушка Хару (фото в рамке) (приоритет 3)

Файл: `characters/haru_photo.png` · 1024×1024

```
small framed photograph of grandmother Haru, an elderly Japanese woman with a gray hair bun, purple cardigan, gentle wise smile, standing in a vegetable garden, wooden photo frame, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Для полки в доме и титров.

## Противники

Стиль тот же: милые, но зловещие. Размер в игре: тля и спороны маленькие, Хайкаби — крупный босс.

### Тля-ниндзя — стойка (приоритет 2)

Файл: `enemies/aphid_idle.png` · 1024×1024

```
Ninja Aphid, a small round green aphid insect dressed as a ninja, dark outfit, purple headband, tiny katana on its back, big shiny black eyes, standing, ready, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Тля-ниндзя — рывок (приоритет 2)

Файл: `enemies/aphid_dash.png` · 1024×1024

```
Ninja Aphid, a small round green aphid insect dressed as a ninja, dark outfit, purple headband, tiny katana on its back, big shiny black eyes, dashing fast to the right with a teal speed trail, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Спорон — стойка (приоритет 2)

Файл: `enemies/sporon_idle.png` · 1024×1024

```
Sporon, a tiny cute but sinister mushroom creature, gray-purple cap with pale speckles, small red eyes, stubby legs, standing, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Спорон — атака (приоритет 2)

Файл: `enemies/sporon_attack.png` · 1024×1024

```
Sporon, a tiny cute but sinister mushroom creature, gray-purple cap with pale speckles, small red eyes, stubby legs, puffing a cloud of gray-purple spores, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Хайкаби — стойка (приоритет 1)

Файл: `enemies/haikabi_idle.png` · 1024×1024

```
Haikabi, a giant gray-purple jellyfish-like mushroom boss with a wide speckled cap, a glowing core in the center and many long curling tentacles, drifting spores, floating menacingly, glowing pale core, teal outline, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Главный босс — сгенерируйте первым, остальные два референсом.

### Хайкаби — ярость (приоритет 1)

Файл: `enemies/haikabi_rage.png` · 1024×1024

```
Haikabi, a giant gray-purple jellyfish-like mushroom boss with a wide speckled cap, a glowing core in the center and many long curling tentacles, drifting spores, enraged, core glowing hot orange, red outline, tentacles spread wide, spore burst, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Хайкаби — поражение (приоритет 1)

Файл: `enemies/haikabi_defeated.png` · 1024×1024

```
Haikabi, a giant gray-purple jellyfish-like mushroom boss with a wide speckled cap, a glowing core in the center and many long curling tentacles, drifting spores, withered and faded to gray, collapsing, losing color, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

## Ферма: здания и предметы

Вид сверху под углом, как в Stardew Valley. Каждый предмет — отдельной картинкой на зелёном фоне.

### Дом бабушки Хару (приоритет 1)

Файл: `world/house.png` · 1024×1024

```
small traditional Japanese countryside house, dark gray kawara tiled roof, cream plaster walls with dark wooden beams, a sliding wooden entrance door, two paper windows glowing warmly, a small engawa veranda with a potted plant, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Лавка Огавы (снаружи) (приоритет 1)

Файл: `world/shop.png` · 1024×1024

```
tiny rural Japanese general store, red-and-cream striped fabric awning, wooden facade, a blank sign board without any text, sliding glass door, crates of vegetables and potted plants in front, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Торговый автомат (приоритет 2)

Файл: `world/vending.png` · 1024×1024

```
white Japanese drink vending machine, rows of colorful bottles behind glass, glowing teal and pink buttons, slightly worn, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Остановка (приоритет 2)

Файл: `world/busstop.png` · 1024×1024

```
small rural Japanese bus stop shelter, light blue metal roof, wooden bench, a blank round bus stop sign on a pole without text, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Автобус (приоритет 3)

Файл: `world/bus.png` · 1536×768

```
small rural Japanese community bus, cream and light-blue livery with a thin red stripe, side view facing left, rounded retro shape, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Уличный фонарь (приоритет 3)

Файл: `world/lamp.png` · 768×1024

```
old street lamp on a dark metal pole, square lamp head glowing warm yellow, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Дерево — весна (приоритет 2)

Файл: `world/tree_spring.png` · 1024×1024

```
round deciduous tree, lush green leaves with a few pink sakura blossoms, thick brown trunk, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Дерево — лето (приоритет 2)

Файл: `world/tree_summer.png` · 1024×1024

```
round deciduous tree, dense deep green leaves, thick brown trunk, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Дерево — осень (приоритет 2)

Файл: `world/tree_autumn.png` · 1024×1024

```
round deciduous tree, orange and red maple leaves, a few falling, thick brown trunk, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Забор (секция) (приоритет 3)

Файл: `world/fence.png` · 1024×512

```
one section of a weathered wooden picket fence, two posts and two horizontal rails, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Грядка (на карте) (приоритет 2)

Файл: `world/raised_bed.png` · 1024×1024

```
small square raised garden bed with a wooden border and dark tilled soil with straw mulch, empty, seen from 3/4 top-down, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Тайл — трава (приоритет 3)

Файл: `tiles/grass.png` · 1024×1024

```
seamless tileable top-down texture of short green grass with a few tiny flowers, 16x16 pixel art tile scaled up, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, fills the whole image edge to edge, no background
```

Тайлы генераторы делают хуже всего. Если швы видны — оставим мои.

### Тайл — тропинка (приоритет 3)

Файл: `tiles/path.png` · 1024×1024

```
seamless tileable top-down texture of packed sandy dirt path with small pebbles, 16x16 pixel art tile scaled up, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, fills the whole image edge to edge, no background
```

Тайлы генераторы делают хуже всего. Если швы видны — оставим мои.

### Тайл — земля сухая (приоритет 3)

Файл: `tiles/soil_dry.png` · 1024×1024

```
seamless tileable top-down texture of dry tilled brown soil in neat furrows, 16x16 pixel art tile scaled up, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, fills the whole image edge to edge, no background
```

Тайлы генераторы делают хуже всего. Если швы видны — оставим мои.

### Тайл — земля мокрая (приоритет 3)

Файл: `tiles/soil_wet.png` · 1024×1024

```
seamless tileable top-down texture of wet dark tilled soil in furrows, slightly shiny, 16x16 pixel art tile scaled up, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, fills the whole image edge to edge, no background
```

Тайлы генераторы делают хуже всего. Если швы видны — оставим мои.

### Тайл — вода (приоритет 3)

Файл: `tiles/water.png` · 1024×1024

```
seamless tileable top-down texture of calm pond water with small light ripples, 16x16 pixel art tile scaled up, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, fills the whole image edge to edge, no background
```

Тайлы генераторы делают хуже всего. Если швы видны — оставим мои.

## Растения крупным планом

Для окна «Процедурной». Сначала 9 здоровых (3 культуры × 3 стадии), потом больные — по одному на каждую болезнь из таблицы.

### Томат — росток (приоритет 2)

Файл: `plants/tomato_sprout.png` · 768×1024 (вертикально)

```
close-up of a tomato plant tied to a wooden stake, tiny sprout with two leaves, growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Томат — растёт (приоритет 2)

Файл: `plants/tomato_young.png` · 768×1024 (вертикально)

```
close-up of a tomato plant tied to a wooden stake, young plant without fruit, growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Томат — созрел (приоритет 1)

Файл: `plants/tomato_mature.png` · 768×1024 (вертикально)

```
close-up of a tomato plant tied to a wooden stake, mature plant with ripe red tomatoes, growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Картофель — росток (приоритет 2)

Файл: `plants/potato_sprout.png` · 768×1024 (вертикально)

```
close-up of a bushy potato plant, tiny sprout with two leaves, growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Картофель — растёт (приоритет 2)

Файл: `plants/potato_young.png` · 768×1024 (вертикально)

```
close-up of a bushy potato plant, young plant without fruit, growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Картофель — созрел (приоритет 1)

Файл: `plants/potato_mature.png` · 768×1024 (вертикально)

```
close-up of a bushy potato plant, mature plant with small white-yellow flowers, growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Перец — росток (приоритет 2)

Файл: `plants/pepper_sprout.png` · 768×1024 (вертикально)

```
close-up of a bell pepper plant, tiny sprout with two leaves, growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Перец — растёт (приоритет 2)

Файл: `plants/pepper_young.png` · 768×1024 (вертикально)

```
close-up of a bell pepper plant, young plant without fruit, growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Перец — созрел (приоритет 1)

Файл: `plants/pepper_mature.png` · 768×1024 (вертикально)

```
close-up of a bell pepper plant, mature plant with ripe red, green and orange bell peppers, growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Больной томат — альтернариоз (приоритет 3)

Файл: `plants/sick_early_blight.png` · 768×1024

```
close-up of a young tomato plant with brown leaf spots with concentric rings and yellow halos (early blight), growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Тот же промпт подходит для картофеля и перца — замените «tomato».

### Больной томат — фитофтороз (приоритет 3)

Файл: `plants/sick_late_blight.png` · 768×1024

```
close-up of a young tomato plant with large dark brown water-soaked blotches, wilting leaves (late blight), growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Тот же промпт подходит для картофеля и перца — замените «tomato».

### Больной томат — бакт. пятнистость (приоритет 3)

Файл: `plants/sick_bacterial_spot.png` · 768×1024

```
close-up of a young tomato plant with many small dark spots with yellow edges (bacterial spot), growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Тот же промпт подходит для картофеля и перца — замените «tomato».

### Больной томат — кладоспориоз (приоритет 3)

Файл: `plants/sick_leaf_mold.png` · 768×1024

```
close-up of a young tomato plant with yellow patches on leaves with olive-gray fuzzy mold underneath (leaf mold), growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Тот же промпт подходит для картофеля и перца — замените «tomato».

### Больной томат — септориоз (приоритет 3)

Файл: `plants/sick_septoria.png` · 768×1024

```
close-up of a young tomato plant with many small round spots with dark borders and pale centers (septoria leaf spot), growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Тот же промпт подходит для картофеля и перца — замените «tomato».

### Больной томат — паутинный клещ (приоритет 3)

Файл: `plants/sick_spider_mites.png` · 768×1024

```
close-up of a young tomato plant with stippled pale speckled leaves with fine white spider webs (spider mites), growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Тот же промпт подходит для картофеля и перца — замените «tomato».

### Больной томат — вирус YLCV (приоритет 3)

Файл: `plants/sick_ylcv.png` · 768×1024

```
close-up of a young tomato plant with curled, cupped, yellow-edged small leaves, stunted (yellow leaf curl virus), growing from soil, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Тот же промпт подходит для картофеля и перца — замените «tomato».

### Фон грядки — весна (приоритет 2)

Файл: `backgrounds/bed_spring.png` · 1024×1152 (почти квадрат)

```
close-up of an empty raised wooden garden bed with dark soil and straw mulch in the foreground, a weathered picket fence and green field behind, distant mountains, spring sunset, sakura petals in the air, no plants in the bed, cozy pixel art game background, looks like a 320x180 pixel image scaled up, Japanese countryside, Stardew Valley meets The Friends of Ringo Ishikawa, limited warm palette (indigo #2B2A4C, sunset orange #E8833A, sakura pink #F2A7B8, cream #F6E7C1, forest green #4F8A3C), subtle dithering, crisp pixels, no anti-aliasing
```

Фон окна «Процедурной»; растение я поставлю поверх.

### Фон грядки — лето (приоритет 2)

Файл: `backgrounds/bed_summer.png` · 1024×1152 (почти квадрат)

```
close-up of an empty raised wooden garden bed with dark soil and straw mulch in the foreground, a weathered picket fence and green field behind, distant mountains, bright clear summer day, blue sky, puffy clouds, no plants in the bed, cozy pixel art game background, looks like a 320x180 pixel image scaled up, Japanese countryside, Stardew Valley meets The Friends of Ringo Ishikawa, limited warm palette (indigo #2B2A4C, sunset orange #E8833A, sakura pink #F2A7B8, cream #F6E7C1, forest green #4F8A3C), subtle dithering, crisp pixels, no anti-aliasing
```

Фон окна «Процедурной»; растение я поставлю поверх.

### Фон грядки — осень (приоритет 2)

Файл: `backgrounds/bed_autumn.png` · 1024×1152 (почти квадрат)

```
close-up of an empty raised wooden garden bed with dark soil and straw mulch in the foreground, a weathered picket fence and green field behind, distant mountains, misty autumn evening, orange leaves, low fog, no plants in the bed, cozy pixel art game background, looks like a 320x180 pixel image scaled up, Japanese countryside, Stardew Valley meets The Friends of Ringo Ishikawa, limited warm palette (indigo #2B2A4C, sunset orange #E8833A, sakura pink #F2A7B8, cream #F6E7C1, forest green #4F8A3C), subtle dithering, crisp pixels, no anti-aliasing
```

Фон окна «Процедурной»; растение я поставлю поверх.

## Сцены и интерьеры

Формат 16:9, без зелёного фона. Где персонаж или предмет должен быть отдельно — указано, что оставить пустым.

### Заставка главного меню (приоритет 1)

Файл: `backgrounds/title.png` · 1920×1080

```
wide key art: Japanese mountain village at sunset, terraced vegetable garden in the foreground, a small traditional house, Aoi, a 23-year-old Japanese woman agronomist, shoulder-length chestnut-brown hair, yellow raincoat over green overalls and a white t-shirt, straw hat with a red ribbon, goggles with teal lenses resting on the hat brim, red rubber boots, friendly and determined standing in the garden with a lantern-shaped flying drone beside her, power lines, warm nostalgic mood, large empty sky area in the upper half for the game logo, cozy pixel art game background, looks like a 320x180 pixel image scaled up, Japanese countryside, Stardew Valley meets The Friends of Ringo Ishikawa, limited warm palette (indigo #2B2A4C, sunset orange #E8833A, sakura pink #F2A7B8, cream #F6E7C1, forest green #4F8A3C), subtle dithering, crisp pixels, no anti-aliasing
```

Логотип и меню я наложу сверху.

### Лавка — помещение (без продавца и прилавка) (приоритет 1)

Файл: `backgrounds/shop_bg.png` · 1920×1080

```
interior of a tiny cozy rural Japanese general store seen from the customer side, wooden plank walls, shelves with glass jars, seed packets and bottles, a red paper lantern hanging from the ceiling in the center, a window with sunset mountains on the left, a blank wooden menu board without text on the right, the center area empty for a shopkeeper, the bottom quarter is plain wooden wall, cozy pixel art game background, looks like a 320x180 pixel image scaled up, Japanese countryside, Stardew Valley meets The Friends of Ringo Ishikawa, limited warm palette (indigo #2B2A4C, sunset orange #E8833A, sakura pink #F2A7B8, cream #F6E7C1, forest green #4F8A3C), subtle dithering, crisp pixels, no anti-aliasing
```

Огава и прилавок встанут поверх.

### Прилавок (отдельно) (приоритет 1)

Файл: `backgrounds/shop_counter.png` · 1920×640

```
front view of a long wooden shop counter spanning the full width, a vintage cash register on the left, an abacus on the right, a small brass bell, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Комната бабушки Хару — ночь (приоритет 1)

Файл: `backgrounds/home_bg.png` · 1920×1080

```
interior of a grandmother's traditional Japanese room at night, tatami floor, a shoji window showing a full moon and a sakura branch, a tokonoma alcove with a hanging scroll and a vase with a flower, a wall shelf with a framed photo, an old red diary and a small charging dock, warm lamp light, empty floor area in the lower right for a futon, cozy pixel art game background, looks like a 320x180 pixel image scaled up, Japanese countryside, Stardew Valley meets The Friends of Ringo Ishikawa, limited warm palette (indigo #2B2A4C, sunset orange #E8833A, sakura pink #F2A7B8, cream #F6E7C1, forest green #4F8A3C), subtle dithering, crisp pixels, no anti-aliasing
```

### Футон, столик и лампа-андон (отдельно) (приоритет 2)

Файл: `backgrounds/home_fg.png` · 1920×1080

```
a cozy Japanese futon with a white pillow and a blue blanket with white flower pattern, a low wooden table with a cup of green tea and a red book, a paper floor lamp (andon) glowing softly, seen from 3/4 above, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Та же комната — утро (приоритет 3)

Файл: `backgrounds/home_morning.png` · 1920×1080

```
same traditional Japanese room in early morning, soft golden sun rays coming through the shoji window, dust in the light, peaceful, cozy pixel art game background, looks like a 320x180 pixel image scaled up, Japanese countryside, Stardew Valley meets The Friends of Ringo Ishikawa, limited warm palette (indigo #2B2A4C, sunset orange #E8833A, sakura pink #F2A7B8, cream #F6E7C1, forest green #4F8A3C), subtle dithering, crisp pixels, no anti-aliasing
```

Сделайте по референсу home_bg.

### Вечер на веранде (Ringo-вайб) (приоритет 1)

Файл: `backgrounds/evening.png` · 1920×1080

```
wide cinematic view from a wooden engawa veranda at sunset, a young woman in a yellow raincoat and straw hat sitting with her back to the viewer, a small lantern-shaped drone hovering next to her, layered mountains, power lines and a wooden pole, fireflies, melancholic but warm mood, cozy pixel art game background, looks like a 320x180 pixel image scaled up, Japanese countryside, Stardew Valley meets The Friends of Ringo Ishikawa, limited warm palette (indigo #2B2A4C, sunset orange #E8833A, sakura pink #F2A7B8, cream #F6E7C1, forest green #4F8A3C), subtle dithering, crisp pixels, no anti-aliasing
```

### Заброшенная теплица (бой) (приоритет 1)

Файл: `backgrounds/boss_bg.png` · 1920×1080

```
interior of an abandoned greenhouse at dusk, broken glass panes, rusty metal frame, overgrown dead plants, drifting gray-purple spores, eerie purple and teal light, empty center for a giant boss, cozy pixel art game background, looks like a 320x180 pixel image scaled up, Japanese countryside, Stardew Valley meets The Friends of Ringo Ishikawa, limited warm palette (indigo #2B2A4C, sunset orange #E8833A, sakura pink #F2A7B8, cream #F6E7C1, forest green #4F8A3C), subtle dithering, crisp pixels, no anti-aliasing
```

### Фестиваль урожая (финал) (приоритет 2)

Файл: `backgrounds/festival.png` · 1920×1080

```
Japanese village harvest festival at night, red paper lanterns on strings, food stalls with baskets of tomatoes and peppers, villagers silhouettes, fireworks in the sky, a girl in a yellow raincoat with a lantern drone celebrating, cozy pixel art game background, looks like a 320x180 pixel image scaled up, Japanese countryside, Stardew Valley meets The Friends of Ringo Ishikawa, limited warm palette (indigo #2B2A4C, sunset orange #E8833A, sakura pink #F2A7B8, cream #F6E7C1, forest green #4F8A3C), subtle dithering, crisp pixels, no anti-aliasing
```

Для экрана победы.

### Раскрытый дневник (для экрана дневника) (приоритет 2)

Файл: `ui/diary_book.png` · 1920×1080

```
top-down view of an old open notebook with a dark red cloth cover and a red ribbon bookmark, blank cream paper pages with faint lines, a pressed sakura flower and a pencil lying on it, on a wooden desk, cozy pixel art game background, looks like a 320x180 pixel image scaled up, Japanese countryside, Stardew Valley meets The Friends of Ringo Ishikawa, limited warm palette (indigo #2B2A4C, sunset orange #E8833A, sakura pink #F2A7B8, cream #F6E7C1, forest green #4F8A3C), subtle dithering, crisp pixels, no anti-aliasing
```

Страницы должны быть пустыми — текст наложу сам.

## Интерфейс и иконки

Маленькие предметы: генерируйте крупно, я уменьшу до 16–32 пикселей.

### Иконка — монета (приоритет 3)

Файл: `ui/icon_coin.png` · 512×512

```
single game inventory icon of a golden Japanese coin with a square hole, bold simple shape, readable at 32x32 pixels, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Иконка — фунгицид (приоритет 3)

Файл: `ui/icon_fungicide.png` · 512×512

```
single game inventory icon of a small pink spray bottle of plant medicine, bold simple shape, readable at 32x32 pixels, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Иконка — удобрение (приоритет 3)

Файл: `ui/icon_fertilizer.png` · 512×512

```
single game inventory icon of a small burlap sack of compost, bold simple shape, readable at 32x32 pixels, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Иконка — семена (приоритет 3)

Файл: `ui/icon_seeds.png` · 512×512

```
single game inventory icon of a paper seed packet with a sprout drawing, bold simple shape, readable at 32x32 pixels, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Иконка — заряд линзы (приоритет 3)

Файл: `ui/icon_lens.png` · 512×512

```
single game inventory icon of a small teal glowing battery cell, bold simple shape, readable at 32x32 pixels, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Иконка — сердечко (приоритет 3)

Файл: `ui/icon_heart.png` · 512×512

```
single game inventory icon of a small pink heart, bold simple shape, readable at 32x32 pixels, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Иконка — дождь (приоритет 3)

Файл: `ui/icon_rain.png` · 512×512

```
single game inventory icon of a blue raindrop, bold simple shape, readable at 32x32 pixels, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Иконка — солнце (приоритет 3)

Файл: `ui/icon_sun.png` · 512×512

```
single game inventory icon of a warm yellow sun, bold simple shape, readable at 32x32 pixels, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Иконка — луна (приоритет 3)

Файл: `ui/icon_moon.png` · 512×512

```
single game inventory icon of a pale crescent moon, bold simple shape, readable at 32x32 pixels, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Иконка — страница дневника (приоритет 3)

Файл: `ui/icon_page.png` · 512×512

```
single game inventory icon of a torn diary page with a pressed leaf, bold simple shape, readable at 32x32 pixels, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

### Инструмент — лейка (приоритет 2)

Файл: `ui/tool_can.png` · 512×512

```
a gray tin watering can, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Для анимаций в «Процедурной».

### Инструмент — спрей (приоритет 2)

Файл: `ui/tool_spray.png` · 512×512

```
a pink plastic spray bottle, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Для анимаций в «Процедурной».

### Инструмент — ножницы (приоритет 2)

Файл: `ui/tool_shears.png` · 512×512

```
garden pruning shears with red handles, side view, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Для анимаций в «Процедурной».

### Логотип (по желанию) (приоритет 3)

Файл: `ui/logo.png` · 1536×768

```
game logo artwork: a small green sprout inside a round magnifying glass, teal and green glossy pixel style, with a red Japanese hanko stamp seal next to it, no letters, cozy pixel art, 16-bit Stardew Valley inspired game sprite, 3/4 top-down view, clean 1-pixel dark outline (#1e1b2e), limited palette: forest green #4F8A3C, warm earth #8A5A3B, cream #F6E7C1, sunset orange #E8833A, sakura pink #F2A7B8, indigo #2B2A4C, teal #3FD0C9, magenta #FF4F9A, soft golden-hour light, subtle dithering, crisp hard pixel edges, no anti-aliasing, isolated on a plain flat solid #00FF00 chroma-green background, no shadow on the background, centered, whole object visible with empty margin around it
```

Буквы SPROUT DOCTOR и катакану наложу сам: генераторы пишут текст с ошибками.

## Музыка (по желанию)

Сейчас музыка синтезируется кодом и работает без файлов. Если хотите «живую» — сгенерируйте в Suno или Udio (инструментал, без голоса), формат mp3/ogg, 1–2 минуты, чтобы трек можно было зациклить.

### День на ферме (приоритет 3)

Файл: `music/day.mp3` · 1–2 мин, цикл

```
lofi city pop instrumental, 82 bpm, warm Rhodes electric piano, soft round bass, brushed drums, gentle guitar, Japanese countryside summer afternoon, nostalgic and cozy, seamless loop, no vocals
```

### Вечер на веранде (приоритет 3)

Файл: `music/evening.mp3` · 1–2 мин, цикл

```
ambient lofi instrumental, 64 bpm, soft warm pads, sparse clean guitar, distant cicadas, melancholic but warm, quiet Japanese village at dusk, seamless loop, no vocals
```

### Скан Линзой (приоритет 3)

Файл: `music/scan.mp3` · 30–60 с, цикл

```
synthwave instrumental, 112 bpm, analog arpeggios, punchy synth bass, neon retro-futuristic, tense but stylish, short seamless loop, no vocals
```

### Лавка Огавы (приоритет 3)

Файл: `music/shop.mp3` · 1 мин, цикл

```
cozy shop music, 70 bpm, music box melody, acoustic guitar, soft bass, warm and friendly, small Japanese store, seamless loop, no vocals
```

### Бой с Хайкаби (приоритет 3)

Файл: `music/boss.mp3` · 1–2 мин, цикл

```
dark synthwave chiptune boss battle, 128 bpm, minor key, driving bass, glitchy arpeggios, ominous choir pads, intense, seamless loop, no vocals
```

### Фестиваль (победа) (приоритет 3)

Файл: `music/festival.mp3` · 30–60 с

```
joyful Japanese matsuri festival chiptune, taiko drums and shamisen with 8-bit synths, celebratory and bright, triumphant ending, no vocals
```

