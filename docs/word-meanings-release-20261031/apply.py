import json,hashlib,pathlib,re,copy
D=pathlib.Path('docs/word-meanings-release-20261031')
def save(p,x,compact=False):pathlib.Path(p).write_text(json.dumps(x,ensure_ascii=False,**({'separators':(',',':')}if compact else{'indent':2}))+'\n')
def sha(b):return hashlib.sha256(b).hexdigest()
contexts=json.load(open('data/klink-meaning-contexts.json'));support=json.load(open('data/klink-b1-reading-support.json')); newwords=set(json.load(open(D/'new-extension-words.json')))
ledger=[];files=[]
meanings={w:s[0]['meaning']+' Voorbeeld: '+s[0]['example']for w,s in contexts.items()}
meanings['pak']='Twee betekenissen: een colbert met een bijpassende broek, of een verpakt geheel zoals een doos met spullen.'
wordids={}
def collect(o):
 if isinstance(o,dict):
  if isinstance(o.get('word'),str) and o.get('id'):wordids[o['id']]=o['word']
  for v in o.values():collect(v)
 elif isinstance(o,list):
  for v in o:collect(v)
for f in ['data/klink-curriculum.json','data/klink-lexicon-wordbuild-rest.json']:collect(json.load(open(f)))
def word(e):return e.get('word')or e.get('exampleWord')or e.get('helpWord')or (e.get('textBlocks')or [{}])[0].get('text')or wordids.get(e.get('wordId'))
def change(o,k,v,path,f):
 if o.get(k)!=v:ledger.append(dict(file=f,path=path+[k],before=o.get(k),after=v));o[k]=v

def walk(o,path,f):
 if isinstance(o,dict):
  w=word(o);level=o.get('contentLevel','');old=o.get('meaning');e=o.get('exerciseId')
  eligible=w in {'regent','zinnen','voorkomen'} or (w in {'pak','want'} and level in {'a1','a2','b1','alfa-c'})
  if eligible and (old is not None or e):change(o,'meaning',meanings[w],path,f)
  if e and w in {'regent','voorkomen'}:
   s=contexts[w][0]
   change(o,'audioContext',s['example'],path,f)
   if o.get('prompt',{}).get('audio'):change(o['prompt']['audio'],'src',s['audio'],path+['prompt','audio'],f)
   for i,b in enumerate(o.get('textBlocks',[])):
    if b.get('audio'):change(b['audio'],'src',s['audio'],path+['textBlocks',i,'audio'],f)
  if w in newwords and (old is not None or e):
   v=support['words'][w];change(o,'meaning',v['meaning']+' Voorbeeld: '+v['example'],path,f)
  if e=='TYP-B1-1454':
   keep={k:v for k,v in o.items()if k not in {'fields','exampleWord','helpWord','wordId'}}
   keep.update(componentId='ALF-CMP-002',mode='meaning-register',title='Dit is een grove vloek. In welke situatie past dit taalgebruik?',displayWord='godverdomme',requiresAudio=False,optionalGuided=True,options=[{'id':'polite','label':'In een beleefd gesprek met een onbekende.'},{'id':'recognition','label':'Je kunt het horen als iemand erg boos is. Het kan anderen kwetsen.'},{'id':'necessary','label':'Je moet dit woord zelf leren gebruiken.'}],answer={'correctOptionIds':['recognition']})
   keep.pop('instructionAudio',None)
   for k in list(o):
    if k not in keep:ledger.append(dict(file=f,path=path+[k],before=o[k],after=None,deleted=True));del o[k]
   for k,v in keep.items():change(o,k,v,path,f)
  for k,v in list(o.items()):
   if k not in {'meaning','audioContext'}:walk(v,path+[k],f)
 elif isinstance(o,list):
  for i,v in enumerate(o):walk(v,path+[i],f)
for f in ['data/klink-lexicon-wordbuild-rest.json']:
 old=pathlib.Path(f).read_bytes();data=json.loads(old);walk(data,[],f);save(f,data,True);files.append({'before':f,'after':f,'oldSha256':sha(old),'newSha256':sha(pathlib.Path(f).read_bytes())})
idx=json.load(open('data/klink-production-index.json'));aliases=json.load(open('data/klink-progress-image-aliases-20261030.json'));selections={};support['collections']={}
for row in idx:
 f='public'+row['url'];old=pathlib.Path(f).read_bytes();data=json.loads(old);start=len(ledger);walk(data,[],f)
 if len(ledger)>start:
  b=(json.dumps(data,ensure_ascii=False,separators=(',',':'))+'\n').encode();new=re.sub(r'-[a-f0-9]{16}\.json$', '-'+sha(b)[:16]+'.json',f);pathlib.Path(new).write_bytes(b)
  aliases[new[6:]]=aliases.get(row['url'],row['url']);row['url']=new[6:];files.append({'before':f,'after':new,'oldSha256':sha(old),'newSha256':sha(b)})
 es=data['exercises'];chosen=[e['exerciseId']for e in es if word(e) in support['words'] or word(e)=='godverdomme' or e.get('optionalGuided')]
 if chosen:
  entry={'allExerciseIds':[e['exerciseId']for e in es],'supportIds':chosen}
  if row['activity']=='read-series' and row['level']=='b1':support['collections'][row['id']]=entry
  else:selections[row['id']]=entry
save('data/klink-production-index.json',idx);save('data/klink-progress-image-aliases-20261030.json',aliases);save('data/klink-b1-reading-support.json',support);save('data/klink-guided-word-selections.json',selections)
media=json.load(open('data/klink-media.json'))
for id,w in [('B5R-e8279948dbb7','regent'),('TL1796','voorkomen')]:media[id]['audio']=contexts[w][0]['audio']
save('data/klink-media.json',media)
save(D/'changes.json',{'fields':ledger,'files':files,'originalExerciseIdsPreserved':True})
print({'fields':len(ledger),'files':len(files),'guidedReadingLists':len(support['collections']),'otherGuidedLists':len(selections)})
