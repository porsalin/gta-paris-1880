import json,re,random
random.seed(1880)
spec=json.load(open('spec_missions.json'))
POI={'tertre':[24,8],'abbesses':[14,22],'ratmort':[36,24],'lapin':[46,4],'galette':[56,14],'chatnoir':[66,24],'bateau':[30,16],'sacrecoeur':[40,12],'moulinrouge':[80,25],
'garnier':[35,35],'cafepaix':[44,44],'boulevard':[60,41],'bourse':[50,33],'bank':[26,46],'elysee':[18,34],'louvre':[46,50],'salon':[64,46],
'halles':[80,36],'abattoir':[96,46],'chien':[86,44],'belleville':[104,32],'gare':[8,36],'railyard':[10,46],'ivry':[8,92],
'notredame':[55,61],'prefecture':[44,61],'hoteldieu':[66,61],'sorbonne':[46,80],'pantheon':[56,90],'procope':[36,74],'cellier':[66,96],'catacombs':[26,100],'boulmich':[50,72],'printers':[76,84]}
FAC={'apache':dict(name="Maza's Apaches",phone='chien',pool=['halles','abattoir','belleville','chien','moulinrouge','tertre','galette'],rival='velvet'),
'avant':dict(name="Henri's Avant-Garde",phone='bateau',pool=['tertre','abbesses','lapin','salon','louvre','ivry','sacrecoeur'],rival='velvet'),
'velvet':dict(name="Vaneau's Velvet Empire",phone='garnier',pool=['garnier','cafepaix','bourse','boulevard','elysee','salon'],rival='apache'),
'crimson':dict(name="Louise's Crimson Cell",phone='procope',pool=['sorbonne','pantheon','printers','cellier','bank','railyard','catacombs','boulmich'],rival='velvet')}
KW=[('garnier|opéra|opera|diva|loge|lustre|chandelier','garnier'),('halles|ventre|frigo','halles'),('notre-dame|cathedral','notredame'),('banque|bank|vault|coffres','bank'),
('élysée|elysee|president|présidence','elysee'),('louvre','louvre'),('salon|jury|exhibition','salon'),('train|rail|gare|goods','railyard'),('égout|sewer|catacomb','catacombs'),
('panthéon|pantheon','pantheon'),('sorbonne|student','sorbonne'),('abattoir|slaughter','abattoir'),('lapin','lapin'),('galette|moulin','galette'),('tertre','tertre'),('abbesses','abbesses'),
('ivry|chemical|factory|fabrique','ivry'),('préfecture|prefecture|archive','prefecture'),('belleville','belleville'),('cellar|cellier','cellier'),('press|printing','printers'),('rat mort','ratmort'),('boulevard','boulevard')]
VEH=[('omnibus','omnibus'),('tram','tram'),('barouche|armou?red','barouche'),('phaeton|fast','phaeton'),('gig|cart|wagon|fourgon','gig'),('brougham|carriage|fiacre|coach','brougham')]
VERBS=[('steal','steal|hijack|take the .*(carriage|wagon|tram)|hotwire'),('smash','smash|wreck the|break the (tables|counter)'),('kill','kill|defeat|knock out|eliminate|assassinat|fight|beat|shoot'),
('destroy','destroy|burn|blow|dynamit|set fire|torch|sabotage'),('escort','escort|kidnap|protect|smuggle .* out|passenger|deliver the (diva|singer)'),('collect','collect|gather|pick up|recover|steal \\d|grab|loot'),
('race','race|chase|intercept|pursue|catch'),('hold','defend|hold|survive the|guard'),('deliver','deliver|drive (it|the)|bring|return|take (it|them) to|transport')]
def loc_for(t,fac,i,used):
  for k,p in KW:
    if re.search(k,t) and p not in used: return p
  pool=[p for p in FAC[fac]['pool'] if p not in used] or FAC[fac]['pool']
  return pool[i%len(pool)]
def vtype(t):
  for k,v in VEH:
    if re.search(k,t): return v
  return random.choice(['brougham','phaeton','gig'])
def fac_of(n):
  return 'apache' if n<=15 else 'avant' if n<=30 else 'velvet' if n<=45 else 'crimson'
out=[]
for m in spec:
  n=m['n'];t=(m.get('obj','')+' '+m['title']).lower()
  if n<=60: fac=fac_of(n)
  else: fac={61:'apache',62:'crimson',63:'apache',64:'avant',65:'velvet',66:'crimson'}[n]
  found=[]
  for name,rx in VERBS:
    mm=re.search(rx,t)
    if mm: found.append((mm.start(),name))
  found=[x[1] for x in sorted(found)]
  seen=[];[seen.append(f) for f in found if f not in seen]
  seen=seen[:3]
  if len(seen)<2: seen=(seen+['goto','kill'])[:2] if 'kill' not in seen else seen+['goto']
  armed=bool(re.search('gun|revolver|shoot|guard|soldier|security|police|mercenar|rifle|army|gendarme',t))
  steps=[];used=[];i=n
  fin=n%5==0 or n>60
  for s in seen:
    at=loc_for(t,fac,i,used);used.append(at);i+=1
    if s=='steal':
      v=vtype(t);steps.append(dict(t='steal',vtype=v,at=at,text=f'Steal a {v}.'))
      if v=='tram': steps.append(dict(t='survive',lvl=1,time=20,text='Ride the stolen tram and survive!'))
    elif s=='smash': steps.append(dict(t='smash',at=at,n=4+n%4,text='Smash the furniture!'))
    elif s=='kill': steps.append(dict(t='kill',at=at,n=3+n%4,armed=armed or fin,boss=fin,text='Take them out!'))
    elif s=='destroy':
      if re.search('wagon|carriage|fourgon|tram|coach',t): steps.append(dict(t='destroy',what='vehicle',vtype=vtype(t) if vtype(t)!='tram' else 'gig',n=1+n%3,at=at,text='Destroy the vehicles!'))
      else: steps.append(dict(t='destroy',what='prop',n=2+n%3,at=at,text='Destroy the crates!'))
    elif s=='escort': steps.append(dict(t='escort',at=at,to=loc_for('',fac,i+2,used+[at]),time=90 if fin else 0,text='Pick up the passenger.'))
    elif s=='collect': steps.append(dict(t='collect',at=at,n=3+n%3,text='Collect the goods.'))
    elif s=='race':
      cps=[loc_for('',fac,i+k,used) for k in range(3)];steps.append(dict(t='race',cps=cps,time=70,text='Catch them — hit the checkpoints!'))
    elif s=='hold': steps.append(dict(t='hold',at=at,time=25,armed=armed,text='Hold the position!'))
    elif s=='deliver':
      if not any(x['t'] in('steal','escort') for x in steps): steps.append(dict(t='steal',vtype=vtype(t),at=at,text='Get a carriage.'))
      d=loc_for('',fac,i+1,used);used.append(d);steps.append(dict(t='deliver',at=d,time=80 if fin else 0,text='Deliver it!'))
    elif s=='goto': steps.append(dict(t='goto',at=at,text='Go to the marked spot.'))
  if fin: steps.append(dict(t='survive',lvl=2 if n<40 else 3,time=0,lose=True,text='Lose the police!'))
  steps.append(dict(t='goto',at=FAC[fac]['phone'],text='Report back.'))
  rw=int(re.sub(r'[^\d]','',(m.get('reward','') or '').split('F')[0])[:6] or 0) or 5000+n*500
  out.append(dict(id=f'm{n}',n=n,fac=fac,title=m['title'],en=m['en'],brief=re.sub(r'\*|✎','',m.get('obj',''))[:260],reward=min(rw,80000),respect=12 if fin else 8,steps=steps))
# side jobs
names=list(POI)
k=67
def add(fac,title,en,brief,steps,rw):
  global k; out.append(dict(id=f's{k}',n=k,fac=fac,title=title,en=en,brief=brief,reward=rw,respect=3,steps=steps)); k+=1
for r in range(10):
  cps=random.sample(names,4)
  add('side',f'Course des Fiacres #{r+1}','Carriage Race','Street race across Paris. Grab a fast carriage and hit every checkpoint before the clock runs out.',[dict(t='steal',vtype=random.choice(['phaeton','brougham','gig']),at=cps[0],text='Grab a racing carriage.'),dict(t='race',cps=cps[1:],time=110,text='Race! Hit the checkpoints.')],3000+r*600)
for r in range(10):
  a,b=random.sample(names,2)
  add('side',f'Le Fiacre de Minuit #{r+1}','Midnight Cab','A fare waits. Drive them across town, fast.',[dict(t='steal',vtype='brougham',at=a,text='Find a Brougham cab.'),dict(t='escort',at=a,to=b,time=100,text='Pick up the fare.')],2000+r*400)
W=['brick','swordcane','revolver','shotgun','winchester','dynamite','molotov','revolver']
for r in range(8):
  a=random.choice(names)
  add('side',f'Frénésie #{r+1}','Rampage',f'Rampage: take down 8 rival thugs with the {W[r]} before time runs out.',[dict(t='goto',at=a,foot=True,text='Go to the rampage spot.'),dict(t='kill',at=a,n=8,armed=False,give=W[r],time=60,text=f'RAMPAGE! {W[r]}!')],4000+r*500)
for r in range(8):
  a,b=random.sample(names,2);v=random.choice(['gig','barouche','omnibus','brougham'])
  add('side',f'Pneumatique Express #{r+1}','Express Delivery',f'Rush a {v} of contraband across the city.',[dict(t='steal',vtype=v,at=a,text=f'Steal the {v}.'),dict(t='deliver',at=b,time=75,text='Deliver it in time!')],3000+r*500)
for r in range(5):
  add('side',f'Chasse à l\'Homme #{r+1}','Manhunt',f'Stir up the Prefecture to {r%3+2} heads, then shake them off.',[dict(t='survive',lvl=r%3+2,time=30,text='Survive the manhunt!'),dict(t='survive',lvl=0,time=0,lose=True,text='Now lose them!')],5000+r*1500)
add('side','Minuit à l\'Horloge','La Coda','Final: confront the Prefect\'s chief inspector at the Gare Saint-Lazare clock.',[dict(t='goto',at='gare',text='Go to the Gare Saint-Lazare.'),dict(t='kill',at='gare',n=6,armed=True,boss=True,text='Kill the inspector and his men!'),dict(t='hold',at='gare',time=30,armed=True,text='Hold the clock tower!'),dict(t='survive',lvl=3,time=0,lose=True,text='Escape the city!')],100000)
for f,v in FAC.items(): v['phonePos']=POI[v['phone']]
open('missions.js','w').write('// generated by gen_missions.py from the spec\nexport const POI='+json.dumps(POI)+';\nexport const FACTIONS='+json.dumps(FAC,ensure_ascii=False)+';\nexport const MISSIONS='+json.dumps(out,ensure_ascii=False,indent=0)+';\n')
from collections import Counter
print(len(out),Counter(s['t'] for m in out for s in m['steps']))
