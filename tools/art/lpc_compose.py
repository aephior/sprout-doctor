"""Сборка LPC-персонажа из слоёв Universal LPC Spritesheet Generator.
usage: lpc_compose.py spec.json out_dir [--fetch]"""
import json, os, sys, glob, subprocess
from PIL import Image
R = '/home/claude/assets_src/lpcgen'
DEF = {os.path.basename(p)[:-5]: p for p in glob.glob(R + '/sheet_definitions/**/*.json', recursive=True)}
BASE = {'hair': 'orange', 'body': 'light', 'cloth': 'white', 'eye': 'blue', 'metal': None, 'wood': None}
def pal(material):
    f = f'{R}/palette_definitions/{material}/{material}_ulpc.json'
    return json.load(open(f)) if os.path.exists(f) else {}
def hexrgb(h): h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))
def layers(spec, anim):
    out = []
    bt = spec['body']
    for it in spec['items']:
        d = json.load(open(DEF[it['def']]))
        for k, L in d.items():
            if not k.startswith('layer_') or bt not in L: continue
            var, rc = it.get('variant'), it.get('recolor')
            if not var and rc and 'cloth' in rc and d.get('variants') and rc['cloth'] in d['variants']:
                var, rc = rc['cloth'], None   # у слоя готовые цветные варианты вместо перекраски
            p = L[bt] + (f"{anim}/{var}.png" if var else f'{anim}.png')
            out.append((L['zPos'], p, rc, d.get('recolors')))
    return sorted(out, key=lambda x: x[0])
def recolor(img, recolor, recolors):
    if not recolor: return img
    px = img.load()
    m = {}
    for material, target in recolor.items():
        P = pal(material); src = P[BASE[material]]; dst = P[target]
        for a, b in zip(src, dst): m[hexrgb(a)] = hexrgb(b)
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            if a and (r, g, b) in m: px[x, y] = m[(r, g, b)] + (a,)
    return img
def build(spec, out_dir, anims, fetch=False):
    paths = sorted({p for a in anims for _, p, _, _ in layers(spec, a)})
    if fetch:
        subprocess.run(['git', '-C', R, 'sparse-checkout', 'add'] + ['/spritesheets/' + p for p in paths], check=True)
    os.makedirs(out_dir, exist_ok=True)
    for a in anims:
        can = None
        for z, p, rc, rcs in layers(spec, a):
            f = f'{R}/spritesheets/{p}'
            if not os.path.exists(f): print('  нет', p); continue
            im = recolor(Image.open(f).convert('RGBA'), rc, rcs)
            if can is None: can = Image.new('RGBA', im.size)
            if im.size != can.size:
                tmp = Image.new('RGBA', can.size); tmp.paste(im.crop((0, 0) + can.size)); im = tmp
            can.alpha_composite(im)
        if can: can.save(f'{out_dir}/{a}.png'); print(a, can.size)
if __name__ == '__main__':
    spec = json.load(open(sys.argv[1]))
    build(spec, sys.argv[2], spec.get('anims', ['walk', 'idle']), '--fetch' in sys.argv)
