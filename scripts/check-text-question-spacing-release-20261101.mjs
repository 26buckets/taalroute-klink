import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='6e7bb1ccc796ebdd899d24cc8a679d039fbc4c74',live='0f9191da3e38064bd81034f1d071056601bfe83e',folder='docs/text-question-spacing-20261101/';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),sort=a=>a.sort((a,b)=>a.localeCompare(b)),lines=b=>b.toString().trim().split('\n').filter(Boolean);
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const allowed=sort(['app/learner-layout.css','VORMGEVING-VASTGEZET.md','scripts/check-teacher-phase-labels-release-20261101.mjs','scripts/check-text-question-spacing-release-20261101.mjs','scripts/test-text-question-spacing-browser-20261101.mjs','scripts/test-text-question-spacing-release-20261101.mjs']);
export function verifyTextQuestionSpacingRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-text-question-spacing-20261101.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChangeApproved,true);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,live);assert(r.userRequest.includes('minder ruimte')&&r.userRequest.includes('boven'));
 git('merge-base','--is-ancestor',live,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,sort([...allowed,'docs/appearance-floor-20261031/floor.json',r.approval]));assert.deepEqual(r.changedFiles,allowed);assert.deepEqual(sort(Object.keys(r.files)),allowed);for(const f of allowed)assert.equal(sha(read(f)),r.files[f],f);
 const original=git('show',base+':app/learner-layout.css').toString(),actual=read('app/learner-layout.css').toString();
 const delta='\n/* Keep reading questions together instead of stretching their rows over the canvas. */\n.learner-app .cp-task-card.cp-extended-task:has(> .cp-source-text):has(> .cp-choice-grid) { height: auto; max-height: none; align-content: start; margin-block: 0; gap: 16px; }\n.learner-app .cp-task-card.cp-extended-task:has(> .cp-source-text):has(> .cp-choice-grid) > h4 { margin: 0; }\n';
 assert.equal(actual,original+delta,'Only the approved question spacing is appended');
 assert.equal(git('diff','--name-only',base,'--','components','hooks','data','lib','public','db','drizzle','.github','package.json','package-lock.json','wrangler.jsonc').length,0,'No player logic, content, audio, storage or dependencies change');
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json')),old=JSON.parse(git('show',base+':docs/appearance-floor-20261031/floor.json'));assert.deepEqual({...floor,approvedUpdates:old.approvedUpdates},old);assert.deepEqual(floor.approvedUpdates,[...old.approvedUpdates,r.approval]);const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);assert.deepEqual(approval.files,r.files);
 const browser=JSON.parse(read(folder+'browser-checks.json'));assert.equal(browser.checks.length,120);assert.equal(browser.native.length,2);assert.deepEqual(browser.errors,[]);assert(browser.checks.every(c=>c.gap>=0&&c.gap<=20&&!c.overflow&&c.oldProgressPreserved));assert(browser.native.every(c=>c.originalAudio&&c.completePlayback&&c.textToggleDuringPlayback&&c.spaceToggle&&c.oldProgressPreserved));
 const pictured=browser.checks.filter(c=>c.width===1686&&c.row==='klink-teksten-zelf-a1-r01-v1');assert.equal(pictured.length,2);assert(pictured.every(c=>c.choicesFit),'The pictured question and all answers fit without stage scrolling');
 const review=JSON.parse(read(folder+'review.json'));for(const k of ['sourcePreserved','audioPreserved','progressPreserved','textSizePreserved','controlsPreserved','gapReduced','keyboard','mobileTouch','nativeAudio','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read(folder+'backup.json'));assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);return r;
}
export function readBeforeTextQuestionSpacing(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',base+':'+file):read(file);}
