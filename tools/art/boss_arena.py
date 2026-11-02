"""Арена Хайкаби: заброшенная теплица ночью, 320×180 (показ ×3). Пиксель-арт в палитре Ninja Adventure:
стеклянная стена с железным каркасом и разбитыми стёклами, луна, кирпичный цоколь, каменный пол,
ящики-грядки с погибшими растениями (из crops.png), горшки, плесень."""
from PIL import Image, ImageDraw
import numpy as np, random
R = random.Random(11)
W, H = 320, 180
OUT = '/home/claude/sprout-doctor/public/art/world/boss_arena.png'
TS = Image.open('/home/claude/assets_src/packs/sp/ninja-adventure/background-elements/tileset.png').convert('RGBA')
TH = Image.open('/home/claude/assets_src/packs/top-down-game2/assets/Objects/TilesetHouse.png').convert('RGBA')
CROPS = Image.open('/home/claude/sprout-doctor/public/art/na/crops.png').convert('RGBA')
K = (24, 18, 28)
def night(t):
    a = np.asarray(t).astype(float); a[..., :3] *= np.array([0.55, 0.52, 0.72]); return Image.fromarray(a.astype(np.uint8), 'RGBA')
im = Image.new('RGBA', (W, H), (20, 16, 34, 255)); d = ImageDraw.Draw(im)
WALL = 78
# ---- стеклянная стена: ночное небо за стеклом ----
for y in range(WALL):
    t = y / WALL
    c = (int(22 + 18 * t), int(30 + 30 * t), int(58 + 30 * t))
    d.line((0, y, W, y), fill=c)
# звёзды и луна (за стеклом)
for _ in range(40):
    x, y = R.randrange(W), R.randrange(WALL - 10)
    d.point((x, y), fill=(170, 180, 220) if R.random() < 0.7 else (240, 240, 255))
d.ellipse((236, 10, 256, 30), fill=(236, 232, 208)); d.ellipse((240, 13, 246, 19), fill=(214, 208, 184)); d.point((250, 22), fill=(214, 208, 184))
# силуэт леса за теплицей
for x in range(W):
    h = 18 + int(6 * np.sin(x / 9) + 4 * np.sin(x / 23 + 1))
    d.line((x, WALL - h, x, WALL), fill=(16, 26, 36))
# стёкла: блики, трещины; каркас
PW, PH = 32, 26
for gy in range(0, WALL, PH):
    for gx in range(0, W, PW):
        # голубоватое стекло поверх неба
        g = Image.new('RGBA', (PW, PH), (120, 190, 220, 34)); im.alpha_composite(g, (gx, gy))
        if R.random() < 0.22: d.line((gx + 4, gy + PH - 6, gx + 10, gy + 4), fill=(140, 190, 210))
        r = R.random()
        if r < 0.18:     # разбитое стекло: дыра с острыми краями
            cx, cy = gx + PW // 2 + R.randrange(-4, 5), gy + PH // 2
            pts = [(cx + np.cos(a) * (6 + R.randrange(5)), cy + np.sin(a) * (5 + R.randrange(4))) for a in np.linspace(0, 6.28, 9)[:-1]]
            d.polygon(pts, fill=(14, 12, 26)); d.line(pts + [pts[0]], fill=(150, 200, 220))
        elif r < 0.4:    # трещина
            x0, y0 = gx + R.randrange(6, PW - 6), gy + R.randrange(4, PH - 4)
            for _ in range(3):
                x1, y1 = x0 + R.randrange(-8, 9), y0 + R.randrange(-7, 8)
                d.line((x0, y0, x1, y1), fill=(196, 230, 240)); x0, y0 = x1, y1
for gx in range(0, W + 1, PW): d.rectangle((gx - 2, 0, gx + 1, WALL), fill=(58, 54, 74)); d.line((gx - 2, 0, gx - 2, WALL), fill=K); d.line((gx - 1, 0, gx - 1, WALL), fill=(92, 88, 112))
for gy in range(0, WALL, PH): d.rectangle((0, gy - 1, W, gy + 1), fill=(58, 54, 74)); d.line((0, gy + 1, W, gy + 1), fill=K)
# ржавчина на каркасе
for _ in range(60):
    x = R.randrange(0, W + 1, PW) + R.randrange(-2, 2); y = R.randrange(WALL)
    d.point((x, y), fill=(140, 76, 46))
# ---- кирпичный цоколь ----
d.rectangle((0, WALL, W, WALL + 12), fill=(110, 62, 52))
for row in range(3):
    y = WALL + row * 4
    d.line((0, y, W, y), fill=(70, 38, 36))
    for x in range((row % 2) * 6, W, 12): d.line((x, y, x, y + 4), fill=(70, 38, 36))
d.line((0, WALL + 12, W, WALL + 12), fill=K)
# ---- каменный пол ----
F0 = WALL + 13
for y in range(F0, H):
    t = (y - F0) / (H - F0)
    d.line((0, y, W, y), fill=(int(52 + 22 * t), int(50 + 18 * t), int(70 + 10 * t)))
for ty, y in enumerate(range(F0, H, 14)):
    d.line((0, y, W, y), fill=(36, 32, 50))
    for x in range((ty % 2) * 10, W, 20):
        d.line((x, y, x, y + 14), fill=(36, 32, 50))
        if R.random() < 0.3: d.point((x + R.randrange(3, 17), y + R.randrange(3, 12)), fill=(96, 92, 112))
# центральная дорожка светлее (свет луны через крышу)
shaft = Image.new('RGBA', (W, H)); sd = ImageDraw.Draw(shaft)
sd.polygon([(170, 0), (210, 0), (250, H), (150, H)], fill=(180, 200, 255, 22)); im.alpha_composite(shaft)
# ---- грядки-ящики с погибшими растениями ----
def planter(x, y, w):
    d.rectangle((x, y, x + w, y + 12), fill=(120, 76, 46)); d.rectangle((x, y, x + w, y + 2), fill=(156, 104, 62))
    d.line((x, y + 7, x + w, y + 7), fill=(92, 56, 36)); d.rectangle((x, y, x + w, y + 12), outline=K)
    d.rectangle((x + 2, y - 2, x + w - 2, y + 1), fill=(74, 48, 36))
    for i in range(w // 14):
        fr = R.choice([7, 6, 7, 15, 23, 22])
        cr = CROPS.crop(((fr % 8) * 16, (fr // 8) * 20, (fr % 8) * 16 + 16, (fr // 8) * 20 + 18))
        im.alpha_composite(night(cr), (x + 2 + i * 14, y - 16))
planter(6, 112, 84); planter(230, 112, 84); planter(4, 150, 60); planter(258, 152, 58)
# горшки и ящики из тайлсетов
def tile(src, tx, ty, w=1, h=1): t = src.crop((tx * 16, ty * 16, (tx + w) * 16, (ty + h) * 16)); bb = t.getbbox(); return night(t.crop(bb))
for (x, y) in [(100, 96), (214, 98)]: im.alpha_composite(tile(TH, 20, 14), (x, y))
for (x, y) in [(96, 160), (222, 162), (124, 98)]: im.alpha_composite(tile(TS, 1, 6), (x, y))
# ---- плесень: фиолетовые пятна по полу и стеклу ----
def mold(cx, cy, r):
    for _ in range(int(r * r * 1.2)):
        a = R.random() * 6.28; rr = r * R.random() ** 0.6
        x, y = int(cx + np.cos(a) * rr), int(cy + np.sin(a) * rr * 0.6)
        if 0 <= x < W and 0 <= y < H: d.point((x, y), fill=R.choice([(94, 62, 130), (124, 82, 160), (70, 48, 100), (190, 120, 200)]))
for (cx, cy, r) in [(160, 150, 26), (60, 100, 10), (280, 60, 9), (30, 40, 8), (120, 176, 12), (300, 150, 10)]: mold(cx, cy, r)
# лёгкая виньетка
a = np.asarray(im).astype(float)
yy, xx = np.mgrid[0:H, 0:W]; v = ((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2
a[..., :3] *= (1 - 0.35 * np.clip(v - 0.3, 0, 1))[..., None]
Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(OUT)
print('ok', OUT)
