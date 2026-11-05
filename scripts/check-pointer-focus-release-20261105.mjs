import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifyHelpContextRelease,readBeforeHelpContext} from './check-help-en-context-release-20261105.mjs';
const root='docs/pointer-focus-20261105/',publication=root+'publication/';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),sha=b=>createHash('sha256').update(b).digest('hex'),lines=b=>b.toString().trim().split('\n').filter(Boolean),sort=a=>a.sort((a,b)=>a.localeCompare(b));
export function verifyPointerFocusContent(read=readFileSync){
 const successor=verifyHelpContextRelease(read),currentRead=read;read=file=>readBeforeHelpContext(file,successor,currentRead);
 const json=p=>JSON.parse(read(p)),r=json(publication+'approval.json'),request=json(publication+'publication-request.json');
 assert.equal(r.approvedBy,'Nico');assert(r.publicationApproved&&request.publicationApproved);
 assert.equal(request.userRequest,'Publiceer deze aanpassing nu via de normale publicatieroute. Controleer eerst de actuele livebasis en behoud alle inhoud, audio, voortgang en de rest van het uiterlijk.');
 assert.equal(r.baselineSourceCommit,'be7c4b36546bc0d5ce5fed38d1bdeebfdee985ff');assert.equal(r.liveSourceCommit,'487be7bb68af6d883b479d00096a79d12ac42791');assert.equal(r.checkedCandidateCommit,'c5a3bc858415c80fb8324f8299e2f25b5203d6dc');
 git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);git('merge-base','--is-ancestor',r.baselineSourceCommit,r.checkedCandidateCommit);git('merge-base','--is-ancestor',r.checkedCandidateCommit,'HEAD');
 const changed=sort(lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots)));
 assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
 assert.deepEqual(changed.filter(p=>!p.startsWith('scripts/')),['app/globals.css','app/learner-ui.css','VORMGEVING-VASTGEZET.md']);
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 for(const p of ['app/globals.css','app/learner-ui.css'])assert.equal(sha(read(p)),sha(git('show',r.checkedCandidateCommit+':'+p)),p);
 const verification=json(publication+'verification.json');assert(verification.typesPassed&&verification.lintPassed&&verification.curriculumTestsPassed&&verification.normalBuildPassed);assert.equal(verification.curriculumTests,49);
 const browser=json(root+'results/checks.json'),collections=json(root+'results/collection-checks.json');
 assert.equal(browser.checks.length,8);assert.deepEqual(browser.errors,[]);assert(browser.checks.every(c=>c.headingFocusPreserved&&c.automaticOutlineRemoved&&c.pointerOutlineRemoved&&c.keyboardOutlinePreserved&&c.nextExerciseFocusPreserved));
 assert.equal(collections.length,4);assert(collections.every(c=>c.keyboardOutline==='solid'&&c.pointerOutline==='none'));
 assert.equal(json(publication+'live-before.json').sourceCommit,r.liveSourceCommit);
 const preservation=json(publication+'preservation.json');assert.deepEqual(preservation.runtimeChangedFiles,['app/globals.css','app/learner-ui.css']);assert.deepEqual(preservation.githubWorkflowFiles,[]);
 const backup=json(publication+'candidate-backup.json');assert(backup.fullReadback&&backup.zipIntegrity&&backup.allPayloadHashesMatch);
 return {...r,successor};
}
export function verifyPointerFocusRelease(read=readFileSync){const r=verifyPointerFocusContent(read),backup=JSON.parse(read(publication+'backup.json'));assert(backup.driveId&&backup.fullReadback&&backup.zipIntegrity&&backup.allPayloadHashesMatch);assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);return r;}
export function readBeforePointerFocus(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeHelpContext(file,r.successor,read);}
