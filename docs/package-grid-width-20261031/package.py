from pathlib import Path
import json,hashlib,zipfile,subprocess
D=Path('docs/package-grid-width-20261031');sha=lambda b:hashlib.sha256(b).hexdigest();dump=lambda p,v:Path(p).write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
assert len(json.loads((D/'comparison.json').read_text())['checks'])==16
assert 'PASS 15' in (D/'sections.log').read_text()
assert (D/'types.log').read_text()==''
assert (D/'lint-changed.log').read_text()==''
assert 'Build complete' in (D/'build.log').read_text()
review={k:True for k in ['fullWidth','responsive','lightDark','imagesPreserved','navigation','progress','types','lint','build','localOnly']}
review.update(runtimeChange='Only two CSS grid width declarations; original 15 cards, 302 lessons, media, aspect ratio, typography, controls, route/storage and columns preserved.',browser='11 responsive widths plus 16 Chromium/WebKit light/dark before/after comparisons',lintScope='Changed scripts pass. Full repository lint still reports existing findings in unchanged scripts/documents.',integration='All 15 package/302 lesson routes, guided sequence and exercise variants passed. Broad existing-player suite stops at stale first-page word assumption; confirmed on unchanged live baseline.',notChecked=['Physical classroom monitor','New human media review: no audio or image bytes changed'],styleReference='Canonical local path absent; read README and reference.png from existing Drive Mac-backup Stijlsheet/digibord-settings.')
dump(D/'review.json',review)
p=Path('docs/klink-owner-release-package-grid-20261031.json');r=json.loads(p.read_text());r['evidence']={str(D/f):sha((D/f).read_bytes()) for f in ['review.json','comparison.json','sections.log','baseline-test-limit.json','types.log','lint-changed.log','build.log']};dump(p,r)
base=r['baselineSourceCommit'];entries={}
for f in r['changedFiles']:entries[f]=Path(f).read_bytes();entries['before/'+f]=subprocess.run(['git','show',base+':'+f],capture_output=True).stdout
for f in D.rglob('*'):
 if f.is_file() and f.name not in ['backup.json','publication.json','final-backup.json']:entries[str(f)]=f.read_bytes()
for f in [str(p),r['approval'],'docs/appearance-floor-20261031/floor.json']:entries[f]=Path(f).read_bytes()
entries['media-preserved.json']=json.dumps({'noMediaChanged':True,'previousVerifiedBackup':'https://drive.google.com/file/d/1_TuVRMVz5JO3-HaL5P6VVRXl7dk0zmou/view','sha256':'8eab6c6d1dafe0da0e20bdf96468311ef5cd48e47b9c4dc47126405b0804dcfd','baseline':base},indent=2).encode()
manifest={f:sha(b) for f,b in entries.items()};entries['manifest.json']=json.dumps(manifest,indent=2).encode()
out=Path('/Users/nicoknoester/Documents/Codex/2026-10-30/wat-ik-zo-bijzonder-vind-is/outputs/klink-kaartbreedte-20261031');out.mkdir(exist_ok=True);z=out/'Klink-kaartbreedte-herstel.zip'
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as archive:
 for f,b in entries.items():archive.writestr(f,b)
dump(D/'backup-pending.json',dict(path=str(z),sha256=sha(z.read_bytes()),size=z.stat().st_size,entries=len(entries),files=r['files']))
print(str(z),z.stat().st_size)
