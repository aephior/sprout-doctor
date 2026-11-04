"""Моти на ферме: калико-котёнок 16×14 (большая голова, глаза-точки, румянец), как Моти в лавке. Лист: 4 направления × 2 кадра шага + сидит + спит."""
from PIL import Image
C = {'o': (40, 26, 30), 'w': (252, 248, 240), 's': (222, 212, 204), 'F': (240, 150, 66), 'B': (70, 52, 50), 'p': (246, 150, 164),
     'e': (30, 20, 26), 'h': (255, 255, 255), 'n': (232, 110, 130)}
D_TOP = [
"................",
".oo........oo...",
".oFo......oBo...",
".oFFoooooooBBo..",
".oFwwwwwwwwwBo..",
"owwwwwwwwwwwwwo.",
"owweewwwwweewwo.",
"owweewwwwweewwo.",
"opwwwwwnwwwwwpo.",
".owwwwwwwwwwwo..",
"..oowwFFwwwoo...",
"...owwFFwwwo....",
]
D_A = D_TOP + ["...osww.wwso....", "...oo.o.o.oo...."]
D_B = D_TOP + ["...oswwww.so....", "....oo.o.oo....."]
D_SIT = D_TOP[:10] + ["..oowwFFwwwoo.o.", "...owwFFwwwooFo.", "..oswwwwwwwsFo..", "..ooooooooooo..."]
U_TOP = [
"................",
".oo........oo...",
".oFo......oBo...",
".oFFoooooooBBo..",
".oFwwwwwwwwwBo..",
"owwwwwwwBBwwwwo.",
"owwwwwwBBBwwwwo.",
"owwwwwwwwwwwwwo.",
"oswwwwwwwwwwwso.",
".owwwwwwwwwwwo..",
"..oowwwwFFwoo.o.",
"...owwwFFFwooFo.",
]
U_A = U_TOP + ["...osww.wwso.o..", "...oo.o.o.oo...."]
U_B = U_TOP + ["...oswwww.so.o..", "....oo.o.oo....."]
L_TOP = [
"................",
".o...o..........",
".oFooBo.........",
"oFFwwBBo......o.",
"owwwwwwwo....oFo",
"owweewwwo....oFo",
"owweewwwoooooFo.",
"opwwnwwwwwwBBwo.",
".owwwwwwwwwBBwo.",
"..oowwwwFFwwwwo.",
"...owwwwFFwwwo..",
"...oswwwwwwwso..",
]
L_A = L_TOP + ["...ow.ow..ow.o..", "...oo.oo..oo.o.."]
L_B = L_TOP + ["....owo...owo...", "....oo.....oo..."]
SLEEP = [
"................",
"................",
"................",
"................",
"......oooooo....",
"....oowwwwBBoo..",
"...owwwFFwwBBwo.",
"..oFwwFFFwwwwwwo",
".oFFwwwwwwwwwFFo",
".owwoeeowwwwwFo.",
".opwwwwwwwwwwwo.",
"..owwnwwwwwwwo..",
"...ooooooooooo..",
"................",
]
def img(rows):
    im = Image.new('RGBA', (16, 14))
    for y, r in enumerate(rows[:14]):
        assert len(r) == 16, (r, len(r))
        for x, c in enumerate(r):
            if c in C: im.putpixel((x, y), C[c] + (255,))
    return im
def build(out):
    cs = {'down': [img(D_A), img(D_B)], 'up': [img(U_A), img(U_B)], 'left': [img(L_A), img(L_B)]}
    cs['right'] = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in cs['left']]
    cat = Image.new('RGBA', (16 * 4, 14 * 3))
    for i, d in enumerate(['down', 'up', 'left', 'right']):
        for j, f in enumerate(cs[d]): cat.alpha_composite(f, (i * 16, j * 14))
    cat.alpha_composite(img(D_SIT), (0, 28)); cat.alpha_composite(img(SLEEP), (16, 28))
    cat.save(out); return cat
if __name__ == '__main__':
    c = build('/home/claude/sprout-doctor/public/art/na/mochi.png')
    o = Image.new('RGBA', c.size, (90, 160, 60, 255)); o.alpha_composite(c); o.resize((c.width * 8, c.height * 8), Image.NEAREST)
