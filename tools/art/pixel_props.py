"""HD-пропсы (автомат, остановка, автобус) → пиксель-арт 1:1 в духе Ninja Adventure: уменьшение ×0.5, палитра, тёмный контур."""
from PIL import Image
import numpy as np, scipy.ndimage as nd
W = '/home/claude/sprout-doctor/public/art/world/'
OUTL = np.array([24, 18, 28, 255], np.uint8)
def pix(im, scale=0.5, colors=20):
    w, h = im.size
    small = im.resize((round(w * scale), round(h * scale)), Image.LANCZOS)
    a = np.asarray(small).copy(); al = a[..., 3] > 110
    rgb = Image.fromarray(a[..., :3]).quantize(colors, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
    out = np.zeros_like(a); out[..., :3] = np.asarray(rgb); out[..., 3] = np.where(al, 255, 0)
    # контур: внешняя кромка + затемнение крайних пикселей
    ring = nd.binary_dilation(al) & ~al
    pad = np.zeros((out.shape[0] + 2, out.shape[1] + 2, 4), np.uint8); pad[1:-1, 1:-1] = out
    ringp = nd.binary_dilation(np.pad(al, 1)) & ~np.pad(al, 1)
    pad[ringp] = OUTL
    return Image.fromarray(pad, 'RGBA')
pix(Image.open(W + 'vending_hd.png').convert('RGBA')).save(W + 'vending.png')
pix(Image.open(W + 'busstop_hd.png').convert('RGBA')).save(W + 'busstop.png')
bus = Image.open(W + 'bus_hd.png').convert('RGBA')
fr = [pix(bus.crop((i * 96, 0, i * 96 + 96, 52)), colors=24) for i in range(2)]
sheet = Image.new('RGBA', (fr[0].width * 2, fr[0].height)); sheet.paste(fr[0], (0, 0)); sheet.paste(fr[1], (fr[0].width, 0)); sheet.save(W + 'bus.png')
for f in ['vending', 'busstop', 'bus']: print(f, Image.open(W + f + '.png').size)

# ---- остановка в стиле Ninja Adventure: столб с круглым знаком + деревянная скамейка (вместо HD-навеса) ----
from PIL import ImageDraw
TS = Image.open('/home/claude/assets_src/packs/sp/ninja-adventure/background-elements/tileset.png').convert('RGBA')
bench = Image.new('RGBA', (30, 14)); bd = ImageDraw.Draw(bench)   # деревянная скамейка
bd.rectangle((0, 2, 29, 7), fill=(24, 18, 28, 255)); bd.rectangle((1, 3, 28, 4), fill=(196, 132, 74, 255)); bd.rectangle((1, 5, 28, 6), fill=(150, 96, 52, 255))
for x in (3, 25): bd.rectangle((x, 7, x + 2, 13), fill=(24, 18, 28, 255)); bd.line((x + 1, 8, x + 1, 12), fill=(120, 76, 42, 255))
bd.rectangle((0, 0, 29, 1), fill=(24, 18, 28, 255)); bd.line((1, 1, 28, 1), fill=(170, 112, 62, 255))
st = Image.new('RGBA', (14 + bench.width + 2, 34)); d = ImageDraw.Draw(st)
K = (24, 18, 28, 255)
# столб
d.rectangle((5, 10, 7, 32), fill=K); d.line((6, 11, 6, 31), fill=(150, 156, 170, 255))
d.rectangle((3, 31, 9, 33), fill=K); d.line((4, 32, 8, 32), fill=(110, 116, 130, 255))
# круглый знак: белый диск, красная кайма, синяя полоса (как у японских остановок)
d.ellipse((0, 0, 12, 12), fill=K); d.ellipse((1, 1, 11, 11), fill=(214, 52, 62, 255)); d.ellipse((3, 3, 9, 9), fill=(250, 246, 238, 255))
d.rectangle((3, 5, 9, 7), fill=(52, 84, 160, 255))
st.alpha_composite(bench, (14, 34 - bench.height))
st.save(W + 'busstop.png'); print('busstop NA', st.size)
