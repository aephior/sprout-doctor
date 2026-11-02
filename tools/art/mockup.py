from PIL import Image, ImageEnhance
import random
S='/tmp/claude-0/-home-claude/1364334e-0733-56dd-a6b0-258df1536bfc/scratchpad/'
T=Image.open('frpg/src/assets/spritesheets/tiled/terrain.png').convert('RGBA')
CR=Image.open('frpg/src/assets/spritesheets/crops/crops.png').convert('RGBA')
farm=Image.open(S+'farm1x.png').convert('RGBA')
def tile(x,y,w=1,h=1): return T.crop((x*32,y*32,(x+w)*32,(y+h)*32))
W,H=480,270
c=Image.new('RGBA',(W,H))
grass=farm.crop((32,32*6,32*3,32*8))       # чистая трава с карты
for y in range(0,H,64):
  for x in range(0,W,64): c.alpha_composite(grass,(x,y))
random.seed(3)
# дом (обрезан краем кадра)
house=farm.crop((395,25,755,295)); c.alpha_composite(house,(-150,-120))
# тропа
for x in range(0,W,32): c.alpha_composite(tile(9,21),(x,150))
# пруд справа
for y in range(3):
  for x in range(4): c.alpha_composite(tile(22,14),(380+x*32,190+y*32))
for x in range(4): c.alpha_composite(tile(22,12),(380+x*32,190-0))
# грядка 9-slice 6x2
gx,gy,gw,gh=160,182,6,2
for j in range(gh+2):
  for i in range(gw+2):
    sx=5 if i==0 else (7 if i==gw+1 else 6); sy=17 if j==0 else (19 if j==gh+1 else 18)
    c.alpha_composite(tile(sx,sy),(gx-32+i*32,gy-32+j*32))
# растения: томаты/картофель/перец, одна больная
def crop(row,stage): return CR.crop((stage*32,row*64,stage*32+32,row*64+64))
def sick(im):
  im=im.copy(); px=im.load()
  for y in range(im.height):
    for x in range(im.width):
      r,g,b,a=px[x,y]
      if a and g>r and g>b: px[x,y]=(int(g*0.75)+40,int(g*0.6),int(b*0.6)+50,a) if (x+y)%3 else (110,78,140,a)
  return im
plants=[(0,4),(0,4),(0,3),(3,4),(3,4),(4,4)]
for i,(r,s) in enumerate(plants):
  im=crop(r,s); im=sick(im) if i==2 else im
  c.alpha_composite(im,(gx+i*32,gy-24))
  im=crop([0,3,4][i%3],[4,3,4][i%3]); c.alpha_composite(sick(im) if i==4 else im,(gx+i*32,gy+8))
# дерево и пугало
c.alpha_composite(T.crop((24*32,15*32,27*32,18*32)),(10,170))
c.alpha_composite(tile(10,25,1,2),(380,96))
c.alpha_composite(tile(13,26,2,2),(330,120))
def spr(name,anim,row,col,x,y):
  im=Image.open(f'chars/out/{name}/{anim}.png').crop((col*64,row*64,col*64+64,row*64+64)); c.alpha_composite(im,(x,y))
spr('aoi_water','thrust',3,5,232,170)   # поливает
spr('ogawa','walk',2,0,300,96)
spr('fisher','walk',1,0,350,160)
c.save(S+'mock_world_1x.png')
c.resize((W*2,H*2),Image.NEAREST).save(S+'mock_world.png')
