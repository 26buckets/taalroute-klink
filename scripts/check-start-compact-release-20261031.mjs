import {verifyWordPlaceholderRelease,readBeforeWordPlaceholder} from './check-word-placeholder-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const lines=bytes=>bytes.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
export function verifyStartCompactRelease(read=readFileSync){
 const successor=verifyWordPlaceholderRelease(read),currentRead=read;read=file=>readBeforeWordPlaceholder(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-start-compact-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.appearanceChangeApproved,true);assert.equal(r.publicationApproved,true);
 assert.equal(r.baselineSourceCommit,'6248d38e40f9614a8c875bc8f4c388d8897f4a5c');
 assert.equal(r.liveSourceCommit,'ec0fb8f1e856062eeaebf98c9a8f52044e8cee3f');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 const expected=['app/learner-layout.css','components/product/learner-app.tsx','components/product/practice-chapters.tsx','components/product/practice-header.tsx','scripts/check-package-grid-release-20261031.mjs','scripts/check-start-compact-release-20261031.mjs','scripts/test-start-compact-release-20261031.mjs','scripts/test-start-compact-browser-20261031.mjs'].sort((a,b)=>a.localeCompare(b));
 assert.deepEqual(changed,expected);assert.deepEqual(r.changedFiles,expected);
 for(const file of changed)assert.equal(sha(read(file)),r.files[file],file);
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','hooks','data','lib','public').length,0,'All content, media, audio and storage code preserved');
 const before=file=>git('show',r.baselineSourceCommit+':'+file).toString();
 const header='components/product/practice-header.tsx';
 assert.equal(read(header).toString(),before(header).replace('title: string;','title: ReactNode;'));
 const chapters='components/product/practice-chapters.tsx';
 assert.equal(read(chapters).toString(),before(chapters)
  .replace('onAttempt, startActions, startFooter','onAttempt, startTitle, startActions, startFooter')
  .replace('startActions?: ReactNode;','startTitle?: ReactNode; startActions?: ReactNode;')
  .replace('<PracticeHeader title={title} headingRef={heading}','<PracticeHeader title={!chapter && startTitle ? startTitle : title} headingRef={heading}'));
 const home='components/product/learner-app.tsx';
 const outside=s=>s.replace(/function LearnerHome\([\s\S]*?\nfunction WordLibrary\(/,'function WordLibrary(');
 assert.equal(outside(read(home).toString()),outside(before(home)),'Words/review/teacher/player code unchanged');
 const css='app/learner-layout.css',prefix=before(css).replace('.cp-home.cp-direct-practice > .cp-context-header h1,','.cp-home.cp-direct-practice > .cp-context-header h1:not(:has(.cp-direct-resume)),');
 assert(read(css).toString().startsWith(prefix),'Existing styling retained');
 const added=read(css).toString().slice(prefix.length);
 assert.equal(added.split('{').length-1,7);assert(added.split('\n').filter(line=>line.includes('{')).every(line=>line.includes('.cp-home')),'Only Start spacing and controls change');
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json'));
 assert.equal(floor.sourceCommit,'cc7fff4646d3ad9bdb33f13cc7e75eec1b356fa2');assert(floor.approvedUpdates.includes('docs/appearance-floor-20261031/approved-updates/start-compact-20261031.json'));
 const review=JSON.parse(read('docs/start-compact-20261031/review.json'));
 for(const key of ['navigation','mobile','keyboard','progress','contentPreserved','otherScreensPreserved','lightDark','types','lint','build','localOnly'])assert.equal(review[key],true,key);
 const backup=JSON.parse(read('docs/start-compact-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256);
 for(const file of changed)assert.equal(backup.files[file],r.files[file],file);
 return {...r,successor};
}
export function readBeforeStartCompact(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeWordPlaceholder(file,r.successor,read);}
