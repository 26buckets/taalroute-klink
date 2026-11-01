from pathlib import Path
import hashlib, json, sys
import mlx_whisper

repo = Path(__file__).resolve().parents[2]
folder = Path(__file__).resolve().parent
plans = [json.loads((folder / name).read_text()) for name in (sys.argv[1:] or ['voice-plan.json'])]
clips = [clip for plan in plans for clip in plan['clips']]
output = folder / 'transcripts'
output.mkdir(exist_ok=True)
for index, clip in enumerate(clips):
    audio = repo / ('public' + clip['src'])
    digest = hashlib.sha256(audio.read_bytes()).hexdigest()
    target = output / (clip['id'] + '.json')
    if target.exists():
        assert json.loads(target.read_text())['sha256'] == digest
        continue
    result = mlx_whisper.transcribe(str(audio), path_or_hf_repo='mlx-community/whisper-large-v3-turbo',
                                   language='nl', temperature=0, condition_on_previous_text=False,
                                   word_timestamps=True, verbose=None)
    record = {'id':clip['id'], 'sha256':digest, 'model':'whisper-large-v3-turbo',
              'expectedTextProvided':False, 'humanListeningReview':False, 'text':result['text'],
              'segments':[{k:v for k,v in segment.items() if k != 'tokens'} for segment in result['segments']]}
    target.write_text(json.dumps(record, ensure_ascii=False, indent=2) + '\n')
    print(f"{index + 1}/{len(clips)} {clip['id']}", flush=True)
