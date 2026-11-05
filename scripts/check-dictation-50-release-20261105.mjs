import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const root='docs/dictation-50-20261105/';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort();
export function verifyDictation50Content(read=readFileSync){
 const json=p=>JSON.parse(read(p)),r=json(root+'approval.json'),request=json(root+'owner-request.json');
 assert.equal(request.userRequest,'Ik ben overal mee akkoord, zet online. Dit is de laatste keer dat je dit aan me vraagt.');
 assert.equal(request.approvedBy,'Nico');assert(request.publicationApproved&&request.ownerAcceptsDisclosedOpenHumanReview);
 assert.equal(request.humanReview,'NOT_PERFORMED');assert.equal(r.baselineSourceCommit,'43c05c9d4c40adb5373d564e6131d5dbdd90d546');
 assert.equal(r.liveSourceCommit,r.baselineSourceCommit);assert.equal(json(root+'live-before.json').sourceCommit,r.liveSourceCommit);
 git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 assert.deepEqual(changed.filter(p=>!p.startsWith('scripts/')),['data/klink-grammar-aa-assets.json','data/klink-production-index.json']);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 const old=p=>JSON.parse(git('show',r.baselineSourceCommit+':'+p)),banks=json(root+'banks.json'),source=new Map(json(root+'source-50.json').map(s=>[s.exerciseId,s]));
 const rows=banks.map(b=>b.row),index='data/klink-production-index.json',asset='data/klink-grammar-aa-assets.json',assets=json(asset),prior=old(asset);
 assert.equal(banks.length,9);assert.deepEqual(json(index),[...old(index),...rows]);assert.equal(old(index).length,1800);
 for(const[k,v]of Object.entries(prior))assert.deepEqual(assets[k],v);
 assert.deepEqual(sort(Object.keys(assets).filter(k=>!Object.hasOwn(prior,k))),sort(rows.map(r=>r.url.split('/').at(-1))));
 const expected=['A1','A2','B1'].flatMap(l=>Array.from({length:12},(_,i)=>`SP-SELF-20261101-${l}-R05-${String(i+1).padStart(2,'0')}`)).concat(Array.from({length:10},(_,i)=>`SP-SELF-20261101-AB-R04-${String(i+1).padStart(2,'0')}`),['02','03','07','10'].map(i=>'SP-SELF-20261101-AC-R05-'+i));
 assert.deepEqual(sort([...source.keys()]),sort(expected));
 const clips=new Map(json(root+'media-50.json').map(c=>[c.id,c])),ids=[];
 for(const{row,bank}of banks){
  const key=row.url.split('/').at(-1),a=assets[key],bytes=Buffer.from(a.body,'base64');
  assert.equal(row.url,'/api/grammar-aa-assets/'+sha(bytes)+'.json');assert.equal(a.sha256,sha(bytes));assert.equal(a.bytes,bytes.length);assert.equal(a.mime,'application/json; charset=utf-8');
  assert.deepEqual(JSON.parse(bytes),bank);assert.equal(row.id,bank.id);assert.equal(row.count,bank.exercises.length);
  for(const e of bank.exercises){
   ids.push(e.exerciseId);const s=source.get(e.exerciseId),c=clips.get(e.exerciseId);assert(s&&c);assert.equal(s.form,'D');
   assert.equal(e.sourceRecordId,s.exerciseId);assert.equal(e.writingSourceId,s.exerciseId);assert.deepEqual(e.fields[0].acceptedAnswers,s.answerModel.acceptedValues);
   assert(e.sourceWordDictationExact&&e.requiresAudio&&e.audioOnly&&e.manualAdvance&&e.requiresExplicitCompletion&&!e.reviewEligible&&!e.independentReading);
   assert.equal(e.feedback,e.exerciseId==='SP-SELF-20261101-A2-R05-08'?'Schrijf twee keer de letter n naast elkaar.':s.feedback.whenIncorrect);
   assert.equal(e.prompt.audio.src,new URL(c.url).pathname);assert.equal(sha(read('public'+e.prompt.audio.src)),c.sha256);assert(c.decodeOK&&c.brandOK&&!c.humanListeningPerformed);assert.deepEqual(c.unwantedMetadata,{});
   assert.equal(e.instructionAudio.src,'/package-audio/productie-instructies-20261029/KLINK-INS-f1e80ab41f43.mp3');
  }
 }
 assert.deepEqual(sort(ids),sort(expected));assert.equal(new Set(ids).size,50);
 assert.equal(sha(read('public/package-audio/productie-instructies-20261029/KLINK-INS-f1e80ab41f43.mp3')),'c7689f211a34271e9acb367b444c48794e1bcbbd203150328d743154c174e664');
 const browser=json(root+'local/browser.json');assert.equal(browser.flows.length,200);assert.equal(browser.native.length,200);assert.deepEqual(browser.errors,[]);
 assert.equal(json(root+'local/sheet.json').checks.length,18);
 const help=json(root+'local/help.json');assert.equal(help.checks.length,8);assert(help.checks.every(c=>c.helpStayedVisible&&c.openAndClosePreserved&&c.enWithPhoto&&c.enWithoutPhoto));
 const checks=json(root+'verification.json');assert(checks.typesPassed&&checks.lintPassed&&checks.normalBuildPassed&&checks.curriculumTests===49&&checks.priorBanksUnchanged===1800);
 return r;
}
export function verifyDictation50Release(read=readFileSync){
 const r=verifyDictation50Content(read),backup=JSON.parse(read(root+'backup.json'));
 assert(backup.driveId&&backup.fullReadback&&backup.zipIntegrity&&backup.allPayloadHashesMatch);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);return r;
}
export function readBeforeDictation50(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
