"""Растения 16×20 в стиле Ninja Adventure: томат, картофель, перец; 8 кадров: лунка, росток, молодое, растёт, созрело, больное, тяжело больное, погибшее."""
from PIL import Image, ImageDraw
import numpy as np, random
OUT = '/home/claude/sprout-doctor/public/art/na/'
K = (2, 2, 2, 255)
LEAF, LEAF2, STEM = (104, 182, 74, 255), (58, 126, 60, 255), (74, 136, 54, 255)
def outline(im):
    a = np.asarray(im)[:, :, 3] > 0; h, w = a.shape; px = im.load()
    for y in range(h):
        for x in range(w):
            if not a[y, x] and any(0 <= y + dy < h and 0 <= x + dx < w and a[y + dy, x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = K
    return im
def blob(d, cx, cy, rx, ry, c, c2=None):
    d.ellipse((cx - rx, cy - ry, cx + rx, cy + ry), fill=c)
    if c2: d.point([(cx - rx + 1, cy - ry + 1)], fill=(170, 220, 120, 255))
def mound():
    im = Image.new('RGBA', (16, 20)); d = ImageDraw.Draw(im)
    d.ellipse((3, 15, 12, 19), fill=(138, 86, 52, 255)); d.line((5, 17, 10, 17), fill=(100, 60, 36, 255))
    return outline(im)
def plant(kind, stage):
    im = Image.new('RGBA', (16, 20)); d = ImageDraw.Draw(im)
    base = 18
    if stage == 1:
        d.line((7, base, 7, base - 3), fill=STEM); blob(d, 5, base - 4, 1.6, 1.1, LEAF); blob(d, 9, base - 4, 1.6, 1.1, LEAF)
        return outline(im)
    h = {2: 7, 3: 11, 4: 13}[stage]
    if kind == 'potato':     # кустистая ботва, у зрелой — белые цветы
        n = {2: 3, 3: 5, 4: 6}[stage]
        for i in range(n):
            ang = -1.2 + i * (2.4 / max(1, n - 1)); x = 7.5 + np.sin(ang) * (2 + stage); y = base - 2 - h * (0.4 + 0.5 * np.cos(ang))
            d.line((7, base, x, y), fill=STEM); blob(d, x, y, 2.3, 1.7, LEAF if i % 2 else LEAF2)
        if stage == 4:
            for (x, y) in ((5, base - 11), (10, base - 12), (8, base - 13)): d.point([(x, y), (x + 1, y)], fill=(246, 240, 226, 255)); d.point([(x, y + 1)], fill=(244, 210, 80, 255))
        return outline(im)
    # томат и перец: стебель с листьями по бокам
    d.line((7, base, 7, base - h), fill=STEM); d.line((8, base, 8, base - h + 1), fill=STEM)
    for k in range(1, stage + 1):
        y = base - 2 - k * (h / (stage + 1))
        blob(d, 4.5, y, 2.2, 1.5, LEAF2 if k % 2 else LEAF); blob(d, 11, y - 1, 2.2, 1.5, LEAF if k % 2 else LEAF2)
    blob(d, 7.5, base - h, 2, 1.6, LEAF)
    if stage == 4:
        if kind == 'tomato':
            for (x, y) in ((4, base - 6), (11, base - 8), (6, base - 10), (10, base - 3)):
                d.ellipse((x - 1.4, y - 1.4, x + 1.4, y + 1.4), fill=(222, 54, 56, 255)); d.point([(x - 1, y - 1)], fill=(255, 170, 160, 255))
        else:
            for (x, y) in ((4, base - 6), (11, base - 9), (9, base - 4)):
                d.rectangle((x - 1, y - 2, x + 1, y + 2), fill=(230, 64, 36, 255)); d.point([(x, y - 3)], fill=STEM); d.point([(x - 1, y - 1)], fill=(255, 160, 120, 255))
    return outline(im)
def tint(im, kind):
    a = np.asarray(im).astype(int).copy()
    for y in range(a.shape[0]):
        for x in range(a.shape[1]):
            r, g, b, al = a[y, x]
            if not al or (r, g, b) == (2, 2, 2): continue
            leaf = g > r + 20 and g > b
            if kind == 'sick' and leaf:
                a[y, x, :3] = (120, 86, 40) if (x * 5 + y * 11) % 13 < 2 else (r + 40, g - 4, b - 24)
            elif kind == 'very' and leaf:
                a[y, x, :3] = (124, 92, 150) if (x * 3 + y * 7) % 11 < 2 else (156, 132, 62)
            elif kind == 'very' and r > 150 and g < 120:
                a[y, x, :3] = (150, 90, 70)
            elif kind == 'dead':
                v = (r + g + b) // 3; a[y, x, :3] = (v * 0.7 + 50, v * 0.5 + 30, v * 0.3 + 10)
    return Image.fromarray(a.clip(0, 255).astype(np.uint8), 'RGBA')
sheet = Image.new('RGBA', (16 * 8, 20 * 3))
for i, kind in enumerate(['tomato', 'potato', 'pepper']):
    fr = [mound()] + [plant(kind, s) for s in (1, 2, 3, 4)]
    def droop(im, k):     # поникшее растение: ниже и шире (сжато по вертикали от земли)
        bb = im.getbbox(); p = im.crop(bb); w, h = p.size
        p = p.resize((min(16, int(w * (1 + (1 - k) * 0.6))), max(4, int(h * k))), Image.NEAREST)
        c = Image.new('RGBA', (16, 20)); c.alpha_composite(p, ((16 - p.width) // 2, 20 - p.height)); return outline(c) if False else c
    # больные кадры строятся из растения БЕЗ плодов: пятна, поникшие листья — не спутать со спелым
    fr += [tint(droop(fr[3], 0.92), 'sick'), tint(droop(fr[3], 0.78), 'very'), tint(droop(fr[3], 0.7), 'dead')]
    for j, f in enumerate(fr):
        bg = mound() if j else Image.new('RGBA', (16, 20))
        c = Image.new('RGBA', (16, 20))
        if j: c.alpha_composite(bg)
        c.alpha_composite(f); sheet.alpha_composite(c, (j * 16, i * 20))
sheet.save(OUT + 'crops.png')
print('ok')
