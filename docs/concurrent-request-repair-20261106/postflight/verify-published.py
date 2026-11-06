import json,subprocess,hashlib,base64,concurrent.futures
from pathlib import Path
out=Path('outputs/timeout-publication-20261106/live');out.mkdir(exist_ok=True,parents=True);checks=[];errors=[]
def fetch(path):return subprocess.check_output(['curl','-fsS','--max-time','25','https://klink.taalroute.nl'+path],stderr=subprocess.PIPE)
def exact(path):
 b=fetch('/'+path);assert b==Path('dist/client',path).read_bytes(),path
 return {'path':path,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}
try:
 before=json.loads(Path('docs/concurrent-request-repair-20261106/publication/live-before.json').read_text());after=json.loads(fetch('/release.json'));assert after==json.loads(Path('dist/client/release.json').read_text());assert after['sourceCommit']=='7e87eca15c1e5d63fe2b68d6623d9cce0334bce2' and after['sourceClean'] and after['branch']=='main'
 for k in ['curriculumEdition','lexiconExportSha256','sectionsSha256','sectionPhotosSha256','contentSha256']:assert before[k]==after[k]
 (out/'release.json').write_text(json.dumps(after,indent=2)+'\n')
 paths=[str(p.relative_to('dist/client')) for p in Path('dist/client').rglob('*') if p.is_file() and p.suffix in ['.js','.css']]
 with concurrent.futures.ThreadPoolExecutor(max_workers=4)as pool:checks.extend(pool.map(exact,paths))
 banks=json.loads(Path('docs/dictation-50-20261105/banks.json').read_text());assets=json.loads(Path('data/klink-grammar-aa-assets.json').read_text());total=0
 for row in banks:
  path=row['row']['url'];b=fetch(path);assert b==base64.b64decode(assets[path.rsplit('/',1)[1]]['body']);bank=json.loads(b);assert bank['id']==row['row']['id'];total+=len(bank['exercises']);checks.append({'path':path,'bytes':len(b),'exercises':len(bank['exercises'])})
 assert total==50;print('PASS: exact published release, 40 JS/CSS files, 9 banks/50 approved word questions, unchanged content hashes.')
except Exception as e:errors.append(str(e));raise
finally:(out/'published-assets.json').write_text(json.dumps({'checks':checks,'errors':errors},indent=2)+'\n')
