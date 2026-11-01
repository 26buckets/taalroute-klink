from pathlib import Path
import hashlib, json
import mlx_whisper

repo = Path(__file__).resolve().parents[2]
folder = Path(__file__).resolve().parent
comparison = json.loads((folder/'transcript-comparison.json').read_text())
plans = [json.loads((folder/f).read_text()) for f in ['voice-plan.json','voice-plan-b1.json','voice-plan-existing-sentences.json', 'voice-plan-reused-audio.json']]
clips = {c['id']:c for plan in plans for c in plan['clips']}
output=folder/'transcripts-second'
output.mkdir(exist_ok=True)
for index, row in enumerate(comparison['differences']):
    c=clips[row['id']]
    audio=repo/('public'+c['src'])
    digest=hashlib.sha256(audio.read_bytes()).hexdigest()
    target=output/(c['id']+'.json')
    if target.exists():
        assert json.loads(target.read_text())['sha256']==digest
        continue
    result=mlx_whisper.transcribe(str(audio),path_or_hf_repo='mlx-community/whisper-large-v3-mlx',
                                 language='nl',temperature=0,condition_on_previous_text=False,
                                 word_timestamps=True,verbose=None)
    record={'id':c['id'],'sha256':digest,'model':'whisper-large-v3','expectedTextProvided':False,
            'humanListeningReview':False,'text':result['text'],
            'segments':[{k:v for k,v in segment.items() if k!='tokens'} for segment in result['segments']]}
    target.write_text(json.dumps(record,ensure_ascii=False,indent=2)+'\n')
    print(f"{index+1}/{len(comparison['differences'])} {c['id']}",flush=True)
