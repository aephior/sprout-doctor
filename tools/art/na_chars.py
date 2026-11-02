"""Персонажи в стиле Ninja Adventure (16 px): Аой (из персонажа 17 + соломенная шляпа + очки), Огава (из 9 + кепка), рыбак, жители."""
from PIL import Image
import numpy as np
NA = '/home/claude/assets_src/packs/sp/ninja-adventure/characters/'
OUT = '/home/claude/sprout-doctor/public/art/na/'
import os; os.makedirs(OUT, exist_ok=True)
K = (2, 2, 2, 255)
def load(n): return Image.open(NA + f'{n}.png').convert('RGBA')
def grid_img(rows, pal):
    h = len(rows); w = max(len(r) for r in rows); im = Image.new('RGBA', (w, h))
    for y, r in enumerate(rows):
        for x, ch in enumerate(r):
            if ch in pal: im.putpixel((x, y), pal[ch])
    return im
HATPAL = {'o': K, 'L': (247, 214, 128, 255), 'M': (214, 166, 74, 255), 'D': (160, 112, 50, 255), 'B': (52, 64, 120, 255),
          'T': (63, 208, 201, 255), 'R': (210, 50, 60, 255), 'G': (90, 170, 70, 255)}
HAT = {
 'down': ['.....oooooo.....', '....oLLLLLMo..G.', '...oLLLLLLLMoG..', '...oBTTBBTTBRo..', '.ooLLLLLLLLLLMoo', 'oMMMMMMMMMMMMMDo', '.oooDDDDDDDDDoo.', '..............'],
 'up':   ['.....oooooo.....', '..G.oLLLLLMo....', '...GoLLLLLLLMo..', '..oRBBBBBBBBBo..', '.ooLLLLLLLLLLMoo', 'oMMMMMMMMMMMMMDo', '.oooDDDDDDDDDoo.', '..............'],
 'left': ['....oooooo......', '...oLLLLLMo.G...', '..oLLLLLLLMoG...', '..oTTBBBBBBRo...', 'ooLLLLLLLLLLMoo.', 'oMMMMMMMMMMMMDo.', '.ooDDDDDDDDDoo..', '..............'],
}
HAT['right'] = [r[::-1] for r in HAT['left']]
HATS = {k: grid_img(v, HATPAL) for k, v in HAT.items()}
DIRS = ['down', 'up', 'left', 'right']     # столбцы листа NA
def recolor(im, mp, y0=0, y1=99):
    a = np.asarray(im).copy()
    for y in range(a.shape[0]):
        if not (y0 <= (y % 16) < y1): continue
        for x in range(a.shape[1]):
            c = tuple(a[y, x, :3])
            if a[y, x, 3] and c in mp: a[y, x, :3] = mp[c]
    return Image.fromarray(a, 'RGBA')
def frames(src, rows=range(4)):
    """→ лист 4 направления × len(rows) кадров, кадр 16×20 (4 px сверху под шляпу)."""
    out = Image.new('RGBA', (16 * 4, 20 * len(rows)))
    for j, r in enumerate(rows):
        for i in range(4):
            out.alpha_composite(src.crop((i * 16, r * 16, i * 16 + 16, r * 16 + 16)), (i * 16, j * 20 + 4))
    return out
def top_row(cell):
    a = np.asarray(cell)[:, :, 3] > 0
    ys = np.where(a.any(1))[0]; return int(ys.min()) if len(ys) else None
def add_hat(sheet, hats, dy=0):
    for j in range(sheet.height // 20):
        for i, d in enumerate(DIRS):
            cell = sheet.crop((i * 16, j * 20, i * 16 + 16, j * 20 + 20)); t = top_row(cell)
            if t is None: continue
            sheet.alpha_composite(hats[d], (i * 16, j * 20 + t - 3 + dy))
    return sheet
def glasses(sheet, col=(255, 214, 120)):
    a = np.asarray(sheet).copy()
    for j in range(a.shape[0] // 20):
        for i, d in enumerate(DIRS):
            if d == 'up': continue
            cy = j * 20; cx = i * 16
            for y in range(cy + 10, cy + 16):
                xs = [x for x in range(cx + 2, cx + 14) if a[y, x, 3] and tuple(a[y, x, :3]) == (2, 2, 2) and a[y, x - 1, 3] and tuple(a[y, x - 1, :3]) != (2, 2, 2) and a[y, x + 1, 3] and tuple(a[y, x + 1, :3]) != (2, 2, 2)]
                if len(xs) >= 2 and d == 'down':
                    l, r = min(xs), max(xs)
                    for x in range(l + 1, r):
                        if tuple(a[y, x, :3]) != (2, 2, 2): a[y, x, :3] = col
                    a[y, l - 1, :3] = col; a[y, r + 1, :3] = col
                    break
                if len(xs) >= 1 and d in ('left', 'right'):
                    x = xs[0]; s = -1 if d == 'left' else 1
                    a[y, x - s, :3] = col
                    break
    return Image.fromarray(a, 'RGBA')
# ---- Аой ----
src = load(17)
HAIR = {(226, 169, 45): (150, 92, 50), (205, 89, 39): (104, 58, 34), (192, 58, 36): (104, 58, 34)}
BODY = {(92, 67, 148): (86, 150, 70), (210, 100, 108): (240, 186, 60), (48, 172, 203): (240, 186, 60), (205, 89, 39): (200, 60, 60), (226, 169, 45): (240, 186, 60)}
aoi = recolor(recolor(src, HAIR, 0, 11), BODY, 11, 16)
aoi = frames(aoi); aoi = glasses(aoi); aoi = add_hat(aoi, HATS)
aoi.save(OUT + 'aoi.png')
# ---- Огава: седой старик (9), синяя кепка, тёмно-синий фартук ----
CAP = {d: grid_img(g, {'o': K, 'B': (52, 64, 120, 255), 'b': (36, 44, 90, 255), 'W': (220, 226, 240, 255)}) for d, g in {
 'down': ['................', '.....oooooo.....', '....oBBBBBBo....', '...oBBBWBBBBo...', '...obbbbbbbbo...', '..oooooooooooo..', '................', '................'],
 'up':   ['................', '.....oooooo.....', '....oBBBBBBo....', '...oBBBBBBBBo...', '...obbbbbbbbo...', '....oooooooo....', '................', '................'],
 'left': ['................', '.....oooooo.....', '....oBBBBBBo....', '...oBBBBBBBBo...', 'oooobbbbbbbbo...', '.ooooooooooo....', '................', '................']}.items()}
CAP['right'] = CAP['left'].transpose(Image.FLIP_LEFT_RIGHT)
og = recolor(load(9), {(224, 31, 76): (52, 64, 120), (146, 30, 101): (36, 44, 90), (209, 81, 59): (230, 230, 236)}, 11, 16)
og = add_hat(frames(og), CAP, 1); og = glasses(og, (200, 200, 210)); og.save(OUT + 'ogawa.png')
# ---- рыбак (14), жители ----
frames(load(14)).save(OUT + 'fisher.png')
for n in (2, 16, 25, 12):
    frames(load(n)).save(OUT + f'villager{n}.png')
print('ok')
