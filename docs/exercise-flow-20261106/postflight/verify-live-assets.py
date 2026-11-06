import json,re,subprocess,hashlib,base64,concurrent.futures
from pathlib import Path
folder=Path('docs/exercise-flow-20261106/postflight');checks=[];errors=[];retried=[]
sha=lambda b:hashlib.sha256(b).hexdigest()
def fetch(path):return subprocess.check_output(['curl','--max-time','20','-fsS','https://klink.taalroute.nl'+path],stderr=subprocess.PIPE)
def check_asset(path):
 expected=Path('dist/client'+path).read_bytes();actual=fetch(path);assert actual==expected,path
 return {'path':path,'bytes':len(actual),'sha256':sha(actual)}
try:
 paths=re.findall(r'^\+ (/\S+)$',(folder/'deploy.log').read_text(),re.M)
 assert len(paths)==21
 with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:checks.extend(pool.map(check_asset,paths))
 banks=json.loads(Path('docs/dictation-50-20261105/banks.json').read_text());assets=json.loads(Path('data/klink-grammar-aa-assets.json').read_text());total=0
 for row in banks:
  path=row['row']['url'];expected=base64.b64decode(assets[path.rsplit('/',1)[1]]['body'])
  try:actual=fetch(path)
  except subprocess.CalledProcessError as e:
   retried.append({'path':path,'exitCode':e.returncode,'error':e.stderr.decode()});actual=fetch(path)
  assert actual==expected,path
  bank=json.loads(actual);assert bank['id']==row['row']['id'];total+=len(bank['exercises']);checks.append({'path':path,'bytes':len(actual),'sha256':sha(actual),'exercises':len(bank['exercises'])})
 assert total==50
 before=json.loads(Path('docs/exercise-flow-20261106/publication/live-before.json').read_text());after=json.loads((folder/'release.json').read_text())
 for k in ['curriculumEdition','lexiconExportSha256','sectionsSha256','sectionPhotosSha256','contentSha256']:assert before[k]==after[k],k
 assert after['sourceCommit']=='3e1e49e914893039b234e20620d22b1a399abe9f' and after['sourceClean'] and after['branch']=='main'
 assert json.loads((folder/'worker.json').read_text())[-1]['versions']==[{'version_id':'38d89a3e-d994-4a15-893b-846697fdfe84','percentage':100}]
 for a,b in [('staging-before.json','staging.json'),('staging-worker-before.json','staging-worker.json')]:assert json.loads(Path('docs/exercise-flow-20261106/publication',a).read_text())==json.loads((folder/b).read_text())
 print('PASS: 21 published app files exact; 9 banks / 50 word questions exact; release/Worker confirmed; staging unchanged.')
except Exception as e:errors.append(str(e));raise
finally:(folder/'asset-checks.json').write_text(json.dumps({'checks':checks,'retried':retried,'errors':errors},indent=2)+'\n')
