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
