import concurrent.futures,hashlib,json,subprocess,tempfile
from pathlib import Path
rows=json.loads(Path('docs/dictation-50-20261105/media-50.json').read_text())
def check(row):
 b=subprocess.check_output(['curl','-fsS','--retry','2','--max-time','45',row['url']]);assert hashlib.sha256(b).hexdigest()==row['sha256']
 with tempfile.NamedTemporaryFile(suffix='.wav') as f:
  f.write(b);f.flush();info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format_tags','-of','json',f.name]));tags={k.lower():v for k,v in info['format']['tags'].items()}
  for key in ['artist','album_artist','publisher']:assert tags[key]=='Taalroute',(row['id'],key)
  assert 'taalroute' in tags['album'].lower() or 'klink' in tags['album'].lower()
  assert not any(x in json.dumps(tags).lower() for x in ['suno','elevenlabs','generator','openai'])
  subprocess.run(['ffmpeg','-v','error','-i',f.name,'-f','null','-'],check=True,capture_output=True)
 return dict(id=row['id'],sha256=row['sha256'],exactBytes=True,brandMetadata=True,fullDecode=True)
with concurrent.futures.ThreadPoolExecutor(max_workers=4) as p:checks=list(p.map(check,rows))
assert len(checks)==50
Path('docs/focus-audit-all-20261105/postflight/dictation-audio.json').write_text(json.dumps(checks,indent=2)+'\n');print('PASS all 50 live dictation recordings, exact bytes, Taalroute metadata and full decode')
