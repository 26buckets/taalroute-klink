import json,pathlib,subprocess,hashlib,re,difflib,time
import mlx_whisper
p=pathlib.Path('docs/content-repair-20261030'); rows=json.loads((p/'audio-scope.json').read_text())['files'];out=[]
model=str(next(pathlib.Path('/Users/nicoknoester/.cache/huggingface/hub/models--mlx-community--whisper-large-v3-turbo/snapshots').iterdir()))
def norm(s):return re.sub(r'[^a-z0-9]+',' ',s.lower()).strip().replace('hier naast','hiernaast').replace('aan blijven','aanblijven')
for i,row in enumerate(rows):
 f=pathlib.Path('public'+row['src']);probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration:format_tags:stream=codec_name','-of','json',str(f)]));tags=probe['format'].get('tags',{});lower={k.lower():v for k,v in tags.items()}
 result=mlx_whisper.transcribe(str(f),path_or_hf_repo=model,language='nl',condition_on_previous_text=False,temperature=0,verbose=None)
 text=result['text'].strip();ratio=difflib.SequenceMatcher(None,norm(row['text']),norm(text)).ratio()
 meta=all(lower.get(k)=='Taalroute' for k in ['artist','album_artist','publisher']) and lower.get('album','').startswith('Klink') and not re.search('suno|elevenlabs|openai|generator',json.dumps(tags),re.I)
 out.append({**row,'transcription':text,'similarity':round(ratio,4),'exactNormalized':norm(text)==norm(row['text']),'metadataPassed':meta,'tags':tags,'duration':float(probe['format']['duration']),'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'review':'automatic-transcription-not-human-listening'})
 (p/'audio-review.json').write_text(json.dumps(out,ensure_ascii=False,indent=2));print(f'{i+1}/{len(rows)} checked',flush=True)
