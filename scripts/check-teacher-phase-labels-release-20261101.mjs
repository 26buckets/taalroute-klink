import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const base='834e85e7eb0ebafd0a05e7d8aa5bc33b0ab4ed27',folder='docs/teacher-phase-labels-20261101/';
const git=(...a)=>execFileSync('git',a,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),sort=a=>a.sort((a,b)=>a.localeCompare(b)),lines=b=>b.toString().trim().split('\n').filter(Boolean);
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const allowed=sort(['lib/teacher-classroom.ts','scripts/test-teacher-phase-labels-20261101.mjs','scripts/test-teacher-phase-labels-browser-20261101.mjs','scripts/check-teacher-module-recovery-release-20261101.mjs','scripts/check-teacher-phase-labels-release-20261101.mjs','scripts/test-teacher-phase-labels-release-20261101.mjs']);
export function verifyTeacherPhaseLabelsRelease(read=readFileSync){
 const r=JSON.parse(read('docs/klink-owner-release-teacher-phase-labels-20261101.json'));
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.baselineSourceCommit,base);assert.equal(r.liveSourceCommit,base);assert(r.userRequest.includes('dubbele opties')&&r.userRequest.includes('hersteld'));
 git('merge-base','--is-ancestor',base,'HEAD');
 const changed=sort([...new Set([...lines(git('diff','--name-only',base,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])]);
 assert.deepEqual(changed,allowed);assert.deepEqual(r.changedFiles,allowed);assert.deepEqual(sort(Object.keys(r.files)),allowed);
 for(const file of allowed)assert.equal(sha(read(file)),r.files[file],file);
 const original=git('show',base+':lib/teacher-classroom.ts').toString(),actual=read('lib/teacher-classroom.ts').toString();
 const oldLine="  return route === 'a' ? lesson.phases : lesson.routes[route].phases;";
 const newLines="  const selected = route === 'a' ? lesson.phases : lesson.routes[route].phases;\n  return selected.map(phase => ({ ...phase, title: phase.title.replace(/^(?:Woord|Zin|Tekst)\\s+\\d+\\.\\s*/, '') }));";
 assert.equal(actual,original.replace(oldLine,newLines),'Only returned display titles change; sources and storage functions stay identical');
 assert.equal(git('diff','--name-only',base,'--','app','components','data','public','hooks','db','drizzle','.github','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','package.json','package-lock.json','wrangler.jsonc').length,0);
 const browser=JSON.parse(read(folder+'browser-checks.json'));assert.equal(browser.checks.length,72);assert.deepEqual(browser.errors,[]);assert(browser.checks.every(c=>c.keyboard&&c.touch&&c.reload&&c.answersPreserved));assert.equal(browser.checks.filter(c=>c.stylesAndGridPreserved).length,6);
 const review=JSON.parse(read(folder+'review.json'));for(const k of ['all58Lessons','all1392Titles','sourcesUnchanged','audioUnchanged','progressPreserved','layoutAndStylesPreserved','keyboard','mobileTouch','localOnly'])assert.equal(review[k],true,k);
 const backup=JSON.parse(read(folder+'backup.json'));assert(backup.verified&&backup.fullReadback&&backup.zipIntegrity&&backup.driveId);assert.deepEqual(backup.files,r.files);return r;
}
export function readBeforeTeacherPhaseLabels(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',base+':'+file):read(file);}
