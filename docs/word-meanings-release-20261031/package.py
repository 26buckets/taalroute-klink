import json,hashlib,zipfile,subprocess,pathlib
P=pathlib.Path;D=P('docs/word-meanings-release-20261031');O=P('/Users/nicoknoester/Documents/Codex/2026-10-30/wat-ik-zo-bijzonder-vind-is/outputs/klink-betekenisherstel-live-20261031');base='7606464fe84907200c52f332e4380b3fad5456f5';sha=lambda b:hashlib.sha256(b).hexdigest()
roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc']
git=lambda *a:subprocess.check_output(['git',*a]).decode().splitlines()
files=sorted(set(git('diff','--name-only',base,'--',*roots)+git('ls-files','--others','--exclude-standard','--',*roots)))
req='Ja, volg je advies bij die vier groepen twijfelgevallen. Pas de gekoppelde oefeningen en antwoorden aan, controleer de audio en zet de herstelversie daarna live. Geef mij weer een directe link naar het resultaat.'
evidence=['audio.json','audio-quality.json','changes.json','package-amendments.json','new-extension-words.json','preservation.json','associated-audio-check.json','direct-links.json','README.md']
auth={'approvedBy':'Nico','approvedAt':'2026-10-31','userRequest':req,'audioAuthorization':'Maak de noodzakelijke opnamen','publicationApproved':True,'baselineSourceCommit':base,'liveSourceCommit':'974b887d804b3c463d78407f3f4b12936636e43b','changedFiles':files,'files':{f:sha(P(f).read_bytes())for f in files},'evidence':{str(D/f):sha((D/f).read_bytes())for f in evidence},'humanListeningReview':'open','newRecordings':4,'existingAudioPreserved':True,'noCloudWorkflows':True}
P('docs/klink-owner-release-word-meanings-20261031.json').write_text(json.dumps(auth,ensure_ascii=False,indent=2)+'\n')
paths={p:P(p)for p in files+['docs/klink-owner-release-word-meanings-20261031.json','PUBLICATIE-ACTUEEL.md']}
for directory in [D,P('docs/word-meanings-review-20261031')]:
 for p in directory.rglob('*'):
  if p.is_file() and p.name not in ['dev-server.log','backup.json','local-backup.json','final-backup.json'] and p.suffix not in ['.zip']:paths[str(p)]=p
for src in json.load(open(D/'associated-audio.json')):paths['public'+src]=P('public'+src)
for p in O.glob('*.html'):paths['resultaat/'+p.name]=p
entries={name:p.read_bytes()for name,p in paths.items()}
for f in files:
 try:b=subprocess.check_output(['git','show',base+':'+f],stderr=subprocess.DEVNULL)
 except subprocess.CalledProcessError:continue
 entries['voor-herstel/'+f]=b
manifest={'baseline':base,'files':{name:{'bytes':len(b),'sha256':sha(b)}for name,b in entries.items()}}
zpath=O/'Klink-betekenisherstel-bron-en-resultaat-20261031.zip'
with zipfile.ZipFile(zpath,'w',zipfile.ZIP_DEFLATED)as z:
 for name,b in entries.items():z.writestr(name,b)
 z.writestr('MANIFEST.json',json.dumps(manifest,ensure_ascii=False,indent=2))
with zipfile.ZipFile(zpath)as z:
 assert set(z.namelist())==set(entries)|{'MANIFEST.json'}
 assert z.testzip()is None
 for name,v in manifest['files'].items():assert sha(z.read(name))==v['sha256']
info={'path':str(zpath),'sha256':sha(zpath.read_bytes()),'bytes':zpath.stat().st_size,'manifestFiles':len(entries),'files':auth['files']};(D/'local-backup.json').write_text(json.dumps(info,indent=2)+'\n');print({k:v for k,v in info.items()if k!='files'})
