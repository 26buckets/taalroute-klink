from pathlib import Path
import json, hashlib, zipfile, subprocess
D=Path('docs/word-placeholder-20261031')
sha=lambda b:hashlib.sha256(b).hexdigest()
dump=lambda p,v:Path(p).write_text(json.dumps(v,indent=2,ensure_ascii=False)+'\n')
for name,needle in [('browser','PASS 78'),('continuity','PASS 12'),('saved','PASS 20'),('library','PASS 14'),('start','PASS 16'),('sections','PASS 15'),('rounds','PASS word round'),('build','Build complete')]:
 assert needle in (D/(name+'.log')).read_text(),name
for name in ['types','lint']:assert not (D/(name+'.log')).read_text(),name
assert 'chromium/390/alfa-a/activities: frame moved' in (D/'navigation.log').read_text()
assert 'chromium/390/alfa-a/activities: frame moved' in (D/'navigation-live-baseline.log').read_text()
review={k:True for k in ['wholeWords','faintLogo','imagesPreserved','savedWords','navigation','responsive','lightDark','unchangedScreens','types','lint','build','localOnly']}
review.update(scope='Shared Blinddruk for existing missing-word image slots, library, saved words, package words and failed known-word images. Intentionally imageless tasks, navigation icons and all actual media remain unchanged.',logoOpacity=0.035,longWordLogoOpacity=0.02,wholeWordsChecked=4694,media='No original public, lib, data or hooks files changed',reactReview='Direct shared component, no new dependencies or effects; scoped failure state, existing error callback retained; text accessible and decorative duplicate hidden.',baselineTestLimit='Historical Alfa C exact-frame test fails with the same mobile 12px difference on current live baseline and local. Navigation and preserved progress verified by word-round continuity, Start, sections and word-library tests.',notChecked=['Physical devices','New human image/audio review; media unchanged'])
dump(D/'review.json',review)
p=Path('docs/klink-owner-release-word-placeholder-20261031.json');r=json.loads(p.read_text());r['files']={f:sha(Path(f).read_bytes()) for f in r['changedFiles']}
evidence=['review.json','browser/checks.json','continuity/checks.json','browser.log','continuity.log','saved.log','library.log','start.log','sections.log','rounds.log','navigation.log','navigation-live-baseline.log','unit.log','types.log','lint.log','build.log']
r['evidence']={str(D/f):sha((D/f).read_bytes()) for f in evidence};dump(p,r)
a=Path(r['approval']);approval=json.loads(a.read_text());approval['files']={f:h for f,h in r['files'].items() if f.startswith(('app/','components/'))};dump(a,approval)
entries={}
for f in r['changedFiles']:
 entries[f]=Path(f).read_bytes()
 before=subprocess.run(['git','show',r['baselineSourceCommit']+':'+f],capture_output=True)
 if before.returncode==0:entries['before/'+f]=before.stdout
for f in D.rglob('*'):
 if f.is_file() and f.name not in ['backup.json','backup-pending.json','final-backup.json','publication.json','deploy.log']:entries[str(f)]=f.read_bytes()
for f in [str(p),r['approval'],'docs/appearance-floor-20261031/floor.json']:entries[f]=Path(f).read_bytes()
entries['media-preserved.json']=json.dumps(dict(noMediaChanged=True,previousVerifiedBackup=json.loads(Path('docs/start-compact-20261031/final-backup.json').read_text()),baseline=r['baselineSourceCommit']),indent=2).encode()
entries['manifest.json']=json.dumps({f:sha(b) for f,b in entries.items()},indent=2).encode()
out=Path('/Users/nicoknoester/Documents/Codex/2026-10-29/klink-beelden-sellerpic/outputs/KLINK-blinddruk-20261031');out.mkdir(exist_ok=True)
z=out/'Klink-Blinddruk-bronnen-en-controle.zip'
with zipfile.ZipFile(z,'w',zipfile.ZIP_DEFLATED) as archive:
 for f,b in entries.items():archive.writestr(f,b)
dump(D/'backup-pending.json',dict(path=str(z),sha256=sha(z.read_bytes()),size=z.stat().st_size,entries=len(entries),files=r['files']))
print(str(z),z.stat().st_size)
