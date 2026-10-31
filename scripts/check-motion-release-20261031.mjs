import {verifyReadingRoundsRelease,readBeforeReadingRounds} from './check-reading-rounds-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const lines=b=>sort(b.toString().trim().split('\n').filter(Boolean));
export function verifyMotionRelease(read=readFileSync){
 const successor=verifyReadingRoundsRelease(read),currentRead=read;read=file=>readBeforeReadingRounds(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-motion-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.appearanceChangeApproved,true);assert.equal(r.publicationApproved,true);
 assert.equal(r.baselineSourceCommit,'7e7cf58ecc25e0a24fd81a4da584e3f8c1dbe03f');assert.equal(r.liveSourceCommit,'7b0e0a8862f50b519c70ce6d25acea3f641e8eed');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 const allowed=sort(['app/layout.tsx','app/motion.css','components/product/motion-feedback.tsx','components/product/package-exercise-browser.tsx','components/product/alfa-c-practice.tsx','components/product/alfa-c-functioneel.tsx','components/product/alfa-c-dagelijks.tsx','lib/media-player.ts','scripts/check-teacher-worksheets-release-20261031.mjs','scripts/check-motion-release-20261031.mjs','scripts/test-motion-release-20261031.mjs','scripts/test-motion-browser-20261031.mjs']);
 assert.deepEqual(changed,allowed);assert.deepEqual(r.changedFiles,allowed);assert.deepEqual(sort(Object.keys(r.files)),allowed);for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','data','public','hooks','db','drizzle','lib/learner-progress.ts','lib/learning-review.ts','lib/round-progress.ts','lib/practice-chapters.ts').length,0,'Content, media, routes, worksheets and persistence unchanged');
 const media='lib/media-player.ts',old=git('show',r.baselineSourceCommit+':'+media).toString(),next=read(media).toString();
 assert.equal(next.replace("  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('klink-audio-source', { detail: audio }));\n",''),old,'Playback timing, policy, tempo and cancellation unchanged');
 for(const name of ['alfa-c-practice','alfa-c-functioneel','alfa-c-dagelijks']){const f='components/product/'+name+'.tsx';assert.equal(read(f).toString().replace(' data-motion-feedback={result}',''),git('show',r.baselineSourceCommit+':'+f).toString(),'Only the existing Alfa C feedback state is exposed for styling');}
 const feedback=read('components/product/motion-feedback.tsx').toString();assert(!/preventDefault|stopPropagation|localStorage|sessionStorage|\.play\(|\.pause\(/.test(feedback),'Visual feedback cannot intercept controls, change storage or control audio');
 const css=read('app/motion.css').toString();assert(css.includes('prefers-reduced-motion: reduce'));assert(css.includes(', print'));assert(!/font(?:-|:)|padding:|margin:|grid-template|position:/.test(css),'No new typography or page layout');
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json')),before=JSON.parse(git('show',r.baselineSourceCommit+':docs/appearance-floor-20261031/floor.json'));assert.deepEqual({...floor,approvedUpdates:before.approvedUpdates},before);assert.deepEqual(floor.approvedUpdates,[...before.approvedUpdates,r.approval]);
 const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);assert.equal(approval.approvedBy,'Nico');for(const[f,h]of Object.entries(approval.files))assert.equal(h,r.files[f]);
 const review=JSON.parse(read('docs/motion-20261031/review.json'));for(const k of ['layoutPreserved','contentPreserved','audioPreserved','progressPreserved','keyboard','mobileTouch','reducedMotion','lightDark','worksheetsPreserved','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/motion-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256&&backup.fullReadback);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeMotion(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',r.baselineSourceCommit+':'+file):readBeforeReadingRounds(file,r.successor,read);}
