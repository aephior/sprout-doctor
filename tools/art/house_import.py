"""Импорт нового дома бабушки Хару и арены-теплицы (Gemini) → public/art/home/, public/art/world/.
Всё в полном экранном разрешении (×1), как лавка: комната 960×540, слои — по размеру на экране."""
import sys, glob; sys.path.insert(0, '/home/claude/assets_src/tools'); import gen_proc as G
sys.path.insert(0, '/home/claude/sprout-doctor/tools/art')
from regrid import regrid
from PIL import Image, ImageFilter
import numpy as np, scipy.ndimage as nd
SRC = '/home/claude/sprout-doctor/art_src/house/Gemini_Generated_Image_'
OUT = '/home/claude/sprout-doctor/art_src/house/out_v1/'   # v1 (вид спереди) — больше не в игре
OUT2 = '/home/claude/sprout-doctor/public/art/home/'
import os; os.makedirs(OUT, exist_ok=True); os.makedirs('/home/claude/sprout-doctor/public/art/home/', exist_ok=True)
def src(k): return Image.open(glob.glob(SRC + k + '*.jpg')[0]).convert('RGB')
def keyed(k, fill_holes=True):
    im = src(k); kk, _ = G.key_bg(im); a = np.asarray(kk).copy()
    if fill_holes:
        holes = nd.binary_fill_holes(a[..., 3] > 0) & (a[..., 3] == 0)
        a[holes, :3] = np.asarray(im)[holes]; a[holes, 3] = 255
    return Image.fromarray(a, 'RGBA')
def fit(im, w=None, h=None):
    W, H = im.size; s = (w / W) if w else (h / H)
    return regrid(im, (max(1, round(W * s)), max(1, round(H * s))), 56)
def frames(im, n):
    """Разрезать картинку с n фигурами в ряд по пустым столбцам → список обрезанных кадров."""
    a = np.asarray(im)[..., 3] > 0
    cols = a.any(0); segs = []; x = 0
    lab, k = nd.label(cols)
    for i in range(1, k + 1):
        xs = np.where(lab == i)[0]; segs.append((xs.min(), xs.max() + 1))
    segs = sorted(segs, key=lambda s: s[1] - s[0], reverse=True)[:n]; segs.sort()
    return [G.trim(im.crop((x0, 0, x1, im.height))) for x0, x1 in segs]
def sheet(frs, h, name):
    """Кадры в одном масштабе (по самому высокому), выровнены по низу и центру, в лист одинаковых ячеек."""
    s = h / max(f.height for f in frs)
    fs = [fit(f, w=round(f.width * s)) for f in frs]
    W = max(f.width for f in fs); H = max(f.height for f in fs)
    out = Image.new('RGBA', (W * len(fs), H))
    for i, f in enumerate(fs): out.paste(f, (i * W + (W - f.width) // 2, H - f.height))
    out.save(OUT + name + '.png'); print(name, W, H, len(fs))
# комната: день / вечер
for k, n in [('8ovmny8o', 'room_day'), ('qe7berqe', 'room_night')]:
    im = src(k); w = round(im.height * 16 / 9); x0 = (im.width - w) // 2
    im.crop((x0, 0, x0 + w, im.height)).resize((960, 540), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.0, 50, 2)).save(OUT + n + '.png')
# футон: пустой днём, с горящей лампой вечером, со спящей Аой — в одном масштабе и одной привязке (левый низ)
FW = 360
def degreen(im):
    """Остатки хромакея (ореол лампы, просветы под столиком): зелёные пиксели → прозрачные."""
    a = np.asarray(im).astype(int).copy(); r, g, b = a[..., 0], a[..., 1], a[..., 2]
    gr = (g > r + 18) & (g > b + 18)
    a[gr, 3] = 0
    return Image.fromarray(a.astype(np.uint8), 'RGBA')
fut = {n: G.trim(degreen(keyed(k, False))) for n, k in [('futon_day', 'suo9xfsu'), ('futon_eve', 'cr3q07cr'), ('futon_sleep', '7xyzn67x')]}
s = FW / fut['futon_day'].width
for n, im in fut.items():
    o = fit(im, w=round(im.width * s)); o.save(OUT + n + '.png'); print(n, o.size)
# Аой: 3 кадра каждой позы
sheet(frames(keyed('rpzaf8rp', False), 3), 250, 'aoi_idle')
sheet(frames(keyed('t9xrr6t9', False), 3), 250, 'aoi_yawn')
sheet(frames(keyed('7ewx87ew', False), 3), 250, 'aoi_stretch')
# Фуку на зарядке: 2 кадра (спит / проснулся)
sheet(frames(keyed('1qmeww1q', False), 2), 70, 'fuku_charge')
# арена: разрушенная теплица
im = src('5c8jy95c'); w = round(im.height * 16 / 9); x0 = (im.width - w) // 2
im.crop((x0, 0, x0 + w, im.height)).resize((960, 540), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.0, 50, 2)).save('/home/claude/sprout-doctor/public/art/world/greenhouse.png')
print('ok')
# бой в теплице: Хайкаби, Аой и Фуку в том же (полном) разрешении, что и новая арена
L = [l.strip() for l in open('/home/claude/gen_in/list.txt') if l.strip().endswith('.jpg')]
def gsrc(i): im = Image.open('/home/claude/gen_in/' + L[i]).convert('RGB'); kk, _ = G.key_bg(im); return G.trim(kk)
W2 = '/home/claude/sprout-doctor/public/art/world/'
hk = {n: gsrc(i) for n, i in [('idle', 13), ('rage', 9), ('defeated', 21)]}
s = 300 / hk['idle'].width
for n, im in hk.items():
    o = fit(im, w=round(im.width * s)); o.save(W2 + f'haikabi_{n}.png'); print('haikabi', n, o.size)
fit(gsrc(24), h=150).save(W2 + 'boss_aoi.png'); fit(gsrc(18), h=84).save(W2 + 'boss_fuku.png')
print('boss ok')

# ---- v2: комната сверху (по ней ходит Аой), 640×540 — вся комната на экране, по бокам поля ----
V2 = '/home/claude/sprout-doctor/art_src/v2/Gemini_Generated_Image_'
for k, n in [('x56bl4x5', 'top_day'), ('sajb3nsa', 'top_night')]:
    im = Image.open(glob.glob(V2 + k + '*.jpg')[0]).convert('RGB')
    im.resize((640, 540), Image.LANCZOS).filter(ImageFilter.UnsharpMask(1.0, 50, 2)).save(OUT2 + n + '.png')
# футон со спящей Аой — под размер футона в комнате (в координатах 960-ширины: 760..915 × 455..690 → ×2/3)
kk, _ = G.key_bg(Image.open(glob.glob(V2 + 'ni0ovyni*.jpg')[0]).convert('RGB')); fs = G.trim(kk)
fit(fs, h=round((690 - 455) * 2 / 3) + 4).save(OUT2 + 'top_futon_sleep.png')
print('top room ok', Image.open(OUT2 + 'top_futon_sleep.png').size)
