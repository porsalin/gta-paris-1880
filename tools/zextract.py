# extract land-use / amenity features for the zoning layer from the Paris pbf
import osmium, json
S,N_,W_,E_=48.827,48.898,2.265,2.41
LU={'industrial','railway','cemetery','commercial','retail','residential','allotments','vineyard','grass','recreation_ground'}
AM={'place_of_worship','marketplace','townhall','hospital','school','police','fire_station','library','theatre'}
out={'lu':[],'pt':[]}
class H(osmium.SimpleHandler):
  def area(self,a):
    t=a.tags; lu=t.get('landuse'); am=t.get('amenity'); mm=t.get('man_made'); ls=t.get('leisure')
    k=None
    if lu in LU: k='lu:'+lu
    elif am in AM: k='am:'+am
    elif mm in('gasometer','chimney','works'): k='mm:'+mm
    elif ls in('park','garden'): k='ls:'+ls
    elif t.get('building') in('church','cathedral','chapel','train_station'): k='b:'+t.get('building')
    if not k: return
    try:
      for o in a.outer_rings():
        pts=[(n.lat,n.lon) for n in o]
        la=sum(p[0] for p in pts)/len(pts); lo=sum(p[1] for p in pts)/len(pts)
        if not(S<la<N_ and W_<lo<E_): return
        out['lu'].append([k,t.get('name',''),t.get('religion',''),t.get('denomination',''),t.get('start_date',''),[ (round(p[0],6),round(p[1],6)) for p in pts]]); break
    except Exception: pass
  def node(self,n):
    t=n.tags; am=t.get('amenity'); mm=t.get('man_made')
    if am in('place_of_worship','marketplace','drinking_water','fountain') or mm in('chimney','gasometer') or t.get('historic') in('memorial','monument'):
      la,lo=n.location.lat,n.location.lon
      if S<la<N_ and W_<lo<E_: out['pt'].append([am or mm or t.get('historic'),t.get('name',''),t.get('religion',''),t.get('fountain',''),round(la,6),round(lo,6)])
H().apply_file('/workspace/gta-paris-1880/osm/Paris.osm.pbf',locations=True)
json.dump(out,open('/workspace/gta-zoning/tools/zosm.json','w'))
from collections import Counter
print(Counter(x[0] for x in out['lu']),Counter(x[0] for x in out['pt']))
