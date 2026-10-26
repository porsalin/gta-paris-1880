# Zoning screenshots: overview M map, key zones and every named district. Usage: PORT=8190 python3 tools/zshots.py
import asyncio,os,re,unicodedata
from playwright.async_api import async_playwright
SH='/workspace/gta-paris-1880/shots/zoning/'; os.makedirs(SH,exist_ok=True)
slug=lambda s: re.sub(r'[^a-z0-9]+','_',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().lower()).strip('_')
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist'])
    pg=await b.new_page(viewport={'width':1280,'height':800}); errs=[]; pg.on('pageerror',lambda e: errs.append(str(e)))
    E0=E=pg.evaluate
    await pg.goto('http://localhost:'+os.environ.get('PORT','8188')+'/'); await pg.wait_for_function('window.__ZR&&window.GAME',timeout=240000); await E0("document.getElementById('bPlay').click()"); await pg.wait_for_timeout(3000)

    ONLY=os.environ.get('ONLY')
    async def shot(name,x,z,zoom=0,t=12):
      if ONLY and not re.search(ONLY,name): return
      await E(f'(()=>{{GAME.pause(true);if(GAME.M)GAME.fail("x");GAME.setRain(0);GAME.setTime({t});GAME.zoom({zoom});GAME.tp({x},{z});GAME.step(4);GAME.flush();GAME.step(30);GAME.flush();window.__ZR&&window.__ZR.near();GAME.quiet&&GAME.quiet();GAME.render();}})()'); await pg.wait_for_timeout(900)
      await E('GAME.render()'); await pg.screenshot(path=SH+name+'.png'); print('shot',name,flush=True)
    ZD=await E('window.__ZN.ZD')
    find=lambda L,s: next(c for c in L if s in c[0])
    LMM=await E("Promise.all([import('./gfx.js'),import('./landmarks.js')]).then(([G,L])=>Object.assign(Object.fromEntries(G.LMODELS.map(m=>[m.key,[m.x,m.z]])),Object.fromEntries(L.FOOTPRINTS.map(f=>[f.key,f.c]))))")
    # Les Halles: frame Baltard's pavilions (landmark model) together with the carreau stalls west of them, from higher up
    h=ZD['markets'][0]; hl=LMM['halles']; await shot('01_les_halles',(hl[0]+h[1])/2,(hl[1]+h[2])/2,90)
    # Gare du Nord: the terminus building and its fan of tracks running north-east
    g=LMM['garenord']; await shot('02_terminus_gare_du_nord',g[0],g[1]-40,170)
    await shot('02b_gare_du_nord_tracks',g[0],g[1]-120,60)
    g=ZD['gaso'][0]; await shot('03_la_villette_gasworks',g[1]+10,g[2]+30)
    w=find(ZD['ware'],'Villette') if any('Villette' in c[0] for c in ZD['ware']) else ZD['ware'][0]; await shot('03b_villette_canal_warehouses',w[1],w[2])
    f=next((c for c in ZD['fountains'] if 'Luxembourg' in c[0] or 'Médicis' in c[0]),None) or next(c for c in ZD['fountains'] if not c[4]); await shot('04_park_'+slug(f[0]),f[1],f[2]+6)
    for nm in ['Saint-Germain-l','Saint-Sulpice','Saint-Étienne-du-Mont','Saint-Julien']:
      c=next((c for c in ZD['churches'] if nm in c[0]),None)
      if c: await shot('05_church_'+slug(c[0]),c[1],c[2]+8)
    gc=next((c for c in ZD['churches'] if not c[7]),None)
    if gc: await shot('05_parish_church_'+slug(gc[0]),gc[1],gc[2]+8)
    q=find(ZD['quarters'],'MONCEAU'); await shot('06_residential_plaine_monceau',q[1],q[2])
    v=ZD['vines'][0]; await shot('07_montmartre_vines_quarries',v[0],v[1])
    bq=ZD['bouq'][len(ZD['bouq'])//3]; await shot('08_bouquinistes_quays',bq[0],bq[1])
    bo=next(c for c in ZD['boats'] if c[0]=='lavoir'); await shot('09_seine_boats_lavoir',bo[1],bo[2])
    cm=next(c for c in ZD['churches'] if c[6]=='orthodox'); await shot('10_alexandre_nevsky',cm[1],cm[2]+6)
    ws=ZD['ware'][0]; await shot('11_bercy_wine_halls',ws[1],ws[2])
    for k,q in enumerate(ZD['quarters']):
      if 'BOIS' in q[0]: continue
      await shot(f'd{k:02d}_'+slug(q[4]),q[1],q[2])
    await E("GAME.pause(false);GAME.setTime(12);GAME.setMap(true)"); await pg.wait_for_timeout(800); await pg.screenshot(path=SH+'00_M_map_districts.png'); print('map')
    print('errs',errs[:5]); await b.close()
asyncio.run(main())
