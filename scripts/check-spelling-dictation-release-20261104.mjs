import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root='docs/spelling-dictation-20261104/',approval='docs/klink-owner-release-spelling-dictation-20261104.json';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),sort=a=>a.sort((x,y)=>x.localeCompare(y)),lines=b=>b.toString().trim().split('\n').filter(Boolean);
const holdPath='docs/spelling-hold-restoration-20261104/';
const holdApproval='docs/klink-owner-spelling-hold-restoration-20261104.json';
function verifyRestoredHold(read){
 if(!existsSync(holdApproval))return null;
 const json=p=>JSON.parse(read(p)),h=json(holdApproval),live=json(holdPath+'baseline-live-release.json'),base=h.baselineSourceCommit,old=p=>git('show',base+':'+p);
 assert.equal(h.status,'RESTORE_SOURCE_HOLD_NO_PUBLICATION_APPROVAL');
 assert.equal(live.sourceCommit,h.liveSourceCommit);assert(live.sourceClean&&live.branch==='main');
 git('merge-base','--is-ancestor',h.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,sort(Object.keys(h.files)));
 assert.deepEqual(changed,['data/klink-grammar-aa-assets.json','data/klink-production-index.json','scripts/check-spelling-dictation-release-20261104.mjs','scripts/test-production-bank-reader.mjs']);
 for(const[p,digest] of Object.entries({...h.files,...h.evidenceFiles}))assert.equal(sha(read(p)),digest,p);
 const m=json(root+'import-manifest.json'),ids=m.newRows.flatMap(x=>x.sourceIds),rowIds=new Set(m.newRows.map(x=>x.row.id));
 assert.equal(ids.length,36);assert.deepEqual(h.sourceIds,ids);
 assert(json(root+'source-records.json').every(x=>x.source.importPermission==='REVIEW_ONLY_NO_PUBLISH'&&x.source.independentLanguageReview==='NOT_RUN'&&x.source.humanReview==='NOT_PERFORMED'));
 const index='data/klink-production-index.json',asset='data/klink-grammar-aa-assets.json',assets=JSON.parse(old(asset));
 assert.deepEqual(json(index),JSON.parse(old(index)).filter(x=>!rowIds.has(x.id)));
 for(const x of m.newRows){assert(Object.hasOwn(assets,x.sha256+'.json'));delete assets[x.sha256+'.json'];}
 assert.deepEqual(json(asset),assets);
 for(const p of [asset,index])assert(sha(read(p))===sha(git('show',h.priorUnaffectedSourceCommit+':'+p)));
 const before=json(root+'postflight/final-backup.json'),after=json(holdPath+'backup.json');
 assert(before.fullReadback&&before.nestedArchiveVerified&&before.driveId===h.originalRecoveryDriveId);
 assert(after.fullReadback&&after.zipIntegrity&&after.driveId);assert.deepEqual(after.files,h.files);assert.deepEqual(after.evidenceFiles,h.evidenceFiles);
 const checks=json(holdPath+'local/browser.json');assert.equal(checks.sixBanksUnavailable,6);assert.equal(checks.formerLinksWithoutExercises,24);assert.equal(checks.retainedAlfaBFlows,4);
 return {...h,changedFiles:changed};
}
export function verifySpellingDictationRelease(read=readFileSync){
 const current=read,held=verifyRestoredHold(current);
 if(held)read=file=>readBeforeSpellingDictation(file,held,current);
 const json=p=>JSON.parse(read(p)),r=json(approval),m=json(root+'import-manifest.json'),policy='docs/klink-invullen-20261101/automatic-owner-approval.json',owner=json(policy),base=r.baselineSourceCommit,old=p=>git('show',base+':'+p);
 assert.equal(r.approvedBy,'Nico');assert.equal(r.standingPolicySha256,sha(read(policy)));assert.equal(r.approvalKind,'standing-owner-approval');assert(r.publicationApproved&&owner.automaticOwnerApproval&&owner.automaticPublicationApproval&&!owner.mayInventHumanReviewEvidence);
 assert.equal(base,m.main);assert.equal(r.liveSourceCommit,json(root+'baseline-live-release.json').sourceCommit);git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,held?.baselineSourceCommit??'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,...(held?[held.baselineSourceCommit]:[]),'--',...roots)),...(held?[]:lines(git('ls-files','--others','--exclude-standard','--',...roots)))])]);assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 assert.deepEqual(changed.filter(p=>/^(app|components|hooks|data|lib|public|db|drizzle|\.github)\//.test(p)),['components/product/package-exercise-browser.tsx','components/product/package-group-practice.tsx','data/klink-grammar-aa-assets.json','data/klink-production-index.json']);
 const index='data/klink-production-index.json',asset='data/klink-grammar-aa-assets.json',rows=m.newRows.map(x=>x.row);
 assert.deepEqual(json(index),[...JSON.parse(old(index)),...rows]);const assets=json(asset),prev=JSON.parse(old(asset));
 for(const [k,v] of Object.entries(prev))assert.deepEqual(assets[k],v);
 assert.deepEqual(Object.keys(assets).filter(k=>!Object.hasOwn(prev,k)),m.newRows.map(x=>x.sha256+'.json'));
 assert.equal(rows.length,6);
 const adaptation=json(root+'editorial-adaptations.json');
 const source=new Map(json(root+'source-records.json').map(x=>[x.id,x.source])),reuse=json(root+'media-reuse-proof.json'),clips=new Map(reuse.sourceRecordings.map(x=>[x.sourceId,x]));
 assert.equal(source.size,36);assert.equal(clips.size,36);assert(reuse.independentTranscripts.every(x=>x.exactWords||x.additionalEvidence));
 for(const {row,sha256,sourceIds}of m.newRows){
  const a=assets[sha256+'.json'],b=Buffer.from(a.body,'base64'),bank=JSON.parse(b);assert.equal(a.bytes,b.length);assert.equal(sha(b),sha256);assert.equal(a.sha256,sha256);
  assert.equal(a.mime,'application/json; charset=utf-8');assert.equal(row.url,'/api/grammar-aa-assets/'+sha256+'.json');assert.equal(bank.id,row.id);assert(['a1','a2','b1'].includes(row.level));assert.equal(row.count,6);assert.deepEqual(bank.exercises.map(x=>x.exerciseId),sourceIds);
  for(const e of bank.exercises){
   const s=source.get(e.exerciseId),c=clips.get(e.exerciseId);assert.equal(s.form,'D');assert.deepEqual(e.fields[0].acceptedAnswers,s.answerModel.acceptedValues);
   assert(e.audioOnly&&e.requiresAudio&&e.sourceWordDictationExact&&e.manualAdvance&&e.requiresExplicitCompletion&&!e.reviewEligible&&!e.independentReading);
   assert.equal(e.title,reuse.instruction.text);assert.equal(e.instructionAudio.src,reuse.instruction.src);assert.equal(e.prompt.audio.src,c.source);if(adaptation[e.exerciseId])assert.equal(adaptation[e.exerciseId].original,s.feedback.whenIncorrect);
  assert.equal(e.feedback,adaptation[e.exerciseId]?.retry??s.feedback.whenIncorrect);
   assert.equal(sha(read('public'+c.source)),c.sha256);
  }
 }
 const browser=json(root+'local/browser.json');assert.equal(browser.flows.length,144);assert.equal(browser.native.length,144);assert.deepEqual(browser.errors,[]);
 assert.equal(json(root+'local/media.json').checks.length,37);assert.equal(json(root+'local/sheet.json').checks.length,12);assert(json(root+'source-drive-proof.json').wholeZipReadBack);
 assert.equal(sha(read('public'+reuse.instruction.src)),reuse.instruction.sha256);
 const v=json(root+'verification.json');assert(v.types&&v.coreTests&&v.build&&v.priorAssetsPreserved&&v.fixedAppearancePreserved);assert.equal(v.offeredStaticAssets,20000);assert.equal(v.missingWordAudio,0);
 const backup=json(root+'backup.json');assert(backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);return r;
}
export function readBeforeSpellingDictation(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
