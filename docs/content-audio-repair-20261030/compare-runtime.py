import json
from pathlib import Path
before=json.load(open('/tmp/klink-repair-before.json'));after=json.load(open('/tmp/klink-audio-repair-after.json'));bm={(x['chapter'],x['activity'],x['id']):x for x in before};am={(x['chapter'],x['activity'],x['id']):x for x in after};assert bm.keys()==am.keys()
clips=json.load(open('docs/content-audio-repair-20261030/audio.json'));media={x['originalSrc']:x['src'] for x in clips};media['/package-audio/connected/96ab5d3085d88e4949d6.wav']=media['/package-audio/dialogue-repair/klink-dialogue-579b29dc10de977f-3.mp3']
def assets(x):
 if isinstance(x,dict):return [v for k,v in x.items() if k in ['src','audio','image'] and isinstance(v,str)]+sum([assets(v) for k,v in x.items() if not(k in ['src','audio','image'] and isinstance(v,str))],[])
 if isinstance(x,list):return sum([assets(v) for v in x],[])
 return []
changed=set();removed=[];added=[];occ=0
for key,new in am.items():
 old=bm[key];be={e['exerciseId']:e for e in old['exercises']};ae={e['exerciseId']:e for e in new['exercises']}
 removed.extend([[key,id] for id in be.keys()-ae.keys()]);added.extend([[key,id] for id in ae.keys()-be.keys()])
 for id in be.keys()&ae.keys():
  if be[id]!=ae[id]:
   changed.add(id);occ+=1;assert sorted(media.get(s,s) for s in assets(be[id]))==sorted(assets(ae[id])),id
assert not removed;assert len(added)==4 and all('find-sentence' in x[1] for x in added)
r=dict(collections=len(after),beforePlacements=sum(len(x['exercises']) for x in before),afterPlacements=sum(len(x['exercises']) for x in after),changedExerciseIds=len(changed),changedPlacements=occ,added=added,removed=removed,affectedIds=sorted(changed),originalMediaPreserved=True)
Path('docs/content-audio-repair-20261030/preservation.json').write_text(json.dumps(r,ensure_ascii=False,indent=2)+'\n');print({k:v for k,v in r.items() if k not in ['affectedIds','added']})
