import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='33463705d0290f07b4502d98c1722aee783f9cbe',live='959d3416064c453d5f0115c89c7835a8a12c05e4',folder='docs/alfa-c-no-scroll-20261101/';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),sort=a=>a.sort((a,b)=>a.localeCompare(b)),lines=b=>b.toString().trim().split('\n').filter(Boolean);
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyAlfaCNoScrollRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-alfa-c-no-scroll-20261101.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChangeApproved,true);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,live);assert(r.userRequest.includes('niet scrollen'));
 git('merge-base','--is-ancestor',live,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,sort([...r.changedFiles,'docs/appearance-floor-20261031/floor.json',r.approval]));assert.deepEqual(sort(Object.keys(r.files)),r.changedFiles);for(const f of r.changedFiles)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only',base,'--','app','hooks','data','lib','public','db','drizzle','.github','package.json','package-lock.json','wrangler.jsonc').length,0,'No content, audio, routes, storage, dependencies or workflows change');
 const normalize=s=>s.replace(/ feedback={<output[^>]*>.*?<\/output>}/gs,'').replace(/<output[^>]*>.*?<\/output>/gs,'').replaceAll('<ExerciseAudioSlot />','').replace(/\s+/g,'');
 for(const name of ['dagelijks','functioneel']){const f=`components/product/alfa-c-${name}.tsx`;assert.equal(normalize(read(f).toString()),normalize(git('show',base+':'+f).toString()),'Only audio-slot and feedback placement change in '+name);}
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json')),old=JSON.parse(git('show',base+':docs/appearance-floor-20261031/floor.json'));assert.deepEqual({...floor,approvedUpdates:old.approvedUpdates},old);assert.deepEqual(floor.approvedUpdates,[...old.approvedUpdates,r.approval]);const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);assert.deepEqual(approval.files,r.files);
 const browser=JSON.parse(read(folder+'browser-checks.json'));assert.equal(browser.checks.length,1200);assert.deepEqual(browser.errors,[]);assert(browser.checks.every(c=>c.noScroll&&c.allContentReachable));
 for(const engine of ['chromium','webkit'])for(const width of [1366,390])assert.equal(browser.checks.filter(c=>c.engine===engine&&c.width===width&&c.height!==600).length,288);
 const focused=JSON.parse(read(folder+'focus-layout/browser-checks.json'));assert.equal(focused.checks.length,72);assert.deepEqual(focused.errors,[]);assert(focused.checks.every(c=>c.noScroll&&c.allContentReachable));
 const interaction=JSON.parse(read(folder+'interaction.json'));assert.equal(interaction.checks.length,4);assert.deepEqual(interaction.errors,[]);assert(interaction.checks.every(c=>c.nativeAudio&&c.keyboard&&c.touch&&c.toggles&&c.progress));
 const review=JSON.parse(read(folder+'review.json'));for(const k of ['all144Assignments','sourcePreserved','audioPreserved','progressPreserved','textSizePreserved','completeParts','keyboard','mobileTouch','nativeAudio','localOnly','reactChecklist'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read(folder+'backup.json'));assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);return r;
}
export function readBeforeAlfaCNoScroll(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',base+':'+file):read(file);}
