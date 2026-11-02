"""Соломенная шляпа Аой поверх LPC-кадров (в LPC такой шляпы нет)."""
from PIL import Image, ImageDraw
import numpy as np, sys, glob
O = (59, 42, 26, 255); L = (240, 205, 120, 255); M = (214, 170, 82, 255); D = (160, 118, 52, 255)
BAND = (43, 58, 107, 255); TEAL = (63, 208, 201, 255); TEAL2 = (30, 130, 140, 255); FR = (90, 74, 58, 255)
RED = (200, 50, 60, 255); GRN = (79, 138, 60, 255)
def ell(px, cx, cy, rx, ry, col, out=O):
    for y in range(int(cy - ry) - 1, int(cy + ry) + 2):
        for x in range(int(cx - rx) - 1, int(cx + rx) + 2):
            d = ((x + .5 - cx) / rx) ** 2 + ((y + .5 - cy) / ry) ** 2
            if d <= 1: px[(x, y)] = col
    # контур
    pts = [k for k, v in px.items()]
    return
def draw_hat(dirn):
    """Шляпа на холсте 40×20, центр полей в (20, 13)."""
    px = {}
    cx, by = 20, 13
    rx, ry = (17, 4.5) if dirn in ('down', 'up') else (15, 3.6)
    ell(px, cx, by, rx, ry, M)
    # тень на полях снизу
    for (x, y) in list(px):
        if y >= by + 1: px[(x, y)] = D if y >= by + 3 else M
        elif y <= by - 2: px[(x, y)] = L
    off = {'down': 0, 'up': 0, 'left': -2, 'right': 2}[dirn]
    for y in range(by - 9, by + 1):
        for x in range(cx - 9 + off, cx + 10 + off):
            t = y - (by - 9)
            if t == 0 and (x < cx - 6 + off or x > cx + 6 + off): continue
            if t == 1 and (x < cx - 8 + off or x > cx + 8 + off): continue
            px[(x, y)] = L if x < cx + 4 + off else M
    for y in (by - 3, by - 2):
        for x in range(cx - 9 + off, cx + 10 + off): px[(x, y)] = BAND
    img = Image.new('RGBA', (40, 20))
    for (x, y), c in px.items():
        if 0 <= x < 40 and 0 <= y < 20: img.putpixel((x, y), c)
    # контур
    a = np.asarray(img)[:, :, 3] > 0
    for y in range(20):
        for x in range(40):
            if not a[y, x] and any(0 <= y + dy < 20 and 0 <= x + dx < 40 and a[y + dy, x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                img.putpixel((x, y), O)
    d = img.load()
    def put(x, y, c):
        if 0 <= x < 40 and 0 <= y < 20: d[x, y] = c
    if dirn == 'down':   # гогглы на ленте
        for gx in (cx - 4, cx + 3):
            for y in range(by - 5, by - 1):
                for x in range(gx - 2, gx + 3):
                    edge = x in (gx - 2, gx + 2) or y in (by - 5, by - 2)
                    put(x, y, FR if edge else (TEAL if y < by - 3 else TEAL2))
        put(cx + 8, by - 4, RED); put(cx + 9, by - 4, RED); put(cx + 8, by - 3, RED)
        put(cx + 6, by - 7, GRN); put(cx + 6, by - 8, GRN); put(cx + 7, by - 9, GRN)
    elif dirn == 'up':
        put(cx - 8, by - 4, RED); put(cx - 9, by - 4, RED); put(cx - 8, by - 3, RED)
    else:
        s = -1 if dirn == 'left' else 1
        gx = cx + s * 6 + off
        for y in range(by - 5, by - 1):
            for x in range(gx - 2, gx + 2):
                edge = x in (gx - 2, gx + 1) or y in (by - 5, by - 2)
                put(x, y, FR if edge else (TEAL if y < by - 3 else TEAL2))
        put(cx - s * 7 + off, by - 4, RED); put(cx - s * 8 + off, by - 4, RED)
        put(cx + off, by - 10, GRN); put(cx + off + s, by - 11, GRN)
    return img
HATS = {d: draw_hat(d) for d in ('up', 'left', 'down', 'right')}
def apply(sheet_path, out_path):
    im = Image.open(sheet_path).convert('RGBA'); a = np.asarray(im)[:, :, 3] > 0
    rows, cols = im.height // 64, im.width // 64
    for r in range(rows):
        dirn = ['up', 'left', 'down', 'right'][r % 4]
        for c in range(cols):
            cell = a[r * 64:(r + 1) * 64, c * 64:(c + 1) * 64]
            if not cell.any(): continue
            top = next((y for y in range(64) if cell[y, 16:48].sum() >= 10), None)
            if top is None: continue
            xs = np.where(cell[top + 4, :])[0]; hx = int((xs.min() + xs.max() + 1) / 2) if len(xs) else 32
            if dirn == 'down' or dirn == 'up': hx = 32 + (hx - 32) // 2
            im.alpha_composite(HATS[dirn], (c * 64 + hx - 20, r * 64 + top + 3 - 13))
    im.save(out_path)
if __name__ == '__main__':
    for f in sys.argv[1:]: apply(f, f)
