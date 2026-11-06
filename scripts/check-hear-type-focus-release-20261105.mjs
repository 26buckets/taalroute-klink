import {verifyPracticeBundlesRelease,readBeforePracticeBundles} from './check-practice-bundles-release-20261106.mjs';
import assert from 'node:assert/strict';
import{readFileSync}from'node:fs';
import{execFileSync}from'node:child_process';
import{createHash}from'node:crypto';
const folder='docs/hear-type-focus-20261105/';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const expected=['components/product/package-exercise-browser.tsx','scripts/check-dialog-focus-release-20261105.mjs','scripts/check-hear-type-focus-release-20261105.mjs','scripts/test-hear-type-focus-release-20261105.mjs','scripts/test-hear-type-focus-browser-20261105.mjs','scripts/test-hear-type-focus-guards-20261105.mjs','scripts/test-hear-type-appearance-20261105.mjs','scripts/test-writing-dictation-audio-errors-20261101.mjs'].sort((a,b)=>a<b?-1:a>b?1:0);
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6}),lines=b=>b.toString().trim().split('\n').filter(Boolean),sha=b=>createHash('sha256').update(b).digest('hex');
export function verifyHearTypeFocusContent(read=readFileSync){
 const successor=verifyPracticeBundlesRelease(read),currentRead=read;read=file=>readBeforePracticeBundles(file,successor,currentRead);
 const json=p=>JSON.parse(read(p)),release=json(folder+'approval.json'),request=json(folder+'owner-request.json');
 assert.equal(request.approvedBy,'Nico');assert(request.publicationApproved);assert.equal(request.designChangeApproved,false);
 assert.equal(request.publicationRequest,'Ik ben overal mee akkoord, zet online. Dit is de laatste keer dat je dit aan me vraagt.');
 assert.equal(release.baselineSourceCommit,'60c12280847ee54725df9830f1666a7ebfdcfa58');
 const before=json(folder+'live-before.json');assert.equal(before.sourceCommit,release.baselineSourceCommit);assert(before.sourceClean);assert.equal(before.branch,'main');
 git('merge-base','--is-ancestor',release.baselineSourceCommit,release.checkedCandidateCommit);git('merge-base','--is-ancestor',release.checkedCandidateCommit,'HEAD');
 const changed=lines(git('diff','--name-only',release.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots)).sort((a,b)=>a<b?-1:a>b?1:0);
 assert.deepEqual(changed,expected);assert.deepEqual(release.changedFiles,expected);assert.deepEqual(Object.keys(release.files).sort((a,b)=>a<b?-1:a>b?1:0),expected);
 for(const[p,h]of Object.entries({...release.files,...release.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 const native=json(folder+'local/browser.json'),catalog=json(folder+'local/catalog.json');
 assert.equal(native.simulatedAudio,false);assert.equal(native.checks.length,268);assert.equal(native.sheets.length,52);assert.deepEqual(native.errors,[]);assert(native.checks.every(x=>x.keyboardOnlyAnswer&&x.wrongAnswerFocus&&x.nativeAudio));
 assert.equal(catalog.checks.length,482);assert.equal(new Set(catalog.checks.map(x=>x.row)).size,122);assert.equal(catalog.catalog.length,124);assert.deepEqual(catalog.errors,[]);
 const guards=json(folder+'local/guards.json');assert.equal(guards.checks.length,2);assert(guards.checks.every(x=>x.helpFocusPreserved&&x.draftReloadPreserved&&x.caretPreserved&&x.correctAnswerNotRefocused&&x.otherQuestionFocusPreserved));
 const appearance=json(folder+'local/appearance/checks.json');assert.equal(appearance.checks.length,8);assert(appearance.checks.every(x=>x.geometryEqual&&x.changedPixels===0));
 assert.equal(json(folder+'local/audio-errors/audio-errors.json').checks.length,4);
 const help=json(folder+'local/help/browser.json');assert.equal(help.checks.length,8);assert(help.checks.every(x=>x.helpStayedVisible&&x.openAndClosePreserved&&x.enWithPhoto&&x.enWithoutPhoto));
 assert.equal(json(folder+'local/storage/checks.json').checks.length,6);
 const preservation=json(folder+'preservation.json');assert(preservation.contentMediaStorageUnchanged&&preservation.appearancePreserved);assert.deepEqual(preservation.githubWorkflowFiles,[]);assert.deepEqual(preservation.runtimeChangedFiles,['components/product/package-exercise-browser.tsx']);
 const checks=json(folder+'verification.json');assert(checks.typesPassed&&checks.lintPassed&&checks.normalBuildPassed&&checks.curriculumTests===49&&checks.writingNavigationTests===7&&checks.storageCases===6&&checks.helpChecks===8);
 return {...release,successor};
}
export function verifyHearTypeFocusRelease(read=readFileSync){const release=verifyHearTypeFocusContent(read),backup=JSON.parse(read(folder+'backup.json'));assert(backup.driveId&&backup.fullReadback&&backup.zipIntegrity&&backup.allPayloadHashesMatch);assert.deepEqual(backup.files,release.files);assert.deepEqual(backup.evidenceFiles,release.evidenceFiles);return release;}
export function readBeforeHearTypeFocus(file,release,read=readFileSync){return release.changedFiles.includes(file)?git('show',release.baselineSourceCommit+':'+file):readBeforePracticeBundles(file,release.successor,read);}
