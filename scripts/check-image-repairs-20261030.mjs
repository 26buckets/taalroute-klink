import {verifyBetaRelease,readBeforeBetaRelease} from './check-beta-release-20261030.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128*1024*1024});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
export function verifyImageRepairs(read=readFileSync){
 const betaSuccessor=verifyBetaRelease(read),currentRead=read;read=file=>readBeforeBetaRelease(file,betaSuccessor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-image-repairs-20261030.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.userRequest,'Zorg dat het online komt te staan. Blijft veel te lang offline staan. Direct publiceren.');
 assert.equal(r.sourceLocationCorrection,'Staat op de Google Drive.');
 assert.equal(r.baselineSourceCommit,'361c1d9da0f7a12514c326650d6660c3b8084cb8');
 assert.equal(r.liveSourceCommit,'89fe121338c1c08ed7238dceaba794a953c7fec2');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','vite.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,betaSuccessor.baselineSourceCommit,'--',...roots)).sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 const allowed=['data/klink-production-index.json','data/klink-progress-image-aliases-20261030.json','scripts/check-word-repairs-20261030.mjs','scripts/check-image-repairs-20261030.mjs','scripts/test-image-repairs-20261030.mjs','scripts/test-image-repairs-browser-20261030.mjs','scripts/test-production-content.mjs','scripts/test-production-answers.mjs'];
 assert(changed.every(f=>allowed.includes(f)||/^public\/package-media\/klink-beelden-20261030\/[a-z0-9_]+_nl\.webp$/.test(f)||/^public\/practice-content\/klink-20261029\/[a-zA-Z0-9_-]+\.json$/.test(f)));
 for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,betaSuccessor.baselineSourceCommit,'--','public').length,0,'Existing public files are immutable');
 const media=JSON.parse(read('docs/image-repairs-20261030/media.json'));
 assert.equal(media.assets.length,8);assert.equal(media.summary.newScenes,2);assert.equal(media.summary.placements,22);
 for(const a of media.assets){assert(a.bytes<100000&&a.width<=640&&a.height<=640);assert.equal(sha(read('public'+a.url)),a.sha256);}
 const review=JSON.parse(read('docs/image-repairs-20261030/review.json'));
 for(const k of ['images','hands','sourceLinks','types','lint','build','unit','browser','menu','progressPreserved','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/image-repairs-20261030/backup.json'));assert.equal(backup.verified,true);assert(backup.driveId&&backup.sha256);
 for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,betaSuccessor};
}
export function readBeforeImageRepairs(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',`${r.baselineSourceCommit}:${file}`):readBeforeBetaRelease(file,r.betaSuccessor,read);}
