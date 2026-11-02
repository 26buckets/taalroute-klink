import hashlib
import json
import re
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent/'work/klink10-20261102'
DIR = REPO/'docs/klink10-grammar-20261102'
STAGE = ROOT/'staging/grammar'
sha = lambda b:hashlib.sha256(b).hexdigest()
save = lambda p,d:p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
repairs = json.loads((DIR/'repair-map.json').read_text())
assembled = {c['replacesCandidate']:c for c in json.loads((DIR/'assembled-audio.json').read_text())}
question = json.loads((DIR/'voice-plan-repair2.json').read_text())['clips'][0]
assert json.loads((DIR/'recordings'/f"{question['id']}.json").read_text())['status']=='generated-and-verified'
def replace_audio(value):
    if isinstance(value,list):
        return [replace_audio(v)for v in value]
    if isinstance(value,str):
        for term,phrase in [('hoewel-zin',"zin met ‘hoewel’"),('voordat-zin',"zin met ‘voordat’"),('dat-zin',"zin met ‘dat’")]:
            value=re.sub(r'(?<!\w)'+re.escape(term)+r'(?!\w)',phrase,value)
        return value
    if not isinstance(value,dict):
        return value
    if value.get('audioId') in repairs:
        clip=repairs[value['audioId']]
        clip=assembled.get(clip['id'],clip)
        return {'audioId':clip['id'],'src':clip['src']}
    return {k:replace_audio(v)for k,v in value.items()}

index_path=REPO/'data/klink-production-index.json'
index=json.loads(index_path.read_text())
manifest_path=DIR/'import-manifest.json'
prior=json.loads(manifest_path.read_text())if manifest_path.exists()else None
new_ids={r['id']for r in json.loads((STAGE/'rounds.json').read_text())}
if prior:
    old_rows={r['row']['id']:r['row']for r in prior['newRows']}
    assert all(row==old_rows[row['id']]for row in index if row['id']in new_ids)
else:
    assert not any(row['id']in new_ids for row in index)
base_rows=[row for row in index if row['id']not in new_ids]
asset_dir=REPO/'public/practice-content/klink10-grammar-20261102'
asset_dir.mkdir(parents=True,exist_ok=True)
manifest={'baselineMain':'5542367d083aa4658403459accee7401c6cc0324','sourcePositions':120,'blockedSourcePositions':40,'newRows':[],'newAudio':{},'reusedAudio':{},'humanReviewPerformed':False}
seen=set()
def audios(value):
    if isinstance(value,list):
        for v in value:yield from audios(v)
    elif isinstance(value,dict):
        if isinstance(value.get('src'),str) and value['src'].startswith('/package-audio/'):
            yield value['src']
        for v in value.values():yield from audios(v)
for row in json.loads((STAGE/'rounds.json').read_text()):
    bank=replace_audio(json.loads((STAGE/row['stagedFile']).read_text()))
    for exercise in bank['exercises']:
        assert exercise['exerciseId']not in seen
        seen.add(exercise['exerciseId'])
        if exercise['mode']=='verb-choice' and exercise['contentLevel'].startswith('alfa-'):
            exercise['questionAudio']={'audioId':question['id'],'src':question['src']}
        for src in audios(exercise):
            file=REPO/('public'+src)
            assert file.is_file(), src
            category='newAudio'if src.startswith('/package-audio/klink10-grammar-20261102/')else'reusedAudio'
            manifest[category][src]=sha(file.read_bytes())
    data=(json.dumps(bank,ensure_ascii=False,indent=2)+'\n').encode()
    digest=sha(data)
    name=bank['id']+'-'+digest[:16]+'.json'
    file=asset_dir/name
    if file.exists():assert file.read_bytes()==data
    else:file.write_bytes(data)
    runtime_row={k:v for k,v in row.items()if k!='stagedFile'}
    runtime_row['url']='/practice-content/klink10-grammar-20261102/'+name
    manifest['newRows'].append({'row':runtime_row,'sha256':digest})
assert len(seen)==120 and len(manifest['newRows'])==12
word_map_path=REPO/'data/klink-word-listening-audio.json'
word_map=json.loads(word_map_path.read_text())
manifest['newWordModels']=[]
for clip in json.loads((DIR/'voice-plan-repair3.json').read_text())['clips']:
    if '-zin' in clip['text']:
        continue
    proof=json.loads((DIR/'recordings'/f"{clip['id']}.json").read_text())
    assert proof['status']=='generated-and-verified'
    entry={'transcript':clip['text'],'role':'target','voiceId':clip['voiceId'],'sha256':proof['sha256'],'metadataApproved':True,'technicalApproved':True,'humanPronunciationReview':'not performed; owner standing approval','proof':'docs/klink10-grammar-20261102/recordings/'+clip['id']+'.json','source':clip['src']}
    key=clip['text'].lower()
    assert key not in word_map or word_map[key]==entry
    word_map[key]=entry
    manifest['newWordModels'].append(key)
    manifest['newAudio'][clip['src']]=proof['sha256']
save(word_map_path,word_map)
save(index_path,base_rows+[r['row']for r in manifest['newRows']])
save(manifest_path,manifest)
# Unselected new candidates are recovery material, never public assets.
private=DIR/'unselected';private.mkdir(exist_ok=True)
for p in (REPO/'public/package-audio/klink10-grammar-20261102').glob('*.mp3'):
    if '/package-audio/klink10-grammar-20261102/'+p.name not in manifest['newAudio']:
        destination=private/p.name
        assert not destination.exists()or destination.read_bytes()==p.read_bytes()
        shutil.move(str(p),str(destination))
selected_banks={Path(r['row']['url']).name for r in manifest['newRows']}
for p in asset_dir.glob('*.json'):
    if p.name not in selected_banks:
        destination=private/p.name
        assert not destination.exists()or destination.read_bytes()==p.read_bytes()
        shutil.move(str(p),str(destination))
print(json.dumps({'rounds':12,'tasks':120,'newAudio':len(manifest['newAudio']),'existingAudio':len(manifest['reusedAudio']),'oldRowsPreserved':len(base_rows)}))
