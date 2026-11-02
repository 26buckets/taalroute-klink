import json,hashlib,subprocess,runpy,re,shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parent;REPO=ROOT.parent.parent/'work/klink10-20261102';STAGE=ROOT/'staging/listening';DOC=REPO/'docs/klink10-listening-20261102';BASE='bf3980e588ad23606839d192a5fb441ea3eb4fb8'
sha=lambda b:hashlib.sha256(b).hexdigest()
def save(p,d):p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
normalize=runpy.run_path(str(ROOT/'listening-audio-normalization.py'))['normalize']
plans=[json.loads((DOC/n).read_text())for n in ['voice-plan.json','voice-plan-words.json']];repairs=json.loads((DOC/'repair-map.json').read_text());selected=[repairs.get(c['id'],{}).get('replacement',c)for p in plans for c in p['clips']]
asr=[c for p in DOC.glob('audio-transcription*.json')for c in json.loads(p.read_text())['clips']];accepted={c['id'] for c in asr if normalize(c['expected'])==normalize(c['recognized'])}
exceptions=json.loads((DOC/'phonetic-review.json').read_text()) if (DOC/'phonetic-review.json').exists() else []
accepted.update(c['id']for c in exceptions if c['technicalAccepted'] and not c['humanListeningPerformed'])
assert all(c['id'] in accepted for c in selected),[(c['id'],c['text'])for c in selected if c['id']not in accepted]
folder=REPO/'public/package-audio/klink10-listening-20261102';folder.mkdir(parents=True,exist_ok=True);record_files=DOC/'recording-files';record_files.mkdir(exist_ok=True)
bindings={};bundle_manifest=[];new_audio={};batch=[];body=b''
def flush():
 global batch,body
 if not batch:return
 src='/package-audio/klink10-listening-20261102/audio-'+sha(body)[:16]+'.bin';path=REPO/('public'+src)
 if path.exists():assert path.read_bytes()==body
 else:path.write_bytes(body)
 bundle_manifest.append({'src':src,'sha256':sha(body),'bytes':len(body),'recordings':len(batch)})
 for c,offset,length,record in batch:
  binding={'src':src,'offset':offset,'length':length};key=src+f'#bytes={offset},{length}';bindings[c['id']]={'audioId':c['id'],'src':key};new_audio[key]={'id':c['id'],'text':c['text'],'sha256':record['sha256'],'voiceId':c['voiceId'],'source':binding,'metadata':record['metadata'],'duration':record['duration'],'audioPacketsUnchanged':record['audioPacketsUnchanged'],'fullDecodeVerified':record['fullDecodeVerified'],'transcriptionAccepted':True,'humanListening':False,'recordingProof':str((DOC/'recordings'/(c['id']+'.json')).relative_to(REPO))}
 batch=[];body=b''
for c in sorted(selected,key=lambda c:c['id']):
 r=json.loads((DOC/'recordings'/(c['id']+'.json')).read_text());assert r['status']=='generated-and-verified' and r['text']==c['text'] and r['metadataVerified'] and r['fullDecodeVerified'];p=REPO/('public'+c['src']);p=p if p.exists() else record_files/p.name;b=p.read_bytes();assert sha(b)==r['sha256'];assert b.startswith(b'ID3') and len(b)<=524288
 if len(body)+len(b)>3*1024*1024:flush()
 batch.append((c,len(body),len(b),r));body+=b
flush()
for old,r in repairs.items():bindings[old]=bindings[r['replacement']['id']]
reused=json.loads((DOC/'audio-reused.json').read_text());reused_audio={}
for r in reused:
 src=r['src'];path,_,fragment=src.partition('#bytes=');b=(REPO/('public'+path)).read_bytes()
 if fragment:offset,length=map(int,fragment.split(','));b=b[offset:offset+length]
 assert sha(b)==r['sha256'];bindings[r['id']]={'audioId':r['id'],'src':src};reused_audio[src]=r
def replace(value):
 if isinstance(value,list):return [replace(x)for x in value]
 if isinstance(value,dict):
  if 'audioId'in value:assert value['audioId']in bindings;return bindings[value['audioId']]
  return {k:replace(v)for k,v in value.items()}
 return value
rounds=json.loads((STAGE/'rounds.json').read_text());ids={r['id']for r in rounds};old_index=json.loads(subprocess.check_output(['git','show',BASE+':data/klink-production-index.json'],cwd=REPO));current=json.loads((REPO/'data/klink-production-index.json').read_text());assert [r for r in current if r['id']not in ids]==old_index
dest=REPO/'public/practice-content/klink10-listening-20261102';dest.mkdir(parents=True,exist_ok=True);rows=[];seen=set()
for r in rounds:
 bank=replace(json.loads((STAGE/r['stagedFile']).read_text()))
 for e in bank['exercises']:
  assert e['exerciseId']not in seen;seen.add(e['exerciseId']);e['sourceDoc']='https://drive.google.com/file/d/1JG-ZM3tVhQtEWu9_LlaX7PiKzkyh8HDG';e['sourceDocumentId']='1JG-ZM3tVhQtEWu9_LlaX7PiKzkyh8HDG'
 data=(json.dumps(bank,ensure_ascii=False,indent=2)+'\n').encode();name=r['id']+'-'+sha(data)[:16]+'.json';path=dest/name
 if path.exists():assert path.read_bytes()==data
 else:path.write_bytes(data)
 row={k:v for k,v in r.items()if k!='stagedFile'};row['url']='/practice-content/klink10-listening-20261102/'+name;rows.append({'row':row,'sha256':sha(data)})
assert len(seen)==120;save(REPO/'data/klink-production-index.json',old_index+[x['row']for x in rows])
pool=json.loads((REPO/'data/klink-word-listening-audio.json').read_text());old_pool=json.loads(subprocess.check_output(['git','show',BASE+':data/klink-word-listening-audio.json'],cwd=REPO));assert all(pool[k]==v for k,v in old_pool.items());word_models=[]
for old in plans[1]['clips']:
 c=repairs.get(old['id'],{}).get('replacement',old);key=bindings[c['id']]['src'];r=new_audio[key];word=old['word'];assert word not in old_pool
 pool[word]={'transcript':word,'role':'target','voiceId':c['voiceId'],'sha256':r['sha256'],'metadataApproved':True,'technicalApproved':True,'humanPronunciationReview':'not performed; explicit owner publication instruction','proof':r['recordingProof'],'source':r['source']};word_models.append(word)
save(REPO/'data/klink-word-listening-audio.json',pool)
instruction_path=REPO/'data/klink-production-instructions.json';old_instructions=json.loads(subprocess.check_output(['git','show',BASE+':data/klink-production-instructions.json'],cwd=REPO));instructions=old_instructions[:]
for old in plans[0]['clips']:
 if old['text'] not in ['Luister goed. Kies het beste antwoord.','Luister naar de ander. Welke reactie past?']:continue
 c=repairs.get(old['id'],{}).get('replacement',old);key=bindings[c['id']]['src'];r=new_audio[key];assert c['voiceId']=='h6uBOiAjLKklte8hdYio'
 instructions.append({'src':key,'text':c['text'],'voiceId':c['voiceId'],'sha256':r['sha256']})
assert len(instructions)==len(old_instructions)+2
save(instruction_path,instructions)

for p in folder.glob('*.mp3'):
 target=record_files/p.name
 if target.exists():assert target.read_bytes()==p.read_bytes();p.unlink()
 else:shutil.move(p,target)
selected_banks={x['row']['url'].split('/')[-1]for x in rows}
for p in dest.glob('*.json'):
 if p.name not in selected_banks:(DOC/'unselected').mkdir(exist_ok=True);shutil.move(p,DOC/'unselected'/p.name)
manifest={'baselineMain':BASE,'sourcePositions':120,'blockedSourcePositions':80,'newRows':rows,'newAudio':new_audio,'reusedAudio':reused_audio,'bundles':bundle_manifest,'newWordModels':word_models,'sourceArchiveId':'1JG-ZM3tVhQtEWu9_LlaX7PiKzkyh8HDG'};save(DOC/'import-manifest.json',manifest)
print(json.dumps({'tasks':120,'rounds':len(rows),'newAudio':len(new_audio),'reusedAudio':len(reused_audio),'bundles':len(bundle_manifest),'newWords':len(word_models)}))
