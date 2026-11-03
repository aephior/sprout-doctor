"""Импорт новой лавки Огавы (Gemini, зелёный фон) → public/art/shop/.
Вырезание фона, затем пересэмплирование к размеру на экране / 2 (фон лавки показывается ×2 — одна сетка пикселей)."""
import sys, glob; sys.path.insert(0, '/home/claude/assets_src/tools'); import gen_proc as G
sys.path.insert(0, '/home/claude/sprout-doctor/tools/art')
from regrid import regrid
from PIL import Image
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
s = 150 / og['idle'].width
import numpy as np
def strip_line(img):
    """Убрать нарисованную под Огавой «линию прилавка»: у нас настоящий прилавок."""
    a = np.asarray(img).copy(); H, W = a.shape[:2]
    dark = (a[..., 3] > 0) & (a[..., :3].astype(int).sum(-1) < 200)
    for r in range(H - 10, H):
        if dark[r].sum() > 0.35 * W:
            body = (a[max(0, r - 4):r, :, 3] > 0) & ~dark[max(0, r - 4):r]
            cols = np.where(body.any(0))[0]
            l, rr = (cols.min(), cols.max()) if len(cols) else (W, -1)
            for x in range(W):
                if dark[r, x] and not (l <= x <= rr): a[r, x] = 0
    # остатки линии: тёмные пиксели внизу, над которыми пусто
    lit = lambda r, x: a[r, x, 3] and a[r, x, :3].astype(int).sum() >= 110
    for r in range(H - 45, H):
        for x in range(W):
            if a[r, x, 3] and not lit(r, x) and not any(lit(rr, x) for rr in range(max(0, r - 3), r)) \
               and not any(lit(rr, x) for rr in range(r + 1, min(H, r + 3))): a[r, x] = 0
    return Image.fromarray(a, 'RGBA')
for n, im in og.items():
    strip_line(fit(im, w=round(im.width * s))).save(OUT + f'ogawa_{n}.png')
counter = load('8dnvm28d'); fit(counter, w=330).save(OUT + 'counter.png')
im = Image.open(glob.glob(SRC + 't44rzjt4*.jpg')[0]).convert('RGB'); w = im.width
for i, box in enumerate([(0, 0, w // 2 - 8, im.height), (w // 2 + 8, 0, w, im.height)]):
    fit(load('t44rzjt4', box), w=62).save(OUT + f'mochi{i}.png')
for n, k in [('harvest', 'dqkrnodq'), ('fungicide', 'xov7iuxo'), ('seeds', 'lyczpuly'), ('fertilizer', 'cya11xcy'), ('lens', 'lo7elrlo')]:
    im = load(k)
    fit(im, h=50).save(OUT + f'item_{n}.png')      # витрина
    fit(im, h=20).save(OUT + f'item_{n}_s.png')    # ячейка ящика
fit(load('qwfecpqw'), h=36).save(OUT + 'tag.png')
for f in sorted(glob.glob(OUT + '*.png')): print(os.path.basename(f), Image.open(f).size)
# ящик прилавка — отдельным спрайтом (выдвигается); в прилавке на его месте — тёмная ниша
import numpy as np
c = Image.open(OUT + 'counter.png').convert('RGBA'); a = np.asarray(c).copy()
DX0, DY0, DX1, DY1 = 95, 73, 236, 126
Image.fromarray(a[DY0:DY1, DX0:DX1]).save(OUT + 'drawer.png')
a[DY0:DY1, DX0 + 1:DX1 - 1, :3] = (58, 32, 24); a[DY0:DY0 + 3, DX0 + 1:DX1 - 1, :3] = (30, 16, 14)
a[DY1 - 1, DX0:DX1, :3] = (30, 16, 14)
Image.fromarray(a).save(OUT + 'counter_body.png')
print('drawer', DX1 - DX0, DY1 - DY0)
