# Automated clearance check for prop placement: props on building/water tiles, props in road lanes, overlapping props.
import asyncio,json,sys,os
from playwright.async_api import async_playwright
JS='''async()=>{const w=await import('./world.js');const {K,kij,T,NCX,NCZ,ensureChunk}=w;const R={n:0,bld:[],water:[],road:[],overlap:[],types:{}};const all=[];
const Zm=await import('./zoning.js');const {ZD,Z,zoneTile,isFountainSite}=Zm;
const RAD={tree:.45,kiosk:1,morris:.7,pissoir:.9,wallace:.5,trough:.8,bench:.6,lamp:.25,fountain:2.4,stall:1.1,bouq:.7,band:3.2};
for(let cx=0;cx<NCX;cx++)for(let cz=0;cz<NCZ;cz++)for(const p of ensureChunk(cx,cz)){R.n++;R.types[p.type]=(R.types[p.type]||0)+1;const k=kij(Math.floor(p.x/T),Math.floor(p.z/T));
 if(k===K.BLD)R.bld.push([p.type,p.x|0,p.z|0]); else if(k===K.WATER)R.water.push([p.type,p.x|0,p.z|0]); else if(k===K.ROAD&&p.type!=='lamp')R.road.push([p.type,p.x|0,p.z|0]); all.push(p);}
const G=new Map();for(const p of all){const key=Math.floor(p.x/4)+','+Math.floor(p.z/4);(G.get(key)||G.set(key,[]).get(key)).push(p);}
for(const p of all){const r=RAD[p.type]||.4;const gx=Math.floor(p.x/4),gz=Math.floor(p.z/4);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const q of G.get((gx+a)+','+(gz+b))||[]){if(q===p||q.x<p.x||(q.x===p.x&&q.z<=p.z))continue;const d=Math.hypot(q.x-p.x,q.z-p.z);if(d<(r+(RAD[q.type]||.4))*.8)R.overlap.push([p.type,q.type,p.x|0,p.z|0,+d.toFixed(2)]);}}

// zoning rules (bouquinistes may lean on the quay parapet, i.e. a wall tile touching the river): no furniture on carriageways/bridges, none against a facade (doorways), fountains only in parks or at real historic sites, stalls only inside market radii, zone buildings on building tiles
R.zRoad=[];R.zDoor=[];R.zFount=[];R.zStall=[];R.zBuild=[];R.zCem=[];const FURN=new Set(['stall','kiosk','bench','fountain','wallace','morris','pissoir','trough','bouq','band']);
const kk=(x,z)=>kij(Math.floor(x/T),Math.floor(z/T));
const ext=ZD.stalls.map(s=>({type:'stall',x:s[0],z:s[1]})).concat(ZD.bouq.map(s=>({type:'bouq',x:s[0],z:s[1]})));
for(const p of all.concat(ext)){if(!FURN.has(p.type))continue;const i=Math.floor(p.x/T),j=Math.floor(p.z/T),k=kij(i,j);
 if(k===K.ROAD||k===K.BRIDGE||k===K.RAIL)R.zRoad.push([p.type,p.x|0,p.z|0]);
 if(k===K.SIDE&&p.type!=='fountain'&&[[1,0],[-1,0],[0,1],[0,-1]].some(([a,b])=>kij(i+a,j+b)===K.BLD&&!(p.type==='bouq'&&[[0,0],[1,0],[-1,0],[0,1],[0,-1],[2,0],[-2,0],[0,2],[0,-2]].some(([c,d])=>kij(i+a+c,j+b+d)===K.WATER))))R.zDoor.push([p.type,p.x|0,p.z|0]);
 if(p.type==='fountain'&&!isFountainSite(p.x,p.z))R.zFount.push([p.x|0,p.z|0]);
 if(k===K.PARK&&zoneTile(i,j)===Z.cemetery&&p.type!=='bench')R.zCem.push([p.type,p.x|0,p.z|0]);}
for(const s of ext)if(s.type==='stall'&&!ZD.markets.some(m=>Math.hypot(s.x-m[1],s.z-m[2])<=m[3]+.01))R.zStall.push([s.x|0,s.z|0]);
for(const [nm,L] of [['church',ZD.churches],['hall',ZD.halls],['fact',ZD.fact],['ware',ZD.ware],['shed',ZD.sheds]])for(const c of L){if(kk(c[1],c[2])===K.ROAD||kk(c[1],c[2])===K.WATER)R.zBuild.push([nm,c[0],c[1]|0,c[2]|0]);}
// lamp rule: every lamp sits on a pavement tile, exactly LAMP_RULE.off inside the kerb of a lamped street, and no two lamps closer than .55 x spacing
const V=await (await fetch('map/vec.json')).json();R.lampBand=[];R.lampSpacing=[];R.lampSurf=[];const LR=w.LAMP_RULE||null;const lamps=all.filter(p=>p.type==='lamp');
const RG=new Map();V.roads.forEach(r=>{const P=r[3];for(let k=0;k+3<P.length;k+=2){for(let a=Math.floor(Math.min(P[k],P[k+2])/40);a<=Math.floor(Math.max(P[k],P[k+2])/40);a++)for(let b=Math.floor(Math.min(P[k+1],P[k+3])/40);b<=Math.floor(Math.max(P[k+1],P[k+3])/40);b++){const key=a+','+b;(RG.get(key)||RG.set(key,[]).get(key)).push([r[0],P[k],P[k+1],P[k+2],P[k+3]]);}}});
if(LR)for(const p of lamps){if(kij(Math.floor(p.x/T),Math.floor(p.z/T))!==K.SIDE)R.lampSurf.push([p.x|0,p.z|0]);let ok=false;const gx=Math.floor(p.x/40),gz=Math.floor(p.z/40);
 for(let a=-1;a<=1&&!ok;a++)for(let b=-1;b<=1&&!ok;b++)for(const [c,x0,z0,x1,z1] of RG.get((gx+a)+','+(gz+b))||[]){if(!LR.sp[c])continue;const dx=x1-x0,dz=z1-z0,l2=dx*dx+dz*dz||1,t=Math.max(0,Math.min(1,((p.x-x0)*dx+(p.z-z0)*dz)/l2)),d=Math.hypot(p.x-x0-dx*t,p.z-z0-dz*t);if(Math.abs(d-((V.W[c]??1)*T/2+LR.off))<.05){ok=true;break;}}
 if(!ok)R.lampBand.push([p.x|0,p.z|0]);}
const LG=new Map();for(const p of lamps){const key=Math.floor(p.x/8)+','+Math.floor(p.z/8);(LG.get(key)||LG.set(key,[]).get(key)).push(p);}
if(LR)for(const p of lamps){const gx=Math.floor(p.x/8),gz=Math.floor(p.z/8);for(let a=-1;a<=1;a++)for(let b=-1;b<=1;b++)for(const q of LG.get((gx+a)+','+(gz+b))||[])if(q!==p&&q.x>=p.x&&Math.hypot(q.x-p.x,q.z-p.z)<14*.55-.01)R.lampSpacing.push([p.x|0,p.z|0]);}
return R;}'''
async def main():
  async with async_playwright() as p:
    b=await p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    pg=await b.new_page(); await pg.goto('http://localhost:'+os.environ.get('PORT','8188')+'/'); await pg.wait_for_timeout(4000)
    r=await pg.evaluate(JS)
    print('props',r['n'],r['types']); 
    for k in ['bld','water','road','overlap','lampSurf','lampBand','lampSpacing','zRoad','zDoor','zFount','zStall','zBuild','zCem']: print(k,len(r[k]),r[k][:12])
    await b.close()
    sys.exit(1 if (r['bld'] or r['water'] or r['overlap'] or r['lampSurf'] or r['lampBand'] or r['lampSpacing'] or r['zRoad'] or r['zDoor'] or r['zFount'] or r['zStall'] or r['zBuild'] or r['zCem']) else 0)
asyncio.run(main())
