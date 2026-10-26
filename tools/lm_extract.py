import osmium, json
from names import NAMES
want=set(NAMES.values()); out={}
class H(osmium.SimpleHandler):
  def area(self,a):
    nm=a.tags.get('name')
    if nm not in want: return
    try:
      for o in a.outer_rings():
        pts=[(n.lat,n.lon) for n in o]; la=sum(p[0] for p in pts)/len(pts)
        if not 48.82<la<48.9: continue
        inner=[[(n.lat,n.lon) for n in r] for r in a.inner_rings(o)]
        out.setdefault(nm,[]).append({'outer':pts,'inner':inner,'tags':dict(a.tags)})
    except Exception as e: pass
H().apply_file('/workspace/gta-paris-1880/osm/Paris.osm.pbf',locations=True,idx='flex_mem')
json.dump(out,open('sel.json','w')); print(len(out), sorted(want-set(out)))
