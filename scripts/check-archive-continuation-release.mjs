import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function verifyArchiveContinuationRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-archive-continuation-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.newGeneration,false);
 assert.equal(r.userRequest,'Ga door met die overige 268 woordvakken. Beoordeel de bestaande afbeeldingen in de chats en op Drive, koppel wat goed is en zet het meteen online. Niet opnieuw maken als er al een bruikbaar beeld bestaat.');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['docs/KLINK-DOCENTHANDLEIDING.md','app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a.localeCompare(b));assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 const allowed=['components/product/taalroute-header.tsx','data/klink-production-index.json','data/klink-progress-image-aliases-20261030.json','scripts/build-practice-overview.mjs','scripts/check-archive-images-release.mjs','scripts/check-archive-continuation-release.mjs','scripts/test-word-image-beta.mjs','scripts/test-meet-word-lists-20261030.mjs','scripts/test-archive-continuation-20261030.mjs','scripts/test-archive-continuation-browser-20261030.mjs','public/klink-oefenoverzicht-archief-vervolg-20261030.html'];
 assert(changed.every(f=>allowed.includes(f)||/^public\/package-media\/klink-archief-vervolg-20261030\/[a-z]+\.webp$/.test(f)||/^public\/practice-content\/klink-20261029\/(beta-images|word-meet)-[a-zA-Z0-9_-]+\.json$/.test(f)));
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 for(const f of r.historicalFiles)assert.equal(sha(read(f)),r.documentFiles[f],f);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','public').length,0);
 const media=JSON.parse(read('docs/archive-continuation-20261030/media.json'));assert.equal(sha(read('docs/archive-continuation-20261030/media.json')),r.mediaSha256);assert.equal(media.assets.length,29);
 for(const a of media.assets){assert.equal(sha(read('public'+a.url)),a.sha256);assert(a.bytes<140000);assert.equal(a.ownerRejectionFound,false);assert(a.handsReviewed&&a.meaningReviewed&&a.observerReviewed);}
 const review=JSON.parse(read('docs/archive-continuation-20261030/review.json'));for(const key of ['images','hands','types','lint','build','content','answers','browser','progressPreserved','localOnly'])assert.equal(review[key],true,key);
 const backup=JSON.parse(read('docs/archive-continuation-20261030/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeArchiveContinuation(file,r,read=readFileSync){return r.changedFiles.includes(file)||r.historicalFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):read(file);}
