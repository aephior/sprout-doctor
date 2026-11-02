from PIL import Image, ImageDraw
import numpy as np, scipy.ndimage as nd, json, sys
SRC = {'T': '/home/claude/assets_src/packs/sp/ninja-adventure/background-elements/tileset.png', 'H': '/home/claude/assets_src/packs/top-down-game2/assets/Objects/TilesetHouse.png'}
def comps(sheet, rect):
    im = Image.open(SRC[sheet]).convert('RGBA'); x0, y0, w, h = rect
    c = im.crop((x0 * 16, y0 * 16, (x0 + w) * 16, (y0 + h) * 16)); a = np.asarray(c)[:, :, 3] > 0
    lab, n = nd.label(a, structure=np.ones((3, 3)))
    out = []
    for i, sl in enumerate(nd.find_objects(lab)):
        if (sl[0].stop - sl[0].start) * (sl[1].stop - sl[1].start) < 20: continue
        sub = c.crop((sl[1].start, sl[0].start, sl[1].stop, sl[0].stop)).copy()
        m = (lab[sl] == i + 1); arr = np.asarray(sub).copy(); arr[~m] = 0
        out.append(((x0 * 16 + sl[1].start, y0 * 16 + sl[0].start), Image.fromarray(arr, 'RGBA')))
    return out
if __name__ == '__main__':
    S = '/tmp/claude-0/-home-claude/1364334e-0733-56dd-a6b0-258df1536bfc/scratchpad/'
    regions = json.loads(sys.argv[1])
    can = Image.new('RGBA', (1800, 1000), (70, 70, 90, 255)); d = ImageDraw.Draw(can); x = y = 0; rh = 0; idx = 0
    for key, (sheet, rect) in regions.items():
        for k, (pos, im) in enumerate(comps(sheet, rect)):
            z = 3; big = im.resize((im.width * z, im.height * z), Image.NEAREST)
            if x + big.width + 10 > 1800: x = 0; y += rh + 14; rh = 0
            can.alpha_composite(big, (x, y + 12)); d.text((x, y), f'{key}{k}', fill=(255, 255, 0)); x += big.width + 12; rh = max(rh, big.height + 12)
    can.crop((0, 0, 1800, y + rh + 14)).save(S + 'na_cat.png')
