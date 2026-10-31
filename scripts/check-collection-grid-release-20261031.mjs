import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),sort=xs=>xs.sort((a,b)=>a.localeCompare(b)),lines=b=>sort(b.toString().trim().split('\n').filter(Boolean));
export function verifyCollectionGridRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-collection-grid-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.appearanceChangeApproved,true);assert.equal(r.publicationApproved,true);
 assert.equal(r.baselineSourceCommit,'a441bf351c8c8b6b7f5332d4fcd212dde227e952');assert.equal(r.liveSourceCommit,'a441bf351c8c8b6b7f5332d4fcd212dde227e952');assert(r.userRequest.includes('Ik wil dat ze dezelfde afstand houden als de vier kaarten in als A, als B.'));
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 const expected=sort(['app/learner-ui.css','scripts/check-word-placeholder-release-20261031.mjs','scripts/check-collection-grid-release-20261031.mjs','scripts/test-collection-grid-release-20261031.mjs','scripts/test-collection-grid-browser-20261031.mjs']);assert.deepEqual(changed,expected);assert.deepEqual(sort([...r.changedFiles]),expected);for(const f of expected)assert.equal(sha(read(f)),r.files[f],f);
 const css='app/learner-ui.css',before=git('show',r.baselineSourceCommit+':'+css).toString(),anchor='.cp-chapter-grid, .cp-chapter-collections { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr)); gap: 12px; }';assert.equal(read(css).toString(),before.replace(anchor,anchor+'\n.cp-chapter-collections { grid-template-columns: repeat(auto-fill, minmax(min(100%, 260px), 1fr)); }'),'Only list-card tracks retain empty slots');
 const approval=JSON.parse(read(r.approval));assert.equal(approval.userRequest,r.userRequest);assert.equal(approval.afterSha256,r.files[css]);assert(JSON.parse(read('docs/appearance-floor-20261031/floor.json')).approvedUpdates.includes(r.approval));
 for(const[f,h]of Object.entries(r.evidence))assert.equal(sha(read(f)),h,f);
 const review=JSON.parse(read('docs/collection-grid-20261031/review.json'));for(const k of ['sixLevels','fixedTracks','responsive','lightDark','navigation','progress','contentPreserved','otherScreensPreserved','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/collection-grid-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256);for(const f of expected)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeCollectionGrid(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',r.baselineSourceCommit+':'+file):read(file);}
