import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/speaking-a1-repeat-20261105/';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
export function verifySpeakingA1Content(read=readFileSync){
 const json=p=>JSON.parse(read(p)),r=json(root+'approval.json'),m=json(root+'manifest.json'),request=json(root+'publication-request.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&request.publicationApproved&&request.excludePR12);
 assert.equal(request.userRequest,'Zet de tien goedgekeurde nazegoefeningen Spreken A1 nu online met de bestaande audio. Stem het publicatievenster af met Inzicht en neem PR12 niet mee.');
 assert.equal(r.baselineSourceCommit,'b085d626f591342e0be3aa32faa3bfe85342d5e9');assert.equal(r.liveSourceCommit,'dc37a479a7a6f148d61ffb5140dfd79112331f85');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 assert.deepEqual(changed.filter(p=>!p.startsWith('scripts/')),['components/product/package-exercise-browser.tsx','data/klink-production-index.json','public'+m.row.url]);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 const index='data/klink-production-index.json',old=JSON.parse(git('show',r.baselineSourceCommit+':'+index));assert.deepEqual(json(index),[...old,m.row]);assert.equal(m.row.count,10);assert.equal(m.row.activity,'speak');assert.equal(m.row.level,'a1');assert.equal(m.row.help,'practice');
 const bank=json(root+'source-bank.json'),review=json(root+'review.json');assert.equal(sha(read('public'+m.row.url)),m.bankSha256);assert.equal(sha(read(root+'source-bank.json')),m.bankSha256);
 assert.deepEqual(json(root+'current-selected-source.json'),json(root+'original-source.json').records);
 assert.equal(bank.exercises.length,10);assert.equal(new Set(bank.exercises.map(e=>e.exerciseId)).size,10);
 for(const[i,e]of bank.exercises.entries()){
  const s=review.recordings[i],a=m.mapping[i];assert.equal(e.exerciseId,s.id);assert.equal(e.exerciseId,a.sourceId);assert.equal(e.title,s.instruction);assert.equal(e.exampleWord,s.word);assert.equal(e.selfCheck,s.selfCheck);assert.equal(e.meaning,s.id==='SPK-A1-ZHW-04'?'Iemand met wie je werkt.':s.meaningSupport);assert.equal(e.feedback,s.feedback);assert.equal(e.prompt.audio.src,a.src);
  assert.equal(e.assessment,'participation');assert.equal(e.reviewEligible,false);assert.equal(e.independentReading,false);assert.equal(e.mode,'repeat-word');assert(e.requiresAudio&&e.requiresExplicitCompletion&&e.sourceRepetition);assert.equal(e.instructionAudio,undefined);
 }
 const browser=json(root+'local/browser.json');assert.equal(browser.checks.length,40);assert.equal(browser.rounds.length,4);assert.deepEqual(browser.errors,[]);assert(browser.checks.every(c=>c.nativeAudio&&c.oldAnswerPreserved&&c.participationOnly));
 const media=json(root+'local/media.json');assert.equal(media.length,10);assert(media.every(x=>x.exactBytes&&x.metadataPassed&&x.fullDecode));
 const preservation=json(root+'preservation.json');assert(preservation.oldPublicBytesPreserved&&preservation.oldIndexRowsPreserved&&preservation.pr12Excluded&&preservation.sixDictationBanksHeld);
 const appearance=json(root+'local/appearance.json');assert.equal(appearance.length,4);assert(appearance.every(x=>x.changedPixels===0||(x.narrowRasterDifference&&x.sameControlGeometryAndMarkup&&x.visuallyInspected&&x.changedPixels<=100&&x.maxChannelDelta<=26)));
 const checks=json(root+'verification.json');assert(checks.typesPassed&&checks.targetedLintPassed&&checks.unitTestsPassed&&checks.normalBuildPassed&&checks.dryRunPassed);assert(checks.offeredAssets<=20000);assert(checks.workerGzipKiB<10240);
 return r;
}
export function verifySpeakingA1Release(read=readFileSync){const r=verifySpeakingA1Content(read),b=JSON.parse(read(root+'backup.json'));assert(b.driveId&&b.fullReadback&&b.zipIntegrity);assert.deepEqual(b.files,r.files);assert.deepEqual(b.evidenceFiles,r.evidenceFiles);return r;}
export function readBeforeSpeakingA1(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
