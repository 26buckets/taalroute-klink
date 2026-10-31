import pathlib,json,zipfile,hashlib,subprocess,sys
D=pathlib.Path('docs/word-coverage-release-20261031');r=json.load(open('docs/klink-owner-release-word-coverage-20261031.json'));files=set(r['changedFiles'])|{'docs/klink-owner-release-word-coverage-20261031.json','VORMGEVING-VASTGEZET.md','PUBLICATIE-ACTUEEL.md','docs/appearance-floor-20261031/floor.json','docs/word-library-menu-20261031/appearance-approval.json'}
files.update(str(p)for p in D.rglob('*')if p.is_file()and p.suffix not in ['.zip']and p.name not in ['final-backup.json'])
files.update('public'+a['src']for a in json.load(open(D/'audio-check.json')))
out=pathlib.Path('/Users/nicoknoester/Documents/Codex/2026-10-30/wat-ik-zo-bijzonder-vind-is/outputs/klink-woorden-aanvulling-20261031');out.mkdir(exist_ok=True,parents=True);z=out/'Klink-woorden-aanvulling-herstel.zip';manifest={}
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED)as arc:
 for f in sorted(files):
  data=pathlib.Path(f).read_bytes();arc.writestr(f,data);manifest[f]=hashlib.sha256(data).hexdigest()
 for f in r['changedFiles']:
  p=subprocess.run(['git','show',r['baselineSourceCommit']+':'+f],stdout=subprocess.PIPE,stderr=subprocess.DEVNULL)
  if p.returncode==0:arc.writestr('before/'+f,p.stdout);manifest['before/'+f]=hashlib.sha256(p.stdout).hexdigest()
 arc.writestr('manifest.json',json.dumps(manifest,indent=2))
with zipfile.ZipFile(z)as arc:
 assert arc.testzip()is None
 for f,h in manifest.items():assert hashlib.sha256(arc.read(f)).hexdigest()==h,f
info={'path':str(z),'sha256':hashlib.sha256(z.read_bytes()).hexdigest(),'size':z.stat().st_size,'entries':len(manifest),'files':r['files']};(out/'archive-info.json').write_text(json.dumps(info,indent=2)+'\n');print(json.dumps({k:v for k,v in info.items()if k!='files'}))
