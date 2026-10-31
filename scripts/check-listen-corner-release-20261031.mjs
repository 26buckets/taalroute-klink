import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const base='52d2048bacd0c3de4b9bf765d80f2929114cb8f8';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const allowed=[
 'app/learner-layout.css',
 ...['exercise-listen','package-exercise-browser','package-group-practice','extended-practice-surface','standard-practice-surface','learning-path-surface','dialogue-surface','alfa-c-practice','alfa-c-dagelijks','alfa-c-functioneel','alfa-c-docent'].map(n=>'components/product/'+n+'.tsx'),
 'scripts/check-teacher-packages-10-15-release-20261031.mjs','scripts/check-worksheet-cleanup-release-20261031.mjs','scripts/check-listen-corner-release-20261031.mjs','scripts/test-listen-corner-release-20261031.mjs','scripts/test-listen-corner-browser-20261031.mjs','scripts/test-alfa-c-docent-browser.mjs',
];
export function verifyListenCornerRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-listen-corner-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChangeApproved,true);
 assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,'4ebac3a0b2d01368beeba90667280464ac76e5c0');assert(r.userRequest);
 git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,sort([...allowed]));assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only',base,'--','hooks','data','lib','public','db','drizzle','components/product/teacher-classroom.tsx','components/product/teacher-classroom.css').length,0,'Content, audio, lessons, worksheets, routes and persistence unchanged');
 const control=read('components/product/exercise-listen.tsx').toString();
 assert(control.includes('createPortal'));assert(control.includes('aria-label={label}'));assert(control.includes('aria-keyshortcuts="Space"'));
 assert(!/localStorage|sessionStorage|\.play\(|\.pause\(|new Audio|preventDefault/.test(control),'Only placement changes; existing handlers own playback and progress');
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json')),oldFloor=JSON.parse(git('show',base+':docs/appearance-floor-20261031/floor.json'));
 assert.deepEqual({...floor,approvedUpdates:oldFloor.approvedUpdates},oldFloor);assert.deepEqual(floor.approvedUpdates,[...oldFloor.approvedUpdates,r.approval]);
 const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);assert.equal(approval.approvedBy,'Nico');for(const[f,h]of Object.entries(approval.files))assert.equal(h,r.files[f]);
 const folder='docs/listen-corner-20261031/';
 const review=JSON.parse(read(folder+'review.json'));for(const k of ['layoutPreserved','contentPreserved','audioPreserved','progressPreserved','keyboard','mobileTouch','lightDark','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const keys=JSON.parse(read(folder+'keyboard-all-forms.json'));assert.equal(keys.forms,58);assert.equal(keys.checks.length,466);assert.deepEqual(keys.errors,[]);
 const browser=JSON.parse(read(folder+'browser-checks.json'));assert.equal(browser.checks.length,192);assert.deepEqual(browser.errors,[]);
 const backup=JSON.parse(read(folder+'backup.json'));assert(backup.verified&&backup.fullReadback&&backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeListenCorner(file,r,read=readFileSync){
 return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',base+':'+file):read(file);
}
