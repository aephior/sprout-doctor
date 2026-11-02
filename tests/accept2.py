import time, json
from playwright.sync_api import sync_playwright
errs=[]; R={}
D="window.__SD_DEBUG"
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/opt/pw-browsers/chromium-1243/chrome-linux64/chrome',args=['--use-gl=swiftshader','--enable-webgl'])
    pg=b.new_page(viewport={'width':960,'height':540}); pg.route('https://fonts.googleapis.com/**', lambda r: r.abort())
    pg.on('pageerror', lambda e: errs.append(f'PAGEERROR: {e}'))
    pg.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type=='error' and 'ERR_FAILED' not in m.text else None)
    ev=lambda js: pg.evaluate(js)
    scenes=lambda: ev(f"()=>{D}.app.scene.getScenes(true).map(s=>s.sys.settings.key).join(',')")
    pg.goto('file:///home/claude/sprout-doctor/release/SproutDoctor.html'); time.sleep(5)
    ev("()=>localStorage.clear()"); pg.keyboard.press('Enter'); time.sleep(3)
    # 13: полночь — Esc в доме не выкидывает
    ev(f"()=>{{{D}.game.data.minutes=24*60-1}}"); time.sleep(4.5)
    pg.keyboard.press('Escape'); time.sleep(0.3); pg.keyboard.press('Escape'); time.sleep(1)
    R['13 midnight esc ignored']=scenes()
    time.sleep(7); pg.keyboard.press('Enter'); time.sleep(2.5)
    R['13 after midnight sleep']=[scenes(), ev(f"()=>[{D}.game.data.day,{D}.game.data.minutes]")]
    # 10: демо
    ev(f"()=>{{const d={D}.game.data; d.day=5; d.minutes=23*60+59;}}"); time.sleep(4)
    time.sleep(7); pg.keyboard.press('Enter'); time.sleep(2.5)
    R['10 demo modal']=ev(f"()=>{{const h={D}.app.scene.getScene('Hud'); return !!h.modal && {D}.game.data.demoEnded}}")
    pg.keyboard.press('3'); time.sleep(2)
    R['10 menu items']=ev(f"()=>{D}.app.scene.getScene('Menu').children.list.filter(o=>o.type==='Text').map(o=>o.text).filter(t=>/Продолжить|Новая/.test(t)).join('|')")
    pg.keyboard.press('Enter'); time.sleep(3)   # «Продолжить»
    R['10 continue -> demo screen again']=ev(f"()=>{{const h={D}.app.scene.getScene('Hud'); return [!!h.modal, {D}.game.data.day]}}")
    pg.screenshot(path='na/b_demo.png')
    # босс
    ev(f"()=>{{const h={D}.app.scene.getScene('Hud'); h.closeModal(); const d={D}.game.data; d.licensed=true; d.season=3; d.demoEnded=false; {D}.events.emit('boss')}}"); time.sleep(5)
    B=f"{D}.app.scene.getScene('Boss')"
    ev(f"()=>{{const s={B}; s.time.removeAllEvents(); s.startPhase(2)}}"); time.sleep(13)
    R['7 phase2 idle: step stays 0']=ev(f"()=>[{B}.step,{B}.hp,{B}.phase]")
    # победа: прогоняем все фазы корректными действиями
    ev(f"()=>{{const s={B}; s.startPhase(1)}}"); time.sleep(0.3)
    for k in ['4','3']: pg.keyboard.press(k); time.sleep(0.3)
    time.sleep(1.5)
    for i in range(3):
        time.sleep(0.9); pg.keyboard.press('6')
    time.sleep(0.5); pg.keyboard.press('3'); time.sleep(1.5)
    need=ev(f"()=>{B}.need"); time.sleep(3.3)
    km={'water':'2','spray':'3','prune':'4'}
    for a in need: pg.keyboard.press(km[a]); time.sleep(0.3)
    R['8 boss hp at victory']=ev(f"()=>[{B}.bossHp,{B}.done]")
    time.sleep(3); pg.screenshot(path='na/b_fest.png')
    pg.keyboard.press('Enter'); time.sleep(2)
    R['9 completed save; menu']=[ev(f"()=>{D}.game.saveCompleted()"), ev(f"()=>{D}.app.scene.getScene('Menu').children.list.filter(o=>o.type==='Text').map(o=>o.text).filter(t=>/Продолжить|Новая/.test(t)).join('|')")]
    print(json.dumps(R, ensure_ascii=False, indent=1))
    b.close()
print('\n'.join(errs[:20]) or 'no errors')
