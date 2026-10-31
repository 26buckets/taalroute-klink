import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const git = (...args) => execFileSync('git', args, { maxBuffer:128e6 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
export function verifyWordLibraryRelease(read=readFileSync) {
 const r=JSON.parse(read('docs/klink-owner-release-word-library-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.visualScope,'WordLibrary');
 assert.equal(r.baselineSourceCommit,'ec613bafcdae4591add4b94a65390773df46738f');
 assert.equal(r.liveSourceCommit,'cc7fff4646d3ad9bdb33f13cc7e75eec1b356fa2');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a.localeCompare(b));
 const allowed=['app/learner-ui.css','components/product/learner-app.tsx','lib/word-library.ts','data/klink-word-library-index.json','package.json','scripts/build-word-library-index.mjs','scripts/check-docent-lessons-release-20261031.mjs','scripts/check-word-library-release-20261031.mjs','scripts/test-word-library-release-20261031.mjs','scripts/test-word-library.mjs','scripts/test-word-library-browser.mjs','scripts/test-word-library-continuity-browser.mjs','scripts/test-existing-player-browser.mjs','scripts/test-learner-ux-browser.mjs','scripts/test-review-saved-words-browser.mjs','scripts/test-word-articles-browser.mjs','scripts/test-word-audio-ui-browser.mjs'];
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));assert(changed.every(f=>allowed.includes(f)),'Only the approved word library and its checks');
 for(const[f,h]of Object.entries(r.files))assert.equal(sha(read(f)),h,f);for(const f of changed)assert(r.files[f],f);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','data','public').length,0,'Existing content and media remain byte-identical');
 const component='components/product/learner-app.tsx',before=git('show',r.baselineSourceCommit+':'+component).toString(),after=read(component).toString();
 const outside=s=>s.replace(/function WordLibrary\([\s\S]*?\nfunction ReviewQueue\(/,'function ReviewQueue(').replace(/^import .*from '@\/lib\/(word-library|content-levels)';\n/gm,'');
 assert.equal(outside(after),outside(before),'All other learner screens and storage code preserved');
 const card=s=>s.slice(s.indexOf('<article key={word.id}>'),s.indexOf('</article>; })}')+11);assert.equal(card(after),card(before),'Original word cards and media actions preserved');
 assert(read('app/learner-ui.css').toString().startsWith(git('show',r.baselineSourceCommit+':app/learner-ui.css').toString()),'Existing styles preserved');
 const oldPackage=JSON.parse(git('show',r.baselineSourceCommit+':package.json'));oldPackage.scripts.prebuild='node scripts/build-word-library-index.mjs --check && '+oldPackage.scripts.prebuild;assert.deepEqual(JSON.parse(read('package.json')),oldPackage);
 const index=JSON.parse(read('data/klink-word-library-index.json'));assert.equal(new Set(index.collections.flatMap(c=>Object.values(c.levels).flat())).size,5127);
 const review=JSON.parse(read('docs/word-library-menu-20261031/review.json'));
 for(const key of ['exactExerciseMapping','searchFilters','savedWords','mediaPreserved','pagination','desktopMobile','lightDark','otherScreensPreserved','types','lint','build','localOnly'])assert.equal(review[key],true,key);
 const backup=JSON.parse(read('docs/word-library-menu-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeWordLibrary(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
