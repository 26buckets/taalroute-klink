import json
import re
from pathlib import Path
import mlx_whisper

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent / 'work/klink10-20261102'
DIR = REPO / 'docs/klink10-sentences-20261102'
MODEL = 'mlx-community/whisper-large-v3-turbo'
normalize = lambda s: ' '.join(re.findall(r"[\w]+", s.lower()))
clips = [{'id':'existing-alstublieft','src':'/package-audio/woorden-20261025/TL0082.mp3','text':'alstublieft'}, {'id':'existing-zdz-ac-002','src':'/package-audio/complete-20261101/zdz-ac-002.mp3','text':'Ik wil graag een brood, alstublieft.'}]
result_path = DIR / 'audio-transcription-existing-alstublieft.json'
result = json.loads(result_path.read_text()) if result_path.exists() else {'model':MODEL,'language':'nl','initialPrompt':None,'humanListening':False,'clips':[]}
done = {c['id'] for c in result['clips']}
for clip in clips:
    if clip['id'] in done:
        continue
    recognized = mlx_whisper.transcribe(str(REPO / ('public'+clip['src'])), path_or_hf_repo=MODEL, language='nl', initial_prompt=None, condition_on_previous_text=False, temperature=0.0, verbose=False)
    row = {'id':clip['id'],'src':clip['src'],'expected':clip['text'],'recognized':recognized['text'],'normalizedExact':normalize(clip['text'])==normalize(recognized['text']),'segments':recognized['segments']}
    result['clips'].append(row)
    result_path.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps({k:row[k]for k in ['id','normalizedExact','expected','recognized']},ensure_ascii=False),flush=True)
assert len(result['clips']) == len(clips)
print(json.dumps({'checked':len(clips),'exact':sum(c['normalizedExact']for c in result['clips']),'humanListening':False}))
