import {verifyTeacherWorksheetsRelease,readBeforeTeacherWorksheets} from './check-teacher-worksheets-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const lines=bytes=>bytes.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
export function verifyReviewStyleRelease(read=readFileSync){
 const successor=verifyTeacherWorksheetsRelease(read),currentRead=read;read=file=>readBeforeTeacherWorksheets(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-review-style-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.appearanceChangeApproved,true);assert.equal(r.publicationApproved,true);
 assert.equal(r.baselineSourceCommit,'b1ca75f831dc14ea901cd4e6d4bc70b5c96a6cf3');assert.equal(r.liveSourceCommit,'bf4eb0cffa0aa0be27cec1df39d1e8126e38e44b');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 const allowed=['app/learner-layout.css','components/product/learner-app.tsx','scripts/check-collection-grid-release-20261031.mjs','scripts/check-review-style-release-20261031.mjs','scripts/test-review-style-release-20261031.mjs','scripts/test-review-style-browser-20261031.mjs'].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,allowed);assert.deepEqual(r.changedFiles,allowed);for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','hooks','data','lib','public').length,0,'Content, media, audio and storage sources unchanged');
 const file='components/product/learner-app.tsx',before=git('show',r.baselineSourceCommit+':'+file).toString(),after=read(file).toString();
 const strip=s=>{const start=s.indexOf('function ReviewQueue('),workspace=s.indexOf('      <div className="cp-page-workspace">',start),end=s.indexOf('      {items.length === 0 ?',workspace);assert(start>=0&&workspace>start&&end>workspace);return s.slice(0,workspace)+s.slice(end);};
 assert.equal(strip(after),strip(before),'Only review toolbar markup changes; all handlers, saved-word cards and availability retained');
 const css='app/learner-layout.css',oldCss=git('show',r.baselineSourceCommit+':'+css).toString(),newCss=read(css).toString();assert(newCss.startsWith(oldCss));
 assert(newCss.slice(oldCss.length).split('\n').filter(line=>line.includes('{')&&!line.startsWith('@media')).every(line=>line.includes('.review-page')),'Only review styles added');
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json'));assert.equal(floor.sourceCommit,'cc7fff4646d3ad9bdb33f13cc7e75eec1b356fa2');assert(floor.approvedUpdates.includes('docs/appearance-floor-20261031/approved-updates/review-style-20261031.json'));
 const review=JSON.parse(read('docs/review-style-20261031/review.json'));for(const key of ['approvedExample','mobile','keyboard','progress','audio','savedWords','mixAndDueWork','otherScreensPreserved','lightDark','types','lint','build','localOnly'])assert.equal(review[key],true,key);
 const backup=JSON.parse(read('docs/review-style-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeReviewStyle(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeTeacherWorksheets(file,r.successor,read);}
