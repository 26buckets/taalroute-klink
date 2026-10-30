import json
from pathlib import Path
b=json.load(open('/tmp/klink-repair-before.json'));a=json.load(open('/tmp/klink-repair-after.json'));bm={(x['chapter'],x['activity'],x['id']):x for x in b};am={(x['chapter'],x['activity'],x['id']):x for x in a};assert bm.keys()==am.keys()
changed=set();removed=[];added=[];occ=0;mediaChanged=[];answerChanges=[]
def media(x):
 out=[]
 if isinstance(x,dict):
  for k,v in x.items():
   if k in ['src','audio','image'] and isinstance(v,str):out.append((k,v))
   else:out+=media(v)
 elif isinstance(x,list):
  for v in x:out+=media(v)
 return sorted(out)
for key,new in am.items():
 old=bm[key];be={e['exerciseId']:e for e in old['exercises']};ae={e['exerciseId']:e for e in new['exercises']}
 for id in be.keys()-ae.keys():removed.append([key,id])
 for id in ae.keys()-be.keys():added.append([key,id])
 for id in be.keys()&ae.keys():
  if be[id]!=ae[id]:
   changed.add(id);occ+=1
   if media(be[id])!=media(ae[id]):mediaChanged.append(id)
   if be[id].get('answer')!=ae[id].get('answer'):answerChanges.append(id)
assert not removed and not mediaChanged
assert len(added)==2 and all('find-sentence' in x[1] for x in added)
assert set(answerChanges)=={'groep-9:group:sentence-build:klink-sentence-f24117313d232d59'}
result={'collections':len(a),'beforePlacements':sum(len(x['exercises']) for x in b),'afterPlacements':sum(len(x['exercises']) for x in a),'changedExerciseIds':len(changed),'changedPlacements':occ,'added':added,'removed':removed,'mediaChanged':mediaChanged,'answerIdsChanged':answerChanges,'affectedIds':sorted(changed),'explanation':'Aanblijven wordt één woordtegel. Daardoor passen twee bestaande zinnen nu ook in de bestaande zinskeuzeronde; geen nieuwe bron of opname.'}
Path('docs/content-repair-20261030/runtime-preservation.json').write_text(json.dumps(result,ensure_ascii=False,indent=2));print({k:v for k,v in result.items() if k!='affectedIds'})
