"""Аой и Моти, нарисованные попиксельно в стиле Ninja Adventure (контур #020202, простые тени)."""
from PIL import Image
OUT = '/home/claude/sprout-doctor/public/art/na/'
P = {'o': (2, 2, 2), 'L': (247, 214, 128), 'M': (214, 166, 74), 'D': (150, 104, 48), 'B': (52, 64, 120), 'T': (63, 208, 201),
     'R': (214, 52, 62), 'G': (96, 178, 72), 'h': (156, 94, 52), 'H': (104, 58, 34), 's': (252, 196, 150), 'S': (220, 142, 104),
     'e': (2, 2, 2), 'g': (128, 82, 40), 'p': (244, 134, 130), 'y': (244, 192, 64), 'Y': (196, 136, 40), 'w': (246, 240, 226),
     'v': (104, 166, 84), 'V': (62, 112, 58), 'r': (214, 72, 60), 'q': (150, 40, 40), 'W': (255, 255, 255), 'F': (232, 140, 60), 'k': (200, 190, 180)}
HAT_F = ['.....oooooo.....', '....oLLLLLMo..G.', '...oLLLLLLLMoGo.', '...oBTTBBTTBRo..', '.ooLLLLLLLLLLMoo', 'oMMMMMMMMMMMMMMo', '.ooDDDDDDDDDDoo.']
HAT_B = ['.....oooooo.....', '.G..oLLLLLMo....', '.oGoLLLLLLLMo...', '..oRBBBBBBBBBo..', '.ooLLLLLLLLLLMoo', 'oMMMMMMMMMMMMMMo', '.ooDDDDDDDDDDoo.']
HAT_L = ['....oooooo......', '...oLLLLLMo..G..', '..oLLLLLLLMoGo..', '..oTTBBBBBBRo...', 'ooLLLLLLLLLLMoo.', 'oMMMMMMMMMMMMMo.', '.ooDDDDDDDDDoo..']
DOWN = HAT_F + ['..ohHhhhhhhHho..', '..ohsssssssssho.', '.ohsgegssgegsho.', '.ohspssssssspho.', '.oHhssssSssshHo.', '..ooSssssssSoHo.',
                '.oyyyvwwwwvyyyHo', '.oyYvvvvvvvvYyRo', '.oyYvvvvvvvvYyo.', '..osvvvvvvvvso..', '...oVVVVVVVVo...']
UP = HAT_B + ['..ohhhhhhhhhhho.', '..ohhhhhhhhhhho.', '.ohhhhhhhhhhhho.', '.ohhhHhhhhHhhho.', '.oHhhhhHHhhhhHo.', '..oHHhhHHhhHHo..',
              '.oyyyyyHHyyyyyo.', '.oyYyvyHHyvyYyo.', '.oyYvvvRRvvvYyo.', '..osvvvvvvvvso..', '...oVVVVVVVVo...']
LEFT = HAT_L + ['..ohhhhhhhhho...', '.ohhhhhhhhhhho..', '.oshhhhhhhhhHo..', '.osgegshhhhHHo..', '.ospsssShhhHHo..', '..oosssshhHHo...',
                '...oyyyyyyHHo...', '...osyyvyyHRo...', '...oyvvvvyyo....', '....ovvvvvo.....', '....oVVVVVo.....']
FEET = {'f_stand': ['...orro..orro...', '...oooo..oooo...'], 'f_a': ['...orro..oooo...', '...oooo.........'], 'f_b': ['...oooo..orro...', '.........oooo...']}
SIDEFEET = {'f_stand': ['....orrrro......', '....oooooo......'], 'f_a': ['...orro.orro....', '...oooo.oooo....'], 'f_b': ['....orrrro......', '....oooooo......']}
def img(rows):
    im = Image.new('RGBA', (16, 20))
    for y, r in enumerate(rows):
        for x, c in enumerate(r[:16]):
            if c in P: im.putpixel((x, y), P[c] + (255,))
    return im
def legsA(body):     # шаг: правая нога приподнята
    b = body[:]; b[-1] = '...oVVVVVorro...'; return b
def legsB(body):
    b = body[:]; b[-1] = '...orroVVVVVo...'; return b
def bob(im, dy):
    c = Image.new('RGBA', im.size); c.alpha_composite(im, (0, dy)); return c
frames = {}
for name, body in (('down', DOWN), ('up', UP)):
    frames[name] = [img(body + FEET['f_stand']), bob(img(legsA(body) + FEET['f_a']), 0), img(body + FEET['f_stand']), img(legsB(body) + FEET['f_b'])]
left = [img(LEFT + SIDEFEET['f_stand']), bob(img(LEFT + SIDEFEET['f_a']), 0), img(LEFT + SIDEFEET['f_stand']), bob(img(LEFT + SIDEFEET['f_a']), 0)]
frames['left'] = left
frames['right'] = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in left]
# лёгкое «подпрыгивание» на шаге
for d in frames: frames[d][1] = bob(frames[d][1], -1); frames[d][3] = bob(frames[d][3], -1)
sheet = Image.new('RGBA', (64, 80))
for i, d in enumerate(['down', 'up', 'left', 'right']):
    for j, f in enumerate(frames[d]): sheet.alpha_composite(f, (i * 16, j * 20))
sheet.save(OUT + 'aoi.png')
# ---- Моти: 16×14, 4 направления × 2 кадра ----
C = {'o': (2, 2, 2), 'w': (250, 246, 238), 'k': (214, 206, 196), 'F': (236, 146, 62), 'f': (196, 108, 40), 'p': (244, 140, 150), 'e': (2, 2, 2)}
CAT_L = ['................', '.o..o...........', 'oFooFo..........', 'oFwwFo........o.', 'owewwo.......oFo', 'owwpwooooooo.oFo',
         '.owwwwwwwFFwwFo.', '..owwwwwwFFwwo..', '..okwwwwwwwwko..', '..owwowwwowwwo..']
CAT_L_A = CAT_L + ['..ow.o..ow.o....', '..oo....oo......']
CAT_L_B = CAT_L + ['...owo....owo...', '...oo.....oo....']
CAT_D = ['................', '...o......o.....', '..oFo....oFo....', '..oFwoooowFo....', '..owwwFFwwwo....', '.owewwFFwwewo...',
         '.owwwwppwwwwo...', '..oowwwwwwoo....', '..owwFFwwwwo....', '..okwFFwwwko....', '..owwwwwwwwo....']
CAT_D_A = CAT_D + ['..owo.oowo.o....', '..oo...oo.......']
CAT_D_B = CAT_D + ['..ow.oo.owo.....', '...o....oo......']
CAT_U = ['................', '...o......o.....', '..oFo....oFo....', '..oFwoooowFo....', '..owwwFFwwwo....', '..owwwFFwwwo....',
         '..owwwwwwwwo....', '..oowwwwwwoo....', '..owwFFwwwwo..o.', '..okwFFwwwkoooFo', '..owwwwwwwwwFFo.']
CAT_U_A = CAT_U + ['..owo.oowo.o....', '..oo...oo.......']
CAT_U_B = CAT_U + ['..ow.oo.owo.....', '...o....oo......']
def cimg(rows):
    im = Image.new('RGBA', (16, 14))
    for y, r in enumerate(rows[:14]):
        for x, c in enumerate(r[:16]):
            if c in C: im.putpixel((x, y), C[c] + (255,))
    return im
cs = {'down': [cimg(CAT_D_A), cimg(CAT_D_B)], 'up': [cimg(CAT_U_A), cimg(CAT_U_B)], 'left': [cimg(CAT_L_A), cimg(CAT_L_B)]}
cs['right'] = [f.transpose(Image.FLIP_LEFT_RIGHT) for f in cs['left']]
CAT_SLEEP = ['................', '................', '................', '................', '................', '......oooooo....',
             '....oowwwwwwoo..', '...owwwFFwwwwwo.', '..owwwFFFwwwwwwo', '..oFwwwwwwwwwFFo', '..oFoeowwwwwwFo.', '...owwpwwwwwwo..', '....oooooooooo..']
cat = Image.new('RGBA', (16 * 4, 14 * 3))
for i, d in enumerate(['down', 'up', 'left', 'right']):
    for j, f in enumerate(cs[d]): cat.alpha_composite(f, (i * 16, j * 14))
cat.alpha_composite(cimg(CAT_D + ['..owo...owo.....', '..oo....oo......']), (0, 28))   # сидит
cat.alpha_composite(cimg(CAT_SLEEP), (16, 28))                                          # спит
# mochi.png теперь рисует tools/art/na_mochi.py
print('ok')
# ---- Фуку 12×14: бумажный фонарик-дрон, 2 кадра (пропеллер), + кадр «скан» ----
FP = {'o': (2, 2, 2), 'p': (246, 226, 180), 'P': (214, 182, 128), 'r': (150, 104, 60), 'T': (63, 208, 201), 't': (30, 140, 150),
      'L': (40, 50, 90), 'l': (120, 150, 210), 'W': (255, 255, 255), 'R': (230, 60, 60)}
FUKU = ['............', '..TTTo.oTTT.', '.....oo.....', '...oooooo...', '..oppppppo..', '.opPrpprPpo.',
        '.opoLLLLopo.', '.oprLlWLrpo.', '.opoLLLLopo.', '.opPrpprPpo.', '..oppppppo..', '...oooooo...', '....oRRo....', '.....oo.....']
FUKU2 = ['............', '...TTotTT...'] + FUKU[2:]
FUKUS = [r.replace('L', 'T').replace('l', 'W') for r in FUKU]
def fimg(rows):
    im = Image.new('RGBA', (12, 14))
    for y, r in enumerate(rows):
        for x, c in enumerate(r[:12]):
            if c in FP: im.putpixel((x, y), FP[c] + (255,))
    return im
fs = Image.new('RGBA', (36, 14))
for i, f in enumerate([FUKU, FUKU2, FUKUS]): fs.alpha_composite(fimg(f), (i * 12, 0))
fs.save(OUT + 'fuku.png')
