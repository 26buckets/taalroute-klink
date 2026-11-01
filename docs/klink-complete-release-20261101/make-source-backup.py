from pathlib import Path
import hashlib, json, subprocess, zipfile

repo=Path(__file__).resolve().parents[2]
folder=Path(__file__).resolve().parent
outputs=Path('/Users/nicoknoester/Documents/Codex/2026-10-31/een-van-de-opties-was-het/outputs/klink-compleet-20261101')
outputs.mkdir(parents=True,exist_ok=True)
read=lambda name:json.loads((folder/name).read_text())
browser=read('browser/checks.json')
assert len(browser['checks'])==948 and not browser['errors']
assert sum(c['questions'] for c in browser['checks'])==2912
assert len(read('progress-checks.json')['checks'])==24
assert len(read('recorder-checks.json')['checks'])==13
assert len(read('appearance/checks.json')['checks'])==8
assert read('audio-file-audit.json')['checked']==1076 and not read('audio-file-audit.json')['issues']
assert read('transcript-resolution.json')['checked']==1076 and read('transcript-resolution.json')['unresolved']==0
review={key:True for key in ['sourceCounts','sourceEquality','originalSixTexts','originalTwentyFourQuestions','allChoiceFeedback','allGoals','localBrowserChecks','recordingControls','progress','types','lint','build','appearancePreserved','oldAudioPreserved','localOnly']}
review.update({'humanListeningReview':False,'learnerPilot':False,'physicalPhoneTest':False,
 'lintScope':'All changed application and check sources pass. A whole-repository lint run reports existing unrelated script warnings; no unrelated files were repaired.',
 'runtimeChecks':'Local Vite browser flows plus successful production build. Local Wrangler start was unavailable with spawn EBADF; the actual published build must still pass online browser and full offered-file checks.',
 'sourcePilotStatus':'Publication is explicitly authorized by Nico for this content. Historical source HOLD and open human/pilot records remain preserved; no human approval is invented.'})
(folder/'verification.json').write_text(json.dumps(review,ensure_ascii=False,indent=2)+'\n')
files=json.loads(subprocess.check_output(['node','--input-type=module','-e',"import {completeCoreFiles} from './scripts/check-klink-complete-release-20261101.mjs';import{readFileSync as r}from'node:fs';const d='docs/klink-complete-release-20261101/';const m=JSON.parse(r(d+'import-manifest.json'));const p=['voice-plan.json','voice-plan-b1.json'].flatMap(f=>JSON.parse(r(d+f)).clips);console.log(JSON.stringify([...completeCoreFiles,...m.runtimeFiles,...p.map(c=>'public'+c.src)].sort((a,b)=>a.localeCompare(b))))"],cwd=repo))
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
hashes={name:sha(repo/name)for name in files}
excluded={'backup.json','final-backup.json','online-files.json','live-release.json'}
evidence={str(p.relative_to(repo)):sha(p)for p in sorted(folder.rglob('*'))if p.is_file() and p.name not in excluded and not p.name.startswith('online-') and '__pycache__'not in p.parts}
owner={'approvedBy':'Nico','publicationApproved':True,'appearanceChanged':False,'baselineSourceCommit':read('baseline.json')['sourceBase'],
 'liveSourceCommit':read('baseline.json')['live']['sourceCommit'],'userRequest':read('owner-instruction.json')['userRequest'],
 'changedFiles':files,'files':hashes,'evidenceFiles':evidence,'humanListeningReview':False,'learnerPilot':False}
ownerPath=repo/'docs/klink-owner-release-complete-20261101.json';ownerPath.write_text(json.dumps(owner,ensure_ascii=False,indent=2)+'\n')
members={name:repo/name for name in [*hashes,*evidence,'docs/klink-owner-release-complete-20261101.json','PUBLICATIE.md','PUBLICATIE-ACTUEEL.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031/floor.json','docs/KLINK-STEMVERDELING.txt']}
for clip in read('audio-file-audit.json')['records']:
    members['public'+clip['src']]=repo/('public'+clip['src'])
source=Path('/Users/nicoknoester/Documents/Codex/2026-10-31/een-van-de-opties-was-het/work/klink-complete-20261101/sources')
for p in source.rglob('*'):
    if p.is_file() and (p.suffix=='.zip' or p.parent.name=='b1'):
        members['source-handoff/'+str(p.relative_to(source))]=p
manifest={name:sha(path)for name,path in members.items()}
groups=[[]]
size=0
for name,path in members.items():
    length=path.stat().st_size
    if size+length>90*1024*1024:
        groups.append([]);size=0
    groups[-1].append((name,path));size+=length
parts=[]
for index,group in enumerate(groups,1):
    target=outputs/f'Klink-compleet-herstel-deel-{index:02d}-van-{len(groups):02d}.zip'
    partManifest={name:manifest[name]for name,_ in group}
    with zipfile.ZipFile(target,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=3)as z:
        for name,path in group:z.write(path,name)
        z.writestr('RESTORE-MANIFEST.json',json.dumps({'baseline':owner['baselineSourceCommit'],'part':index,'totalParts':len(groups),'files':partManifest,'purpose':'Internal source/audio recovery; extract all parts into the same folder. Originals and failed takes are not learner downloads.'},ensure_ascii=False,indent=2))
    with zipfile.ZipFile(target)as z:
        assert z.testzip()is None
        for name,digest in partManifest.items():assert hashlib.sha256(z.read(name)).hexdigest()==digest,name
    assert target.stat().st_size<100*1024*1024
    parts.append({'localFile':str(target),'sha256':sha(target),'bytes':target.stat().st_size,'members':len(partManifest)+1,'zipIntegrity':True})
receipt={'parts':parts,'members':len(manifest)+len(parts),'files':hashes,'evidenceFiles':evidence,'allArchiveFiles':manifest}
(outputs/'bronarchief-lokaal.json').write_text(json.dumps(receipt,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'parts':parts,'members':receipt['members']},ensure_ascii=False))
