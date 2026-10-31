import json,subprocess,hashlib,collections,concurrent.futures
from pathlib import Path
p=Path(__file__).parent; change=json.loads((p/'changes.json').read_text());checks=[];audios=set();uniqueids=set()
def baseline(f):return json.loads(subprocess.check_output(['git','show','7f465f53dc13176e98217231ccfb900b84f879ca:'+f]))
def neutral(v):
 if isinstance(v,dict):return {k:neutral(x) for k,x in v.items() if k not in ('meaning','altText')}
 if isinstance(v,list):return [neutral(x) for x in v]
 return v
def audio(v):
 if isinstance(v,str) and v.startswith('/package-audio/') and v.endswith(('.mp3','.wav','.m4a','.ogg')):audios.add(v)
 elif isinstance(v,dict):
  for x in v.values():audio(x)
 elif isinstance(v,list):
  for x in v:audio(x)
for f in change['files']:
 old=baseline(f['before']);new=json.loads(Path(f['after']).read_text());assert neutral(old)==neutral(new),f
 assert hashlib.sha256(Path(f['after']).read_bytes()).hexdigest()==f['newSha256']
 if f['before'].startswith('public/'):
  assert hashlib.sha256(Path(f['before']).read_bytes()).hexdigest()==f['oldSha256']
  changedids={x['exerciseId'] for x in change['fields'] if x['file']==f['before']}
  for e in new['exercises']:
   if e['exerciseId'] in changedids:audio(e);uniqueids.add(e['exerciseId'])
 checks.append(f['after'])
newidx=json.load(open('data/klink-production-index.json'));oldidx=baseline('data/klink-production-index.json');assert len(oldidx)==len(newidx)
oldaliases=baseline('data/klink-progress-image-aliases-20261030.json');newaliases=json.load(open('data/klink-progress-image-aliases-20261030.json'))
for o,n in zip(oldidx,newidx):
 assert {k:v for k,v in o.items() if k!='url'}=={k:v for k,v in n.items() if k!='url'}
 assert oldaliases.get(o['url'],o['url'])==newaliases.get(n['url'],n['url'])
wordrounds=json.load(open('data/klink-word-round-index.json'));oldrounds=baseline('data/klink-word-round-index.json')
for o,n in zip(oldidx,newidx):
 if o['url'] in oldrounds:assert oldrounds[o['url']]==wordrounds[n['url']]
def probe(src):
 file='public'+src
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:format_tags','-of','json',file]))['format']
 assert float(info['duration'])>.05,src
 return {'src':src,'duration':float(info['duration']),'sha256':hashlib.sha256(Path(file).read_bytes()).hexdigest(),'tags':info.get('tags',{})}
with concurrent.futures.ThreadPoolExecutor(max_workers=8) as pool:media=list(pool.map(probe,sorted(audios)))
report={'changedFilesVerified':len(checks),'unchangedNonMeaningFields':True,'oldPublicFilesRetained':True,'collectionIdsCountsLevelsAndOrderPreserved':True,'roundsAndProgressKeysPreserved':True,'changedExerciseIds':len(uniqueids),'audioFilesInspected':len(media),'audioFiles':media,'humanListening':False,'levelReassignments':0}
(p/'verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print({k:v for k,v in report.items() if k!='audioFiles'})
