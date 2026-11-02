import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyDictationApprovedRelease(read=readFileSync){
 const json=p=>JSON.parse(read(p)),d='docs/klink10-dictation-aa-20261102/',r=json('docs/klink-owner-release-ten-dictation-approved-20261102.json');
 assert.equal(r.approvedBy,'Nico');assert.equal(r.ownerApproval,'standing-owner-approval');assert(r.publicationApproved&&r.existingAppearancePreserved&&r.progressPreserved);
 assert.equal(r.liveSourceCommit,'c401dab88da45a3ee41874f95a1c18bf8796d261');
 assert.equal(r.repairLiveSourceCommit,'d091f55102e3892cf76d680630a35db5ae417b62');git('merge-base','--is-ancestor',r.repairLiveSourceCommit,'HEAD');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 const allowed=['data/klink-word-library-index.json','data/klink10-writing-dictation-aa-20261102.json','lib/klink10-writing-dictation-aa.ts','lib/practice-chapters.ts','scripts/test-practice-chapters.mjs','scripts/test-klink10-dictation-aa.mjs','scripts/test-klink10-dictation-aa-browser.mjs','scripts/test-klink10-dictation-aa-sheet.mjs','scripts/test-klink10-dictation-aa-media.mjs','scripts/check-klink10-speaking-release-20261102.mjs','scripts/check-klink10-dictation-approved-release.mjs','scripts/test-klink10-dictation-approved-release.mjs'];
 assert(changed.every(p=>allowed.includes(p)));assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,'--','public').length,0);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 const oldLibrary=JSON.parse(git('show',r.baselineSourceCommit+':data/klink-word-library-index.json')),library=json('data/klink-word-library-index.json');
 const newIds=[1,2].map(n=>'dictation/klink10:writing-dictation:alfa-a:20261102~words-'+n);assert.deepEqual(library.collections.filter(c=>newIds.includes(c.id)).map(c=>c.id),newIds);assert.deepEqual({...library,collections:library.collections.filter(c=>!newIds.includes(c.id))},oldLibrary);
 const bank=json('data/klink10-writing-dictation-aa-20261102.json');assert(bank.publicationReady);assert.equal(bank.positions.length,10);assert.equal(new Set(bank.positions.map(p=>p.sourceId)).size,10);
 const review=json(d+'content-review.json');assert.equal(review.checks.length,10);assert.equal(review.newUniqueQuestions,0);assert.equal(review.newAudio,0);assert(review.checks.every(c=>c.exactSourceAnswer&&c.sourceFeedbackMatched&&c.requiresNoWrittenModelBeforeAnswer&&c.existingCanonicalAnswerReused));
 const approval=json(d+'nico-drie-opnamen-goedkeuring.json');assert.equal(approval.userAnswer,'Alle drie goed');assert.deepEqual(approval.recordings.map(x=>x.word).sort(),['maan','man','vis']);assert(approval.recordings.every(x=>x.humanApproved&&x.reviewer==='Nico'));
 const media=json(d+'media-review.json');assert.equal(media.checks.length,11);assert.equal(media.newAudio,0);
 const policy=json('data/klink-audio-policy.json'), instructions=json('data/klink-production-instructions.json');
 for(const p of bank.positions)assert(instructions.some(i=>i.src===p.instructionAudio));
 for(const m of media.checks){assert(!policy.withdrawnPrefixes.some(p=>m.src.startsWith(p)));assert(!policy.withdrawnFiles.includes(m.src));assert(m.metadataVerified&&m.fullDecode&&m.unchangedExistingBytes);assert.equal(sha(read('public'+m.src)),m.sha256);}
 for(const a of approval.recordings)assert(media.checks.some(m=>m.sha256===a.sha256));
 for(const [name,n] of [['browser',20],['sheet',20]]){const b=json(d+'local/'+name+'.json');assert.equal(b.checks.length,n);assert.deepEqual(b.errors,[]);}
 const native=json(d+'local/native-media.json');assert.equal(native.checks.length,22);assert.equal(native.flows.length,2);
 const v=json(d+'validation.json');for(const k of ['typescript','lint','unit','regression','sourceReview','appearancePreserved','progressPreserved'])assert(v[k]);
 const backup=json(d+'backup.json');assert(backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
 return r;
}
export function readBeforeDictationApproved(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
