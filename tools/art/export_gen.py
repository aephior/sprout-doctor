import sys, json; sys.path.insert(0, '/home/claude/assets_src/tools'); import gen_proc as G
from PIL import Image
fs = [l.strip() for l in open('/home/claude/gen_in/list.txt') if l.strip().endswith('.jpg')]
OUT = '/home/claude/sprout-doctor/public/art/gen/'
BG = {0: ('diary_book', None), 6: ('home_bg', 16), 7: ('shop_bg', 16), 22: ('title', 16), 16: ('evening', 'evening')}
SPR = {1: 'mochi_sit', 4: 'mochi_walk', 17: 'mochi_sleep', 3: 'ogawa_happy', 14: 'ogawa_neutral', 23: 'ogawa_talk',
       5: 'fisher', 8: 'aoi_sleep', 9: 'haikabi_rage', 13: 'haikabi_idle', 21: 'haikabi_defeated', 10: 'home_fg',
       11: 'fuku_scan', 15: 'fuku_alert', 18: 'fuku_idle', 20: 'fuku_damaged', 27: 'fuku_happy', 12: 'aphid_dash',
       19: 'aphid_idle', 24: 'aoi_chibi', 25: 'shop_counter', 28: 'haru_photo', 2: 'aoi_sheet', 26: 'aoi_home'}
FACTOR = {'ogawa_happy': 3, 'ogawa_neutral': 3, 'ogawa_talk': 3, 'aoi_sleep': 3, 'home_fg': 3, 'shop_counter': 3, 'haru_photo': 3}
meta = {}
for i, f in enumerate(fs):
    im = Image.open(f).convert('RGB')
    if i in BG:
        name, crop = BG[i]
        if crop == 'evening': im = im.crop((im.width - int(im.height * 16 / 9) - 20, 0, im.width - 20, im.height))
        elif crop: im = im.crop((crop, crop, im.width - crop, im.height - crop))
        else:
            r = 16 / 9; w = im.width; h = int(w / r)
            if h > im.height: h = im.height; w = int(h * r)
            im = im.crop(((im.width - w) // 2, (im.height - h) // 2, (im.width + w) // 2, (im.height + h) // 2))
        out = im.resize((480, 270), Image.BOX)
        out.save(OUT + name + '.png'); meta[name] = out.size; continue
    name = SPR[i]
    k, _ = G.key_bg(im); t = G.trim(k)
    s = G.pixelize(t, FACTOR.get(name, 4))
    s.save(OUT + name + '.png'); meta[name] = s.size
json.dump(meta, open(OUT + 'sizes.json', 'w'), indent=0)
print(meta)
