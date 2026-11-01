import {verifySynonymRecoveryRelease,readBeforeSynonymRecovery} from './check-synonym-recovery-release-20261101.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const base='b1888a37ad2783e08dd16b6c8ad71dc1863bba6d';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const allowed=['app/learner-layout.css',...['alfa-c-dagelijks','alfa-c-docent','alfa-c-workspace','dialogue-surface','exercise-listen','exercise-view','extended-practice-surface','imported-practice-surface','learning-path-surface','package-exercise-browser','package-group-practice','practice-chapters','route-settings'].map(n=>'components/product/'+n+'.tsx'),'data/klink-teacher-manual.json','docs/KLINK-DOCENTHANDLEIDING.md','scripts/check-single-practice-title-release-20261031.mjs','scripts/check-exercise-view-release-20261101.mjs','scripts/test-exercise-view-release-20261101.mjs','scripts/test-exercise-view-browser-20261101.mjs','scripts/test-exercise-view-preferences-browser-20261101.mjs'].sort((a,b)=>a.localeCompare(b));
export function verifyExerciseViewRelease(read=readFileSync){
 const successor=verifySynonymRecoveryRelease(read);const readCurrent=read;read=file=>readBeforeSynonymRecovery(file,successor,readCurrent);
 const r=JSON.parse(read('docs/klink-owner-release-exercise-view-20261101.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.appearanceChangeApproved,true);assert.equal(r.publicationApproved,true);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,'0c5ed30d9b1703c2c8418387122c248b554dae9d');assert(r.userRequest&&r.previewSha256);
 git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const lines=b=>b.toString().trim().split('\n').filter(Boolean);
 const changed=lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots)).sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,allowed);assert.deepEqual(r.changedFiles,allowed);assert.deepEqual(Object.keys(r.files).sort((a,b)=>a.localeCompare(b)),allowed);for(const f of allowed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only',base,successor.baselineSourceCommit,'--','hooks','lib','public','db','drizzle','.github','package.json','package-lock.json','wrangler.jsonc').length,0,'No media, original persistence, dependencies or configuration changes');
 assert.deepEqual(lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--','data')),['data/klink-teacher-manual.json']);
 assert.equal(read('data/klink-teacher-manual.json').toString(),git('show',base+':data/klink-teacher-manual.json').toString().replace('Met Hulp kies je wanneer de woordfoto helpt; voorbeelden en situatiebeelden blijven zichtbaar.',r.manualReplacement),'Only the outdated help description in the manual changes');
 const folder='docs/exercise-view-20261101/';
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json')),old=JSON.parse(git('show',base+':docs/appearance-floor-20261031/floor.json'));
 assert.deepEqual({...floor,approvedUpdates:old.approvedUpdates},old);assert.deepEqual(floor.approvedUpdates,[...old.approvedUpdates,r.approval]);
 const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);assert.deepEqual(approval.files,r.files);
 const browser=JSON.parse(read(folder+'browser-checks.json'));assert.equal(browser.checks.length,216);assert.deepEqual(browser.errors,[]);
 const audio=JSON.parse(read(folder+'listen-checks.json'));assert.equal(audio.checks.length,204);assert.deepEqual(audio.errors,[]);
 const preferences=JSON.parse(read(folder+'preferences-checks.json'));assert.equal(preferences.checks.length,14);assert.deepEqual(preferences.errors,[]);
 const keys=JSON.parse(read(folder+'keyboard-all-forms.json'));assert.equal(keys.forms,58);assert.equal(keys.checks.length,466);assert.deepEqual(keys.errors,[]);
 const review=JSON.parse(read(folder+'review.json'));for(const k of ['contentPreserved','audioPreserved','progressPreserved','keyboard','mobileTouch','lightDark','types','lint','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read(folder+'backup.json'));assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);
 return {...r,successor};
}
export function readBeforeExerciseView(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',base+':'+file):readBeforeSynonymRecovery(file,r.successor,read);}
