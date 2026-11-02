"""Обработка картинок из генератора: вырезание однотонного фона, обрезка, приведение к пиксельной сетке."""
import numpy as np
from PIL import Image, ImageFilter
def key_bg(im, tol=60, soft=25):
    a = np.asarray(im.convert('RGB')).astype(np.int32)
    h, w, _ = a.shape
    # цвет фона — медиана по рамке в 6 px
    border = np.concatenate([a[:6].reshape(-1, 3), a[-6:].reshape(-1, 3), a[:, :6].reshape(-1, 3), a[:, -6:].reshape(-1, 3)])
    bg = np.median(border, 0)
    d = np.sqrt(((a - bg) ** 2).sum(2))
    # зелёный «хромакей»: ещё и по доминированию зелёного
    g_dom = (a[:, :, 1] - np.maximum(a[:, :, 0], a[:, :, 2]))
    bg_g = bg[1] - max(bg[0], bg[2])
    mask = (d > tol)
    if bg_g > 60: mask &= ~((g_dom > bg_g * 0.55) & (d < tol * 2.2))
    # убрать зелёные ореолы (despill)
    out = a.copy()
    spill = (out[:, :, 1] > np.maximum(out[:, :, 0], out[:, :, 2]) + 10) & mask
    if bg_g > 40:
        mx = np.maximum(out[:, :, 0], out[:, :, 2])
        near = np.zeros_like(mask)
        m8 = Image.fromarray((~mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))
        near = np.asarray(m8) > 0
        fix = spill & near
        out[:, :, 1][fix] = mx[fix] + (out[:, :, 1][fix] - mx[fix]) // 4
    alpha = (mask * 255).astype(np.uint8)
    # убрать одиночные пиксели-шум
    alpha = np.asarray(Image.fromarray(alpha).filter(ImageFilter.MedianFilter(3)))
    rgba = np.dstack([out.clip(0, 255).astype(np.uint8), alpha])
    return Image.fromarray(rgba, 'RGBA'), bg
def trim(im, pad=2):
    bb = im.getchannel('A').point(lambda v: 255 if v > 20 else 0).getbbox()
    if not bb: return im
    x0, y0, x1, y1 = bb
    return im.crop((max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)))
def grid_scale(im, lo=2, hi=12):
    """Оценка размера «пикселя» картинки: при правильном шаге блоки почти однотонны."""
    a = np.asarray(im.convert('RGB')).astype(np.float32)
    best = []
    for s in range(lo, hi + 1):
        errs = []
        for ox in range(0, s, max(1, s // 3)):
            h = (a.shape[0] - ox) // s * s; w = (a.shape[1] - ox) // s * s
            b = a[ox:ox + h, ox:ox + w].reshape(h // s, s, w // s, s, 3)
            errs.append(b.std(axis=(1, 3)).mean())
        best.append((s, min(errs)))
    return best
def pixelize(im, s):
    """Уменьшение до «настоящих» пикселей: мода цвета в каждом блоке s×s."""
    w, h = im.width // s, im.height // s
    small = im.resize((w, h), Image.BOX)
    a = np.asarray(small).copy()
    a[:, :, 3] = np.where(a[:, :, 3] > 128, 255, 0)
    return Image.fromarray(a, 'RGBA')
