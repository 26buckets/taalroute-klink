import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const root='docs/spelling-dictation-20261104/',approval='docs/klink-owner-release-spelling-dictation-20261104.json';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),sort=a=>a.sort((x,y)=>x.localeCompare(y)),lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function verifySpellingDictationRelease(read=readFileSync){
 const json=p=>JSON.parse(read(p)),r=json(approval),m=json(root+'import-manifest.json'),policy='docs/klink-invullen-20261101/automatic-owner-approval.json',owner=json(policy),base=r.baselineSourceCommit,old=p=>git('show',base+':'+p);
 assert.equal(r.approvedBy,'Nico');assert.equal(r.standingPolicySha256,sha(read(policy)));assert.equal(r.approvalKind,'standing-owner-approval');assert(r.publicationApproved&&owner.automaticOwnerApproval&&owner.automaticPublicationApproval&&!owner.mayInventHumanReviewEvidence);
 assert.equal(base,m.main);assert.equal(r.liveSourceCommit,json(root+'baseline-live-release.json').sourceCommit);git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
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
