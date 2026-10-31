import json,hashlib,re,collections,copy,subprocess
from pathlib import Path
p=Path(__file__).parent
assert subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()=='7f465f53dc13176e98217231ccfb900b84f879ca','Use the recorded baseline worktree for replay'
assert not subprocess.check_output(['git','diff','--name-only','--','data','public','lib']).strip(),'Source changed; review before replay'
manifest=json.loads((p/'fixes.json').read_text()); fixes=manifest['meanings']
# Legacy CP definitions are source notes, not currently served vocabulary. Keep them intact.
patches={(f['word'],f['before']):f['after'] for f in fixes}
extra=json.loads((p/'extra-lexicon.json').read_text())
for w,new in [('hoede','Bescherming of goed opletten; meestal in vaste verbindingen zoals ‘onder iemands hoede’ en ‘op je hoede’.'),('hoeverre','In de combinatie ‘in hoeverre’: hoeveel of tot welk punt iets zo is.')]:
 r=next(r for r in extra if r['word']==w);patches[(w,r['meaning'])]=new;fixes.append({'n':None,'word':w,'before':r['meaning'],'after':new,'reason':'Vaste verbinding helder en correct geformuleerd.'})
idx=json.load(open('data/klink-production-index.json')); aliases=json.load(open('data/klink-progress-image-aliases-20261030.json'))
ids={};audio={}; docs={};used=collections.Counter();ledger=[];filechanges=[]
for f in ['data/klink-curriculum.json','data/klink-lexicon-wordbuild-20.json','data/klink-lexicon-wordbuild-rest.json']:
 docs[f]=json.load(open(f))
 def words(v):
  if isinstance(v,dict):
   if isinstance(v.get('word'),str) and v.get('id'):ids[v['id']]=v['word']
   for child in v.values():words(child)
  elif isinstance(v,list):
   for child in v:words(child)
 words(docs[f])
for c in idx:
 f='public'+c['url']; docs[f]=json.load(open(f))
 for e in docs[f]['exercises']:
  if e['mode']=='read-series':
   w=' '.join(b['text'] for b in e['textBlocks']);ids[e['exerciseId']]=w
   ids[e['exerciseId'].removeprefix('read:')]=w
   for b in e['textBlocks']:audio[b['audio']['src']]=b['text'];ids[b['audio']['audioId']]=b['text']
# Only uniquely specified old glosses may be followed through nested image labels.
byold=collections.defaultdict(set)
for (w,old),new in patches.items():
 if old:byold[old].add(new)
unique={old:next(iter(new)) for old,new in byold.items() if len(new)==1}
def update(v,path,f,word=None,eid=None):
 if isinstance(v,dict):
  word=v.get('word') or v.get('exampleWord') or v.get('helpWord') or v.get('displayWord') or ids.get(v.get('id')) or ids.get(v.get('wordId')) or ids.get(v.get('exerciseId')) or word
  eid=v.get('exerciseId') or eid
  if v.get('textBlocks') and v.get('mode')=='read-series':word=' '.join(b['text'] for b in v['textBlocks'])
  if word=='u' and v.get('mode') in ('read-series','copy-word') and not v.get('meaning'):v['meaning']=''
  for k,old in list(v.items()):
   if k in ('meaning','altText') and isinstance(old,str):
    new=patches.get((word,old))
    # Unambiguous full gloss matches also cover labels without their word-ID nearby.
    if new is None:new=unique.get(old)
    if new is not None and new!=old:
     v[k]=new;ledger.append({'file':f,'path':path+[k],'exerciseId':eid,'word':word,'before':old,'after':new});used[(old,new)]+=1
   else:update(old,path+[k],f,word,eid)
 elif isinstance(v,list):
  for n,ch in enumerate(v):update(ch,path+[n],f,word,eid)
for f,d in docs.items():update(d,[],f)
for f in fixes:assert used[(f['before'],f['after'])]>0,f
for f,d in docs.items():
 changes=[x for x in ledger if x['file']==f]
 if not changes:continue
 oldbytes=Path(f).read_bytes(); newbytes=(json.dumps(d,ensure_ascii=False,separators=(',',':'))+'\n').encode()
 if f.startswith('public/practice-content/'):
  oldurl=f[len('public'):]; newurl=re.sub(r'-[a-f0-9]{16}\.json$', '-'+hashlib.sha256(newbytes).hexdigest()[:16]+'.json',oldurl);assert newurl!=oldurl
  Path('public'+newurl).write_bytes(newbytes)
  c=next(c for c in idx if c['url']==oldurl);c['url']=newurl
  aliases[newurl]=aliases.get(oldurl,oldurl)
  newfile='public'+newurl
 else:
  Path(f).write_text(json.dumps(d,ensure_ascii=False,**({'separators':(',',':')} if oldbytes.count(b'\n')<2 else {'indent':2}))+'\n');newfile=f
 filechanges.append({'before':f,'after':newfile,'oldSha256':hashlib.sha256(oldbytes).hexdigest(),'newSha256':hashlib.sha256(Path(newfile).read_bytes()).hexdigest(),'fields':len(changes)})
for f in fixes:assert used[(f['before'],f['after'])]>0,f
Path('data/klink-production-index.json').write_text(json.dumps(idx,ensure_ascii=False,indent=2)+'\n')
Path('data/klink-progress-image-aliases-20261030.json').write_text(json.dumps(aliases,ensure_ascii=False,indent=2)+'\n')
manifest['meanings']=fixes;manifest['legacyPackageProposalsNotApplied']=manifest.pop('packages')
(p/'fixes.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(p/'changes.json').write_text(json.dumps({'files':filechanges,'fields':ledger},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'definitions':len(fixes),'files':len(filechanges),'fields':len(ledger),'exerciseIds':len({x['exerciseId'] for x in ledger if x['exerciseId']})}))
