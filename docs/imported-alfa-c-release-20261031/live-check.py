from pathlib import Path
import json,urllib.request,hashlib,concurrent.futures,subprocess
R=Path('/private/tmp/klink-release-20261030');D=R/'docs/imported-alfa-c-release-20261031';O=D/'live';O.mkdir(exist_ok=True)
base='https://klink.taalroute.nl';get=lambda path:subprocess.check_output(['curl','-fsS','--retry','2','--max-time','60',base+path]);sha=lambda b:hashlib.sha256(b).hexdigest()
r=json.loads(get('/release.json'));expected=subprocess.check_output(['git','rev-parse','HEAD'],cwd=R).decode().strip();assert r['sourceCommit']==expected and r['sourceClean']and r['branch']=='main';(O/'release.json').write_text(json.dumps(r,indent=2))
prior=json.loads((D/'live-baseline.json').read_text())
for k in ['curriculumEdition','lexiconExportSha256','sectionsSha256','sectionPhotosSha256','contentSha256']:assert r[k]==prior[k],k
paths={c['src']:R/('public'+c['src'])for c in json.loads((D/'associated-audio.json').read_text())}
m=json.loads((R/'docs/drive-images-20261031/media.json').read_text())
for c in m['assets']+m['collections']:paths[c['url']]=R/('public'+c['url'])
for p in (R/'dist/client/_next').rglob('*'):
 if p.suffix in ['.js','.css']:paths['/'+str(p.relative_to(R/'dist/client'))]=p
paths['/content-register/active.json']=R/'public/content-register/active.json'
new={c['src']for c in json.loads((D/'audio.json').read_text())}
def check(item):
 path,local=item;b=get(path);h=sha(b);assert h==sha(local.read_bytes()),path;row={'path':path,'sha256':h,'bytes':len(b)}
 if path in new:
  f=O/Path(path).name;f.write_bytes(b);tags=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','format_tags','-of','json',str(f)]))['format']['tags']
  for k in ['artist','album_artist','publisher']:assert tags[k]=='Taalroute',(path,k)
  assert not any(w in json.dumps(tags).lower()for w in ['elevenlabs','suno','openai','generator']);row['taalrouteMetadataVerified']=True
 return row
with concurrent.futures.ThreadPoolExecutor(max_workers=6)as pool:rows=list(pool.map(check,paths.items()))
(O/'files.json').write_text(json.dumps({'sourceCommit':expected,'allByteIdentical':True,'metadataReadBack':5,'files':rows},indent=2));print('PASS',len(rows),'live files, 5 embedded audio metadata checks, release continuity')
