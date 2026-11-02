"""Спрайты для мира: растения (LPC crops + больные варианты), персонажи LPC, Моти и Фуку из сгенерированных картинок."""
import colorsys, random, sys
from PIL import Image
import numpy as np
R = '/home/claude/assets_src/'; P = '/home/claude/sprout-doctor/public/art/'
# ---- растения ----
CR = Image.open(R + 'frpg/src/assets/spritesheets/crops/crops.png').convert('RGBA')
ROWS = {'tomato': 0, 'potato': 3, 'pepper': 4}
def recolor(im, fn):
    a = np.asarray(im).astype(float).copy(); h, w, _ = a.shape
    for y in range(h):
        for x in range(w):
            if a[y, x, 3] > 0: a[y, x, :3] = fn(x, y, *a[y, x, :3])
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')
rnd = random.Random(3)
def is_leaf(r, g, b): return g > r + 8 and g > b
def sick(x, y, r, g, b):          # жёлтые пятна по листьям
    if is_leaf(r, g, b):
        if (x * 7 + y * 13) % 11 < 3: return (150, 120, 40)
        return (r * 0.9 + 25, g * 0.88, b * 0.7)
    return (r, g, b)
def very_sick(x, y, r, g, b):     # увядание: оливково-бурые листья, лиловые пятна плесени
    if is_leaf(r, g, b):
        if (x * 5 + y * 3) % 9 < 2: return (107, 78, 140)
        v = (r + g + b) / 3; return (v * 0.95 + 30, v * 0.85 + 10, v * 0.45)
    if r > g + 40: return (r * 0.7, g * 0.6, b * 0.6)   # бледные плоды
    return (r, g, b)
def dead(x, y, r, g, b):
    v = (r + g + b) / 3; return (v * 0.75 + 40, v * 0.55 + 20, v * 0.35)
sheet = Image.new('RGBA', (32 * 8, 64 * 3))
for i, (crop, row) in enumerate(ROWS.items()):
    fr = [CR.crop((c * 32, row * 64, c * 32 + 32, row * 64 + 64)) for c in range(5)]
    mature = fr[4]
    fr += [recolor(mature, sick), recolor(mature, very_sick), recolor(fr[3], dead)]
    for j, f in enumerate(fr): sheet.alpha_composite(f, (j * 32, i * 64))
sheet.save(P + 'world/crops.png')
TER = Image.open(R + 'frpg/src/assets/spritesheets/tiled/terrain.png').convert('RGBA')
soil = TER.crop((6 * 32, 20 * 32, 7 * 32, 21 * 32)); soil.save(P + 'world/soil.png')
recolor(soil, lambda x, y, r, g, b: (r * 0.62, g * 0.55, b * 0.55)).save(P + 'world/soil_wet.png')
# ---- персонажи LPC ----
C = R + 'chars/out_hat/'
Image.open(C + 'aoi/walk.png').save(P + 'chars/aoi_walk.png')
Image.open(C + 'aoi_water/thrust.png').save(P + 'chars/aoi_water.png')
Image.open(C + 'aoi/sit.png').save(P + 'chars/aoi_sit.png')
Image.open(R + 'chars/out/fisher/sit.png').save(P + 'chars/fisher_sit.png')
Image.open(R + 'chars/out/ogawa/walk.png').save(P + 'chars/ogawa_walk.png')
# ---- Моти: 4 кадра 36×28 (идёт, идёт-2, сидит, спит) ----
G = P + 'gen/'
def fit(im, w, h, dy=0):
    im = im.copy(); im.thumbnail((w, h), Image.BOX)
    a = np.asarray(im).copy(); a[:, :, 3] = np.where(a[:, :, 3] > 110, 255, 0); im = Image.fromarray(a, 'RGBA')
    c = Image.new('RGBA', (w, h)); c.alpha_composite(im, ((w - im.width) // 2, h - im.height - dy)); return c
walk = Image.open(G + 'mochi_walk.png').convert('RGBA').transpose(Image.FLIP_LEFT_RIGHT)   # исходник смотрит вправо → по умолчанию влево
frames = [fit(walk, 36, 24), fit(walk, 36, 24, 1), fit(Image.open(G + 'mochi_sit.png').convert('RGBA'), 36, 24), fit(Image.open(G + 'mochi_sleep.png').convert('RGBA'), 36, 24)]
m = Image.new('RGBA', (36 * 4, 24))
for i, f in enumerate(frames): m.alpha_composite(f, (i * 36, 0))
m.save(P + 'chars/mochi_small.png')
# ---- Фуку: маленькие кадры для мира (28×32) и крупные для сцен (112×128) ----
order = ['fuku_idle', 'fuku_idle', 'fuku_scan', 'fuku_alert', 'fuku_happy', 'fuku_damaged']
for key, (w, h) in [('fuku_small', (28, 34)), ('fuku_hd', (112, 136))]:
    s = Image.new('RGBA', (w * len(order), h))
    for i, n in enumerate(order):
        f = fit(Image.open(G + n + '.png').convert('RGBA'), w, h, 1 if i == 1 else 0)
        s.alpha_composite(f, (i * w, 0))
    s.save(P + 'chars/' + key + '.png')
print('ok')
