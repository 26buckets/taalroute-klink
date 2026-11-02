import json,subprocess,wave,hashlib,runpy
from pathlib import Path
import mlx_whisper
ROOT=Path(__file__).resolve().parent;REPO=ROOT.parent.parent/'work/klink10-20261102';DIR=REPO/'docs/klink10-listening-20261102';normalize=runpy.run_path(str(ROOT/'listening-audio-normalization.py'))['normalize']
words={'tasje','douchekop','afmeldt','ordernummer'};clips=[c for file in ['voice-plan-words.json','voice-plan-repair3.json']for c in json.loads((DIR/file).read_text())['clips']if c['word']in words];out=DIR/'audio-transcription-short-words.json';result={'model':'mlx-community/whisper-large-v3-mlx','initialPrompt':None,'diagnostic':'Three byte-identical decoded copies separated by silence; the delivered recording is unchanged.','humanListening':False,'clips':[]}
folder=DIR/'diagnostics';folder.mkdir(exist_ok=True)
for c in clips:
 p=REPO/('public'+c['src']);pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','s16le','-ar','16000','-ac','1','-']);silence=bytes(16000);body=silence+silence.join([pcm]*3)+silence;wav=folder/(c['id']+'.wav')
 with wave.open(str(wav),'wb')as w:w.setnchannels(1);w.setsampwidth(2);w.setframerate(16000);w.writeframes(body)
 r=mlx_whisper.transcribe(str(wav),path_or_hf_repo=result['model'],language='nl',initial_prompt=None,condition_on_previous_text=False,temperature=0.0,verbose=False);expected=' '.join([c['text']]*3);row={'id':c['id'],'src':c['src'],'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),'expected':c['text'],'repeatedExpected':expected,'recognized':r['text'],'repeatedExact':normalize(expected)==normalize(r['text']),'segments':r['segments']};result['clips'].append(row);out.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps({k:row[k]for k in ['id','expected','recognized','repeatedExact']},ensure_ascii=False),flush=True)
