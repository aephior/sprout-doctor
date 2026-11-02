"""Игровой спрайт из сгенерированного рисунка: чёткое уменьшение, палитра, тёмный контур."""
from PIL import Image, ImageFilter
import numpy as np
OUTL = (43, 30, 46, 255)
def crisp(im, h, colors=28, outline=True, sharpen=True):
    im = im.convert('RGBA')
    if sharpen: im = im.filter(ImageFilter.UnsharpMask(radius=3, percent=120, threshold=2))
    w = max(1, round(im.width * h / im.height))
    # уменьшаем в 2 этапа: BOX до 2× и затем «медиана» по 2×2 → меньше мыла
    s = im.resize((w, h), Image.BOX)
    a = np.asarray(s).copy(); alpha = a[:, :, 3] > 110
    rgb = Image.fromarray(a[:, :, :3]).quantize(colors, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).convert('RGB')
    out = np.dstack([np.asarray(rgb), np.where(alpha, 255, 0).astype(np.uint8)])
    res = Image.fromarray(out, 'RGBA')
    if outline:
        res2 = Image.new('RGBA', (w + 2, h + 2)); res2.alpha_composite(res, (1, 1)); res = res2
        A = np.asarray(res)[:, :, 3] > 0; px = res.load()
        for y in range(res.height):
            for x in range(res.width):
                if not A[y, x] and any(0 <= y + dy < res.height and 0 <= x + dx < res.width and A[y + dy, x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                    px[x, y] = OUTL
        # тонируем крайние пиксели внутрь: светлые края → тёмный контур (чётче силуэт)
    return res

def add_outline(res):
    res2 = Image.new('RGBA', (res.width + 2, res.height + 2)); res2.alpha_composite(res, (1, 1)); res = res2
    A = np.asarray(res)[:, :, 3] > 0; px = res.load()
    for y in range(res.height):
        for x in range(res.width):
            if not A[y, x] and any(0 <= y + dy < res.height and 0 <= x + dx < res.width and A[y + dy, x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                px[x, y] = OUTL
    return res
def walk_frames(base, side=False, leg=0.2):
    """4 кадра шага: стойка, шаг А, стойка (покачивание), шаг Б."""
    w, h = base.size; ly = int(h * (1 - leg))
    top, legs = base.crop((0, 0, w, ly)), base.crop((0, ly, w, h))
    def comp(dy_body, mod):
        c = Image.new('RGBA', (w, h + 2))
        L = mod(legs)
        c.alpha_composite(L, (0, ly + 2))
        c.alpha_composite(top, (0, 2 + dy_body))
        return c
    def lift(half):
        def f(L):
            L2 = Image.new('RGBA', L.size)
            l, r = L.crop((0, 0, w // 2, L.height)), L.crop((w // 2, 0, w, L.height))
            if half == 0: L2.alpha_composite(l, (0, -2)); L2.alpha_composite(r, (w // 2, 0))
            else: L2.alpha_composite(l, (0, 0)); L2.alpha_composite(r, (w // 2, -2))
            return L2
        return f
    def slide(dx):
        def f(L):
            L2 = Image.new('RGBA', L.size)
            a, b = L.crop((0, 0, w, L.height // 2)), L.crop((0, L.height // 2, w, L.height))
            L2.alpha_composite(a, (0, 0)); L2.alpha_composite(b, (dx, L.height // 2)); return L2
        return f
    same = lambda L: L
    if side: fr = [comp(0, same), comp(-1, slide(2)), comp(0, same), comp(-1, slide(-2))]
    else: fr = [comp(0, same), comp(-1, lift(0)), comp(0, same), comp(-1, lift(1))]
    return [add_outline(f) for f in fr]
