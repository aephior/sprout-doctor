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
# ---- земля: песок; «плато» травы с обрывом; огород; пруд ----
SAND = [t(18, 6), t(18, 6), t(18, 6), t(21, 11)]
for y in range(MH):
    for x in range(MW): put(SAND[0], x, y)
def nine(x0, y0, x1, y1, L, M, R, Tp, Mid, Bt):
    """9-slice: координаты тайлов кусочков (x,y) для столбцов L/M/R и строк Top/Mid/Bot."""
    for y in range(y0, y1):
        for x in range(x0, x1):
            cx = L if x == x0 else R if x == x1 - 1 else M
            cy = Tp if y == y0 else Bt if y == y1 - 1 else Mid
            put(t(cx, cy), x, y)
GRASS = (14, 15, 17, 15, 16, 17)   # x: лев/сред/прав, y: верх/сред/низ(обрыв)
plateaus = [(0, 0, MW, 4), (0, 4, 3, 17), (MW - 3, 4, MW, 17), (8, 15, 14, 18), (23, 16, 28, 19)]
for (x0, y0, x1, y1) in plateaus:
    nine(x0, y0, x1, y1, 14, 15, 17, 15, 16, 17)
    for y in range(y0 + 1, y1 - 1):
        for x in range(x0 + 1, x1 - 1): put(t(22, 11), x, y)
# огород: вспаханное поле с травяной каймой
GARDEN = (17, 8, 27, 15)
nine(*GARDEN, 20, 21, 22, 15, 16, 17)
# пруд с песчаным берегом
POND = (4, 10, 9, 14)
nine(*POND, 19, 20, 21, 7, 8, 9)
bg.alpha_composite(t(23, 8), (5 * 16, 11 * 16)); bg.alpha_composite(t(23, 8), (7 * 16 + 4, 12 * 16))
# мелочь на песке: травка, камешки
for _ in range(40):
    x, y = rnd.randrange(3, MW - 3), rnd.randrange(4, MH - 1)
    if GARDEN[0] - 1 <= x <= GARDEN[2] and GARDEN[1] - 1 <= y <= GARDEN[3]: continue
    if POND[0] - 1 <= x <= POND[2] and POND[1] - 1 <= y <= POND[3]: continue
    bg.alpha_composite(rnd.choice([t(0, 5), t(2, 8), t(0, 8), t(1, 8)]), (x * 16, y * 16))
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
obj('stall', trim(t(16, 16, 3, 2, TH)), 26 * 16, 3 * 16 + 4)
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
print('ok', len(objs))
