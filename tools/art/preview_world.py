import json, re
from PIL import Image
O = '/home/claude/sprout-doctor/public/art/world/'
s = open('/home/claude/sprout-doctor/src/world/layout.ts').read()
L = json.loads(s[s.index('{'):s.rindex('}') + 1])
c = Image.open(O + 'ground.png').convert('RGBA')
for o in sorted(L['objs'], key=lambda o: o['depth']):
    c.alpha_composite(Image.open(O + o['key'] + '.png'), (int(o['x'] * 2), int(o['y'] * 2))) if o['x'] >= 0 and o['y'] >= 0 else c.paste(Image.alpha_composite(c.crop((int(o['x']*2), int(o['y']*2), int(o['x']*2)+Image.open(O + o['key'] + '.png').width, int(o['y']*2)+Image.open(O + o['key'] + '.png').height)), Image.open(O + o['key'] + '.png')), (int(o['x']*2), int(o['y']*2)))
c.resize((c.width // 2 * 1, c.height // 2 * 1), Image.BOX).save('/tmp/claude-0/-home-claude/1364334e-0733-56dd-a6b0-258df1536bfc/scratchpad/world_prev.png')
c.save('/tmp/claude-0/-home-claude/1364334e-0733-56dd-a6b0-258df1536bfc/scratchpad/world_full.png')
