# City layout / land-use generator for 1890 Paris -> game/map/zones.json
# Inputs: game/map/map.png (gameplay raster), game/map/world.json (landmarks), tools/zosm.json (OSM landuse/amenity, tools/zextract.py)
# Rules are historical: zones from period knowledge layered over OSM; every placement is snapped to a legal tile class.
import json, math, base64, numpy as np
from PIL import Image
from scipy import ndimage
G='/workspace/gta-zoning/'
LAT1,LON0=48.895,2.270; MPU=2.5; T=2; KX=111320*math.cos(math.radians(48.862)); KZ=111320
def P(lat,lon): return ((lon-LON0)*KX/MPU,(LAT1-lat)*KZ/MPU)
M=lambda m: m/MPU
mp=np.array(Image.open(G+'map/map.png')); kind=mp[...,0].astype(np.uint8); surf=mp[...,1]; dist=mp[...,2]
NZ,NX=kind.shape; ROAD,SIDE,BLD,WATER,BRIDGE,PARK,STAIR,RAIL=range(8)
WJ=json.load(open(G+'map/world.json')); LM=WJ['landmarks']; OS=json.load(open(G+'tools/zosm.json'))
C=4; CW,CHh=(NX+C-1)//C,(NZ+C-1)//C  # zone cell = 4 tiles = 8 units = 20 m
ZN=['open','commercial','bourgeois','working','medieval','industrial','railway','market','park','cemetery','civic','rural','riverside','luxury','latin','warehouse']
Z={n:k for k,n in enumerate(ZN)}
# ---- 1. district defaults (DN order in world.js)
DEF={0:'working',1:'commercial',2:'medieval',3:'working',4:'riverside',5:'medieval',6:'latin',7:'bourgeois',8:'bourgeois',9:'working',10:'working',11:'working',12:'bourgeois',13:'bourgeois'}
dc=dist[::C,::C][:CHh,:CW]; zone=np.zeros((CHh,CW),np.uint8)
for d,n in DEF.items(): zone[dc==d]=Z[n]
cx=(np.arange(CW)+.5)*C*T; cz=(np.arange(CHh)+.5)*C*T; XX,ZZ=np.meshgrid(cx,cz)
def circ(lat,lon,rm,n,only=None):
  x,z=P(lat,lon); m=(XX-x)**2+(ZZ-z)**2<M(rm)**2
  if only is not None: m&=np.isin(zone,[Z[o] for o in only])
  zone[m]=Z[n]
# ---- 2. historical character areas (lat, lon, radius m)
for a in [
 (48.8715,2.3420,700,'bourgeois'),(48.8790,2.3060,600,'bourgeois'),(48.8660,2.2930,600,'bourgeois'),(48.8570,2.2800,700,'bourgeois'),(48.8560,2.3200,700,'bourgeois'),(48.8700,2.3020,500,'bourgeois'),
 (48.8820,2.3370,350,'working'),(48.8730,2.3560,550,'working'),(48.8720,2.3850,700,'working'),(48.8680,2.3900,600,'working'),(48.8510,2.3800,650,'working'),(48.8690,2.3700,450,'working'),
 (48.8420,2.3240,500,'working'),(48.8480,2.2950,550,'working'),(48.8400,2.3520,450,'working'),(48.8840,2.3180,450,'working'),(48.8650,2.3620,350,'working'),
 (48.8545,2.3480,280,'medieval'),(48.8585,2.3600,520,'medieval'),(48.8517,2.3567,230,'medieval'),(48.8420,2.3500,230,'medieval'),(48.8600,2.3510,250,'medieval'),
 (48.8490,2.3450,480,'latin'),(48.8700,2.3170,450,'luxury'),(48.8690,2.3310,250,'luxury'),(48.8680,2.3290,180,'commercial'),
 (48.8930,2.3780,450,'industrial'),(48.8885,2.3720,250,'industrial'),(48.8900,2.3850,300,'industrial'),(48.8420,2.2790,400,'industrial'),(48.8505,2.2920,280,'industrial'),
 (48.8720,2.3650,200,'warehouse'),(48.8350,2.3850,450,'warehouse'),(48.8330,2.3720,350,'industrial'),(48.8385,2.3020,220,'industrial'),(48.8840,2.3650,250,'industrial'),
 (48.8870,2.3400,230,'rural'),(48.8885,2.3355,200,'rural'),(48.8893,2.3440,180,'rural'),
 (48.8620,2.3460,170,'market'),
 (48.8540,2.3470,110,'civic'),(48.8385,2.3630,250,'civic'),(48.8735,2.3680,150,'civic'),(48.8825,2.3520,120,'civic'),(48.8405,2.3420,140,'civic'),(48.8455,2.3155,130,'civic'),(48.8680,2.3640,90,'civic'),(48.8500,2.3060,200,'civic'),(48.8565,2.3125,200,'civic'),
]: circ(*a)
# commercial frontage: building cells within ~15 m of a macadam boulevard in the central districts, plus the Grands Boulevards line
mac=((kind==ROAD)&(surf==0)); macc=ndimage.maximum_filter(mac.astype(np.uint8),size=C*2+1)[::C,::C][:CHh,:CW]>0
cent=np.isin(dc,[1,2,3,6,7,10,13,8,11]) & np.isin(zone,[Z['bourgeois'],Z['working'],Z['medieval'],Z['latin']])
gb=np.zeros_like(zone,bool)
for la,lo in [(48.8705,2.3330),(48.8712,2.3400),(48.8705,2.3480),(48.8695,2.3560),(48.8678,2.3620),(48.8640,2.3660),(48.8580,2.3680),(48.8590,2.3480),(48.8620,2.3400),(48.8650,2.3300)]:
  x,z=P(la,lo); gb|=(XX-x)**2+(ZZ-z)**2<M(260)**2
zone[macc & (cent & (gb | np.isin(dc,[1,7]) | (np.random.default_rng(1).random(zone.shape)<.35)))]=Z['commercial']
# ---- 3. raster truths: water / parks / rails; cemeteries from OSM
def kc(v):
  a=np.zeros((CHh*C,CW*C),np.float32); a[:NZ,:NX]=(kind==v); return a.reshape(CHh,C,CW,C).mean((1,3))
wat,par,rai=kc(WATER),kc(PARK),kc(RAIL)
from PIL import ImageDraw
cem=Image.new('L',(CW,CHh),0); dcem=ImageDraw.Draw(cem); CEM=[]
for k,nm,rel,den,sd,pts in OS['lu']:
  if k=='lu:cemetery' and not (sd and sd[:4].isdigit() and int(sd[:4])>1890):
    q=[(P(a,b)[0]/(C*T),P(a,b)[1]/(C*T)) for a,b in pts]; dcem.polygon(q,fill=1); CEM.append(nm)
cem=np.array(cem)>0
zone[par>.5]=Z['park']; zone[cem & (par>.2)]=Z['cemetery']; zone[rai>.3]=Z['railway']; zone[wat>.5]=Z['riverside']
# rail-adjacent building cells near the termini become railway (goods sheds, depots)
railc=ndimage.binary_dilation(rai>.3,iterations=3)
for key in ['garenord','gareest','gare','garelyon','gareaust','garemontp']:
  l=LM[key]; zone[railc & ((XX-l[1])**2+(ZZ-l[2])**2<180**2) & (wat<.5) & (par<.5)]=Z['railway']
# ---- reserve masks (tile level)
bld=(kind==BLD); res=np.zeros_like(bld)
def lmr(t): return {'cathedral':40,'palace':45,'ruin':60,'hall':45,'halles':45,'station':40,'opera':40,'dome':30,'store':30,'temple':25,'church':24,'trocadero':30,'scaffold':28}.get(t,14)
for k,l in LM.items():
  i,j=int(l[1]/T),int(l[2]/T); r=int(lmr(l[3])/T); res[max(0,j-r):j+r,max(0,i-r):i+r]=True
def fit(x,z,w,d,ang,search=40,need=BLD,frac=1.0):
  """find nearest placement of a w x d rect (units) whose samples are all `need` tiles and unreserved; returns x,z,ang"""
  best=None
  for a in ([ang,ang+math.pi/2] if w!=d else [ang]):
    ca,sa=math.cos(a),math.sin(a); us=np.arange(-w/2+1,w/2,1.6); vs=np.arange(-d/2+1,d/2,1.6); U,V=np.meshgrid(us,vs); U=U.ravel(); V=V.ravel()
    for r in range(0,search,2):
      for dx in range(-r,r+1,2):
        for dz in range(-r,r+1,2):
          if max(abs(dx),abs(dz))!=r: continue
          px,pz=x+dx,z+dz; I=((px+U*ca-V*sa)/T).astype(int); J=((pz+U*sa+V*ca)/T).astype(int)
          if I.min()<0 or J.min()<0 or I.max()>=NX or J.max()>=NZ: continue
          ok=(kind[J,I]==need)&~res[J,I]
          if ok.mean()>=frac: 
            if best is None or r<best[3]: best=(px,pz,a,r)
            break
        else: continue
        break
      if best and best[3]<=r: break
  if not best: return None
  px,pz,a,_=best; ca,sa=math.cos(a),math.sin(a)
  us=np.arange(-w/2,w/2+.1,1); vs=np.arange(-d/2,d/2+.1,1); U,V=np.meshgrid(us,vs); I=((px+U.ravel()*ca-V.ravel()*sa)/T).astype(int); J=((pz+U.ravel()*sa+V.ravel()*ca)/T).astype(int)
  m=(I>=0)&(J>=0)&(I<NX)&(J<NZ); res[J[m],I[m]]=True
  return round(px,1),round(pz,1),round(a,3)
def obb(pts):
  xy=np.array([P(a,b) for a,b in pts]); c=xy.mean(0); q=xy-c; cov=q.T@q; ev,evec=np.linalg.eigh(cov); ax=evec[:,1]; a=math.atan2(ax[1],ax[0])
  u=q@ax; v=q@np.array([-ax[1],ax[0]]); return c[0],c[1],u.max()-u.min(),v.max()-v.min(),a
# ---- 4. churches: real 1890 churches by name (style), then a parish church per quarter where none
CH_STY={"Saint-Germain l'Auxerrois":'gothic','Saint-Séverin':'gothic','Saint-Julien-le-Pauvre':'romanesque','Saint-Merri':'gothic','Saint-Gervais':'classical','Saint-Étienne-du-Mont':'gothic','Saint-Nicolas-des-Champs':'gothic',
 'Saint-Leu':'gothic','Saint-Médard':'gothic','Saint-Laurent':'gothic','Sainte-Clotilde':'gothic','Saint-Pierre de Montmartre':'romanesque','Saint-Jean-Baptiste de Belleville':'gothic','Saint-Roch':'baroque',
 'Saint-Paul-Saint-Louis':'baroque','Val-de-Grâce':'baroque','Notre-Dame-des-Victoires':'baroque','Saint-Louis-en-l':'baroque','Saint-Nicolas du Chardonnet':'baroque','Saint-Thomas d':'classical',
 'Saint-Vincent-de-Paul':'classical','Saint-Philippe-du-Roule':'classical','Saint-Denis du Saint-Sacrement':'classical','Blancs-Manteaux':'classical','Saint-Jacques-du-Haut-Pas':'classical',
 'Sainte-Marguerite':'classical','Saint-François-Xavier':'classical','Saint-Pierre de Montrouge':'romanesque','Saint-Joseph des Carmes':'baroque','Saint-Eugène':'gothic','Saint-Ambroise':'gothic',
 'Notre-Dame de Clignancourt':'romanesque','Saint-Lambert de Vaugirard':'classical','Sainte-Elisabeth':'baroque','Notre-Dame-de-Bonne-Nouvelle':'classical','Saint-Antoine des Quinze-Vingts':'classical',
 "Temple de l'Oratoire":'classical','Temple du Marais':'baroque','Saint-Ferdinand des Ternes':'classical','Saint-Georges de la Villette':'classical','Saint-Jean-Baptiste de Grenelle':'classical',
 'Saint-Martin des Champs':'romanesque','Saint-Pierre de Chaillot':'classical','Synagogue de la rue des Tournelles':'synagogue','Synagogue Nazareth':'synagogue','Saint-Alexandre':'orthodox','Saint-Serge':'gothic',
 'Notre-Dame-de-la-Croix':'romanesque','Saint-Germain de Charonne':'romanesque','Notre-Dame des Champs':'romanesque','Saint-Honoré d\'Eylau':'classical','Saint-Bernard':'gothic','Sainte-Marie des Batignolles':'classical',
 'Saint-Pierre du Gros-Caillou':'classical','Notre-Dame-de-la-Gare':'romanesque','Saint-Marcel':'romanesque','Notre-Dame-de-l\'Assomption':'baroque','Saint-Charles de Monceau':'classical'}
SKIPLM={'stsulpice','stgermain','steustache','trinite','lorette','staugustin','madeleine','notredame','saintechapelle','pantheon','invalides','sacrecoeur'}
churches=[]; seen=set()
for k,nm,rel,den,sd,pts in OS['lu']:
  if k not in('am:place_of_worship','b:church','b:chapel') or not nm: continue
  sty=next((s for key,s in CH_STY.items() if key.lower() in nm.lower()),None)
  if not sty or nm in seen: continue
  if 'Saint-Serge' in nm: continue  # 1920s conversion
  x,z,w,d,a=obb(pts); 
  if any((x-l[1])**2+(z-l[2])**2<40**2 for kk,l in LM.items() if l[3] in('church','cathedral','dome','temple','chapel','scaffold')): continue
  if not(0<x<NX*T and 0<z<NZ*T): continue
  w=max(14,min(w,46)); d=max(8,min(d,22)); f=fit(x,z,w*.9,d*.9,a,search=12,frac=.8)
  if f: seen.add(nm); churches.append([nm,f[0],f[1],round(w*.9,1),round(d*.9,1),f[2],sty,1])
# Russian cathedral (rue Daru, 1861) - OSM tag missing name match
for nm,la,lo,w,d,sty in [('Cathédrale Saint-Alexandre-Nevsky',48.8779,2.3016,22,16,'orthodox'),('Synagogue de la Victoire',48.8760,2.3380,24,14,'synagogue')]:
  x,z=P(la,lo); f=fit(x,z,w,d,0,search=14,frac=.8)
  if f: churches.append([nm,f[0],f[1],w,d,f[2],sty,1])
QSTY={Z['medieval']:'gothic',Z['latin']:'gothic',Z['working']:'romanesque',Z['bourgeois']:'classical',Z['commercial']:'classical',Z['luxury']:'classical',Z['rural']:'romanesque',Z['industrial']:'romanesque'}
allc=[(c[1],c[2]) for c in churches]+[(l[1],l[2]) for k,l in LM.items() if l[3] in('church','cathedral','dome','temple','chapel')]
PAR=['Saint-Ambroise-des-Faubourgs','Notre-Dame-des-Ateliers','Saint-Éloi','Sainte-Geneviève-des-Carrières','Saint-Joseph-des-Mariniers','Saint-Denis-de-la-Chapelle','Notre-Dame-du-Rosaire','Saint-Vincent-des-Prés','Saint-Hippolyte','Saint-Fiacre','Sainte-Anne-du-Faubourg','Saint-Médéric','Saint-Crépin','Saint-Martin-des-Tonneliers','Notre-Dame-de-la-Barrière','Saint-Christophe','Saint-Blaise','Saint-Lubin','Sainte-Opportune-Neuve','Saint-Landry']
pk=0
for gz in np.arange(200,NZ*T,M(650)):
  for gx in np.arange(200,NX*T,M(650)):
    j,i=int(gz/(C*T)),int(gx/(C*T))
    if j>=CHh or i>=CW or zone[j,i] not in QSTY or bld[min(NZ-1,int(gz/T))-20:int(gz/T)+20,int(gx/T)-20:int(gx/T)+20].mean()<.5: continue
    if any((gx-a)**2+(gz-b)**2<M(420)**2 for a,b in allc): continue
    f=fit(gx,gz,22,11,0 if (i+j)%2 else math.pi/2,search=30)
    if f: churches.append([PAR[pk%len(PAR)],f[0],f[1],22,11,f[2],QSTY[zone[j,i]],0]); allc.append(f[:2]); pk+=1
# ---- 5. markets: Les Halles is a landmark; covered markets (Baltard-type halls) and street markets (stalls on pavements/squares only)
halls=[]
for nm,la,lo,w,d in [('Marché du Temple (Carreau)',48.8653,2.3610,44,26),('Marché des Enfants-Rouges',48.8628,2.3617,18,14),('Marché Saint-Germain',48.8522,2.3352,36,28),('Marché Beauvau',48.8487,2.3785,24,18),
  ('Marché Saint-Quentin',48.8762,2.3557,30,22),('Marché Saint-Honoré',48.8668,2.3323,30,20),("Marché de l'Europe",48.8775,2.3215,26,18),('Marché Popincourt',48.8630,2.3755,24,16),('Marché des Batignolles',48.8875,2.3205,22,16),('Marché Saint-Martin',48.8705,2.3575,24,16),('Marché des Patriarches',48.8395,2.3510,18,14)]:
  x,z=P(la,lo); f=fit(x,z,w,d,0,search=44,frac=.8)
  if f: halls.append([nm,f[0],f[1],w,d,f[2]]); circ(la,lo,90,'market')
MK=[('Les Halles',48.8622,2.3455,190),('Place Maubert',48.8500,2.3485,55),('Rue Mouffetard',48.8410,2.3497,120),('Rue de Buci',48.8535,2.3370,60),("Place d'Aligre",48.8490,2.3780,60),('Marché aux fleurs, Cité',48.8553,2.3470,55),
  ('Rue Montorgueil',48.8645,2.3470,80),('Rue Lepic',48.8850,2.3345,70),('Rue Cler',48.8565,2.3060,50),('Marché aux chevaux',48.8385,2.3580,60),('Carreau du Temple',48.8653,2.3605,70),('Rue de Lévis',48.8825,2.3110,50),('Rue des Martyrs',48.8790,2.3395,60),('Rue Poncelet',48.8790,2.2970,45)]
stalls=[]
for nm,la,lo,r in MK:
  x,z=P(la,lo); i0,j0=int(x/T),int(z/T); R=int(M(r)/T)-1
  for j in range(max(1,j0-R),min(NZ-1,j0+R)):
    for i in range(max(1,i0-R),min(NX-1,i0+R)):
      if (i-i0)**2+(j-j0)**2>R*R or kind[j,i]!=SIDE or res[j,i]: continue
      n4=[kind[j,i+1],kind[j,i-1],kind[j+1,i],kind[j-1,i]]
      if any(k in(ROAD,BRIDGE,BLD,WATER,RAIL) for k in n4): continue  # never at the kerb, never against a door
      n8=kind[j-1:j+2,i-1:i+2]
      if (n8==BLD).any() or (n8==ROAD).any(): continue
      if (i*7+j*13)%3: continue
      if any(abs(s[0]-(i+.5)*T)<3.2 and abs(s[1]-(j+.5)*T)<3.2 for s in stalls[-80:]): continue
      a=0 if ((i//3+j//3)%2) else 1.5708; stalls.append([(i+.5)*T,(j+.5)*T,a])
  circ(la,lo,r*.6,'market',only=['commercial','bourgeois','working','medieval','latin','luxury'])
# ---- 6. industry: gasworks with gasometers, factories with chimneys, Bercy wine halls, canal warehouses, abattoirs
gaso=[];fact=[];ware=[]
for nm,la,lo,n in [('Usine à gaz de La Villette',48.8925,2.3690,4),('Usine à gaz de Belleville',48.8780,2.3990,2),('Usine à gaz de Vaugirard',48.8370,2.3010,3),("Usine à gaz d'Ivry",48.8320,2.3730,3),('Usine à gaz de Passy',48.8560,2.2735,2),('Usine à gaz de Grenelle',48.8455,2.2860,2)]:
  x,z=P(la,lo)
  for q in range(n):
    r=9+(q%2)*3; f=fit(x+(q%2)*30-15,z+(q//2)*30-15,r*2+2,r*2+2,0,search=40,frac=.7)
    if f: gaso.append([nm,f[0],f[1],r])
FS=[('Ateliers Cail (locomotives)',48.8505,2.2930,6),('Usines de Javel',48.8425,2.2790,6),('Raffinerie Say',48.8320,2.3570,3),('Manufacture des Gobelins',48.8355,2.3520,2),('Usines de La Villette',48.8900,2.3800,6),('Ateliers du Faubourg Saint-Antoine',48.8515,2.3780,4),
    ('Fonderies de Belleville',48.8730,2.3860,2),('Ateliers de La Chapelle',48.8860,2.3600,4),('Chocolaterie Menier (dépôt)',48.8420,2.3140,1),('Tanneries de la Bièvre',48.8350,2.3480,3),('Imprimeries de Grenelle',48.8470,2.2980,2)]
for nm,la,lo,n in FS:
  x,z=P(la,lo)
  for q in range(n):
    w,d=18+(q*7)%14,12+(q*5)%8; f=fit(x+((q%3)-1)*34,z+((q//3)-.5)*34,w,d,(q%2)*1.5708,search=36,frac=.85)
    if f: fact.append([nm,f[0],f[1],w,d,f[2],1 if q%2==0 else 0])
for nm,la,lo,n in [('Entrepôts de Bercy',48.8355,2.3860,14),("Magasins généraux du canal Saint-Martin",48.8740,2.3655,5),('Entrepôts de la Villette',48.8880,2.3735,6),('Halle aux vins',48.8475,2.3560,5)]:
  x,z=P(la,lo)
  for q in range(n):
    f=fit(x+((q%4)-1.5)*26,z+((q//4)-1)*20,22,9,-.62 if 'Bercy' in nm else 0,search=24,frac=.85)
    if f: ware.append([nm,f[0],f[1],22,9,f[2]])
# ---- 7. Montmartre: vineyards, quarries, shacks (the Maquis), extra windmill
vines=[];quar=[];shacks=[];mills=[]
for la,lo in [(48.8878,2.3400),(48.8882,2.3412),(48.8874,2.3388),(48.8889,2.3395),(48.8868,2.3420),(48.8893,2.3430),(48.8862,2.3378)]:
  x,z=P(la,lo); f=fit(x,z,14,10,0,search=26,frac=.97)
  if f: vines.append([f[0],f[1],14,10,f[2]])
for la,lo,r in [(48.8888,2.3335,16),(48.8872,2.3318,12),(48.8790,2.3830,14)]:
  x,z=P(la,lo); f=fit(x,z,r*2,r*2,0,search=30,frac=.92)
  if f: quar.append([f[0],f[1],r])
rng=np.random.default_rng(7)
for la,lo,n in [(48.8880,2.3375,14),(48.8890,2.3445,8),(48.8870,2.3440,6)]:
  x,z=P(la,lo)
  for q in range(n):
    f=fit(x+rng.uniform(-40,40),z+rng.uniform(-40,40),5,4,rng.uniform(0,3),search=10,frac=.9)
    if f: shacks.append([f[0],f[1],f[2]])
for nm,la,lo in [('Moulin de la Lancette',48.8872,2.3365)]:
  x,z=P(la,lo); f=fit(x,z,5,5,0,search=14)
  if f: mills.append([nm,f[0],f[1]])
# ---- 8. the Seine: bouquinistes on the quay parapets, moored barges, bateaux-lavoirs, bathing establishments, bateaux-mouches
wmask=(kind==WATER); seine=wmask&(dist==4)
dw=ndimage.distance_transform_edt(~wmask)
bouq=[]
def along(i,j):
  gy,gx=np.gradient(wmask[j-3:j+4,i-3:i+4].astype(float)); return math.atan2(gy.mean(),gx.mean())
quays=[(48.8575,2.3330,48.8530,2.3470),(48.8595,2.3360,48.8575,2.3470),(48.8520,2.3470,48.8505,2.3520)]
for la0,lo0,la1,lo1 in quays:
  x0,z0=P(la0,lo0); x1,z1=P(la1,lo1); L=math.hypot(x1-x0,z1-z0)
  for s in np.arange(0,L,4.2):
    x=x0+(x1-x0)*s/L; z=z0+(z1-z0)*s/L; i,j=int(x/T),int(z/T)
    # walk toward the river to the last pavement tile before the parapet
    best=None
    for r in range(0,40):
      for di,dj in((0,1),(0,-1),(1,0),(-1,0)):
        ii,jj=i+di*r,j+dj*r
        if 0<ii<NX-1 and 0<jj<NZ-1 and kind[jj,ii]==SIDE and dw[jj,ii]<=2.5 and not res[jj,ii]:
          best=(ii,jj);break
      if best: break
    if not best: continue
    ii,jj=best; a=along(ii,jj)
    if any(abs(b[0]-(ii+.5)*T)<3.6 and abs(b[1]-(jj+.5)*T)<3.6 for b in bouq): continue
    def _wall_ok(ii,jj):  # any wall tile beside the box must be the river parapet, not a house front
      for a_,b_ in ((1,0),(-1,0),(0,1),(0,-1)):
        if kind[jj+b_,ii+a_]==BLD and not any(kind[jj+b_+d_,ii+a_+c_]==WATER for c_,d_ in ((0,0),(1,0),(-1,0),(0,1),(0,-1),(2,0),(-2,0),(0,2),(0,-2))): return False
      return True
    if not _wall_ok(ii,jj): continue
    bouq.append([(ii+.5)*T,(jj+.5)*T,round(a,3)])
boats=[]
dl=ndimage.distance_transform_edt(wmask)
def moor(la,lo,typ,n=1,gap=16):
  x,z=P(la,lo); i0,j0=int(x/T),int(z/T); best=None
  for r in range(0,60):
    for di in range(-r,r+1):
      for dj in (-r,r):
        for ii,jj in ((i0+di,j0+dj),(i0+dj,j0+di)):
          if 0<ii<NX and 0<jj<NZ and seine[jj,ii] and 2.5<=dl[jj,ii]<=4: best=(ii,jj);break
        if best:break
      if best:break
    if best:break
  if not best: return
  ii,jj=best; gy,gx=np.gradient(dl[jj-4:jj+5,ii-4:ii+5]); a=math.atan2(gy.mean(),gx.mean())+math.pi/2
  for q in range(n):
    boats.append([typ,round((ii+.5)*T+math.cos(a)*q*gap,1),round((jj+.5)*T+math.sin(a)*q*gap,1),round(a,3)])
for la,lo,t,n in [(48.8560,2.3420,'lavoir',1),(48.8517,2.3530,'lavoir',1),(48.8545,2.3595,'lavoir',1),(48.8610,2.3230,'bains',1),(48.8575,2.3395,'bains',1),(48.8470,2.3650,'barge',4),(48.8440,2.3700,'barge',5),
  (48.8580,2.3510,'barge',2),(48.8630,2.3010,'barge',3),(48.8600,2.2950,'mouche',1),(48.8605,2.3300,'mouche',1),(48.8520,2.3640,'barge',3),(48.8395,2.3780,'barge',6),(48.8550,2.2860,'barge',4)]: moor(la,lo,t,n)
# ---- 9. parks: real basins/fountains at their sites, generated fountains at park centres, bandstands
fountains=[]
HIST=[('Fontaine Saint-Michel',48.8532,2.3437,'wall'),('Fontaine des Innocents',48.8605,2.3484,'tiered'),('Fontaine Saint-Sulpice (des Quatre-Évêques)',48.8510,2.3345,'tiered'),('Fontaine du Palmier, Châtelet',48.8577,2.3470,'column'),
 ('Fontaine Molière',48.8650,2.3365,'wall'),("Fontaine de l'Observatoire",48.8420,2.3368,'tiered'),('Grand bassin octogonal, Tuileries',48.8640,2.3245,'basin'),('Grand bassin rond, Tuileries',48.8628,2.3290,'basin'),
 ('Grand bassin du Luxembourg',48.8467,2.3372,'basin'),('Fontaine Médicis',48.8485,2.3392,'wall'),('Fontaine Cuvier',48.8455,2.3560,'wall'),('Fontaine Louvois',48.8682,2.3375,'tiered'),('Fontaine du Château-d\'Eau',48.8675,2.3630,'tiered'),
 ('Fontaine Gaillon',48.8693,2.3343,'wall'),('Fontaine de Mars',48.8565,2.3020,'wall'),('Naumachie, parc Monceau',48.8797,2.3100,'basin'),('Cascade du Trocadéro',48.8618,2.2895,'basin'),('Fontaine Stravinsky?',0,0,'x')]
def clear(i,j,rt,ok=(SIDE,PARK)):
  sub=kind[j-rt:j+rt+1,i-rt:i+rt+1]; return sub.size and np.isin(sub,ok).all()
for nm,la,lo,typ in HIST:
  if not la: continue
  x,z=P(la,lo); i0,j0=int(x/T),int(z/T); hit=None
  for r in range(0,22):
    for di in range(-r,r+1):
      for dj in range(-r,r+1):
        if max(abs(di),abs(dj))==r and clear(i0+di,j0+dj,2): hit=(i0+di,j0+dj);break
      if hit:break
    if hit:break
  if hit: fountains.append([nm,(hit[0]+.5)*T,(hit[1]+.5)*T,typ,1])
  else: print('no site for',nm)
lab,n=ndimage.label(kind==PARK); bands=[]
pd=ndimage.distance_transform_edt(kind==PARK)
for c in range(1,n+1):
  sl=ndimage.find_objects(lab==c) if False else None
objs=ndimage.find_objects(lab)
for c,sl in enumerate(objs,1):
  m=lab[sl]==c; area=m.sum()
  if area<220: continue
  sub=pd[sl]*m; j,i=np.unravel_index(sub.argmax(),sub.shape); j+=sl[0].start; i+=sl[1].start
  zc=zone[min(CHh-1,j//C),min(CW-1,i//C)]
  if zc==Z['cemetery'] or pd[j,i]<4: continue
  x,z=(i+.5)*T,(j+.5)*T
  if not any((x-f[1])**2+(z-f[2])**2<60**2 for f in fountains): fountains.append(['Fontaine du square',x,z,'tiered' if area>900 else 'small',0])
  if area>1200 and pd[j,i]>6:
    # bandstand off-centre toward the park's second-deepest point
    sub2=sub.copy(); jj,ii=np.ogrid[:sub.shape[0],:sub.shape[1]]; sub2[(jj+sl[0].start-j)**2+(ii+sl[1].start-i)**2<20**2]=0
    j2,i2=np.unravel_index(sub2.argmax(),sub2.shape)
    if sub2.max()>5: bands.append([(i2+sl[1].start+.5)*T,(j2+sl[0].start+.5)*T])
# ---- 10. railway: platform canopies + goods sheds beside the termini (on building land next to tracks)
sheds=[]
for key in ['garenord','gareest','gare','garelyon','gareaust','garemontp']:
  l=LM[key]
  for q in range(3):
    f=fit(l[1]+(q-1)*40,l[2]+60,30,10,0,search=40,frac=.9)
    if f: sheds.append([LM[key][0],f[0],f[1],30,10,f[2]])
# ---- 11. quarters: labels + character for the M map and district banner
Q=[('LES CHAMPS-ÉLYSÉES',48.8698,2.3076,'avenue, gardens, café-concerts, the Cirque d’Été and the Panorama'),('QUARTIER LATIN',48.8490,2.3450,'medieval lanes, students, bookshops, colleges'),
 ('LE MARAIS',48.8590,2.3610,'old hôtels turned workshops, the Jewish quarter of the Pletzl, Place des Vosges'),('FAUBOURG SAINT-HONORÉ',48.8710,2.3170,'luxury shops, faubourg mansions, the Élysée'),
 ('PIGALLE',48.8820,2.3370,'cabarets, artists, models'),('LES GRANDS BOULEVARDS',48.8712,2.3420,'cafés, theatres, arcades, crowds'),('ÎLE SAINT-LOUIS',48.8517,2.3567,'quiet hôtels on the river'),
 ('ÎLE DE LA CITÉ',48.8550,2.3470,'Notre-Dame, the Palais, the Préfecture'),('BELLEVILLE',48.8720,2.3850,'workers, guinguettes, gasworks'),('MÉNILMONTANT',48.8660,2.3910,'workshops and vines on the hill'),
 ('PASSY',48.8570,2.2800,'villas and gardens above the river'),('MONTMARTRE',48.8867,2.3400,'windmills, vines, quarries, the Maquis'),('LA VILLETTE',48.8890,2.3770,'abattoirs, canal basin, gasometers'),
 ('BERCY',48.8360,2.3840,'the wine warehouses'),('FAUBOURG SAINT-ANTOINE',48.8510,2.3780,'cabinet-makers and workshops'),('FAUBOURG SAINT-GERMAIN',48.8565,2.3210,'aristocratic hôtels and ministries'),
 ('GRENELLE',48.8480,2.2950,'factories by the river'),('JAVEL',48.8420,2.2800,'chemical works'),('LES BATIGNOLLES',48.8840,2.3180,'clerks, painters, the rail yards'),('PLAINE MONCEAU',48.8810,2.3040,'new money and mansions'),
 ('LES HALLES',48.8620,2.3460,'the belly of Paris'),('LE TEMPLE',48.8660,2.3620,'second-hand clothes and the Carreau'),('MONTPARNASSE',48.8420,2.3240,'the gare and the guinguettes'),('MOUFFETARD',48.8410,2.3500,'the old market street'),
 ('LE GROS-CAILLOU',48.8580,2.3020,'barracks and the Champ de Mars'),('CHAILLOT',48.8660,2.2930,'hill above the Trocadéro'),('FAUBOURG SAINT-DENIS',48.8730,2.3540,'the Gares and the porters'),('BOIS DE BOULOGNE (to the west)',48.8705,2.2735,'lakes, carriage drives, Longchamp — beyond the fortifications')]
PROPER={'LA VILLETTE':'La Villette','LES CHAMPS-ÉLYSÉES':'Les Champs-Élysées','ÎLE DE LA CITÉ':'Île de la Cité','BOIS DE BOULOGNE (to the west)':'Bois de Boulogne'}
quarters=[[n,round(P(a,b)[0],1),round(P(a,b)[1],1),dsc,PROPER.get(n,' '.join(w if w in('de','la','du','des') else w.capitalize() for w in n.lower().split(' ')).replace('Saint-honoré','Saint-Honoré').replace('Saint-germain','Saint-Germain').replace('Saint-antoine','Saint-Antoine').replace('Saint-denis','Saint-Denis').replace('Saint-louis','Saint-Louis').replace('Gros-caillou','Gros-Caillou'))] for n,a,b,dsc in Q]
out=dict(cell=C*T,W=CW,H=CHh,names=ZN,z=base64.b64encode(zone.tobytes()).decode(),quarters=quarters,churches=churches,halls=halls,stalls=[[round(a,1),round(b,1),c] for a,b,c in stalls],
 markets=[[n,round(P(a,b)[0],1),round(P(a,b)[1],1),round(M(r),1)] for n,a,b,r in MK],gaso=gaso,fact=fact,ware=ware,vines=vines,quar=quar,shacks=shacks,mills=mills,bouq=bouq,boats=boats,fountains=[[n,round(x,1),round(z,1),t,r] for n,x,z,t,r in fountains],bands=bands,sheds=sheds,cemeteries=CEM)
json.dump(out,open(G+'map/zones.json','w'),ensure_ascii=False,separators=(',',':'))
import collections; print({ZN[k]:v for k,v in collections.Counter(zone.ravel().tolist()).items()})
print({k:len(v) for k,v in out.items() if isinstance(v,list)})
