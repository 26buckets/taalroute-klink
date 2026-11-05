import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifyStorageRepairRelease,readBeforeStorageRepair} from './check-storage-player-repair-release-20261105.mjs';
const root='docs/reading-comprehension-20261105/';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
export function verifyReadingContent(read=readFileSync){
 const successor=verifyStorageRepairRelease(read),currentRead=read;read=file=>readBeforeStorageRepair(file,successor,currentRead);
 const json=p=>JSON.parse(read(p)),r=json(root+'approval.json'),m=json(root+'manifest.json'),request=json(root+'publication-request.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&request.publicationApproved&&request.excludePR12&&request.excludeDictation&&request.existingAudioOnly&&request.coordination.explicitWindowReleased);
 assert.equal(request.userRequest,'Ga verder met de andere onderdelen die klaar zijn om online te zetten. Gebruik bestaande audio, stem af met Inzicht en laat de dictees en PR12 buiten deze publicatie.');
 assert.equal(r.baselineSourceCommit,'ebe45d6f5be44fa0cb49cc5ff1b15a9512420632');assert.equal(r.liveSourceCommit,'8589a60a02117dfce87c44a833341796eed8b2c1');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=sort(lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots)));
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 assert.deepEqual(changed.filter(p=>!p.startsWith('scripts/')),['data/klink-grammar-aa-assets.json','data/klink-production-index.json']);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 const old=JSON.parse(git('show',r.baselineSourceCommit+':data/klink-production-index.json'));assert.deepEqual(json('data/klink-production-index.json'),[...old,...m.rows]);assert.equal(m.rows.length,2);
 const before=JSON.parse(git('show',r.baselineSourceCommit+':data/klink-grammar-aa-assets.json')),assets=json('data/klink-grammar-aa-assets.json');
 for(const[k,v]of Object.entries(before))assert.deepEqual(assets[k],v,k);assert.equal(Object.keys(assets).length,Object.keys(before).length+2);
 const source=json(root+'sources/selected.json');assert.equal(source.length,20);assert.equal(new Set(source.map(s=>s.id)).size,20);
 for(const row of m.rows){
  assert.equal(row.count,10);assert.equal(row.activity,'text-question');assert(['a1','a2'].includes(row.level));const asset=assets[row.url.split('/').at(-1)],bytes=Buffer.from(asset.body,'base64');assert.equal(sha(bytes),asset.sha256);assert.equal(bytes.length,asset.bytes);assert.equal(sha(read(root+row.level+'-bank.json')),asset.sha256);
  const bank=JSON.parse(bytes);assert.equal(bank.id,row.id);assert.equal(bank.exercises.length,10);
  for(const e of bank.exercises){const s=source.find(s=>s.id===e.exerciseId);assert(s);assert.equal(e.sourceText,s.text);assert.equal(e.question,s.question);assert.deepEqual(e.optionFeedback,s.feedback);assert.deepEqual(e.answer.correctOptionIds,[s.answer]);assert(!e.requiresAudio&&e.manualAdvance&&e.requiresExplicitCompletion);assert.equal(e.reviewEligible,false);assert.equal(e.instructionAudio,undefined);assert.equal(e.sourceBlocks[0].audio,undefined);}
 }
 const browser=json(root+'local/browser.json');assert.equal(browser.checks.length,80);assert.equal(browser.rounds.length,8);assert.deepEqual(browser.errors,[]);assert(browser.checks.every(c=>c.nativeAudio&&c.feedbackExact&&c.oldAnswerPreserved&&c.helpNotIndependentReading));
 const coverage=json(root+'local/word-coverage.json'),media=json(root+'local/media.json');assert.equal(coverage.length,401);assert.equal(media.recordings.length,401);assert(media.recordings.every(x=>x.exactBytes&&x.metadataPassed&&x.fullDecode));
 const checks=json(root+'verification.json');assert(checks.typesPassed&&checks.targetedLintPassed&&checks.unitTestsPassed&&checks.normalBuildPassed&&checks.dryRunPassed&&checks.pr12Excluded&&checks.sixDictationBanksHeld);assert(checks.offeredAssets<=20000&&checks.workerGzipKiB<10240);
 const appearance=json(root+'local/appearance.json');assert.equal(appearance.length,4);assert(appearance.every(x=>x.changedPixels===0||(x.maxChannelDelta===1&&x.changedPixels<=841&&x.sameControlGeometryAndText)));
 return {...r,successor};
}
export function verifyReadingRelease(read=readFileSync){const r=verifyReadingContent(read),b=JSON.parse(read(root+'backup.json'));assert(b.driveId&&b.fullReadback&&b.zipIntegrity);assert.deepEqual(b.files,r.files);assert.deepEqual(b.evidenceFiles,r.evidenceFiles);return r;}
export function readBeforeReading(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeStorageRepair(file,r.successor,read);}
