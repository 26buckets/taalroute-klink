import json
import re
from pathlib import Path
import mlx_whisper

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent / 'work/klink10-20261102'
DIR = REPO / 'docs/klink10-listening-20261102'
MODEL = 'mlx-community/whisper-large-v3-mlx'
import runpy
normalize = runpy.run_path(str(ROOT/'listening-audio-normalization.py'))['normalize']
clips = json.loads((DIR / 'voice-plan-word-final.json').read_text())['clips']
result_path = DIR / 'audio-transcription-word-final.json'
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
