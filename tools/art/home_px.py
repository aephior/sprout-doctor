"""Дом бабушки Хару — комната сверху, нарисованная попиксельно в стиле Ninja Adventure (16 px тайл, 320×176,
в игре ×3, как ферма). Тёмный контур, 3 тона на материал. Отдельно — котацу (Аой может зайти за него) и ночной вариант.
Выход: public/art/home/px_day.png, px_night.png, px_kotatsu_day.png, px_kotatsu_night.png."""
from PIL import Image, ImageDraw
import numpy as np, random
OUT = '/home/claude/sprout-doctor/public/art/home/'
W, H = 320, 176
R = random.Random(3)
K = (30, 18, 24)
WD, WM, WL = (92, 54, 38), (146, 92, 56), (194, 136, 82)          # дерево
PL, PS = (238, 222, 190), (214, 194, 156)                        # штукатурка
TL, TM, TB = (224, 214, 150), (204, 192, 124), (84, 104, 64)      # татами + кайма
BL, BM, BD = (66, 84, 150), (52, 64, 120), (36, 44, 90)           # синяя ткань
PK, WH = (242, 168, 186), (250, 246, 238)
GR, GD = (96, 160, 72), (58, 110, 56)

def box(d, x0, y0, x1, y1, fill, outline=K):
    d.rectangle((x0, y0, x1, y1), fill=outline); d.rectangle((x0 + 1, y0 + 1, x1 - 1, y1 - 1), fill=fill)

def room(night, bare=False):
    im = Image.new('RGB', (W, H), K); d = ImageDraw.Draw(im)
    # ---- пол: татами (маты 16×32 и 32×16 вперемешку, как в японской комнате) ----
    FX0, FY0, FX1, FY1 = 6, 50, 313, 167
    d.rectangle((FX0, FY0, FX1, FY1), fill=TM)
    mats = []
    for y in range(FY0, FY1, 32):
        for x in range(FX0, FX1, 32):
            if ((x // 32) + (y // 32)) % 2: mats += [(x, y, x + 31, y + 15), (x, y + 16, x + 31, y + 31)]
            else: mats += [(x, y, x + 15, y + 31), (x + 16, y, x + 31, y + 31)]
    for (x0, y0, x1, y1) in mats:
        x1, y1 = min(x1, FX1), min(y1, FY1)
        d.rectangle((x0, y0, x1, y1), fill=TL)
        for yy in range(y0 + 2, y1, 3): d.line((x0 + 1, yy, x1 - 1, yy), fill=TM)          # плетение
        d.rectangle((x0, y0, x1, y1), outline=TB)                                          # тёмная кайма мата
    # ---- верхняя стена: балка, штукатурка, деревянные стойки, плинтус ----
    d.rectangle((0, 0, W - 1, 49), fill=PL)
    for y in range(12, 44, 10): d.line((0, y, W - 1, y), fill=PS)
    d.rectangle((0, 0, W - 1, 4), fill=WD); d.line((0, 5, W - 1, 5), fill=K)
    for x in (0, 60, 100, 196, 252, 314): d.rectangle((x, 6, x + 5, 44), fill=WM); d.line((x + 5, 6, x + 5, 44), fill=WD)
    d.rectangle((0, 44, W - 1, 49), fill=WM); d.line((0, 44, W - 1, 44), fill=WL); d.line((0, 49, W - 1, 49), fill=K)
    # боковые и нижняя стены (тёмное дерево), дверной проём внизу по центру
    d.rectangle((0, 0, 5, H - 1), fill=WD); d.line((5, 6, 5, H - 1), fill=K)
    d.rectangle((W - 6, 0, W - 1, H - 1), fill=WD); d.line((W - 7, 6, W - 7, H - 1), fill=K)
    d.rectangle((0, 168, W - 1, H - 1), fill=WD); d.line((0, 167, W - 1, 167), fill=K)
    d.rectangle((144, 166, 175, H - 1), fill=(120, 84, 56)); d.line((144, 167, 175, 167), fill=WL)    # порог
    for x in range(146, 175, 4): d.line((x, 170, x + 2, 170), fill=(150, 108, 70))
    # ---- окно-сёдзи с сакурой (днём небо, ночью луна) ----
    box(d, 112, 8, 176, 40, WM)
    sky = (60, 70, 130) if night else (176, 216, 240)
    d.rectangle((114, 10, 174, 38), fill=sky)
    if night:
        d.ellipse((156, 13, 166, 23), fill=(246, 240, 214)); d.ellipse((159, 15, 163, 19), fill=(226, 218, 190))
        for _ in range(8): d.point((R.randrange(116, 172), R.randrange(12, 36)), fill=(200, 210, 250))
    else:
        d.rectangle((120, 14, 132, 17), fill=WH); d.rectangle((117, 16, 136, 19), fill=WH)
    # ветка сакуры
    d.line((114, 34, 134, 26), fill=(70, 44, 40)); d.line((134, 26, 150, 22), fill=(70, 44, 40)); d.line((134, 26, 140, 34), fill=(70, 44, 40))
    for (x, y) in [(124, 28), (131, 24), (138, 23), (146, 20), (140, 31), (128, 32), (150, 25)]:
        d.rectangle((x - 1, y - 1, x + 1, y + 1), fill=PK); d.point((x, y), fill=WH)
    # переплёт: левая половина — бумажные сёдзи, правая открыта
    d.rectangle((114, 10, 143, 38), fill=(244, 236, 214) if not night else (150, 140, 150))
    for x in range(121, 143, 7): d.line((x, 10, x, 38), fill=WM)
    for y in range(17, 38, 7): d.line((114, y, 143, y), fill=WM)
    d.line((144, 10, 144, 38), fill=WD)
    # ---- свиток и календарь ----
    box(d, 84, 8, 96, 40, (232, 222, 196)); d.rectangle((82, 7, 98, 9), fill=WD); d.rectangle((82, 39, 98, 41), fill=WD)
    for (y, w) in [(14, 6), (19, 5), (24, 6), (30, 4)]: d.line((90 - w // 2, y, 90 + w // 2, y), fill=K); d.line((90, y - 2, 90, y + 2), fill=K)
    box(d, 212, 10, 228, 30, WH); d.rectangle((214, 12, 226, 18), fill=PK); d.point((218, 15), fill=(120, 70, 60))
    for y in (21, 24, 27):
        for x in range(214, 227, 3): d.point((x, y), fill=(200, 80, 80) if (x + y) % 7 == 0 else (120, 110, 100))
    # ---- книжная полка с дневником (левый верхний угол) ----
    if not bare:
        box(d, 12, 22, 54, 62, WM)
        for y in (32, 44, 54): d.line((13, y, 53, y), fill=WD)
        cols = [(150, 60, 60), (70, 110, 80), (70, 90, 140), (180, 150, 80), (120, 80, 120)]
        for row, y0 in enumerate((24, 34, 46)):
            x = 14
            while x < 50:
                w = R.choice([2, 3, 3, 4]); c = R.choice(cols)
                d.rectangle((x, y0 + R.randrange(0, 2), x + w - 1, y0 + 7), fill=c); x += w + (1 if R.random() < 0.3 else 0)
        box(d, 16, 14, 30, 24, (190, 50, 60)); d.line((18, 16, 28, 16), fill=(230, 160, 120)); d.point((29, 19), fill=(240, 200, 90))   # дневник Хару
        box(d, 34, 15, 41, 24, (96, 140, 80)); box(d, 43, 13, 50, 24, (210, 196, 150))                                              # чайные банки
    # ---- зарядка Фуку: деревянная подставка и провод от розетки ----
    if not bare:
        box(d, 62, 52, 80, 58, WM); d.line((63, 53, 79, 53), fill=WL)
        d.rectangle((84, 38, 88, 42), fill=WH); d.point((86, 40), fill=K)                                                           # розетка
        d.line((86, 42, 86, 48), fill=(60, 60, 70)); d.line((86, 48, 80, 55), fill=(60, 60, 70))
    # ---- комод с фото бабушки и дедушки ----
    if not bare:
        box(d, 202, 34, 240, 60, WM); d.line((203, 47, 239, 47), fill=WD); d.rectangle((219, 39, 222, 41), fill=WL); d.rectangle((219, 51, 222, 53), fill=WL)
        box(d, 210, 22, 228, 36, (210, 170, 90)); d.rectangle((212, 24, 226, 34), fill=(200, 200, 190))
        d.rectangle((214, 27, 218, 34), fill=(90, 70, 70)); d.rectangle((220, 27, 224, 34), fill=(130, 90, 110)); d.rectangle((215, 25, 217, 28), fill=(220, 220, 220)); d.rectangle((221, 25, 223, 28), fill=(220, 220, 220))
        box(d, 232, 24, 238, 34, (120, 160, 100)); d.point((235, 22), fill=PK)   # благовония/цветок
    # ---- кухонный уголок: стол-тумба, плитка, чайник ----
    if not bare:
        box(d, 264, 28, 310, 64, WM); d.line((265, 40, 309, 40), fill=WL); d.line((265, 52, 309, 52), fill=WD)
        box(d, 270, 18, 290, 30, (110, 110, 120)); d.ellipse((274, 20, 286, 28), fill=(60, 60, 70))
        box(d, 274, 10, 286, 22, (200, 200, 205)); d.line((276, 12, 284, 12), fill=WH); d.rectangle((286, 14, 289, 16), fill=K)        # чайник
        box(d, 294, 24, 306, 36, (232, 226, 210)); d.line((296, 28, 304, 28), fill=(180, 170, 150))                                       # посуда
    # ---- футон у правой стены, лампы-андон ----
    box(d, 262, 90, 300, 150, WH)
    box(d, 264, 104, 298, 148, BM); d.line((265, 105, 297, 105), fill=BL)
    for (x, y) in [(270, 112), (286, 118), (276, 128), (292, 134), (268, 140), (284, 142)]:
        d.rectangle((x - 1, y, x + 1, y), fill=PK); d.rectangle((x, y - 1, x, y + 1), fill=PK); d.point((x, y), fill=WH)
    box(d, 268, 92, 294, 102, WH); d.line((270, 94, 292, 94), fill=(226, 222, 214))                                                  # подушка
    for (x, y) in ([] if bare else [(304, 84), (304, 150)]):
        box(d, x, y, x + 9, y + 15, (250, 226, 160) if night else (236, 220, 180)); d.line((x + 1, y + 5, x + 8, y + 5), fill=WM); d.line((x + 1, y + 10, x + 8, y + 10), fill=WM)
    # ---- лежанка Моти и миска ----
    d.ellipse((14, 96, 48, 120), fill=K); d.ellipse((15, 97, 47, 119), fill=(196, 140, 82)); d.ellipse((19, 101, 43, 115), fill=(236, 214, 190))
    d.ellipse((22, 124, 36, 132), fill=K); d.ellipse((23, 125, 35, 131), fill=WH); d.rectangle((26, 126, 32, 128), fill=(150, 90, 60))
    # ---- растения в углах ----
    if not bare:
        for (cx, by, s) in [(18, 164, 1.0), (40, 166, 0.8)]:
            pw = int(10 * s); box(d, cx - pw // 2, by - int(10 * s), cx + pw // 2, by, (170, 96, 64))
            for i in range(7):
                ang = -2.6 + i * 0.36; ln = int(14 * s)
                x2, y2 = cx + int(np.cos(ang) * ln), by - int(10 * s) + int(np.sin(ang) * ln)
                d.line((cx, by - int(10 * s), x2, y2), fill=GD); d.ellipse((x2 - 3, y2 - 2, x2 + 3, y2 + 2), fill=GR if i % 2 else GD)
    # дзабутоны вокруг котацу (низкие, можно наступать)
    if not bare:
        for (x, y) in [(124, 102), (190, 102), (156, 128)]:
            box(d, x, y, x + 12, y + 10, (214, 120, 70)); d.point((x + 6, y + 5), fill=(160, 70, 40))
    a = np.asarray(im).astype(float)
    if night:
        a *= np.array([0.46, 0.44, 0.66]); a[10:39, 114:175] = np.asarray(im)[10:39, 114:175] * np.array([0.8, 0.8, 1.0])   # окно чуть светлее
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))

def kotatsu(night):
    im = Image.new('RGBA', (56, 34)); d = ImageDraw.Draw(im)
    box(d, 0, 10, 55, 33, BM); d.line((1, 11, 54, 11), fill=BL)                       # одеяло-юбка
    for (x, y) in [(8, 22), (22, 28), (40, 24), (48, 30), (14, 30)]: d.rectangle((x - 1, y, x + 1, y), fill=PK); d.rectangle((x, y - 1, x, y + 1), fill=PK)
    box(d, 4, 2, 51, 22, WM); d.line((5, 3, 50, 3), fill=WL); d.line((5, 21, 50, 21), fill=WD)   # столешница
    box(d, 22, 2, 32, 11, (200, 200, 205)); d.line((24, 4, 30, 4), fill=WH); d.rectangle((32, 5, 34, 7), fill=K)   # чайник
    for x in (10, 40): box(d, x, 12, x + 6, 18, (232, 226, 210)); d.rectangle((x + 2, 13, x + 4, 14), fill=(110, 160, 90))   # чашки
    if night:
        a = np.asarray(im).astype(float); a[..., :3] *= np.array([0.62, 0.56, 0.62]); im = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    return im

def sleeper():
    """Футон со спящей Аой (накладывается поверх футона 262..301 × 90..151)."""
    base = room(False).crop((262, 90, 302, 152)).convert('RGBA'); d = ImageDraw.Draw(base)
    HR, HD, SK = (156, 94, 52), (104, 58, 34), (252, 196, 150)
    d.ellipse((12, 3, 28, 17), fill=K); d.ellipse((13, 4, 27, 16), fill=HR)              # волосы на подушке
    d.ellipse((15, 7, 25, 15), fill=SK); d.rectangle((15, 7, 25, 9), fill=HR)              # лицо, чёлка
    d.line((17, 12, 19, 12), fill=K); d.line((21, 12, 23, 12), fill=K)                     # закрытые глаза
    d.point((16, 13), fill=(244, 140, 140)); d.point((24, 13), fill=(244, 140, 140))
    d.line((26, 14, 30, 22), fill=HD); d.point((30, 23), fill=(214, 52, 62))               # коса с бантиком
    d.rectangle((6, 15, 34, 22), fill=BL); d.line((6, 15, 34, 15), fill=K)                 # одеяло подтянуто
    d.ellipse((8, 18, 32, 34), fill=BL)                                                     # бугорок под одеялом
    return base
TS = Image.open('/home/claude/assets_src/packs/sp/ninja-adventure/background-elements/tileset.png').convert('RGBA')
WS = Image.open('/home/claude/assets_src/na_extra/tileset_wall_simple.png').convert('RGBA')
def tl(x, y, w=1, h=1, src=TS):
    t = src.crop((x * 16, y * 16, (x + w) * 16, (y + h) * 16)); bb = t.getbbox(); return t.crop(bb) if bb else t
def room2(night):
    """Комната из ассетов Ninja Adventure: стены-рамка (tileset_wall_simple), мебель и утварь (tileset), + татами, окно и футон."""
    im = room(False, bare=True).convert('RGBA'); d = ImageDraw.Draw(im)
    for x in (96, 178): im.alpha_composite(tl(11, 3), (x, 10))      # бумажные сёдзи по бокам окна
    # ---- мебель NA ----
    P = lambda t, x, y: im.alpha_composite(t, (x, y - t.height))       # (x, низ)
    P(tl(12, 4), 12, 54); P(tl(11, 5), 30, 54)                          # шкаф и комод-тансу (левый угол)
    P(tl(8, 6), 50, 56)                                                  # письменный столик с бумагами — тут дневник
    P(tl(15, 3), 66, 56)                                                 # ящичек-док: зарядка Фуку
    P(tl(11, 4), 202, 54); P(tl(10, 5), 204, 40)                         # сундук + домашний алтарь с фото
    P(tl(12, 5), 222, 54)
    P(tl(12, 6), 262, 56); P(tl(9, 6), 280, 56); P(tl(13, 3), 298, 58)   # кухня: кадка риса, умывальник, ведро
    P(tl(12, 3), 248, 58)
    P(tl(16, 7), 284, 40)                                                # лоток с яйцами на полке
    for (x, y) in [(18, 166), (296, 166)]: P(tl(1, 6), x, y)            # горшки
    P(tl(13, 4), 36, 166)                                                # бонсай
    P(tl(10, 6), 302, 102); P(tl(10, 6), 302, 158)                       # стойки-андон у футона
    P(tl(12, 7), 116, 112); P(tl(12, 7), 188, 112); P(tl(13, 7), 152, 128)   # дзабутоны вокруг столика
    # провод от розетки к доку Фуку
    d.rectangle((84, 38, 88, 42), fill=WH); d.point((86, 40), fill=K); d.line((86, 42, 86, 47), fill=(60, 60, 70)); d.line((86, 47, 78, 52), fill=(60, 60, 70))
    # стены-рамка NA (коричневые): левая/правая/нижняя кромка
    out = im.convert('RGB')
    a = np.asarray(out).astype(float)
    if night:
        a *= np.array([0.46, 0.44, 0.66]); a[10:39, 114:175] = np.asarray(out)[10:39, 114:175] * np.array([0.8, 0.8, 1.0])
    return Image.fromarray(a.clip(0, 255).astype(np.uint8))
def table2(night):
    """Низкий столик-тябудай (NA) с чайником и чашками — отдельным спрайтом."""
    t = tl(14, 6, 3, 1).copy(); d = ImageDraw.Draw(t)
    w = t.width
    box(d, w // 2 - 5, 0, w // 2 + 5, 7, (200, 200, 205)); d.line((w // 2 - 3, 2, w // 2 + 3, 2), fill=WH); d.rectangle((w // 2 + 5, 3, w // 2 + 7, 4), fill=K)
    for x in (8, w - 14): box(d, x, 2, x + 6, 7, (232, 226, 210)); d.rectangle((x + 2, 3, x + 4, 4), fill=(110, 160, 90))
    if night:
        a = np.asarray(t).astype(float); a[..., :3] *= np.array([0.62, 0.56, 0.62]); t = Image.fromarray(a.clip(0, 255).astype(np.uint8))
    return t
for n in (False, True):
    tag = 'night' if n else 'day'
    room2(n).save(OUT + f'px_{tag}.png'); table2(n).save(OUT + f'px_kotatsu_{tag}.png')
sleeper().save(OUT + 'px_futon_sleep.png')
print('home px ok')
