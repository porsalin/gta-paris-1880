# Builds map/landmarks.json: real OSM footprints (outer + inner rings) of the 1890 landmarks, projected to game units.
# Input: sel.json made by tools/lm_extract (osmium over osm/Paris.osm.pbf, names in lm_names.py).
import json, math, sys
from lm_names import NAMES
KX=111320*math.cos(math.radians(48.862)); MPU=2.5
def P(la,lo): return [round((lo-2.270)*KX/MPU,2), round((48.895-la)*111320/MPU,2)]
def area(q):
  s=0
  for i in range(len(q)): x0,z0=q[i];x1,z1=q[(i+1)%len(q)]; s+=x0*z1-x1*z0
  return s/2
def rdp(pts,eps):
  if len(pts)<3: return pts
  a,b=pts[0],pts[-1]; dx,dz=b[0]-a[0],b[1]-a[1]; L=math.hypot(dx,dz) or 1e-9; dm,im=0,0
  for i in range(1,len(pts)-1):
    d=abs(dz*(pts[i][0]-a[0])-dx*(pts[i][1]-a[1]))/L
    if d>dm: dm,im=d,i
  if dm>eps: return rdp(pts[:im+1],eps)[:-1]+rdp(pts[im:],eps)
  return [a,b]
def ring(r,eps=.35):
  q=[P(*p) for p in r]
  if q[0]==q[-1]: q=q[:-1]
  f=max(range(len(q)),key=lambda i:(q[i][0]-q[0][0])**2+(q[i][1]-q[0][1])**2)
  return rdp(q[:f+1],eps)[:-1]+rdp(q[f:]+[q[0]],eps)[:-1]
src=json.load(open(sys.argv[1])); out={}
for key,nm in NAMES.items():
  L=src.get(nm)
  if not L: print('missing',key,nm); continue
  polys=[{'o':ring(x['outer']),'h':[ring(h) for h in x['inner'] if len(h)>3]} for x in L]
  polys=[p for p in polys if len(p['o'])>=3 and 0<sum(v[0] for v in p['o'])/len(p['o'])<3954 and 0<sum(v[1] for v in p['o'])/len(p['o'])<2894]
  polys.sort(key=lambda p:-abs(area(p['o'])))
  if not polys: print('degenerate',key); continue
  big=polys[0]; cx=sum(v[0] for v in big['o'])/len(big['o']); cz=sum(v[1] for v in big['o'])/len(big['o'])
  keep=[big]+[p for p in polys[1:] if math.hypot(sum(v[0] for v in p['o'])/len(p['o'])-cx,sum(v[1] for v in p['o'])/len(p['o'])-cz)<60]
  for p in keep:
    if area(p['o'])<0: p['o'].reverse()
  out[key]={'n':nm,'c':[round(cx,1),round(cz,1)],'p':keep}
pts={ # hand-placed 1890 features (lat, lon) where OSM has no 1890 geometry
 'obelisk':(48.86546,2.32112),'fmers':(48.86521,2.32111),'ffleuves':(48.86574,2.32117),'vendomecol':(48.86753,2.32944),
 'henri4':(48.85718,2.34095),'marianne':(48.86763,2.36325),'louis13':(48.85561,2.36550),'liberty':(48.85010,2.27970),
 'moulinrouge':(48.88412,2.33225),'trocadero':(48.86210,2.28780),'halles':(48.86240,2.34530),'galerie':(48.85240,2.30055),
 'gareest':(48.87700,2.35920),'galettemill':(48.88720,2.33710),'radet':(48.88740,2.33640),'fstmichel':(48.85320,2.34370),
 'opcomique':(48.87055,2.33720),'halleaux':(48.86180,2.34630),'finnocents':(48.86070,2.34857),
}
json.dump({'L':out,'pt':{k:P(*v) for k,v in pts.items()}},open(sys.argv[2],'w'),separators=(',',':'))
for k,v in out.items(): print(k, v['c'], len(v['p']), sum(len(p['o']) for p in v['p']), 'holes', sum(len(p['h']) for p in v['p']))
