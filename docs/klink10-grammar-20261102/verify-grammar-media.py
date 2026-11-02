import hashlib
import json
import re
import subprocess
import unicodedata
from pathlib import Path

ROOT=Path(__file__).resolve().parent
REPO=ROOT.parent.parent/'work/klink10-20261102'
DIR=REPO/'docs/klink10-grammar-20261102'
sha=lambda b:hashlib.sha256(b).hexdigest()
normal=lambda s:' '.join(re.findall(r'\w+',unicodedata.normalize('NFD',s.lower()).encode('ascii','ignore').decode().replace('acht','8').replace('negen','9')))
manifest=json.loads((DIR/'import-manifest.json').read_text())
assembled={c['src']:c for c in json.loads((DIR/'assembled-audio.json').read_text())}
transcripts={}
for name in ['audio-transcription.json','audio-transcription-second.json','audio-transcription-repair.json','audio-transcription-extra.json']:
    for c in json.loads((DIR/name).read_text())['clips']:
        transcripts.setdefault(c['src'],[]).append(c)
checks=[]
for category in ['newAudio','reusedAudio']:
    for src,expected_hash in manifest[category].items():
        file=REPO/('public'+src)
        assert sha(file.read_bytes())==expected_hash,src
        probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(file)]))
        tags=probe['format'].get('tags',{})
        assert tags.get('artist')=='Taalroute', (src,tags)
        assert re.search(r'Taalroute|Klink',tags.get('album','')), (src,tags)
        assert tags.get('album_artist')=='Taalroute', (src,tags)
        assert not re.search(r'suno|elevenlabs|openai|generator',json.dumps(tags),re.I),src
        duration=float(probe['format']['duration']);assert 0.15<duration<60,src
        subprocess.run(['ffmpeg','-v','error','-i',str(file),'-f','null','-'],check=True)
        basis='unchanged-published-word-model'
        if category=='newAudio':
            if src in assembled:
                c=assembled[src]
                assert c['wordSequence']==re.findall(r'\w+',c['text'].lower())
                assert [p['word']for p in c['parts']]==c['wordSequence']
                assert c['sha256']==expected_hash
                basis='exact-sequence-of-published-word-recordings'
            else:
                assert any(normal(c['expected'])==normal(c['recognized'])for c in transcripts.get(src,[])),(src,transcripts.get(src))
                basis='unprompted-local-transcript-match'
        checks.append({'src':src,'sha256':expected_hash,'metadata':tags,'seconds':duration,'fullDecode':True,'basis':basis})
(DIR/'selected-media-verification.json').write_text(json.dumps({'checks':checks,'humanListening':False,'physicalDeviceTested':False,'limits':'Automatic transcription is not a human pronunciation review. Sixteen uncertain sentence/phrase candidates use existing isolated word models with deliberate pauses.'},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'checked':len(checks),'new':len(manifest['newAudio']),'reused':len(manifest['reusedAudio']),'metadataAndDecodePassed':True,'humanListening':False}))
