import json, base64, zlib, struct, os
from PIL import Image
def load(path):
    m = json.load(open(path)); base = os.path.dirname(path); T = m['tilewidth']
    sets = []
    for ts in m['tilesets']:
        img = Image.open(os.path.join(base, ts['image'])).convert('RGBA'); sets.append((ts['firstgid'], img, img.width // T))
    sets.sort(key=lambda s: -s[0])
    layers = {}
    for L in m['layers']:
        if L['type'] != 'tilelayer': continue
        d = L['data']
        if isinstance(d, str):
            raw = base64.b64decode(d)
            if L.get('compression') == 'zlib': raw = zlib.decompress(raw)
            d = struct.unpack('<%dI' % (len(raw) // 4), raw)
        layers[L['name']] = [g & 0x1FFFFFFF for g in d]
    return m, sets, layers
def tile_img(sets, g, T=32):
    fg, img, cols = next(s for s in sets if g >= s[0]); k = g - fg
    return img.crop(((k % cols) * T, (k // cols) * T, (k % cols + 1) * T, (k // cols + 1) * T))
def render_region(path, layer_names, x0, y0, x1, y1, pred=lambda g: True):
    m, sets, layers = load(path); W = m['width']; T = m['tilewidth']
    can = Image.new('RGBA', ((x1 - x0) * T, (y1 - y0) * T))
    for n in layer_names:
        for i, g in enumerate(layers[n]):
            x, y = i % W, i // W
            if g and x0 <= x < x1 and y0 <= y < y1 and pred(g): can.alpha_composite(tile_img(sets, g, T), ((x - x0) * T, (y - y0) * T))
    return can
