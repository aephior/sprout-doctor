"""Импорт новой лавки Огавы (Gemini) → public/art/shop/.
Все слои — в полном экранном разрешении (×1): комната 960×540 и спрайты по размеру на экране.
Так сохраняется вся детализация картинок (раньше уменьшали вдвое под сетку ×2 — отсюда «мыло»)."""
import sys, glob; sys.path.insert(0, '/home/claude/assets_src/tools'); import gen_proc as G
sys.path.insert(0, '/home/claude/sprout-doctor/tools/art')
from regrid import regrid
from PIL import Image
import numpy as np
SRC = '/home/claude/sprout-doctor/art_src/shop/Gemini_Generated_Image_'
OUT = '/home/claude/sprout-doctor/public/art/shop/'
import os; os.makedirs(OUT, exist_ok=True)
def load(k, box=None):
    im = Image.open(glob.glob(SRC + k + '*.jpg')[0]).convert('RGB')
    if box: im = im.crop(box)
    kk, _ = G.key_bg(im); return G.trim(kk)
def fit(im, w=None, h=None):
    W, H = im.size; s = (w / W) if w else (h / H)
    return regrid(im, (max(1, round(W * s)), max(1, round(H * s))), 48)
# Огава: все позы в одном масштабе (по ширине спокойной позы), низ — линия прилавка
og = {n: load(k) for n, k in [('idle', 'a5t67ba5'), ('talk', 'ek8sjqek'), ('happy', 'wo2snawo'), ('coins', 'y8rmowy8')]}
s = 300 / og['idle'].width
def strip_line(img):
    """Убрать нарисованную под Огавой «линию прилавка»: у нас настоящий прилавок."""
    a = np.asarray(img).copy(); H, W = a.shape[:2]
    dark = (a[..., 3] > 0) & (a[..., :3].astype(int).sum(-1) < 200)
    for r in range(H - 20, H):
        if dark[r].sum() > 0.35 * W:
            body = (a[max(0, r - 8):r, :, 3] > 0) & ~dark[max(0, r - 8):r]
            cols = np.where(body.any(0))[0]
            l, rr = (cols.min(), cols.max()) if len(cols) else (W, -1)
            for x in range(W):
                if dark[r, x] and not (l <= x <= rr): a[r, x] = 0
    # остатки линии: тёмные пиксели внизу, над которыми пусто
    lit = lambda r, x: a[r, x, 3] and a[r, x, :3].astype(int).sum() >= 110
    for r in range(H - 90, H):
        for x in range(W):
            if a[r, x, 3] and not lit(r, x) and not any(lit(rr, x) for rr in range(max(0, r - 6), r)) \
               and not any(lit(rr, x) for rr in range(r + 1, min(H, r + 5))): a[r, x] = 0
    return Image.fromarray(a, 'RGBA')
for n, im in og.items():
    strip_line(fit(im, w=round(im.width * s))).save(OUT + f'ogawa_{n}.png')
def load_solid(k):
    """Как load, но «дыры» внутри предмета (зелёный узор ткани и т. п.) возвращаются из исходника."""
    import scipy.ndimage as nd
    src = Image.open(glob.glob(SRC + k + '*.jpg')[0]).convert('RGB')
    kk, _ = G.key_bg(src); a = np.asarray(kk).copy()
    holes = nd.binary_fill_holes(a[..., 3] > 0) & (a[..., 3] == 0)
    a[holes, :3] = np.asarray(src)[holes]; a[holes, 3] = 255
    return G.trim(Image.fromarray(a, 'RGBA'))
counter = load_solid('8dnvm28d'); fit(counter, w=660).save(OUT + 'counter.png')
im = Image.open(glob.glob(SRC + 't44rzjt4*.jpg')[0]).convert('RGB'); w = im.width
for i, box in enumerate([(0, 0, w // 2 - 8, im.height), (w // 2 + 8, 0, w, im.height)]):
    fit(load('t44rzjt4', box), w=124).save(OUT + f'mochi{i}.png')
for n, k in [('harvest', 'dqkrnodq'), ('fungicide', 'xov7iuxo'), ('seeds', 'lyczpuly'), ('fertilizer', 'cya11xcy'), ('lens', 'lo7elrlo')]:
    im = load(k)
    fit(im, h=100).save(OUT + f'item_{n}.png')      # витрина
    fit(im, h=40).save(OUT + f'item_{n}_s.png')    # ячейка ящика
fit(load('qwfecpqw'), h=72).save(OUT + 'tag.png')
for f in sorted(glob.glob(OUT + '*.png')): print(os.path.basename(f), Image.open(f).size)
# ящик прилавка — отдельным спрайтом (выдвигается); в прилавке на его месте — тёмная ниша
import numpy as np
c = Image.open(OUT + 'counter.png').convert('RGBA'); a = np.asarray(c).copy()
DX0, DY0, DX1, DY1 = 190, 146, 472, 252
Image.fromarray(a[DY0:DY1, DX0:DX1]).save(OUT + 'drawer.png')
a[DY0:DY1, DX0 + 1:DX1 - 1, :3] = (58, 32, 24); a[DY0:DY0 + 6, DX0 + 2:DX1 - 2, :3] = (30, 16, 14)
a[DY1 - 2:DY1, DX0:DX1, :3] = (30, 16, 14)
Image.fromarray(a).save(OUT + 'counter_body.png')
print('drawer', DX1 - DX0, DY1 - DY0)

# комната лавки: день и вечер, 960×540 (лёгкая резкость после уменьшения)
from PIL import ImageFilter
for n in ['day', 'night']:
    im = Image.open(f'/home/claude/sprout-doctor/art_src/shop/room_{n}.jpg').convert('RGB')
    w = round(im.height * 16 / 9); x0 = (im.width - w) // 2
    im = im.crop((x0, 0, x0 + w, im.height)).resize((960, 540), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.0, 50, 2))
    im.save(OUT + f'room_{n}.png')
print('rooms ok')
