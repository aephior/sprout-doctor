"""Сборка фермы из LPC-тайлов: фон (земля, трава, тропы, огород, пруд) + отдельные объекты + src/world/layout.ts.
Единицы: 1 тайл = 16 ед. мира = 32 px LPC (объекты рисуются в игре с масштабом 0.5)."""
import random, json, colorsys, sys
from PIL import Image
sys.path.insert(0, '/home/claude/assets_src/tools'); import tmx_lib as X
R = '/home/claude/assets_src/'
OUT = '/home/claude/sprout-doctor/public/art/world/'
TER = Image.open(R + 'frpg/src/assets/spritesheets/tiled/terrain.png').convert('RGBA')
MW, MH = 40, 28
def t(x, y, w=1, h=1): return TER.crop((x * 32, y * 32, (x + w) * 32, (y + h) * 32))
def trim(im): return im.crop(im.getbbox())
rnd = random.Random(7)
bg = Image.new('RGBA', (MW * 32, MH * 32))
def put(im, tx, ty): bg.alpha_composite(im, (int(tx * 32), int(ty * 32)))
# ---- тропы ----
path = set()
for x in range(3, 38):
    for y in (9, 10): path.add((x, y))
for y in range(11, 13):
    for x in (19, 20): path.add((x, y))
for y in range(20, 25):
    for x in (19, 20): path.add((x, y))
for x in range(MW):
    for y in (25, 26): path.add((x, y))
for y in range(11, 25):   # тропа к остановке
    for x in (35, 36): path.add((x, y))
# ---- огород и пруд ----
GARDEN = (15, 13, 24, 20)      # x0,y0,x1,y1 (не включая)
POND = (2, 15, 9, 22)
for y in range(MH):
    for x in range(MW):
        if (x, y) in path:
            put(t(16, 3), x, y)
        else:
            put(t(22, 3), x, y)
            if rnd.random() < 0.06: put(t(rnd.choice([21, 22, 23]), 11), x, y)   # цветы в траве
# кромка травы вокруг троп
EDGE = {(0, 1): (22, 4), (0, -1): (22, 2), (-1, 0): (21, 3), (1, 0): (23, 3)}
for y in range(MH):
    for x in range(MW):
        if (x, y) in path: continue
        n = {d for d in EDGE if (x + d[0], y + d[1]) in path}
        if not n:   # внутренний угол: тропа только по диагонали
            diag = [(dx, dy) for dx in (-1, 1) for dy in (-1, 1) if (x + dx, y + dy) in path]
            if len(diag) == 1:
                put(t(16, 3), x, y)
                put(t(*{(1, 1): (22, 0), (-1, 1): (23, 0), (1, -1): (22, 1), (-1, -1): (23, 1)}[diag[0]]), x, y)
            continue
        put(t(16, 3), x, y)
        S, N, W, E = (0, 1) in n, (0, -1) in n, (-1, 0) in n, (1, 0) in n
        if S and W: p = (21, 4)
        elif S and E: p = (23, 4)
        elif N and W: p = (21, 2)
        elif N and E: p = (23, 2)
        elif S and N or W and E: p = None
        else: p = EDGE[next(iter(n))]
        put(t(*p) if p else t(16, 3), x, y)
# огород (вспаханная земля с травяной кромкой)
gx0, gy0, gx1, gy1 = GARDEN
for y in range(gy0, gy1):
    for x in range(gx0, gx1):
        sx = 5 if x == gx0 else 7 if x == gx1 - 1 else 6
        sy = 17 if y == gy0 else 19 if y == gy1 - 1 else 18
        put(t(sx, sy), x, y)
# пруд
px0, py0, px1, py1 = POND
for y in range(py0, py1):
    for x in range(px0, px1):
        sx = 6 if x == px0 else 8 if x == px1 - 1 else 7
        sy = 11 if y == py0 else 13 if y == py1 - 1 else 12
        put(t(sx, sy), x, y)
for (x, y, tx, ty) in [(3, 17, 6, 30), (6, 19, 7, 31), (4, 20, 8, 30), (7, 16, 6, 31)]: put(t(tx, ty), x, y)
put(t(7, 14), 6, 17)
bg.save(OUT + 'ground.png')
# ---- объекты ----
objs = []      # key, x, y (левый верх, ед.), depth(ед.), solid [x,y,w,h] ед.
def save(key, im): im.save(OUT + key + '.png'); return im.size
house = trim(Image.open(R + 'world/house_raw.png'))
save('house', house)
hx, hy = 32, 16
objs.append(dict(key='house', x=hx, y=hy, depth=hy + house.height / 2, solid=[hx + 4, hy + 50, house.width / 2 - 8, house.height / 2 - 52]))
DOOR_HOUSE = (hx + (288 - 54) / 2, hy + house.height / 2)
# лавка: тот же дом поменьше, крыша — синяя черепица, вывеска и норэн
shop = house.copy(); px = shop.load()
for y in range(shop.height):
    for x in range(shop.width):
        r, g, b, a = px[x, y]
        if a and y < 136:   # крыша
            h, s, v = colorsys.rgb_to_hsv(r / 255, g / 255, b / 255)
            if 0.04 < h < 0.17 and s > 0.25:
                r2, g2, b2 = colorsys.hsv_to_rgb(0.62, min(1, s * 0.75), v * 0.78)
                px[x, y] = (int(r2 * 255), int(g2 * 255), int(b2 * 255), a)
# норэн над дверью: красные полотнища
for y in range(178, 200):
    for x in range(202, 266):
        if (x - 202) % 16 != 15 and px[x, y][3]: px[x, y] = (200, 50, 60, 255) if y < 196 else (150, 30, 40, 255)
for y in range(185, 191):
    for x in range(228, 240): px[x, y] = (246, 231, 193, 255)
shop = shop.resize((int(shop.width * 0.8), int(shop.height * 0.8)), Image.NEAREST)
save('shop', shop)
sx, sy = 440, 144 - shop.height / 2
objs.append(dict(key='shop', x=sx, y=sy, depth=144, solid=[sx + 4, sy + 40, shop.width / 2 - 8, shop.height / 2 - 42]))
DOOR_SHOP = (sx + (288 - 54) * 0.8 / 2, 144)
# деревья
tree = trim(TER.crop((28 * 32 + 30, 28 * 32, 32 * 32, 32 * 32))); save('tree_big', tree)
pine = trim(TER.crop((30 * 32, 0, 32 * 32, 5 * 32))); save('tree_pine', pine)
fence = t(19, 20, 5, 1); save('fence', fence)
for key, im in [('scarecrow', t(10, 25, 1, 2)), ('cart', t(13, 26, 3, 2)), ('barrels', t(9, 27, 4, 2)), ('hay', t(14, 30, 2, 2)), ('sign', t(11, 24, 1, 2)), ('mushroom', t(27, 28)), ('cattail', t(26, 29))]:
    save(key, trim(im))
def obj(key, x, y, solid=None, depth=None):
    w, h = Image.open(OUT + key + '.png').size
    objs.append(dict(key=key, x=x, y=y, depth=depth if depth is not None else y + h / 2, solid=solid))
# лес по верхнему и боковым краям
for i, x in enumerate(range(-6, MW * 16, 34)):
    if 200 < x < 430: continue
    obj('tree_pine', x + rnd.randint(-4, 4), -40 + rnd.randint(-6, 6))
for (x, y) in [(232, 20), (300, 8), (372, 26), (606, 60), (610, 150), (616, 250), (612, 330), (-14, 150), (-10, 250), (-12, 360), (180, 360), (430, 352)]:
    obj('tree_big', x, y, solid=[x + 24, y + 54, 16, 8])
for (x, y) in [(240, 330), (420, 300), (520, 340), (150, 320)]:
    obj('tree_pine', x, y, solid=[x + 12, y + 70, 8, 6])
# ограда огорода сверху и снизу, калитка на тропе x=19..20
for fy in (gy0 - 1, gy1):
    for fx in (gx0 - 1, 21):
        w = 5 if fx == gx0 - 1 else 3
        im = fence.crop((0, 0, w * 32, 32)) if w == 5 else fence.crop((2 * 32, 0, 5 * 32, 32))
        key = 'fence5' if w == 5 else 'fence3'
        save(key, im)
        obj(key, fx * 16, fy * 16 + 2, solid=[fx * 16, fy * 16 + 10, w * 16, 5], depth=fy * 16 + 14)
obj('scarecrow', (gx1) * 16 + 6, (gy0 + 1) * 16, solid=[gx1 * 16 + 10, gy0 * 16 + 26, 6, 5])
obj('cart', 380, 106, solid=[384, 124, 40, 8])
obj('barrels', 214, 112, solid=[216, 126, 40, 8])
obj('mushroom', 600, 230); obj('mushroom', 30, 300); obj('cattail', 140, 270); obj('cattail', 30, 236)
layout = dict(MW=MW, MH=MH, objs=objs, doorHouse=DOOR_HOUSE, doorShop=DOOR_SHOP,
              garden=[gx0, gy0, gx1, gy1], pond=[px0 * 16, py0 * 16, (px1 - px0) * 16, (py1 - py0) * 16],
              bedOffset=[gx0 + 1 - 9, gy0 + 1 - 9], vending=[sx + shop.width / 2 + 6, 116], busstop=[37 * 16, 22 * 16],
              lamp=[18 * 16 - 4, 19 * 16 + 14], road=26 * 16 + 4, fisher=[px1 * 16 - 2, 18 * 16 + 4])
ts = '// Сгенерировано tools/build_world.py — раскладка фермы (единицы мира: тайл = 16).\nexport const LAYOUT = ' + json.dumps(layout, indent=1) + ' as const;\n'
ts = ts.replace(' as const', '')
open('/home/claude/sprout-doctor/src/world/layout.ts', 'w').write(ts)
print('ok', len(objs), 'objs', DOOR_HOUSE, DOOR_SHOP)
