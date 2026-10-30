import json,pathlib,hashlib,subprocess
D=pathlib.Path('docs/cooking-release-20261030');L=pathlib.Path('docs/long-content-review-20261030')
def load(f):return json.loads(pathlib.Path(f).read_text())
def save(f,x):
 p=pathlib.Path(f); compact=p.exists() and p.read_text().count('\n')<5;p.write_text(json.dumps(x,ensure_ascii=False,**({'separators':(',',':')} if compact else {'indent':2}))+'\n')
clips=[load(D/(i+'.json')) for i in ['d128-2','d128-4']];save(D/'audio.json',clips)
bank=load('data/klink-connected-content.json');source=next(x for x in bank['items'] if x['id']==clips[0]['contentId']);repair=load('data/klink-dialogue-repair.json');dialogue=next(x for x in repair['dialogues'] if x['id']==source['id']);register=load('public/content-register/active.json')
for c in clips:
 b=next(x for x in source['blocks'] if x['id']==c['blockId']);t=next(x for x in dialogue['turns'] if x['id']==c['blockId']);assert t['src']==c['originalSrc'];b['text']=c['text'];b['speaker']='Ali';b['audio']['src']=c['src']
 for k in ['text','voiceId','speaker','personId','src','status','humanListeningReview','requestId','historyItemId','sha256','originalSha256','metadata','duration','metadataVerified','audioPacketsUnchanged']:t[k]=c[k]
 t.pop('characterCost',None);t['originalSrc']=c['src']
 row=next(x for x in register if x['id']==c['audioId']);row.update(text=c['text'],src=c['src'],voiceId=c['voiceId'],personId=c['personId'],originalSrc=c['src'],note='Spreker: Ali. Vaste stemkoppeling.',review='Goedgekeurde kookherstelkeuze; technische audiocontrole uitgevoerd, menselijke luisterreview open.')
source['text']=' '.join(b['text'] for b in source['blocks']);source['humanReview']='open';source['reading']['outsideWordBank'].remove('ook');dialogue['people']=['klink-persoon-sara','klink-persoon-ali']
routing=load('data/klink-content-routing.json');next(x for x in routing['items'] if x['id']==source['id'])['textHash']=hashlib.sha256(source['text'].encode()).hexdigest()
levels=load('data/klink-long-content-levels.json')
for r in levels['items']:
 if r['ref'] in ['T192','D128']:
  r['ownerReview']=False;r['editorialNote']='Door Nico goedgekeurd als één situatie: Sara koopt wortels in plaats van kool, Ali neemt de biet mee. Sara en Ali behouden hun vaste stemmen.';r['preparation']='Bespreek de boodschappenafspraak: Sara neemt wortels mee, Ali een biet. Luistersteun blijft beschikbaar.'
  if r['ref']=='D128':r['text']=source['text']
 if r['ref'] in ['T153','T179']:
  r['status']='reviewed';r['ownerReview']=False;r.pop('alternativeLevel',None);r['reason']='Nico bevestigt begeleid A2. '+r['reason'];r['editorialNote']+=' Nico kiest begeleid A2; onafhankelijke praktijktoetsing blijft open.'
  r['preparation']=('Bespreek vooraf eisen, bestemming, geldig en geldigheidsdatum. ' if r['ref']=='T153' else 'Bespreek vooraf inzamelpunt, accepteert, aan voorwaarden voldoen en een andere bestemming. ')+'Lees de tekst samen en gebruik de luistersteun; dit is geen toets van zelfstandig lezen.'
for f,x in [('data/klink-connected-content.json',bank),('data/klink-content-routing.json',routing),('data/klink-dialogue-repair.json',repair),('public/content-register/active.json',register),('data/klink-long-content-levels.json',levels)]:save(f,x)
decisions=load(L/'owner-review.json')
for x in decisions:
 x['status']='resolved-by-owner';x['unchanged']=x['id']!='kookpersonen';x['decision']='Eén situatie met Sara en Ali: Sara koopt wortels, Ali neemt de biet mee.' if x['id']=='kookpersonen' else 'Begeleid A2 met woordvoorbereiding en luistersteun.'
save(L/'owner-review.json',decisions)
# Extend the exact historical amendment proof; do not change the historical baseline.
m=load(L/'source-amendments.json');files=list(dict.fromkeys(c['path'][0] for c in m['changes']));changes=[]
def diff(a,b,path):
 if a==b:return
 if isinstance(a,dict) and isinstance(b,dict):
  for k in dict.fromkeys(list(a)+list(b)):
   if k not in a:changes.append({'path':path+[k],'added':True,'after':b[k]})
   elif k not in b:changes.append({'path':path+[k],'removed':True,'before':a[k]})
   else:diff(a[k],b[k],path+[k])
 elif isinstance(a,list) and isinstance(b,list) and len(a)==len(b):
  for i,(x,y) in enumerate(zip(a,b)):diff(x,y,path+[i])
 else:changes.append({'path':path,'before':a,'after':b})
for f in files:diff(json.loads(subprocess.check_output(['git','show',m['baseline']+':'+f])),load(f),[f])
m['changes']=changes;save(L/'source-amendments.json',m)
