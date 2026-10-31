import {verifyReadingAudioRelease,readBeforeReadingAudio} from './check-reading-audio-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const lines=b=>sort(b.toString().trim().split('\n').filter(Boolean));
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
export function verifyTeacherPackagesRelease(read=readFileSync){
 const successor=verifyReadingAudioRelease(read),currentRead=read;read=file=>readBeforeReadingAudio(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-teacher-packages-1-9-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.appearanceChanged,false);assert(r.userRequest&&r.repairRequest);
 assert.equal(r.baselineSourceCommit,'b4df210793db0a5bf9b6bb1a8aecc3a9ee4352c6');assert.equal(r.liveSourceCommit,'b4df210793db0a5bf9b6bb1a8aecc3a9ee4352c6');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots));
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 const allowed=new Set(['components/product/teacher-classroom.tsx','components/product/teacher-route-stage.tsx','lib/teacher-classroom.ts','lib/teacher-worksheets.ts','data/klink-docent-extra-lessons.json','data/klink-compact-images-20261031.json','data/klink-image-preparation.json','scripts/test-teacher-lessons.mjs','scripts/test-teacher-lessons-browser.mjs','scripts/test-teacher-worksheets.mjs','scripts/test-teacher-worksheets-browser.mjs','scripts/test-teacher-packages-1-9.mjs','scripts/check-sentence-rounds-release-20261031.mjs','scripts/check-teacher-packages-release-20261031.mjs','scripts/test-teacher-packages-release-20261031.mjs']);
 const source=JSON.parse(read('docs/lespakketten-1-9-20261031/sources.json'));
 const newAssets=new Set(source.files.map(x=>x.path));
 for(const f of changed)assert(allowed.has(f)||newAssets.has(f),`Outside the nine teacher packages: ${f}`);
 const existingPublic=new Set(lines(git('ls-tree','-r','--name-only',r.baselineSourceCommit,'--','public')));
 for(const f of changed.filter(f=>f.startsWith('public/')))assert(!existingPublic.has(f),'Previously published media cannot change');
 for(const f of source.files)assert.equal(sha(read(f.path)),f.sha256,f.path);
 for(const name of ['data/klink-compact-images-20261031.json','data/klink-image-preparation.json']){
  const before=JSON.parse(git('show',r.baselineSourceCommit+':'+name)),after=JSON.parse(read(name));
  for(const[k,v]of Object.entries(before))assert.deepEqual(after[k],v,`Existing image preparation ${k}`);
  for(const k of Object.keys(after).filter(k=>!(k in before)))assert(k.startsWith('/docent-werkbladen/lespakketten-1-9/'),'Only new lesson previews and drawings');
 }
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','app','hooks','db','drizzle','data/klink-docent-lessons.json','data/klink-docent-mat.json','data/klink-docent-routes.json','data/klink-docent-worksheets.json','lib/learner-progress.ts','lib/learning-review.ts','lib/round-progress.ts','lib/media-player.ts').length,0,'Existing design, lessons, audio player and storage remain intact');
 assert.equal(read('docs/appearance-floor-20261031/floor.json').toString(),git('show',r.baselineSourceCommit+':docs/appearance-floor-20261031/floor.json').toString());
 const lessons=JSON.parse(read('data/klink-docent-extra-lessons.json'));
 assert.equal(lessons.length,30);assert.equal(new Set(lessons.map(l=>l.id)).size,30);
 assert.equal(lessons.flatMap(l=>Object.values(l.routes).flatMap(r=>r.phases)).length,720);
 assert.equal(lessons.flatMap(l=>Object.values(l.worksheet.rounds).flatMap(r=>r.answers)).length,900);
 for(const l of lessons){assert.equal(l.routes.b.example,l.source.sentence);assert.deepEqual(l.routes.c.example.split('\n'),l.source.text);assert.equal(l.wordRef,'klink-woord-'+l.id);}
 const review=JSON.parse(read('docs/lespakketten-1-9-20261031/review.json'));
 for(const k of ['sourceVersionsChecked','knownRepairsResolved','allThirtyLessons','originalEightPreserved','matchingPdfsAndAnswers','pdfLayout','handsAndImageDirection','audioMetadata','repeatedLetters','finalDevoicing','lessonStorage','keyboard','desktopMobile','lightDark','learnerPreserved','types','lint','build','localOnly'])assert.equal(review[k],true,k);
 assert.equal(review.newAudioGenerated,false);assert.equal(review.physicalPrint,false);assert.equal(review.classroomPilot,false);
 const backup=JSON.parse(read('docs/lespakketten-1-9-20261031/backup.json'));assert(backup.verified&&backup.fullReadback&&backup.driveFolderId&&backup.archives.length);
 for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeTeacherPackages(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeReadingAudio(file,r.successor,read);}
