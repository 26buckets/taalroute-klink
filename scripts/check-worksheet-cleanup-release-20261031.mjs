import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex');
const sort=a=>a.sort((a,b)=>a.localeCompare(b)),lines=b=>b.toString().trim().split('\n').filter(Boolean);
const base='f963d52d485e96dc7eb88f688c0a67f27d0f268a',folder='docs/worksheet-cleanup-20261031';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const allowed=['components/product/teacher-classroom.css','components/product/teacher-classroom.tsx','scripts/test-teacher-print-layout.mjs','scripts/check-teacher-packages-10-15-release-20261031.mjs','scripts/check-worksheet-cleanup-release-20261031.mjs','scripts/test-worksheet-cleanup-release-20261031.mjs'];
const before=f=>git('show',base+':'+f);
export function verifyWorksheetCleanupRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-worksheet-cleanup-20261031.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,'4b091f58a07152251209c6fddd0f5aa9f4dd7f23');assert(r.userRequest&&r.appearanceScope);assert.equal(r.observationAppCreated,false);
 git('merge-base','--is-ancestor',r.liveSourceCommit,base);git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);assert.deepEqual(changed,sort([...allowed]));assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);for(const f of changed)assert.equal(sha(read(f)),r.files[f],f);
 assert.equal(git('diff','--name-only',base,'--','app','hooks','data','lib','public','db','drizzle').length,0,'All content, 58 lessons, PDFs, audio, routes and storage remain exact');
 const css='components/product/teacher-classroom.css',tsx='components/product/teacher-classroom.tsx';
 const expected=before(css).toString().replace('.kpd-worksheet-extras details { border-top: 1px solid var(--line); padding: 16px 0; }','.kpd-worksheet-extras details { border-top: 1px solid var(--line); padding: 16px 20px; }').replace('.kpd-worksheet-extras select { margin-left: 12px; }\n','').replace("  body:has(.kpd-worksheets) .kpd-worksheets > :not(:has(.kpd-print-page)),\n  .kpd-worksheet-extras[data-print-kind='extra'] .kpd-worksheet-answers,\n  .kpd-worksheet-extras[data-print-kind='answers'] .kpd-extra-materials { display: none !important; }","  body:has(.kpd-worksheets) .kpd-worksheets > :not(:has(.kpd-print-page)) { display: none !important; }");assert.equal(read(css).toString(),expected,'Only answer inset and obsolete extra-material print selectors may change');
 const a=before(tsx).toString(),b=read(tsx).toString();assert.equal(a.slice(0,a.indexOf('function LetterCards(')).replace('  RouteCards,\n',''),b.slice(0,b.indexOf('function WritingBoard(')));
 const board=s=>s.slice(s.indexOf('function WritingBoard('),s.indexOf('export function TeacherMaterials()'));assert.equal(board(b),board(a),'Entire board, tools, audio and session handling retained');
 const sheets=s=>s.slice(s.indexOf('    <section className="kpd-worksheets"'),s.indexOf('        <div className="kpd kpd-worksheet-extras"'));assert.equal(sheets(b),sheets(a),'Worksheet choices, previews, downloads and return links retained');
 const answers=s=>s.slice(s.indexOf('<details key='),s.indexOf('</details>',s.indexOf('<details key='))+10);assert.equal(answers(b),answers(a).replace('onClick={() => printExtra("answers")}','onClick={() => window.print()}'));
 for(const s of ['Extra materiaal','Docentobservatie','function LetterCards(','function ObservationSheet(','printKind','setExtra'])assert(!b.includes(s),s);
 assert.equal(read('docs/appearance-floor-20261031/floor.json').toString(),before('docs/appearance-floor-20261031/floor.json').toString());
 const review=JSON.parse(read(folder+'/review.json'));for(const k of ['answers','keyboard','print','desktopMobile','lightDark','appearanceScope','lessonReturn','previousContentPreserved','types','lint','build','localOnly'])assert.equal(review[k],true,k);assert.equal(review.observationAppCreated,false);assert.equal(review.newAudio,false);
 const browser=JSON.parse(read(folder+'/browser-checks.json'));assert.equal(browser.checks.length,144);assert.equal(browser.comparisons.length,12);assert.equal(browser.lessonReturns,48);assert.deepEqual(browser.errors,[]);assert.equal(JSON.parse(read(folder+'/print-checks.json')).length,6);
 const backup=JSON.parse(read(folder+'/backup.json'));assert(backup.verified&&backup.fullReadback&&backup.driveId);for(const f of changed)assert.equal(backup.files[f],r.files[f],f);
 return r;
}
export function readBeforeWorksheetCleanup(file,r,read=readFileSync){return r.changedFiles.includes(file)?before(file):read(file);}
