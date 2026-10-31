import {verifyStartStepRelease,readBeforeStartStep} from './check-start-step-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a.localeCompare(b));
export function verifyDocentLessonsRelease(read=readFileSync){
 const successor=verifyStartStepRelease(read),currentRead=read;read=file=>readBeforeStartStep(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-docent-lessons-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
 assert.equal(r.baselineSourceCommit,'b0191b87b73e4062f1a9d19a4b60dc067917a938');
 assert.equal(r.liveSourceCommit,'b0191b87b73e4062f1a9d19a4b60dc067917a938');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 assert.deepEqual(changed,[...r.changedFiles].sort((a,b)=>a.localeCompare(b)));
 const allowed=['scripts/test-production-answers.mjs','components/product/classroom-boundary.tsx','components/product/taalroute-header.tsx','components/product/teacher-classroom.css','components/product/teacher-classroom.tsx','components/product/teacher-route-stage.tsx','components/product/teacher-workspace-frame.tsx','lib/teacher-classroom.ts','data/klink-docent-lessons.json','scripts/check-review-empty-release-20261031.mjs','scripts/check-docent-lessons-release-20261031.mjs','scripts/test-docent-lessons-release-20261031.mjs','scripts/test-teacher-lessons.mjs','scripts/test-teacher-lessons-browser.mjs','scripts/test-teacher-classroom-edges.mjs','scripts/test-teacher-direct-board-browser.mjs','scripts/test-teacher-phonemes-browser-20261030.mjs','scripts/test-teacher-print-layout.mjs','scripts/test-teacher-redesign-browser.mjs'];
 assert(changed.every(f=>allowed.includes(f)),'Only reviewed teacher UI, lesson data and local checks');
 assert.equal(git('diff','--name-only','--diff-filter=MD',r.baselineSourceCommit,'--','data','public').length,0,'Existing lessons, media, answers and progress maps remain byte-identical');
 for(const[f,h]of Object.entries(r.files))assert.equal(sha(read(f)),h,f);for(const f of changed)assert(r.files[f],f);
 const lessons=JSON.parse(read('data/klink-docent-lessons.json'));assert.deepEqual(lessons.map(l=>l.id),['tas','map','man','pan','jas','pen','pet']);
 for(const l of lessons){assert.equal(l.phases.length,8);for(const route of ['b','c'])assert.equal(l.routes[route].phases.length,8);assert.equal(l.routes.c.example.split('\n')[0],l.routes.b.example);}
 const review=JSON.parse(read('docs/docent-lessen-release-20261031/review.json'));for(const k of ['sourceMapping','images','hands','audioMetadata','contentPreserved','lessonIsolation','allPhases','navigation','keyboard','progress','privacy','print','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/docent-lessen-release-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeDocentLessons(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeStartStep(file,r.successor,read);}
