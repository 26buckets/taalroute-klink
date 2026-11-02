import json,hashlib,subprocess,re,tempfile,runpy
from pathlib import Path
T=Path(__file__).resolve().parent;R=T.parent.parent/'work/klink10-20261102';D=R/'docs/klink10-listening-20261102';m=json.load(open(D/'import-manifest.json'));sha=lambda b:hashlib.sha256(b).hexdigest();normal=runpy.run_path(str(T/'listening-audio-normalization.py'))['normalize'];asr=[c for p in D.glob('audio-transcription*.json')for c in json.load(open(p))['clips']];accepted={c['id']for c in asr if normal(c['expected'])==normal(c['recognized'])};exceptions={x['id']:x for x in json.load(open(D/'phonetic-review.json'))};checks=[]
with tempfile.TemporaryDirectory()as tmp:
 for category in ['newAudio','reusedAudio']:
  for src,record in m[category].items():
   path,_,fragment=src.partition('#bytes=');b=(R/('public'+path)).read_bytes()
   if fragment:offset,length=map(int,fragment.split(','));b=b[offset:offset+length]
   assert sha(b)==record['sha256'];file=Path(tmp)/'selected.mp3';file.write_bytes(b);probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(file)]));tags=probe['format']['tags'];assert tags.get('artist')==tags.get('album_artist')=='Taalroute';assert re.search(r'Taalroute|Klink',tags.get('album',''));assert not re.search(r'suno|elevenlabs|openai|generator',json.dumps(tags),re.I);duration=float(probe['format']['duration']);assert 0.15<duration<120;subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True)
   basis='unchanged-published-source'
   if category=='newAudio':
    assert record['id']in accepted or record['id']in exceptions;basis='unprompted-local-transcript-match' if record['id']in accepted else 'explicit-final-devoicing-orthographic-ambiguity'
   checks.append({'src':src,'sha256':record['sha256'],'metadata':tags,'seconds':duration,'fullDecode':True,'basis':basis})
(D/'selected-media-verification.json').write_text(json.dumps({'checks':checks,'humanListening':False,'physicalDeviceTested':False,'limits':'Automatic transcription is not human pronunciation review. Afmeldt has an explicit spelling-only final-devoicing ambiguity; tasje/douchekop are complete lossless extracts with exact contextual and isolated recognition.'},ensure_ascii=False,indent=2)+'\n');print(json.dumps({'checked':len(checks),'humanListening':False}))
