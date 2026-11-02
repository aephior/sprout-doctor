import json, sys, os
from PIL import Image
def render(path, out, scale=1):
    m = json.load(open(path)); T = m['tilewidth']; base = os.path.dirname(path)
    sets = []
    for ts in m['tilesets']:
        img = Image.open(os.path.join(base, ts['image'])).convert('RGBA')
        sets.append((ts['firstgid'], img, img.width // T))
    sets.sort(key=lambda s: -s[0])
    can = Image.new('RGBA', (m['width'] * T, m['height'] * T), (40, 40, 40, 255))
    for L in m['layers']:
        if L['type'] != 'tilelayer': continue
        data = L['data']
        if isinstance(data, str):
            import base64, zlib, struct
            raw = base64.b64decode(data)
            if L.get('compression') == 'zlib': raw = zlib.decompress(raw)
            elif L.get('compression') == 'gzip': import gzip; raw = gzip.decompress(raw)
            data = struct.unpack('<%dI' % (len(raw) // 4), raw)
        for i, g in enumerate(data):
            g &= 0x1FFFFFFF
            if not g: continue
            fg, img, cols = next(s for s in sets if g >= s[0]); k = g - fg
            tile = img.crop(((k % cols) * T, (k // cols) * T, (k % cols + 1) * T, (k // cols + 1) * T))
            can.alpha_composite(tile, ((i % m['width']) * T, (i // m['width']) * T))
    if scale != 1: can = can.resize((int(can.width * scale), int(can.height * scale)), Image.NEAREST)
    can.save(out)
if __name__ == '__main__': render(sys.argv[1], sys.argv[2], float(sys.argv[3]) if len(sys.argv) > 3 else 1)
