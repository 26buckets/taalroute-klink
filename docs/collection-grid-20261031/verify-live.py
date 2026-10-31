from pathlib import Path
import urllib.request,json,hashlib,concurrent.futures,subprocess
root=Path('/private/tmp/klink-release-20261030');d=root/'docs/collection-grid-20261031';sha=lambda b:hashlib.sha256(b).hexdigest()
commit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=root,text=True).strip()
def get(path):
 return subprocess.check_output(['curl','-fsS','--retry','2','--max-time','60','https://klink.taalroute.nl/'+path+'?grid='+commit])
release=json.loads(get('release.json'));assert release['sourceCommit']==commit;assert release['sourceClean'] is True
before=json.loads((d/'live-before.json').read_text());assert all(release[k]==before[k] for k in ['curriculumEdition','lexiconExportSha256','sectionsSha256','sectionPhotosSha256','contentSha256'])
files=[p for p in (root/'dist/client').rglob('*') if p.suffix in ['.js','.css']]
assert len(files)>20
def verify(p):
 path=str(p.relative_to(root/'dist/client'));b=get(path);assert sha(b)==sha(p.read_bytes()),path;return {'path':path,'sha256':sha(b),'bytes':len(b)}
with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:results=list(pool.map(verify,files))
(d/'live-assets.json').write_text(json.dumps({'release':release,'unchangedContentFingerprints':True,'verifiedFiles':results},indent=2)+'\n');print('Live source and',len(results),'runtime files verified; all content fingerprints unchanged')
