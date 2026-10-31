import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b)),lines=b=>b.toString().trim().split('\n').filter(Boolean);
const base='093a01a42f5c2d2763a2943d5a79b0d6b37a8792';
const players=['package-exercise-browser','alfa-c-practice','alfa-c-functioneel','alfa-c-dagelijks','alfa-c-docent'].map(n=>'components/product/'+n+'.tsx');
const allowed=['app/learner-layout.css',...players,'scripts/check-listen-corner-release-20261031.mjs','scripts/check-listen-playfield-left-release-20261031.mjs','scripts/test-listen-playfield-left-release-20261031.mjs','scripts/test-listen-playfield-left-browser-20261031.mjs'];
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyListenPlayfieldLeftRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-listen-playfield-left-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.appearanceChangeApproved,true);assert.equal(r.publicationApproved,true);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,'7e713d637dc5a213d488528efa663327fc752341');assert(r.userRequest&&r.screenshotSha256);
 git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);assert.deepEqual(changed,sort([...allowed]));assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 const withoutSlot=s=>s.replace('{!teacher && <ExerciseAudioSlot />}','').replaceAll('<ExerciseAudioSlot />','').replace(/\s/g,'');
 for(const f of players)assert.equal(withoutSlot(read(f).toString()),withoutSlot(git('show',base+':'+f).toString()),'Only the JSX slot location changes: '+f);
 assert.equal(git('diff','--name-only',base,'--','hooks','data','lib','public','db','drizzle','components/product/exercise-listen.tsx','components/product/package-group-practice.tsx').length,0,'Content, media, handlers, routes and storage unchanged');
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json')),old=JSON.parse(git('show',base+':docs/appearance-floor-20261031/floor.json'));assert.deepEqual({...floor,approvedUpdates:old.approvedUpdates},old);assert.deepEqual(floor.approvedUpdates,[...old.approvedUpdates,r.approval]);
 const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);for(const[f,h]of Object.entries(approval.files))assert.equal(h,r.files[f]);
 const folder='docs/listen-playfield-left-20261031/';
 const review=JSON.parse(read(folder+'review.json'));for(const k of ['markedLocation','keyboard','mobileTouch','lightDark','audioPreserved','progressPreserved','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const browser=JSON.parse(read(folder+'browser-checks.json'));assert.equal(browser.checks.length,204);assert.deepEqual(browser.errors,[]);assert.equal(browser.checks.filter(c=>c.route==='marked-dialogue').length,12);
 const keyboard=JSON.parse(read(folder+'keyboard-all-forms.json'));assert.equal(keyboard.forms,58);assert.equal(keyboard.checks.length,466);assert.deepEqual(keyboard.errors,[]);
 const backup=JSON.parse(read(folder+'backup.json'));assert(backup.verified&&backup.fullReadback&&backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeListenPlayfieldLeft(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',base+':'+file):read(file);}
