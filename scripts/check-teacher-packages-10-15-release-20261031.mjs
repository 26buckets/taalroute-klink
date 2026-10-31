import {verifyWorksheetCleanupRelease,readBeforeWorksheetCleanup} from './check-worksheet-cleanup-release-20261031.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b));
const lines=b=>sort(b.toString().trim().split('\n').filter(Boolean));
const base='9d22cfcc',folder='docs/lespakketten-10-15-20261031';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const before=f=>git('show',base+':'+f);
export function verifyNextTeacherPackagesRelease(read=readFileSync){
 const successor=verifyWorksheetCleanupRelease(read),currentRead=read;read=file=>readBeforeWorksheetCleanup(file,successor,currentRead);
 const r=JSON.parse(read('docs/klink-owner-release-teacher-packages-10-15-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.baselineSourceCommit,git('rev-parse',base).toString().trim());assert.equal(r.liveSourceCommit,'61f8ae7801b832b541149806a4cd897ef81b6b22');assert(r.userRequest&&r.repairRequest);
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
 const changed=lines(git('diff','--name-only',base,successor.baselineSourceCommit,'--',...roots));
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 const source=JSON.parse(read(folder+'/sources.json')),assets=new Set(source.files.map(f=>f.path));
 const allowed=new Set(['lib/teacher-classroom.ts','lib/teacher-worksheets.ts','components/product/teacher-classroom.tsx','components/product/teacher-classroom.css','data/klink-docent-extra-lessons-10-15.json','data/klink-compact-images-20261031.json','data/klink-image-preparation.json','scripts/test-teacher-packages-1-9.mjs','scripts/test-teacher-packages-10-15.mjs','scripts/check-reading-audio-release-20261031.mjs','scripts/check-teacher-packages-10-15-release-20261031.mjs','scripts/test-teacher-packages-10-15-release-20261031.mjs']);
 for(const f of changed)assert(allowed.has(f)||assets.has(f),'Outside packages 10–15: '+f);
 const previousPublic=new Set(lines(git('ls-tree','-r','--name-only',base,'--','public')));for(const f of changed.filter(f=>f.startsWith('public/')))assert(!previousPublic.has(f),'Existing published media cannot change');
 for(const f of source.files)assert.equal(sha(read(f.path)),f.sha256,f.path);
 for(const f of ['data/klink-compact-images-20261031.json','data/klink-image-preparation.json']){const a=JSON.parse(before(f)),b=JSON.parse(read(f));for(const[k,v]of Object.entries(a))assert.deepEqual(b[k],v,'Existing image mapping: '+k);for(const k of Object.keys(b).filter(k=>!(k in a)))assert(k.startsWith('/docent-werkbladen/lespakketten-10-15/'));}
 const css='components/product/teacher-classroom.css',tsx='components/product/teacher-classroom.tsx';
 assert.equal(read(css).toString(),before(css).toString()+'\n@media (max-width: 360px) {\n  .kpd-big-word[data-word="maand"] {\n    font-size: 80px;\n  }\n}\n');
 assert.equal(read(tsx).toString(),before(tsx).toString().replaceAll('<p className="kpd-big-word">{matWord.word}</p>','<p className="kpd-big-word" data-word={matWord.word}>{matWord.word}</p>'));
 const appearance=JSON.parse(read(folder+'/month-appearance-approval.json'));assert.equal(appearance.approvedBy,'Nico');assert.equal(appearance.answer,'Ja, voer dit gerichte herstel uit');assert.equal(appearance.onlyWord,'maand');assert.equal(appearance.maxWidth,360);assert.equal(appearance.fontSize,80);assert.equal(r.appearanceChanged,true);
 assert.equal(read('docs/appearance-floor-20261031/floor.json').toString(),before('docs/appearance-floor-20261031/floor.json').toString());
 assert.equal(git('diff','--name-only',base,successor.baselineSourceCommit,'--','app','hooks','db','drizzle','data/klink-production-index.json','data/klink-progress-image-aliases-20261030.json','data/klink-docent-extra-lessons.json','data/klink-docent-lessons.json','data/klink-docent-mat.json','data/klink-docent-routes.json','data/klink-docent-worksheets.json','lib/learner-progress.ts','lib/learning-review.ts','lib/round-progress.ts','lib/media-player.ts').length,0,'Previous 38 lessons, learner content, reading audio and storage retained');
 const ls=JSON.parse(read('data/klink-docent-extra-lessons-10-15.json'));assert.equal(ls.length,20);assert.equal(new Set(ls.map(l=>l.id)).size,20);assert.equal(ls.flatMap(l=>Object.values(l.routes).flatMap(x=>x.phases)).length,480);assert.equal(ls.flatMap(l=>Object.values(l.worksheet.rounds).flatMap(x=>x.answers)).length,600);
 const kernels=JSON.parse(read(folder+'/source-kernels.json'));for(const l of ls){const k=kernels.find(k=>k.id===l.id);assert.equal(l.wordRef,'klink-woord-'+l.id);assert.equal(l.routes.b.example,k.sentence);assert.deepEqual(l.routes.c.example.split('\n'),k.text);}
 const review=JSON.parse(read(folder+'/review.json'));for(const k of ['sourceVersionsChecked','knownRepairsResolved','allTwentyLessons','previousThirtyEightPreserved','matchingPdfsAndAnswers','pdfLayout','handsAndImageDirection','audioMetadata','longVowels','finalDevoicing','lessonStorage','keyboard','desktopMobile','lightDark','learnerPreserved','types','scopedLint','build','localOnly'])assert.equal(review[k],true,k);assert.equal(review.newAudioGenerated,false);assert.equal(review.physicalPrint,false);assert.equal(review.classroomPilot,false);
 const audio=JSON.parse(read(folder+'/audio-all-clips.json'));assert.equal(audio.checks.length,35);assert(audio.metadataChecked);for(const a of audio.checks)assert.equal(sha(read('public'+a.src)),a.sha256,a.src);
 const backup=JSON.parse(read(folder+'/backup.json'));assert(backup.verified&&backup.fullReadback&&backup.driveFolderId&&backup.archives.length>=6);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return {...r,successor};
}
export function readBeforeNextTeacherPackages(file,r,read=readFileSync){return r.changedFiles.includes(file)?before(file):readBeforeWorksheetCleanup(file,r.successor,read);}
