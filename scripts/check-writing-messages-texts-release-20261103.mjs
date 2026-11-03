import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((x,y)=>x.localeCompare(y));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const folder='docs/writing-messages-texts-20261103/';
export function verifyMessagesTextsRelease(read=readFileSync){
 const json=p=>JSON.parse(read(p)),r=json('docs/klink-owner-release-messages-texts-20261103.json'),m=json(folder+'import-manifest.json'),old=p=>git('show',r.baselineSourceCommit+':'+p);
 assert.equal(r.baselineSourceCommit,m.baselineSourceCommit);assert.equal(r.liveSourceCommit,m.actualPreviousLiveSourceCommit);assert.equal(json(folder+'baseline-live-release.json').sourceCommit,r.liveSourceCommit);
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 assert.equal(r.approvedBy,'Nico');assert.equal(r.ownerApproval,'standing-owner-approval');assert(r.publicationApproved);assert.equal(r.standingPolicySha256,sha(read('docs/klink-invullen-20261101/automatic-owner-approval.json')));
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const [p,h] of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 assert.deepEqual(lines(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public')),['public/.assetsignore']);
 const ignore='public/.assetsignore';assert(read(ignore).toString().startsWith(old(ignore).toString()));assert.deepEqual(read(ignore).toString().slice(old(ignore).length).split('\n').filter(l=>l&&!l.startsWith('#')),['/practice-content/klink-messages-texts-20261103/**']);
 const index='data/klink-production-index.json',instructions='data/klink-production-instructions.json',audio=json(folder+'audio-review.json');
 assert.deepEqual(json(index),[...JSON.parse(old(index)),...m.newRows.map(x=>x.row)]);assert.deepEqual(json(instructions),[...JSON.parse(old(instructions)),...Object.values(audio.instructions)]);
 assert.equal(m.newRows.length,33);assert.equal(m.sourceDocuments,11);const bundle=json('public'+m.deliveryBundle.src);assert.equal(sha(read('public'+m.deliveryBundle.src)),m.deliveryBundle.sha256);
 const exercises=m.newRows.flatMap(({row,sha256})=>{const bytes=read('public'+row.url);assert.equal(sha(bytes),sha256);assert.equal(bundle.banks[row.id],bytes.toString());return JSON.parse(bytes).exercises;});
 assert.equal(new Set(exercises.map(e=>e.exerciseId)).size,220);assert.equal(exercises.filter(e=>e.exerciseId.includes('-SB-')).length,120);assert.equal(exercises.filter(e=>e.exerciseId.includes('-ZS-')).length,100);assert.equal(exercises.flatMap(e=>e.sourceWritingExamples).length,440);
 assert(exercises.every(e=>e.sourceFreeWriting&&e.manualAdvance&&e.requiresExplicitCompletion&&!e.independentReading&&!e.reviewEligible&&e.assessment==='participation'));
 const media=read('public'+audio.bundle.src);assert.equal(sha(media),audio.bundle.sha256);assert.equal(audio.selected.length,70);for(const x of audio.selected)assert.equal(sha(media.subarray(x.offset,x.offset+x.length)),x.record.sha256);
 const b=json(folder+'local/browser.json');assert.equal(b.checks.length,440);assert.equal(b.rounds.length,66);assert.equal(b.reloaded.length,66);assert.equal(b.native.length,4);assert.deepEqual(b.errors,[]);
 assert.equal(json(folder+'local/media.json').checks.length,70);assert.equal(json(folder+'local/layout-native.json').checks.length,16);
 const v=json(folder+'verification.json');assert(v.localTypes&&v.localRegressions&&v.driveSourceRevisionsUnchanged&&v.audioMetadataVerified&&v.priorAssetsPreserved);assert.equal(v.missingWordAudio,0);
 const backup=json(folder+'backup.json');assert(backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);return r;
}
export function readBeforeMessagesTexts(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
