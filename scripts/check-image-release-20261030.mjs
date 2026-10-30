import {verifyImageRepairs,readBeforeImageRepairs} from './check-image-repairs-20261030.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024});
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const sha=b=>createHash('sha256').update(b).digest('hex');
export function verifyImageRelease(read=readFileSync){
 const repairSuccessor=verifyImageRepairs(read),currentRead=read;
 read=file=>readBeforeImageRepairs(file,repairSuccessor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-images-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'Hoe ver zijn we nu met de rest van de afbeeldingen? Kijk even wat er inmiddels klaar is en koppel de goedgekeurde beelden ook, zo klein mogelijk, en zet ze online.');
 assert.equal(r.baselineSourceCommit,'e99ee54ae0a086edb9ddd9a4f09c9e41660472b7');assert.equal(r.liveSourceCommit,'3be0062a2ddf42f9758a6dc15473f28cfb076591');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,repairSuccessor.baselineSourceCommit,'--',...roots)).sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 const code=['components/product/package-exercise-browser.tsx','data/klink-production-index.json','data/klink-progress-image-aliases-20261030.json','lib/round-progress.ts','scripts/check-layout-fixes-release.mjs','scripts/check-image-release-20261030.mjs','scripts/test-production-content.mjs','scripts/test-image-release-20261030.mjs','scripts/test-images-browser-20261030.mjs'];
 assert(changed.every(f=>code.includes(f)||/^public\/package-media\/klink-beelden-20261030\/[a-z0-9_]+\.webp$/.test(f)||/^public\/practice-content\/klink-20261029\/[a-zA-Z0-9_-]+\.json$/.test(f)),'Only reviewed images, exact exercise links and progress preservation');
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff',r.baselineSourceCommit,repairSuccessor.baselineSourceCommit,'--','app','components','hooks','db','drizzle','public/package-audio',':(exclude)components/product/package-exercise-browser.tsx').length,0);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,repairSuccessor.baselineSourceCommit,'--','public').length,0,'All existing immutable media/content retained');
 const review=JSON.parse(read('docs/images-20261030/review.json'));
 for(const k of ['images','hands','sourceLinks','types','lint','build','unit','browser','menu','progressPreserved','localOnly'])assert.equal(review[k],true,k);
 const media=JSON.parse(read('docs/images-20261030/media.json'));assert.equal(media.assets.length,52);assert.equal(media.summary.newScenes,32);assert.equal(media.summary.linkedWordExercises,52);
 for(const a of media.assets){assert(a.bytes<150000);assert(a.width<=768&&a.height<=768);assert.equal(sha(read('public'+a.url)),a.sha256);}
 const backup=JSON.parse(read('docs/images-20261030/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,repairSuccessor};
}
export function readBeforeImageRelease(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):readBeforeImageRepairs(file,r.repairSuccessor,read);}
