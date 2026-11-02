"""Ферма в стиле Ninja Adventure (16 px = 1 ед. мира). Фон + объекты + src/world/layout.ts."""
import json, random, sys
from PIL import Image
import numpy as np
sys.path.insert(0, '/home/claude/assets_src/tools'); from na_catalog import comps
TS = Image.open('/home/claude/assets_src/packs/sp/ninja-adventure/background-elements/tileset.png').convert('RGBA')
TH = Image.open('/home/claude/assets_src/packs/top-down-game2/assets/Objects/TilesetHouse.png').convert('RGBA')
OUT = '/home/claude/sprout-doctor/public/art/naw/'
import os; os.makedirs(OUT, exist_ok=True)
MW, MH = 32, 22
def t(x, y, w=1, h=1, src=TS): return src.crop((x * 16, y * 16, (x + w) * 16, (y + h) * 16))
def trim(im): bb = im.getbbox(); return im.crop(bb) if bb else im
rnd = random.Random(5)
bg = Image.new('RGBA', (MW * 16, MH * 16))
def put(im, tx, ty): bg.alpha_composite(im, (int(tx * 16), int(ty * 16)))
# ---- земля: трава; песчаные тропинки и дворики; «плато» травы с обрывом; огород; пруд ----
GR = np.asarray(t(22, 11)).copy()
for y in range(MH):
    for x in range(MW): put(t(22, 11), x, y)
# тропинки (в пикселях): мягкие края, тёмная кромка, редкие камешки
PATHS = [
    (4 * 16, 7 * 16, 4 * 16, 2 * 16),            # двор у дома
    (6 * 16, 8 * 16 + 4, 10 * 16, 22),           # от дома на восток
    (15 * 16, 6 * 16 + 4, 14 * 16, 22),          # вдоль огорода к лавке
    (20 * 16, 5 * 16, 7 * 16, 2 * 16),           # двор у лавки
    (15 * 16, 6 * 16 + 4, 26, 13 * 16),          # на юг к тории
    (7 * 16, 9 * 16, 22, 26),                    # к пруду
    (0, 19 * 16 + 6, MW * 16, 2 * 16 + 10),     # дорога (автобус)
    (27 * 16, 17 * 16 + 8, 3 * 16, 2 * 16),      # площадка у остановки
]
mask = np.zeros((MH * 16, MW * 16), bool)
for (x, y, w, h) in PATHS: mask[y:y + h, x:x + w] = True
import scipy.ndimage as nd0
mask = nd0.binary_closing(mask, np.ones((5, 5)))
# неровный край: случайно «откусываем»/добавляем пиксели по границе
edge = mask ^ nd0.binary_erosion(mask)
rng = np.random.RandomState(7)
ys, xs = np.where(edge)
for y, x in zip(ys, xs):
    if rng.rand() < 0.35: mask[y, x] = False
outer = nd0.binary_dilation(mask) & ~mask
ys, xs = np.where(outer)
for y, x in zip(ys, xs):
    if rng.rand() < 0.15: mask[y, x] = True
A = np.asarray(bg).copy()
SANDC = np.array([255, 173, 93, 255], np.uint8)
A[mask] = SANDC
peb = mask & (rng.rand(*mask.shape) < 0.012)
A[peb] = [255, 203, 141, 255]
peb2 = mask & (rng.rand(*mask.shape) < 0.006)
A[peb2] = [239, 140, 70, 255]
rim = mask & ~nd0.binary_erosion(mask)
A[rim] = [240, 150, 78, 255]
grim = nd0.binary_dilation(mask) & ~mask
A[grim] = [56, 125, 45, 255]
bg = Image.fromarray(A, 'RGBA')
PATHMASK = mask
GRASS = (14, 15, 17, 15, 16, 17)
plateaus = [(0, 0, MW, 4), (8, 15, 14, 18), (23, 16, 28, 19)]
for (x0, y0, x1, y1) in plateaus:
    def nine_(x0, y0, x1, y1):
        for y in range(y0, y1):
            for x in range(x0, x1):
                cx = 15 if x == x0 else 17 if x == x1 - 1 else 16
                cy = 15 if y == y0 else 17 if y == y1 - 1 else 16
                put(t(cx, cy), x, y)
    nine_(x0, y0, x1, y1)
    for y in range(y0 + 1, y1 - 1):
        for x in range(x0 + 1, x1 - 1): put(t(22, 11), x, y)
# у краёв уступов тайлы рассчитаны на песок вокруг — заменяем песчаные пиксели травой
A = np.asarray(bg).copy()
for (x0, y0, x1, y1) in plateaus:
    for py in range(y0 * 16, y1 * 16):
        for px in range(x0 * 16, x1 * 16):
            r, g, b, al = A[py, px]
            if r > 200 and g > 120 and b < 150: A[py, px] = GR[py % 16, px % 16]
bg = Image.fromarray(A, 'RGBA')
def nine(x0, y0, x1, y1, L, M, R, Tp, Mid, Bt):
    for y in range(y0, y1):
        for x in range(x0, x1):
            cx = L if x == x0 else R if x == x1 - 1 else M
            cy = Tp if y == y0 else Bt if y == y1 - 1 else Mid
            put(t(cx, cy), x, y)
GARDEN = (17, 8, 27, 15)
nine(*GARDEN, 20, 21, 22, 15, 16, 17)
POND = (4, 10, 9, 14)
nine(*POND, 19, 20, 21, 7, 8, 9)
# углы пруда были рассчитаны на песок — меняем оранжевые пиксели на траву
A = np.asarray(bg).copy()
for py in range(POND[1] * 16, POND[3] * 16):
    for px in range(POND[0] * 16, POND[2] * 16):
        r, g, b, al = A[py, px]
        if (r > 200 and g > 100 and b < 150) or (120 < r < 170 and 80 < g < 125 and 80 < b < 120): A[py, px] = GR[py % 16, px % 16]   # песок и бурая кромка в углах
bg = Image.fromarray(A, 'RGBA')
bg.alpha_composite(t(23, 8), (5 * 16, 11 * 16)); bg.alpha_composite(t(23, 8), (7 * 16 + 4, 12 * 16))
# мелочь на траве: травка, цветочки (не на тропинках)
DECO = [t(0, 5), t(2, 8), t(0, 8), t(1, 8), t(0, 5)]
for _ in range(70):
    x, y = rnd.randrange(3, MW - 3), rnd.randrange(4, MH - 1)
    if GARDEN[0] - 1 <= x <= GARDEN[2] and GARDEN[1] - 1 <= y <= GARDEN[3]: continue
    if POND[0] - 1 <= x <= POND[2] and POND[1] - 1 <= y <= POND[3]: continue
    if PATHMASK[y * 16:(y + 1) * 16, x * 16:(x + 1) * 16].any(): continue
    bg.alpha_composite(rnd.choice(DECO), (x * 16 + rnd.randrange(-4, 5), y * 16 + rnd.randrange(-4, 5)))
bg.save(OUT + 'ground.png')
# ---- объекты ----
objs = []
def save(key, im): im.save(OUT + key + '.png'); return im
def solid_auto(im, x, y, kind):
    a = np.asarray(im)[:, :, 3] > 0; ys, xs = np.where(a); w, h = im.size
    if kind == 'tree':  return [x + w * 0.3, y + h * 0.78, w * 0.4, h * 0.18]
    if kind == 'none':  return None
    return [x + 1, y + h * 0.55, w - 2, h * 0.4]     # нижняя часть предмета
def obj(key, im, x, y, kind='box', depth=None):
    save(key, im); w, h = im.size
    objs.append(dict(key=key, x=x, y=y, depth=depth if depth is not None else y + h, solid=solid_auto(im, x, y, kind), hidden=False))
C = lambda sheet, rect, i=0: comps(sheet, rect)[i][1]
house = trim(t(0, 0, 4, 3)); shop = trim(t(19, 0, 4, 3, TH))
obj('house', house, 4 * 16, 4 * 16, 'house'); objs[-1]['solid'] = [4 * 16 + 2, 4 * 16 + 16, 60, 30]
DOOR_HOUSE = (4 * 16 + 32, 4 * 16 + 48)
obj('shop', shop, 21 * 16, 3 * 16, 'house'); objs[-1]['solid'] = [21 * 16 + 2, 3 * 16 + 18, 60, 28]
DOOR_SHOP = (21 * 16 + 38, 3 * 16 + 48)
# лес и рощи (кластеры деревьев NA)
grove, pines, sakura = C('T', [0, 9, 6, 3]), C('T', [6, 9, 6, 3], 2), None
sk = TS.crop((64, 240, 160, 288)).copy(); a = np.asarray(sk).copy()
sandc = {tuple(p[:3]) for p in np.asarray(TS.crop((18 * 16, 6 * 16, 19 * 16, 7 * 16))).reshape(-1, 4)} | {tuple(p[:3]) for p in np.asarray(TS.crop((5 * 16, 14 * 16, 6 * 16, 15 * 16))).reshape(-1, 4)}
import scipy.ndimage as nd
m = np.array([[tuple(a[y, x, :3]) not in sandc for x in range(a.shape[1])] for y in range(a.shape[0])]) & (a[:, :, 3] > 0)
lab, n = nd.label(m, structure=np.ones((3, 3))); big = np.argmax(np.bincount(lab.ravel())[1:]) + 1
a[lab != big] = 0
green = (a[:, :, 1].astype(int) > a[:, :, 0].astype(int) + 10); a[green] = 0; sakura = trim(Image.fromarray(a, 'RGBA'))
bonsai = C('T', [12, 8, 2, 2])
for i, x in enumerate(range(-8, MW * 16, 44)):
    if 60 < x < 140 or 330 < x < 400: continue
    obj(f'pines', pines, x, -22 + (i % 2) * 6, 'tree')
obj('grove', grove, -14, 90, 'tree'); obj('grove', grove, -10, 190, 'tree'); obj('grove', grove, MW * 16 - 72, 100, 'tree')
obj('sakura', sakura, 150, 40, 'tree'); obj('sakura', sakura, 300, 248, 'tree')


# торий у входа в деревню, каменные фонари
obj('torii', C('T', [0, 3, 3, 2]), 14 * 16, 16 * 16, 'none', depth=17 * 16 + 4)
objs.append(dict(key='torii_post', x=0, y=0, depth=0, solid=[14 * 16 + 2, 17 * 16 + 4, 6, 6], hidden=True))
objs.append(dict(key='torii_post', x=0, y=0, depth=0, solid=[16 * 16 + 10, 17 * 16 + 4, 6, 6], hidden=True))
lan = C('T', [3, 3, 2, 4], 2)
obj('lantern', lan, 13 * 16, 16 * 16 + 2); obj('lantern', lan, 17 * 16 + 4, 16 * 16 + 2)
# огород: ограда и пугало-фонарь
fence = t(11, 5, 1, 1, TH)
for x in range(GARDEN[0], GARDEN[2]):
    if x in (21, 22): continue
    obj('fence', trim(fence), x * 16, (GARDEN[1] - 1) * 16 + 4, 'box')
# лавка: прилавок с овощами, корзины, бочки
for i, (tx, ty) in enumerate([(16, 13), (17, 13), (18, 13)]):
    obj(f'basket{i}', trim(t(tx, ty, 1, 1, TH)), 25 * 16 + i * 14, 5 * 16 + 4)
obj('barrel', trim(t(16, 15, 1, 1, TH)), 19 * 16 + 4, 4 * 16 + 4); obj('barrel2', trim(t(17, 15, 1, 1, TH)), 20 * 16, 5 * 16)
obj('crate', trim(t(20, 14, 1, 1, TH)), 9 * 16, 5 * 16 + 4); obj('sack', trim(t(19, 14, 1, 1, TH)), 10 * 16, 6 * 16)
# цветы, кусты, камни
bush, flowers, stone = C('T', [0, 20, 3, 2], 1), C('T', [0, 20, 3, 2], 2), C('T', [0, 5, 3, 4], 6)
for (x, y) in [(56, 120), (140, 110), (220, 70), (300, 100), (420, 160), (380, 290), (250, 300), (190, 220)]: obj('bush', bush, x, y)
for (x, y) in [(96, 70), (40, 140), (330, 60), (270, 80), (180, 120), (440, 280), (60, 220)]: obj('flowers', flowers, x, y, 'none', depth=y)
for (x, y) in [(150, 230), (350, 300), (470, 140)]: obj('stone', stone, x, y)
layout = dict(MW=MW, MH=MH, scale=1, objs=objs, doorHouse=DOOR_HOUSE, doorShop=DOOR_SHOP,
              garden=list(GARDEN), pond=[POND[0] * 16 + 6, POND[1] * 16 + 6, (POND[2] - POND[0]) * 16 - 12, (POND[3] - POND[1]) * 16 - 12],
              bedOffset=[GARDEN[0] + 2 - 9, GARDEN[1] + 1 - 9], vending=[25 * 16 + 6, 3 * 16 + 8], busstop=[28 * 16 + 4, 18 * 16 + 2],
              lamp=[20 * 16, 18 * 16], road=20 * 16 + 8, fisher=[POND[2] * 16 + 4, 10 * 16 + 10],
              blocks=[[x0 * 16, y0 * 16, (x1 - x0) * 16, (y1 - y0) * 16 - 6] for (x0, y0, x1, y1) in plateaus])
ts = '// Сгенерировано tools/art/build_world_na.py — раскладка фермы (1 ед. мира = 1 px арта, тайл 16).\nexport const LAYOUT = ' + json.dumps(layout, indent=1) + ';\n'
open('/home/claude/sprout-doctor/src/world/layout.ts', 'w').write(ts)

# ---- сезонные варианты (лето/осень): перекраска листвы и травы ----
import colorsys
def recolor(path, season, kind):
    im = Image.open(path).convert('RGBA'); a = np.asarray(im).astype(float) / 255
    rgb = a[..., :3]; hsv = np.zeros_like(rgb)
    flat = rgb.reshape(-1, 3)
    h, sv, v = np.vectorize(colorsys.rgb_to_hsv)(flat[:, 0], flat[:, 1], flat[:, 2])
    h = h.reshape(rgb.shape[:2]); sv = sv.reshape(rgb.shape[:2]); v = v.reshape(rgb.shape[:2])
    green = (h > 0.17) & (h < 0.45) & (sv > 0.2)
    pink = ((h > 0.85) | (h < 0.07)) & (sv > 0.08) & (v > 0.55)
    if season == 2:
        if kind == 'sakura':
            h = np.where(pink, 0.27 + (v - 0.8) * 0.1, h); sv = np.where(pink, 0.62, sv); v = np.where(pink, v * 0.72, v)
        else:
            h = np.where(green, h - 0.012, h); sv = np.where(green, np.minimum(1, sv * 1.12), sv); v = np.where(green, v * 0.96, v)
    if season == 3:
        if kind == 'sakura':
            h = np.where(pink, 0.03, h); sv = np.where(pink, np.minimum(1, sv * 1.5 + 0.15), sv); v = np.where(pink, v * 0.9, v)
        elif kind == 'pines':
            h = np.where(green, h - 0.05, h); sv = np.where(green, sv * 0.8, sv)
        elif kind in ('ground',):
            h = np.where(green, 0.16 - (h - 0.25) * 0.4, h); sv = np.where(green, sv * 0.85, sv); v = np.where(green, v * 1.02, v)
        else:   # роща, кусты, цветы: рыжая листва с разбросом
            jitter = 0
            h = np.where(green, 0.045 + (v - 0.4) * 0.12, h); sv = np.where(green, np.minimum(1, sv * 1.3), sv); v = np.where(green, np.minimum(1, v * 1.08), v)
    out = np.stack(np.vectorize(colorsys.hsv_to_rgb)(h.ravel(), sv.ravel(), v.ravel()), -1).reshape(rgb.shape)
    res = np.concatenate([np.clip(out, 0, 1), a[..., 3:]], -1)
    Image.fromarray((res * 255 + 0.5).astype(np.uint8), 'RGBA').save(path.replace('.png', f'_s{season}.png'))
for k in ['ground', 'grove', 'pines', 'sakura', 'bush', 'flowers']:
    for se in (2, 3): recolor(OUT + k + '.png', se, k)
print('ok', len(objs))
