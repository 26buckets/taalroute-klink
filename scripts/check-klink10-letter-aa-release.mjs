import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
export function verifyLetterAARelease(read=readFileSync){
 const json=p=>JSON.parse(read(p)),root='docs/klink10-letter-aa-20261103/',r=json('docs/klink-owner-release-ten-letters-aa-20261103.json'),m=json(root+'manifest.json'),old=p=>git('show',r.baselineSourceCommit+':'+p);
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&r.appearancePreserved&&r.progressPreserved);assert.equal(r.standingPolicySha256,sha(read('docs/klink-invullen-20261101/automatic-owner-approval.json')));
 assert.equal(r.baselineSourceCommit,m.baselineSourceCommit);assert.equal(r.liveSourceCommit,json(root+'baseline-live-release.json').sourceCommit);git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public').length,0);assert.equal(git('diff','--name-only',r.baselineSourceCommit,'--','app','components','lib','hooks','.github').length,0);
 const idx='data/klink-production-index.json',ins='data/klink-production-instructions.json';assert.deepEqual(json(idx),[...JSON.parse(old(idx)),m.row]);assert.deepEqual(json(ins),[...JSON.parse(old(ins)),m.instruction]);
 assert.equal(m.newAudio,0);assert.equal(m.newPublicFiles,1);assert.equal(m.sourcePositions,10);assert.equal(m.row.activity,'write-letter');assert.equal(m.row.level,'alfa-a');assert.equal(m.row.help,'practice');
 const bank=json('public'+m.row.url);assert.equal(bank.id,m.row.id);assert.equal(sha(read('public'+m.row.url)),m.bankSha256);assert.equal(bank.exercises.length,10);
 assert.equal(bank.exercises.map(e=>e.exampleWord).join(''),'masotnreik');assert.equal(sha(read(root+'source.txt')),m.sourceSha256);
 for(const[i,e]of bank.exercises.entries()){assert.equal(e.exerciseId,m.positions[i].sourceId);assert.equal(e.title,m.positions[i].instruction);assert.equal(e.answerPolicy,'exact-copy');assert.equal(e.componentId,'ALF-CMP-006');assert.equal(e.mode,'copy-word');assert.deepEqual(e.fields,[{fieldId:'letter',acceptedAnswers:[m.positions[i].model]}]);assert.equal(e.writingSourceId,e.exerciseId);assert.equal(e.assessment,'answer');assert(!e.reviewEligible&&!e.independentReading&&e.manualAdvance);assert.equal(e.instructionAudio.src,m.instruction.src);}
 assert.equal(sha(read('public'+m.instruction.src)),m.instruction.sha256);assert(read('public'+m.instruction.src).equals(old('public'+m.instruction.src)));
 const b=json(root+'local/browser.json');assert.equal(b.checks.length,40);assert.deepEqual(b.errors,[]);assert(b.checks.every(x=>x.lowercaseAccepted&&x.uppercaseAndDoubleRejected&&x.firstAnswerPreserved));
 const media=json(root+'local/native-media.json');assert.equal(media.checks.length,2);assert(media.checks.every(x=>x.instructionPlayedToEnd));assert.equal(media.fullAudioSha256,m.instruction.sha256);
 const v=json(root+'verification.json');for(const k of ['sourceReviewed','exactCaseTested','types','regression','appearanceReviewed','audioMetadataVerified','existingPlayersUnchanged'])assert(v[k],k);
 const backup=json(root+'backup.json');assert(backup.driveId&&backup.fullReadback&&backup.zipIntegrity);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);return r;
}
export function readBeforeLetterAA(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
