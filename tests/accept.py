import time, json
from playwright.sync_api import sync_playwright
errs=[]; R={}
D="window.__SD_DEBUG"
def ev(pg,js): return pg.evaluate(js)
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=swiftshader','--enable-webgl'])
    pg=b.new_page(viewport={'width':960,'height':540}); pg.route('https://fonts.googleapis.com/**', lambda r: r.abort())
    pg.on('pageerror', lambda e: errs.append(f'PAGEERROR: {e}'))
    pg.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type=='error' and 'ERR_FAILED' not in m.text else None)
    pg.goto('file:///home/claude/sprout-doctor/release/SproutDoctor.html'); time.sleep(5)
    ev(pg,"()=>localStorage.clear()")
    # 23: меню — Enter под «Как играть» не запускает игру
    ev(pg,f"()=>{D}.app.scene.getScene('Menu').help()"); time.sleep(0.3); pg.keyboard.press('Enter'); time.sleep(1)
    R['23 menu overlay blocks Enter']=ev(pg,f"()=>{D}.app.scene.getScenes(true).map(s=>s.sys.settings.key).join(',')")=='Menu'
    pg.screenshot(path='na/a_help.png')
    pg.keyboard.press('Escape'); time.sleep(0.3); pg.keyboard.press('Enter'); time.sleep(3)
    hud=f"{D}.app.scene.getScene('Hud')"; W=f"{D}.app.scene.getScene('World')"
    # 1: Esc пауза открывается и закрывается
    pg.keyboard.press('Escape'); time.sleep(0.4); a=ev(pg,f"()=>!!{hud}.modal"); pg.screenshot(path='na/a_pause.png')
    pg.keyboard.press('Escape'); time.sleep(0.4); b2=ev(pg,f"()=>!!{hud}.modal")
    R['1 esc pause open/close']=(a, b2)==(True, False)
    # 2: под модалкой не ходит, часы стоят
    pg.keyboard.press('Escape'); time.sleep(0.3)
    x0,m0=ev(pg,f"()=>[{W}.aoi.x,{D}.game.data.minutes]"); pg.keyboard.down('d'); time.sleep(0.8); pg.keyboard.up('d')
    x1,m1=ev(pg,f"()=>[{W}.aoi.x,{D}.game.data.minutes]")
    R['2 frozen under modal']=(x0==x1 and m0==m1); pg.keyboard.press('Escape'); time.sleep(0.4)
    # 3: окно ключа: M и 0/1/O/I
    ev(pg,f"()=>{{const h={hud}; h.keyModal('')}}"); time.sleep(0.3)
    snd0=ev(pg,"()=>window.__SD_DEBUG && true")
    for k in ['m','0','1','o','i','a','b','2']: pg.keyboard.press(k); time.sleep(0.05)
    key=ev(pg,f"()=>{hud}.keyEntry && {hud}.keyEntry.key")
    x0=ev(pg,f"()=>{W}.aoi.x"); pg.keyboard.down('d'); time.sleep(0.5); pg.keyboard.up('d'); x1=ev(pg,f"()=>{W}.aoi.x")
    pg.screenshot(path='na/a_key.png')
    pg.keyboard.press('Escape'); time.sleep(0.4)
    R['3 key filter']=key; R['2b frozen in key modal']=x0==x1
    R['3 key modal Esc returns (modal still open = endScreen)']=ev(pg,f"()=>!!{hud}.modal")
    ev(pg,f"()=>{hud}.closeModal()"); time.sleep(0.3)
    # 4: процедурная до скана
    ev(pg,f"()=>{{const w={W}; w.current={{kind:'bed',bed:{D}.game.data.beds[0]}}; w.interact()}}"); time.sleep(2)
    P=f"{D}.app.scene.getScene('Procedure')"
    for k in ['2','3','4','7','0','Enter']: pg.keyboard.press(k); time.sleep(0.15)
    R['4 no actions before scan']=ev(pg,f"()=>[{P}.seq.length,{P}.treated,{P}.msg.slice(0,40)]")
    pg.keyboard.press('1'); time.sleep(5)
    pg.keyboard.press('7'); time.sleep(0.3)
    R['4b remove blocked in spring']=ev(pg,f"()=>[{P}.seq.length,{P}.msg.slice(0,40)]")
    # 6: фунгицид 0
    ev(pg,f"()=>{{{D}.game.data.fungicide=0; {P}.redraw()}}"); pg.keyboard.press('3'); time.sleep(0.3)
    R['6 spray blocked w/o fungicide']=ev(pg,f"()=>[{P}.seq.length,{P}.treated,{P}.msg.slice(0,40)]")
    ev(pg,f"()=>{{{D}.game.data.fungicide=3; {P}.redraw()}}")
    pg.keyboard.press('2'); time.sleep(1.2); pg.keyboard.press('Enter'); time.sleep(1.5)
    pg.screenshot(path='na/a_proc_done.png')
    charge=ev(pg,f"()=>{D}.game.data.fukuCharge")
    pg.keyboard.press('Escape'); time.sleep(2)
    ev(pg,f"()=>{{const w={W}; w.current={{kind:'bed',bed:{D}.game.data.beds[0]}}; w.interact()}}"); time.sleep(2)
    pg.keyboard.press('1'); time.sleep(1); pg.keyboard.press('4'); time.sleep(0.3); pg.keyboard.press('Enter'); time.sleep(0.5)
    R['5 re-entry: diag shown, no charge, no 2nd treat']=ev(pg,f"()=>[!!{P}.diag, {P}.treated, {D}.game.data.fukuCharge=== {charge}, {P}.msg.slice(0,45)]")
    pg.screenshot(path='na/a_reentry.png')
    # Tab — дневник из процедурной и обратно
    pg.keyboard.press('Tab'); time.sleep(1); t1=ev(pg,f"()=>{D}.app.scene.getScenes(true).map(s=>s.sys.settings.key).join(',')")
    pg.screenshot(path='na/a_diary_proc.png')
    pg.keyboard.press('Escape'); time.sleep(1); t2=ev(pg,f"()=>{D}.app.scene.getScenes(true).map(s=>s.sys.settings.key).join(',')")
    R['15 tab diary in procedure']=(t1,t2)
    pg.keyboard.press('Escape'); time.sleep(2)
    # 9 сезоны: лето без лепестков
    ev(pg,f"()=>{{{D}.game.nextSeason(); {D}.events.emit('season')}}"); time.sleep(0.5)
    R['11 summer petals off']=ev(pg,f"()=>!{W}.life.season")
    ev(pg,f"()=>{{{D}.game.nextSeason(); {D}.events.emit('season')}}"); time.sleep(0.5)
    R['11 autumn leaves']=ev(pg,f"()=>{W}.life.season && {W}.life.season.texture.key")
    R['17 sick after 2 season changes ≤ 6']=ev(pg,f"()=>{D}.game.data.beds.filter(b=>b.crop&&!b.dead&&!{D}.game.cls(b).key.includes('healthy')).length")
    R['17 crops by column']=ev(pg,f"()=>{D}.game.data.beds.map(b=>b.crop&&b.crop[0]).join('')")
    # 12 ночь темнее; дом до 18
    ev(pg,f"()=>{{{D}.game.data.minutes=21*60+30; {W}.life.apply()}}"); time.sleep(1); pg.screenshot(path='na/a_night.png')
    R['20 overlay color 21:30']=hex(ev(pg,f"()=>{W}.life.overlay.fillColor"))
    ev(pg,f"()=>{{{D}.game.data.minutes=10*60; {W}.life.apply(); {W}.aoi.setPosition({W}.aoi.x,{W}.aoi.y)}}")
    ev(pg,f"()=>{D}.events.emit('place','house')"); time.sleep(1.5)
    R['12 house before 18 -> Home (no Evening)']=ev(pg,f"()=>{D}.app.scene.getScenes(true).map(s=>s.sys.settings.key).join(',')")
    pg.screenshot(path='na/a_home_day.png')
    pg.keyboard.press('Escape'); time.sleep(1.5)
    ev(pg,f"()=>{{{D}.game.data.minutes=6*60+30}}"); ev(pg,f"()=>{D}.events.emit('place','shop')"); time.sleep(0.6)
    R['12 shop closed 6:30']=ev(pg,f"()=>{D}.app.scene.getScenes(true).map(s=>s.sys.settings.key).join(',')")
    ev(pg,f"()=>{{{D}.game.data.minutes=10*60}}"); ev(pg,f"()=>{D}.events.emit('place','shop')"); time.sleep(1.5)
    pg.screenshot(path='na/a_shop_day.png')
    for k in ['ArrowDown','ArrowDown']: pg.keyboard.press(k); time.sleep(0.1)
    pg.keyboard.press('Escape'); time.sleep(2)
    print(json.dumps(R, ensure_ascii=False, indent=1))
    b.close()
print('\n'.join(errs[:20]) or 'no errors')
