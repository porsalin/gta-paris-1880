# world-start harness: every mission is begun by walking up to its giver in the world and interacting (GAME.interact),
# then solved with GAME.solveStep. Also samples NPC conversations and runs the activity self-test.
import asyncio,json,sys
from playwright.async_api import async_playwright
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(viewport={'width':1280,'height':800})
    errs=[];pg.on('console',lambda m: errs.append(m.text) if m.type=='error' else None);pg.on('pageerror',lambda e: errs.append('PAGEERR '+str(e)))
    await pg.goto(sys.argv[1] if len(sys.argv)>1 else 'http://localhost:8197/');await pg.wait_for_function("window.GAME&&GAME.life",timeout=120000);await pg.wait_for_timeout(1500)
    await pg.evaluate("localStorage.clear()")
    await pg.evaluate("GAME.start(false)");await pg.wait_for_timeout(1500)
    E=pg.evaluate
    await E("GAME.pause(true); GAME.DEBUG_FAST=true; window.ONLY="+(sys.argv[2] if len(sys.argv)>2 else "null"))
    run='''((ids,ch,force)=>{const out={};const L=GAME.life;GAME.player.god=true;for(const m of GAME.MISSIONS){if(ids&&!ids.includes(m.id))continue;if(window.ONLY&&!ONLY.includes(m.id)){GAME.done[m.id]=true;continue;}for(const k in ch)GAME.setChoice(k,ch[k]);GAME.heat=0;GAME.wanted=0;const unveh=()=>{if(GAME.player.veh){GAME.enter();if(GAME.player.veh){GAME.player.veh.driver=null;GAME.player.veh=null;GAME.player.mesh.visible=true;}}};unveh();
      const natural=!force&&(m.fac==='side'||GAME.nextStory()===m);if(!natural){delete GAME.done[m.id];L.forceOffer(m.id);}
      const g=L.giverSpec(m);GAME.tp(g.x+30,g.z);GAME.step(2);GAME.tp(g.x,g.z);L.refresh();GAME.step(2);let gp=[...L.givers.entries()].find(([k])=>k===m.id);gp=gp&&gp[1];
      if(gp){unveh();GAME.tp(gp.x+1.1,gp.z);}const said=GAME.interact();const started=!!(GAME.M&&GAME.M.def.id===m.id);let n=0,types=[];
      try{while(started&&GAME.M&&n<30){types.push(GAME.solveStep());n++;}}catch(e){types.push('ERR '+e.stack.slice(0,300))}
      out[m.id]={ok:started&&!!GAME.done[m.id],natural,giver:!!gp,who:g.who,where:g.poi,said:typeof said==='string'?said.slice(0,60):said,dbg:started?0:{ui:L.UI.open,st:GAME.state,p:(q=>q&&{n:q.persona&&q.persona.name,g:q.giver,h:q.hostile,ty:q.type})(L.pedNear()),M:GAME.M&&GAME.M.def.id,gp:gp&&[gp.x,gp.z,gp.alive,gp.inVeh,GAME.peds.includes(gp)],pl:[GAME.player.x,GAME.player.z,!!GAME.player.veh],alive:GAME.player.alive},types,stuck:GAME.M?GAME.M.s&&GAME.M.s.t:GAME.lastFail};if(GAME.M)GAME.fail('test');GAME.step(3)}return out})'''
    res=await E(run+'(null,{},false)')
    ok=sum(1 for v in res.values() if v['ok']);nat=sum(1 for v in res.values() if v['natural']);print('world-start pass A',ok,'/',len(res),'natural',nat)
    for k,v in res.items():
      if not v['ok']: print('FAIL',k,v)
    bids=await E("GAME.MISSIONS.filter(m=>m.steps.some(s=>s.only&&s.only.endsWith('=b'))).map(m=>m.id)")
    rb=await E(run+'(%s,{moineau:"b",odile:"b",ledger:"b",mourier:"b"},true)'%json.dumps(bids))
    print('pass B',sum(1 for v in rb.values() if v['ok']),'/',len(rb),bids)
    for k,v in rb.items():
      if not v['ok']: print('FAILB',k,v)
    json.dump(res,open('/tmp/s/worldrun.json','w'),indent=0,ensure_ascii=False)
    conv=await E('''(()=>{const out=[];const L=GAME.life;const spots=[['tertre',22,0],['halles',7,1],['boulevard',13,0],['sorbonne',1,1],['gare',10,0]];for(const [k,h,r] of spots){GAME.setTime(h);GAME.setRain(r);const q=GAME.POI[k];GAME.tp(q[0],q[1]);for(let i=0;i<30;i++)GAME.step(2);
      const ps=GAME.peds.filter(p=>p.alive&&p.type==='civ'&&!p.onTalk&&!p.giver).sort((a,b)=>((a.x-q[0])**2+(a.z-q[1])**2)-((b.x-q[0])**2+(b.z-q[1])**2)).slice(0,2);
      for(const p of ps){const P=L.persona(p);out.push({at:k,hour:h,rain:r,name:P.name,trade:P.trade,temp:P.temp,lines:[L.compose(p),L.compose(p)]});}}return out})()''')
    json.dump(conv,open('/tmp/s/conv.json','w'),indent=1,ensure_ascii=False)
    for c in conv[:10]: print('CONV',json.dumps(c,ensure_ascii=False))
    st=await E('GAME.life.ACT.selftest()'); print('ACTS',st)
    print('errs',errs[:8],len(errs))
    await b.close()
asyncio.run(main())
