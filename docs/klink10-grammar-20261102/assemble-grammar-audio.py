import hashlib
import json
import re
import subprocess
import tempfile
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parent.parent / 'work/klink10-20261102'
DIR = REPO / 'docs/klink10-grammar-20261102'
sha = lambda b: hashlib.sha256(b).hexdigest()
normal = lambda s: ' '.join(re.findall(r'\w+',unicodedata.normalize('NFD',s.lower()).encode('ascii','ignore').decode().replace('acht','8').replace('negen','9')))
word_bank = json.loads((REPO / 'data/klink-word-listening.json').read_text())
checked = json.loads((DIR / 'audio-transcription-repair.json').read_text())['clips']
plan = {c['id']:c for c in json.loads((DIR / 'voice-plan-repair.json').read_text())['clips']}
rows = [r for r in checked if normal(r['expected']) != normal(r['recognized']) and 'puntje' not in r['expected']]
records = []
for row in rows:
    clip = plan[row['id']]
    assert clip['role'] == 'model', clip['id']
    words = re.findall(r'\w+',clip['text'].lower())
    parts = []
    audio_parts = []
    with tempfile.TemporaryDirectory() as temporary:
        for index, word in enumerate(words):
            candidates = word_bank.get(word)
            assert candidates, word
            source = candidates[0]
            path = source if isinstance(source,str) else source['src']
            assert path.startswith('/package-audio/') and '/instructions/' not in path, path
            data = (REPO / ('public'+path)).read_bytes()
            if isinstance(source,dict):
                start, size = source['offset'], source['length']
                assert start >= 0 and size > 0 and start + size <= len(data)
                data = data[start:start+size]
            file = Path(temporary)/f'{index}.audio'
            file.write_bytes(data)
            # Published isolated word models preserve the deliberately incorrect inflection.
            pcm = subprocess.check_output(['ffmpeg','-v','error','-i',str(file),'-ar','44100','-ac','1','-f','s16le','-'])
            assert len(pcm)>1000 and len(pcm)%2==0
            parts.append({'word':word,'recording':source,'recordingSha256':sha(data),'pcmSha256':sha(pcm),'samples':len(pcm)//2})
            audio_parts.extend([pcm,bytes(10584)])
        pcm = b''.join(audio_parts[:-1])
        id = 'k10-units-'+sha(pcm)[:16]
        src = '/package-audio/klink10-grammar-20261102/'+id+'.mp3'
        output = REPO / ('public'+src)
        if not output.exists():
            subprocess.run(['ffmpeg','-v','error','-f','s16le','-ar','44100','-ac','1','-i','pipe:0','-c:a','libmp3lame','-b:a','128k','-map_metadata','-1','-metadata','artist=Taalroute','-metadata','album_artist=Taalroute','-metadata','publisher=Taalroute','-metadata','album=Klink - Taalroute','-metadata','title='+clip['text'],'-metadata','encoder=','-n',str(output)],input=pcm,check=True)
        probe = json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-of','json',str(output)]))
        for key in ['artist','album_artist','publisher']:assert probe['format']['tags'][key]=='Taalroute'
        assert probe['format']['tags']['title']==clip['text']
        records.append({'id':id,'src':src,'replacesCandidate':row['id'],'text':clip['text'],'method':'published-isolated-word-models-with-120ms-gaps','wordSequence':words,'parts':parts,'sourcePcmSha256':sha(pcm),'sha256':sha(output.read_bytes()),'duration':float(probe['format']['duration']),'metadata':probe['format']['tags'],'humanListening':False})
(DIR/'assembled-audio.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'assembled':len(records),'allWordSequencesExact':True,'newGenerativeRequests':0}))
