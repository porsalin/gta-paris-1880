# Renders the zone overview map (land use + district labels) from map/zones.json
import json,base64,numpy as np
from PIL import Image,ImageDraw,ImageFont
d=json.load(open('map/zones.json')); W,H=d['W'],d['H']; z=np.frombuffer(base64.b64decode(d['z']),np.uint8).reshape(H,W)
COL={'open':(60,58,54),'commercial':(214,120,60),'bourgeois':(222,200,150),'working':(170,140,110),'medieval':(150,90,120),'industrial':(90,90,100),'railway':(120,60,60),'market':(240,200,40),'park':(90,150,80),'cemetery':(60,100,70),'civic':(80,120,190),'rural':(170,190,90),'riverside':(80,160,200),'luxury':(250,170,200),'latin':(190,120,200),'warehouse':(140,110,70)}
pal=np.array([COL[n] for n in d['names']],np.uint8); img=Image.fromarray(pal[z]).resize((W*3,H*3),Image.NEAREST); dr=ImageDraw.Draw(img); s=3/d['cell']
try: F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',15); f2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',13)
except: F=f2=ImageFont.load_default()
for c in d['churches']: dr.rectangle([c[1]*s-2,c[2]*s-2,c[1]*s+2,c[2]*s+2],fill=(255,255,255))
for f in d['fountains']: dr.ellipse([f[1]*s-2,f[2]*s-2,f[1]*s+2,f[2]*s+2],fill=(40,200,255))
for q in d['quarters']:
  x,y=q[1]*s,q[2]*s; x=min(max(x,130),W*3-130); dr.text((x,y),q[0],font=F,fill=(255,255,255),anchor='mm',stroke_width=3,stroke_fill=(0,0,0))
y=10
for n in d['names']:
  dr.rectangle([10,y,26,y+14],fill=COL[n]); dr.text((32,y),n,font=f2,fill=(255,255,255),stroke_width=2,stroke_fill=(0,0,0)); y+=18
dr.text((10,y+4),'□ church   ● fountain',font=f2,fill=(255,255,255),stroke_width=2,stroke_fill=(0,0,0))
img.save('/workspace/gta-paris-1880/shots/zoning/00_zone_overview.png'); print(img.size)
