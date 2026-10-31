import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),sort=xs=>xs.sort((a,b)=>a.localeCompare(b)),lines=b=>sort(b.toString().trim().split('\n').filter(Boolean));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyTeacherWorksheetsRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-worksheets-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.appearanceChangeApproved,true);assert.equal(r.publicationApproved,true);
 assert.equal(r.baselineSourceCommit,'cee1648f170a4ee42c3d103908612bca60072acb');assert.equal(r.liveSourceCommit,'feb9d1276880b571a85506393f4cc6430ddc9b47');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 const allowed=new Set(['AGENTS.md','components/product/classroom-boundary.tsx','components/product/teacher-classroom.css','components/product/teacher-classroom.tsx','components/product/teacher-workspace-frame.tsx','data/klink-compact-images-20261031.json','data/klink-docent-worksheets.json','data/klink-image-preparation.json','lib/teacher-worksheets.ts','scripts/preview-worksheet-dashboard-20261031.mjs','scripts/review-teacher-materials-20261031.mjs','scripts/test-teacher-direct-board-browser.mjs','scripts/test-teacher-print-layout.mjs','scripts/test-teacher-redesign-browser.mjs','scripts/test-teacher-worksheets-browser.mjs','scripts/test-teacher-worksheets.mjs','scripts/check-review-style-release-20261031.mjs','scripts/check-teacher-worksheets-release-20261031.mjs','scripts/test-teacher-worksheets-release-20261031.mjs']);
 const source=JSON.parse(read('docs/werkbladen-koppeling-20261031/sources.json'));
 const media=new Set(source.files.map(x=>x.path));media.add('public/docent-werkbladen/kpd08/docentantwoorden.pdf');
 for(const f of ['data/klink-compact-images-20261031.json','data/klink-image-preparation.json']){
  const old=JSON.parse(git('show',r.baselineSourceCommit+':'+f)),next=JSON.parse(read(f));
  for(const [k,v]of Object.entries(old))assert.deepEqual(next[k],v,`Existing image mapping ${k}`);
  const additions=Object.keys(next).filter(k=>!(k in old));assert.equal(additions.length,48);for(const k of additions){assert(media.has('public'+k));media.add('public'+(typeof next[k]==='string'?next[k]:next[k].url));}
 }
 for(const f of changed)assert(allowed.has(f)||media.has(f),`Out of scope ${f}`);
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,'--','app','hooks','db','drizzle','lib/teacher-classroom.ts','lib/learner-progress.ts','lib/learning-review.ts').length,0,'Learner UI, lesson content and storage preserved');
 for(const f of changed.filter(f=>f.startsWith('public/')))assert(!git('ls-tree','--name-only',r.baselineSourceCommit,'--',f).length,'Existing media cannot change');
 for(const f of source.files)assert.equal(sha(read(f.path)),f.sha256,f.path);
 assert.equal(sha(read('public/docent-werkbladen/kpd08/docentantwoorden.pdf')),source.answerSha256);
 assert.equal(sha(read('data/klink-docent-worksheets.json')),source.catalogSha256);
 const sheets=JSON.parse(read('data/klink-docent-worksheets.json'));assert.deepEqual(sheets.map(x=>x.id),['mat','tas','map','man','pan','jas','pen','pet']);assert.equal(sheets.flatMap(x=>Object.values(x.rounds).flatMap(s=>s.answers)).length,240);
 const approval=JSON.parse(read(r.approval));assert.equal(approval.approvedBy,'Nico');assert.equal(approval.userRequest,r.userRequest);for(const[f,h]of Object.entries(approval.files))assert.equal(h,r.files[f]);
 const floor=JSON.parse(read('docs/appearance-floor-20261031/floor.json'));const oldFloor=JSON.parse(git('show',r.baselineSourceCommit+':docs/appearance-floor-20261031/floor.json'));assert.deepEqual({...floor,approvedUpdates:oldFloor.approvedUpdates},oldFloor);assert.deepEqual(floor.approvedUpdates,[...oldFloor.approvedUpdates,r.approval]);
 const review=JSON.parse(read('docs/werkbladen-publicatie-20261031/review.json'));for(const k of ['originalPdfs','matchingAnswers','allEightLessons','threeRounds','returnPosition','reloadSelection','mobile','lightDark','learnerPreserved','printLayouts','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read('docs/werkbladen-publicatie-20261031/backup.json'));assert(backup.verified&&backup.driveId&&backup.sha256);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeTeacherWorksheets(file,r,read=readFileSync){return r.changedFiles.includes(file)||file==='docs/appearance-floor-20261031/floor.json'?git('show',r.baselineSourceCommit+':'+file):read(file);}
