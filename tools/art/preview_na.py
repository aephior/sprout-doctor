import json
from PIL import Image, ImageDraw
O = '/home/claude/sprout-doctor/public/art/naw/'
s = open('/home/claude/sprout-doctor/src/world/layout.ts').read(); L = json.loads(s[s.index('{'):s.rindex('}') + 1])
c = Image.open(O + 'ground.png').convert('RGBA')
crops = Image.open('/home/claude/sprout-doctor/public/art/na/crops.png')
items = [(o['depth'], Image.open(O + o['key'] + '.png'), o['x'], o['y']) for o in L['objs'] if not o.get('hidden')]
for col in range(4):
    for row in range(3):
        x = (9 + col * 2 + L['bedOffset'][0]) * 16; y = (9 + row * 2 + L['bedOffset'][1]) * 16
        items.append((y + 16, crops.crop((4 * 16, 0, 5 * 16, 20)), x, y - 4))
aoi = Image.open('/home/claude/sprout-doctor/public/art/na/aoi.png').crop((0, 0, 16, 20))
items.append((L['doorHouse'][1] + 20, aoi, L['doorHouse'][0] - 8, L['doorHouse'][1]))
for d, im, x, y in sorted(items, key=lambda i: i[0]):
    tmp = Image.new('RGBA', c.size); tmp.paste(im, (int(x), int(y))); c = Image.alpha_composite(c, tmp)
dr = ImageDraw.Draw(c)
import sys
if len(sys.argv) > 1:
    for o in L['objs']:
        if o.get('solid'): x, y, w, h = o['solid']; dr.rectangle((x, y, x + w, y + h), outline=(255, 0, 0, 255))
c.resize((c.width * 2, c.height * 2), Image.NEAREST).save('/tmp/claude-0/-home-claude/1364334e-0733-56dd-a6b0-258df1536bfc/scratchpad/na_world.png')
