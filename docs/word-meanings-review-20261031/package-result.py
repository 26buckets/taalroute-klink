import json,subprocess,hashlib,zipfile
from pathlib import Path
p=Path(__file__).parent;root=Path.cwd();out=Path('/Users/nicoknoester/Documents/Codex/2026-10-30/wat-ik-zo-bijzonder-vind-is/outputs/klink-woordbetekenissen-20261031')
commit=subprocess.check_output(['git','rev-parse','HEAD']).decode().strip()
assert commit!='7f465f53dc13176e98217231ccfb900b84f879ca'
changes=json.loads((p/'changes.json').read_text());sources={x['after'] for x in changes['files']}
sources.update(['data/klink-production-index.json','data/klink-progress-image-aliases-20261030.json','data/klink-word-round-index.json','scripts/test-lexicon-wordbuild-rest.mjs'])
files={}
for f in sources:files['herstel/bron/'+f]=root/f
for f in p.iterdir():
 if f.is_file() and f.name not in ['dev-server.log','browser-failure.txt']:files['herstel/'+str(f)]=f
for f in out.rglob('*'):
 if f.is_file() and f.suffix not in ['.zip'] and f.name not in ['browser-failure.png','backup-verification.json']:files['resultaat/'+str(f.relative_to(out))]=f
for m in json.loads((p/'verification.json').read_text())['audioFiles']:files['herstel/bestaande-audio'+m['src']]=root/('public'+m['src'])
patch=out/'bronwijzigingen.patch';patch.write_bytes(subprocess.check_output(['git','diff','7f465f53dc13176e98217231ccfb900b84f879ca..'+commit,'--','data','public','scripts']))
files['herstel/bronwijzigingen.patch']=patch
manifest={'reviewCommit':commit,'baseCommit':'7f465f53dc13176e98217231ccfb900b84f879ca','published':False,'files':{name:{'bytes':file.stat().st_size,'sha256':hashlib.sha256(file.read_bytes()).hexdigest()} for name,file in sorted(files.items())}}
zipfile_path=out/'Klink-woordbetekenissen-resultaat-en-herstel-20261031.zip'
with zipfile.ZipFile(zipfile_path,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
 for name,file in files.items():z.write(file,name)
 z.writestr('MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'path':str(zipfile_path),'bytes':zipfile_path.stat().st_size,'sha256':hashlib.sha256(zipfile_path.read_bytes()).hexdigest(),'files':len(files),'commit':commit}))
