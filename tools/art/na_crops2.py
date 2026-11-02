"""Растения в стиле Ninja Adventure — два размера из одной геометрии:
  crops.png    16×20 (ферма, 1 ед. мира = 1 px), 8 кадров × 3 культуры;
  crops_hd.png 48×60 (крупный план в Процедурной, показывается ×4 — сетка совпадает с фоном ×4).
Кадры: 0 лунка, 1 росток, 2 молодое, 3 растёт (томат — цветы), 4 созрело, 5 больное, 6 тяжело больное (вялое, плесень), 7 погибшее.
Культуры различаются силуэтом: томат — высокий куст у колышка с гроздьями; картофель — низкая широкая ботва с цветами;
перец — средний куст с глянцевыми листьями и висящими вытянутыми плодами."""
from PIL import Image, ImageDraw
import numpy as np, math, random
OUT = '/home/claude/sprout-doctor/public/art/na/'
K = (24, 18, 22, 255)
PAL = {
    'healthy': dict(l1=(116, 196, 78), l2=(70, 150, 62), l3=(44, 104, 52), stem=(78, 140, 56)),
    'sick':    dict(l1=(206, 196, 84), l2=(160, 160, 60), l3=(104, 116, 50), stem=(110, 130, 56), spot=(112, 70, 36)),
    'very':    dict(l1=(170, 150, 84), l2=(132, 112, 66), l3=(92, 76, 56), stem=(110, 96, 60), spot=(70, 46, 34), mold=(196, 190, 206)),
    'dead':    dict(l1=(150, 112, 70), l2=(118, 84, 52), l3=(86, 60, 40), stem=(104, 76, 48)),
}
SOIL, SOIL2 = (138, 86, 52), (100, 60, 36)

def leaf(d, S, x, y, ang, ln, w, col, shade, k=1.0):
    """Лист-капля: основание (x,y), направление ang (рад, 0 = вправо, π/2 = вниз), длина ln, ширина w (в ед. 16×20)."""
    ca, sa = math.cos(ang), math.sin(ang)
    tip = (x + ca * ln, y + sa * ln)
    mid = (x + ca * ln * 0.45, y + sa * ln * 0.45)
    nx, ny = -sa * w / 2, ca * w / 2
    pts = [(x, y), (mid[0] + nx, mid[1] + ny), tip, (mid[0] - nx, mid[1] - ny)]
    d.polygon([(px * S, py * S) for px, py in pts], fill=col)
    # тень по нижней половине листа
    d.polygon([(px * S, py * S) for px, py in [(x, y), (mid[0] + (nx if ny > 0 else -nx) * 0.9, mid[1] + abs(ny) * 0.9), tip]], fill=shade)
    return tip, mid

def outline(im):
    a = np.asarray(im)[:, :, 3] > 0; h, w = a.shape; px = im.load()
    ring = np.zeros_like(a)
    ring[1:] |= a[:-1]; ring[:-1] |= a[1:]; ring[:, 1:] |= a[:, :-1]; ring[:, :-1] |= a[:, 1:]
    ring &= ~a
    for y, x in zip(*np.where(ring)): px[x, y] = K
    return im

def mound(S):
    im = Image.new('RGBA', (16 * S, 20 * S)); d = ImageDraw.Draw(im)
    d.ellipse((3 * S, 15.5 * S, 12.5 * S, 19.3 * S), fill=SOIL)
    d.line((5 * S, 17.5 * S, 10.5 * S, 17.5 * S), fill=SOIL2, width=max(1, S // 2))
    if S > 1:
        for (x, y) in ((4.5, 16.8), (9.5, 16.5), (7, 18.6)): d.point([(x * S, y * S)], fill=(170, 116, 74))
    return im

def plant(kind, stage, state, S, seed=1):
    """stage: 1..4; state: healthy/sick/very/dead. Больные состояния рисуются от stage 3 без плодов."""
    rnd = random.Random(seed * 31 + stage)
    im = Image.new('RGBA', (16 * S, 20 * S)); d = ImageDraw.Draw(im)
    P = PAL[state]; base = 18.2
    droop = {'healthy': 0, 'sick': 0.35, 'very': 0.95, 'dead': 1.35}[state]
    shrink = {'healthy': 1, 'sick': 0.95, 'very': 0.8, 'dead': 0.55}[state]
    sw = max(1, S)                         # толщина стебля
    tips = []
    def L(x, y, ang, ln, w, i):
        a2 = ang + droop * (0.6 if math.cos(ang) >= 0 else -0.6) * (1 if ang < math.pi / 2 + 0.01 else 1)
        # поникание: листья тянутся вниз (к π/2)
        a2 = ang + (math.pi / 2 - ang) * min(0.85, droop * 0.55)
        col = P['l1'] if i % 2 == 0 else P['l2']
        t, m = leaf(d, S, x, y, a2, ln * shrink, w * (0.85 if state == 'dead' else 1), col, P['l3'])
        tips.append((t, m))
    if stage == 1 and state == 'healthy':
        d.line((7.5 * S, base * S, 7.5 * S, (base - 3) * S), fill=P['stem'], width=sw)
        L(7.5, base - 3, math.pi + 0.5, 3, 2, 0); L(7.5, base - 3, -0.5, 3, 2, 1)
        return outline(im)
    if kind == 'tomato':
        h = {2: 8, 3: 12.5, 4: 13.5}[stage] * (1 if state == 'healthy' else 0.92)
        if stage >= 3 and state != 'dead':   # колышек
            d.line((11.6 * S, base * S, 11.6 * S, (base - h - 0.5) * S), fill=(150, 104, 62), width=sw)
        bend = droop * 2.2
        top = (7.5 + bend, base - h * (1 - 0.18 * droop))
        d.line((7.5 * S, base * S, (7.5 + bend * 0.4) * S, (base - h * 0.5) * S, top[0] * S, top[1] * S), fill=P['stem'], width=sw + (1 if S > 1 else 0), joint='curve')
        n = {2: 2, 3: 4, 4: 4}[stage]
        for k in range(n):
            t = (k + 1) / (n + 0.6); y = base - h * t; x = 7.5 + bend * t
            side = 1 if k % 2 else -1
            L(x, y, (math.pi + 0.35 if side < 0 else -0.35) + rnd.uniform(-0.15, 0.15), 4.4 - t * 1.2, 3.4, k)
            L(x, y, (math.pi - 0.25 if side < 0 else 0.25), 2.8, 2.6, k + 1)
        L(top[0], top[1], -math.pi / 2 - 0.5, 3, 2.8, 0); L(top[0], top[1], -math.pi / 2 + 0.5, 3, 2.8, 1)
        if state == 'healthy' and stage == 3:   # жёлтые цветы
            for (x, y) in ((5, base - 9), (10, base - 11)): d.rectangle((x * S, y * S, (x + 1) * S - 1, (y + 1) * S - 1), fill=(250, 214, 70))
        if state == 'healthy' and stage == 4:   # гроздья томатов
            for (x, y, r) in ((4.6, base - 6.2, 1.6), (10, base - 8.6, 1.6), (6, base - 10.8, 1.4), (9.4, base - 4.2, 1.5), (5.2, base - 3.6, 1.3)):
                d.ellipse(((x - r) * S, (y - r) * S, (x + r) * S, (y + r) * S), fill=(222, 54, 56))
                d.point([((x - r * 0.4) * S, (y - r * 0.4) * S)], fill=(255, 176, 166))
                d.point([(x * S, (y - r) * S)], fill=(70, 140, 50))
    elif kind == 'potato':
        h = {2: 5.5, 3: 8, 4: 9}[stage]
        n = {2: 5, 3: 7, 4: 8}[stage]
        for k in range(n):
            ang = -math.pi / 2 + (k - (n - 1) / 2) * (2.3 / max(1, n - 1))
            ln = h * (0.75 + 0.25 * math.cos(ang + math.pi / 2)) * (1 - 0.25 * droop)
            ex, ey = 7.8 + math.cos(ang) * ln, base - 0.5 + math.sin(ang) * ln * (1 - 0.45 * droop)
            if droop > 1.2: ey = base - 1 - abs(math.cos(ang)) * 1.5 - rnd.uniform(0, 1.5); ex = 7.8 + math.cos(ang) * (ln + 2)
            d.line((7.8 * S, base * S, ex * S, ey * S), fill=P['stem'], width=sw)
            # округлые листочки по стеблю
            for j, f in enumerate((0.55, 1.0)):
                cx, cy = 7.8 + (ex - 7.8) * f, base + (ey - base) * f
                r = (1.9 if f == 1 else 1.5) * (S > 1 and 1.05 or 1) * shrink
                d.ellipse(((cx - r) * S, (cy - r * 0.8) * S, (cx + r) * S, (cy + r * 0.8) * S), fill=P['l1'] if (k + j) % 2 else P['l2'])
                d.point([((cx + 0.3) * S, (cy + 0.4) * S)], fill=P['l3'])
        if state == 'healthy' and stage == 4:     # белые цветки с жёлтым центром
            for (x, y) in ((5, base - 8), (10.5, base - 8.5), (7.8, base - 9.6)):
                d.rectangle(((x - 0.6) * S, (y - 0.6) * S, (x + 0.6) * S, (y + 0.6) * S), fill=(246, 240, 236))
                d.point([(x * S, y * S)], fill=(240, 200, 60))
    else:   # pepper
        h = {2: 7, 3: 10, 4: 11}[stage] * (1 if state == 'healthy' else 0.92)
        bend = -droop * 1.8
        top = (7.6 + bend, base - h * (1 - 0.2 * droop))
        d.line((7.6 * S, base * S, (7.6 + bend * 0.3) * S, (base - h * 0.45) * S), fill=P['stem'], width=sw + (1 if S > 1 else 0))
        fork = (7.6 + bend * 0.3, base - h * 0.45)
        for dx in (-2.6, 2.6):   # развилка — у перца «рогатка»
            d.line((fork[0] * S, fork[1] * S, (fork[0] + dx + bend * 0.5) * S, (top[1] + 0.5) * S), fill=P['stem'], width=sw)
        n = {2: 2, 3: 3, 4: 3}[stage]
        for k in range(n):
            t = (k + 1) / (n + 0.5); y = base - h * t
            for dx, a0 in ((-2.6, math.pi + 0.15), (2.6, -0.15)):
                x = 7.6 + bend * t + (dx * t if t > 0.45 else 0)
                L(x, y, a0 + (-0.45 if dx < 0 else 0.45) * t, 3.6, 2.7, k + (dx > 0))
        for dx in (-2.6, 2.6):
            L(fork[0] + dx + bend * 0.5, top[1] + 0.5, -math.pi / 2 + (-0.35 if dx < 0 else 0.35), 2.8, 2.0, 0)
        if state == 'healthy' and stage == 4:   # висящие вытянутые перцы
            for (x, y, c) in ((5.2, base - 7.5, (232, 70, 40)), (10.4, base - 8.4, (240, 140, 40)), (8.6, base - 4.6, (232, 70, 40))):
                d.polygon([((x - 0.9) * S, y * S), ((x + 0.9) * S, y * S), ((x + 0.5) * S, (y + 3.2) * S), (x * S, (y + 4) * S), ((x - 0.4) * S, (y + 3.2) * S)], fill=c)
                d.line((x * S, (y - 1) * S, x * S, y * S), fill=(70, 140, 50), width=sw)
                d.point([((x - 0.4) * S, (y + 0.6) * S)], fill=(255, 190, 150))
    # болезнь: пятна на листьях и плесень
    if state in ('sick', 'very'):
        cnt = {'sick': 5, 'very': 8}[state] * (S if S > 1 else 1)
        a = np.asarray(im)
        leafpix = [(x, y) for y in range(a.shape[0]) for x in range(a.shape[1]) if a[y, x, 3] and tuple(a[y, x, :3]) in (P['l1'], P['l2'])]
        rnd.shuffle(leafpix)
        for (x, y) in leafpix[:cnt]:
            d.rectangle((x, y, x + (S > 1), y + (S > 1)), fill=P['spot'])
        if state == 'very':   # серо-фиолетовый налёт по краям листьев
            for (x, y) in leafpix[cnt:cnt + 4 * S]:
                d.point([(x, y)], fill=P['mold'])
    if state == 'dead':   # опавшие листья у основания
        for x in (4.5, 10.5):
            d.ellipse(((x - 1.3) * S, (base - 0.6) * S, (x + 1.3) * S, (base + 0.6) * S), fill=P['l2'])
    return outline(im)

def sheet(S):
    sh = Image.new('RGBA', (16 * S * 8, 20 * S * 3))
    for i, kind in enumerate(['tomato', 'potato', 'pepper']):
        frames = [None] + [plant(kind, s, 'healthy', S, i) for s in (1, 2, 3, 4)] + \
                 [plant(kind, 3, st, S, i) for st in ('sick', 'very', 'dead')]
        for j, f in enumerate(frames):
            c = mound(S)
            if f is not None: c.alpha_composite(f)
            c = outline(c) if j == 0 else c
            sh.alpha_composite(c, (j * 16 * S, i * 20 * S))
    return sh
sheet(1).save(OUT + 'crops.png')
sheet(3).save(OUT + 'crops_hd.png')   # 48×60: крупный план ×4
print('ok')
