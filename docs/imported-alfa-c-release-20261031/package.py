from pathlib import Path
import json,hashlib,zipfile,subprocess
D=Path('docs/imported-alfa-c-release-20261031');O=Path('/Users/nicoknoester/Documents/Codex/2026-10-30/wat-ik-zo-bijzonder-vind-is/outputs/klink-leesreeksen-alfa-c-live-20261031')
base='bfef2c3d813e00d9dc5fc313c72c8f453e991a1e';files=json.loads((D/'allowed-files.json').read_text());sha=lambda b:hashlib.sha256(b).hexdigest()
req='Ja, volg je advies bij die drie twijfelgevallen. Pas de gekoppelde opdrachten en antwoorden aan, controleer de audio en zet de herstelversie daarna live. Geef mij weer een directe link naar het resultaat.'
evidence=['audio.json','audio-quality.json','source-amendments.json','owner-review.json','preservation.json','associated-audio.json']
auth={'approvedBy':'Nico','approvedAt':'2026-10-31','userRequest':req,'publicationApproved':True,'baselineSourceCommit':base,'liveSourceCommit':base,'changedFiles':files,'files':{f:sha(Path(f).read_bytes())for f in files},'evidence':{str(D/f):sha((D/f).read_bytes())for f in evidence},'humanListeningReview':'open','newRecordings':5,'existingAudioPreserved':True,'noCloudWorkflows':True}
Path('docs/klink-owner-release-imported-alfa-c-20261031.json').write_text(json.dumps(auth,ensure_ascii=False,indent=2)+'\n')
paths=set(files+['docs/klink-owner-release-imported-alfa-c-20261031.json']);paths.update(str(p)for p in D.rglob('*')if p.is_file()and p.suffix not in ['.png','.pdf']and p.name not in ['backup.json','local-backup.json','verification.json'])
paths.update('public'+c['src']for c in json.loads((D/'associated-audio.json').read_text()));paths.update(str(p)for p in Path('docs/imported-alfa-c-review-20261031').glob('*.json')if p.name in ['source-amendments.json','repairs.json','owner-review.json','checks.json'])
manifest={'baseline':base,'files':{p:sha(Path(p).read_bytes())for p in sorted(paths)}}
f=O/'Klink-leesreeksen-Alfa-C-bronherstel-actueel-20261031.zip'
with zipfile.ZipFile(f,'w',zipfile.ZIP_DEFLATED)as z:
 for p in sorted(paths):z.write(p,p)
 for p in files:
  try:b=subprocess.check_output(['git','show',base+':'+p],stderr=subprocess.DEVNULL)
  except subprocess.CalledProcessError:continue
  z.writestr('voor-herstel/'+p,b)
 z.writestr('manifest.json',json.dumps(manifest,ensure_ascii=False,indent=2))
with zipfile.ZipFile(f)as z:
 assert z.testzip()is None
 for p,h in manifest['files'].items():assert sha(z.read(p))==h
info={'path':str(f),'sha256':sha(f.read_bytes()),'bytes':f.stat().st_size,'manifestFiles':len(paths),'files':auth['files']};(D/'local-backup.json').write_text(json.dumps(info,indent=2)+'\n');print({k:v for k,v in info.items()if k!='files'})
