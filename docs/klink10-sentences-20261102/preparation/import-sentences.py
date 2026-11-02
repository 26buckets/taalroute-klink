import json,hashlib,subprocess,re,shutil
from pathlib import Path
T=Path(__file__).resolve().parent;R=T.parent.parent/'work/klink10-20261102';D=R/'docs/klink10-sentences-20261102';S=T/'staging/sentences';BASE='eb6270430997e84ffbb3428d4f1fbdfe06e52546'
sha=lambda b:hashlib.sha256(b).hexdigest()
def save(p,v):p.write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n')
normal=lambda s:' '.join(re.findall(r'\w+',s.lower()))
rounds=json.load(open(S/'rounds.json'));blocked=[r for r in rounds if r['level']=='alfa-c'and r['activity']=='sentences'];rounds=[r for r in rounds if r not in blocked]
needed=set()
def collect(v):
 if isinstance(v,list):
  for x in v:collect(x)
 elif isinstance(v,dict):
  if 'audioId'in v:needed.add(v['audioId'])
  for x in v.values():collect(x)
for r in rounds:collect(json.load(open(S/r['stagedFile'])))
plan=json.load(open(D/'voice-plan.json'));repairs=json.load(open(D/'repair-map.json'))if(D/'repair-map.json').exists()else{};selected=[repairs.get(c['id'],{}).get('replacement',c)for c in plan['clips']if c['id']in needed]
asr=[c for p in D.glob('audio-transcription*.json')for c in json.load(open(p))['clips']];accepted={c['id']for c in asr if normal(c['expected'])==normal(c['recognized'])}
exceptions=json.load(open(D/'phonetic-review.json'))if(D/'phonetic-review.json').exists()else[];accepted.update(c['id']for c in exceptions if c['technicalAccepted']and not c['humanListeningPerformed'])
assert all(c['id']in accepted for c in selected),[(c['id'],c['text'])for c in selected if c['id']not in accepted]
folder=R/'public/package-audio/klink10-sentences-20261102';folder.mkdir(parents=True,exist_ok=True);private=D/'recording-files';private.mkdir(exist_ok=True)
body=b'';pending=[];bindings={};new_audio={};bundles=[]
def flush():
 global body,pending
 if not pending:return
 src='/package-audio/klink10-sentences-20261102/audio-'+sha(body)[:16]+'.bin';path=R/('public'+src)
 if path.exists():assert path.read_bytes()==body
 else:path.write_bytes(body)
 bundles.append({'src':src,'sha256':sha(body),'bytes':len(body),'recordings':len(pending)})
 for c,r,o,l in pending:
  key=src+f'#bytes={o},{l}';bindings[c['id']]={'audioId':c['id'],'src':key};new_audio[key]={'id':c['id'],'text':c['text'],'voiceId':c['voiceId'],'sha256':r['sha256'],'source':{'src':src,'offset':o,'length':l},'recordingProof':str((D/'recordings'/(c['id']+'.json')).relative_to(R))}
 body=b'';pending=[]
for c in sorted(selected,key=lambda c:c['id']):
 r=json.load(open(D/'recordings'/(c['id']+'.json')));assert r['metadataVerified']and r['fullDecodeVerified']and r['audioPacketsUnchanged'];p=R/('public'+c['src']);p=p if p.exists()else private/p.name;b=p.read_bytes();assert sha(b)==r['sha256']and b.startswith(b'ID3')and len(b)<=524288
 if len(body)+len(b)>3*1024*1024:flush()
 pending.append((c,r,len(body),len(b)));body+=b
flush()
for old,r in repairs.items():
 if old in needed:bindings[old]=bindings[r['replacement']['id']]
used=set()
def replace(v):
 if isinstance(v,list):return[replace(x)for x in v]
 if isinstance(v,dict):
  if 'audioId'in v:
   a=bindings.get(v['audioId'],v);used.add(a['src']);return a
  return{k:replace(x)for k,x in v.items()}
 return v
ids={r['id']for r in rounds};old=json.loads(subprocess.check_output(['git','show',BASE+':data/klink-production-index.json'],cwd=R));current=json.load(open(R/'data/klink-production-index.json'));assert[r for r in current if r['id']not in ids]==old
dest=R/'public/practice-content/klink10-sentences-20261102';dest.mkdir(parents=True,exist_ok=True);rows=[];instruction_sources=set()
for r in rounds:
 bank=replace(json.load(open(S/r['stagedFile'])));assert len(bank['exercises'])==10
 instruction_sources.update(e['instructionAudio']['src']for e in bank['exercises'])
 data=(json.dumps(bank,ensure_ascii=False,indent=2)+'\n').encode();name=r['id']+'-'+sha(data)[:16]+'.json';p=dest/name
 if p.exists():assert p.read_bytes()==data
 else:p.write_bytes(data)
 row={k:v for k,v in r.items()if k!='stagedFile'};row['url']='/practice-content/klink10-sentences-20261102/'+name;rows.append({'row':row,'sha256':sha(data)})
save(R/'data/klink-production-index.json',old+[x['row']for x in rows])
reused={r['src']:r for r in json.load(open(D/'audio-reused.json'))if r['src']in used};assert used==set(new_audio)|set(reused)
instructions=json.loads(subprocess.check_output(['git','show',BASE+':data/klink-production-instructions.json'],cwd=R));existing={i['src']for i in instructions};added=[]
for src in sorted(instruction_sources-existing):
 c=new_audio.get(src)or reused[src];added.append({'src':src,'text':c['text'],'voiceId':'h6uBOiAjLKklte8hdYio','sha256':c['sha256']})
save(R/'data/klink-production-instructions.json',instructions+added)
for p in folder.glob('*.mp3'):
 target=private/p.name
 if target.exists():assert target.read_bytes()==p.read_bytes();p.unlink()
 else:shutil.move(p,target)
current_names={x['row']['url'].split('/')[-1]for x in rows}
for p in dest.glob('*.json'):
 if p.name not in current_names:(D/'unselected').mkdir(exist_ok=True);shutil.move(p,D/'unselected'/p.name)
save(D/'blocked.json',[{'round':r,'sourcePositions':10,'blockingRecord':'SZ-ALFA-C-LLM-002','reason':'New instruction audio for alstublieft is recognized as alsjeblieft by two independent blind recognizers, also after a retake. Correct pronunciation not yet established; retain the complete ten-item round offline. Existing source sentence is unchanged and independently transcribed exactly.'}for r in blocked])
save(D/'import-manifest.json',{'baselineMain':BASE,'sourcePositions':220,'blockedSourcePositions':10,'newRows':rows,'newAudio':new_audio,'reusedAudio':reused,'bundles':bundles,'newInstructions':added,'newWordModels':[],'existingSpeakingTasksPreserved':True})
print(json.dumps({'positions':220,'blocked':10,'rounds':len(rows),'newAudio':len(new_audio),'reusedAudio':len(reused),'bundles':len(bundles),'newInstructions':len(added)}))
