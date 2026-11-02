"""Пересэмплирование сгенерированных спрайтов под сетку пикселей фона (фоны интерьеров показываются ×2):
спрайт уменьшается так, чтобы при показе ×2 его «пиксель» совпадал с пикселем фона."""
from PIL import Image
import numpy as np
G = '/home/claude/sprout-doctor/public/art/gen/'
def regrid(im, size, colors=40):
    im = im.convert('RGBA'); a = np.asarray(im).astype(float) / 255
    pm = a.copy(); pm[..., :3] *= pm[..., 3:]                       # premultiplied — без тёмной каймы
    small = np.asarray(Image.fromarray((pm * 255).astype(np.uint8), 'RGBA').resize(size, Image.LANCZOS)).astype(float) / 255
    al = small[..., 3]; rgb = np.where(al[..., None] > 0.01, small[..., :3] / np.maximum(al[..., None], 1e-3), 0)
    from PIL import ImageEnhance, ImageFilter
    rgb8 = Image.fromarray((rgb.clip(0, 1) * 255).astype(np.uint8))
    rgb8 = ImageEnhance.Contrast(rgb8.filter(ImageFilter.UnsharpMask(1.2, 60, 2))).enhance(1.1)   # вернуть чёткость после уменьшения
    rgbi = rgb8.quantize(colors, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB')
    out = np.zeros((size[1], size[0], 4), np.uint8); out[..., :3] = np.asarray(rgbi); out[..., 3] = np.where(al > 0.5, 255, 0)
    # тёмная кромка по силуэту — как у пиксель-арта фона
    import scipy.ndimage as nd
    op = out[..., 3] > 0; edge = op & ~nd.binary_erosion(op)
    out[edge, :3] = (out[edge, :3] * 0.45).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')
def one(name, k):
    im = Image.open(G + name + '.png'); w, h = im.size
    regrid(im, (round(w * k), round(h * k))).save(G + name + '_px.png')
for n in ['ogawa_neutral', 'ogawa_talk', 'ogawa_happy']: one(n, 0.5)
one('home_fg', 0.56)
# Аой дома: лист 4 кадра — по кадрам, чтобы кадры не «плыли»
im = Image.open(G + 'aoi_home.png'); fw = im.width // 4
fr = [regrid(im.crop((i * fw, 0, i * fw + fw, im.height)), (round(fw * 0.7), round(im.height * 0.7))) for i in range(4)]
sh = Image.new('RGBA', (fr[0].width * 4, fr[0].height)); [sh.paste(f, (i * f.width, 0)) for i, f in enumerate(fr)]; sh.save(G + 'aoi_home_px.png')
# Фуку (HD-лист 6×112×136) → кадры 24×29 для интерьеров ×2
F = Image.open('/home/claude/sprout-doctor/public/art/chars/fuku_hd.png')
fr = [regrid(F.crop((i * 112, 0, i * 112 + 112, 136)), (24, 29), 24) for i in range(F.width // 112)]
sh = Image.new('RGBA', (24 * len(fr), 29)); [sh.paste(f, (i * 24, 0)) for i, f in enumerate(fr)]; sh.save('/home/claude/sprout-doctor/public/art/chars/fuku_px.png')
print('ok', fr[0].size)
# Хайкаби: на арене ×3 (фон 320×180) — пересэмплируем под ту же сетку
for n in ['haikabi_idle', 'haikabi_rage', 'haikabi_defeated']: one(n, 1.85 / 3)
