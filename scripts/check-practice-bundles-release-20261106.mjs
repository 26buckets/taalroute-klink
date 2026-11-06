import {verifyExerciseFlowRelease,readBeforeExerciseFlow} from './check-exercise-flow-release-20261106.mjs';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const folder='docs/practice-bundles-20261106/publication/';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const sort=xs=>xs.sort((a,b)=>a<b?-1:a>b?1:0);
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc','middleware.ts','.gitignore'];
const expected=sort(['.gitignore','data/klink-practice-delivery.json','db/env.d.ts','lib/practice-bundle-response.ts','lib/production-practice.ts','middleware.ts','package.json','public/.assetsignore','scripts/build-practice-bundles.mjs','scripts/check-asset-limit.mjs','scripts/check-hear-type-focus-release-20261105.mjs','scripts/check-practice-bundles-release-20261106.mjs','scripts/serve-performance.mjs','scripts/test-hear-type-appearance-20261105.mjs','scripts/test-hear-type-focus-guards-20261105.mjs','scripts/test-practice-bundles-http.mjs','scripts/test-practice-bundles.mjs','scripts/test-practice-bundles-release-20261106.mjs','scripts/test-practice-delivery-browser.mjs','scripts/test-production-browser.mjs','scripts/test-writing-forms-20261102.mjs','scripts/test-writing-forms-bundle-20261103.mjs','vite.config.ts']);
export function verifyPracticeBundlesContent(read=readFileSync){
  const successor=verifyExerciseFlowRelease(read),currentRead=read;read=file=>readBeforeExerciseFlow(file,successor,currentRead);
  const json=p=>JSON.parse(read(p)),r=json(folder+'approval.json'),request=json(folder+'owner-request.json');
  assert.equal(request.approvedBy,'Nico');assert.equal(request.publicationApproved,true);assert.equal(request.designChangeApproved,false);
  assert.equal(request.userRequest,'Publiceer deze gecontroleerde bundeling nu via de normale publicatieroute. Controleer eerst de actuele livebasis en behoud alle inhoud, audio, voortgang, links, toetsenbordbediening en het huidige uiterlijk.');
  assert.equal(r.baselineSourceCommit,'cefd22e3220decc663a0e982f63d912906ac4ea9');
  assert.equal(r.checkedCandidateCommit,'ce254f0b947e92db5ed9135ba3756f17c7d23ae7');
  git('merge-base','--is-ancestor',r.baselineSourceCommit,r.checkedCandidateCommit);git('merge-base','--is-ancestor',r.checkedCandidateCommit,'HEAD');
  const live=json(folder+'live-before.json');assert.equal(live.sourceCommit,r.baselineSourceCommit);assert(live.sourceClean);assert.equal(live.branch,'main');
  const changed=sort(lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots)));
  assert.deepEqual(changed,expected);assert.deepEqual(r.changedFiles,expected);assert.deepEqual(sort(Object.keys(r.files)),expected);
  for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
  for(const p of ['data/klink-practice-delivery.json','db/env.d.ts','lib/practice-bundle-response.ts','lib/production-practice.ts','middleware.ts','public/.assetsignore','vite.config.ts','scripts/build-practice-bundles.mjs','scripts/check-asset-limit.mjs'])assert.equal(sha(read(p)),sha(git('show',r.checkedCandidateCommit+':'+p)),p);
  const packageBefore=JSON.parse(git('show',r.checkedCandidateCommit+':package.json'));packageBefore.scripts.predeploy='node scripts/build-practice-bundles.mjs && npm run images:prepare';assert.deepEqual(json('package.json'),packageBefore);
  const all=json(folder+'local/all-collections.json');assert(all.checks.some(x=>x.allCollections===1809));assert.deepEqual(all.errors,[]);
  assert.equal(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','app','components','hooks','data/klink-production-index.json').toString().trim(),'');
  assert.deepEqual(lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--','public')),['public/.assetsignore']);
  execFileSync(process.execPath,['scripts/build-practice-bundles.mjs','--check']);
  const checks=json('docs/practice-bundles-20261106/verification.json');
  assert.equal(checks.beforeAssets,20000);assert.equal(checks.afterAssets,18393);assert.equal(checks.sourceFiles,1720);assert.equal(checks.bundles,113);
  assert.equal(checks.collections,1809);assert.equal(checks.exercisePlacements,64326);assert(checks.originalContentAndMediaFilesUnchanged&&checks.appearanceSourceUnchanged&&checks.noWorkflowChanges);
  const http=json(folder+'local/http.json');assert.equal(http.verified,20149);assert.equal(http.expected,http.verified);assert.equal(http.checks.length,http.expected);
  const browser=json(folder+'local/browser/checks.json');assert.equal(browser.visual.length,32);assert(browser.visual.every(x=>x.changedPixels===0));assert.deepEqual(browser.errors,[]);
  const current=json(folder+'current-live-comparison/checks.json');assert.equal(current.visual.length,32);assert(current.visual.every(x=>x.changedPixels===0));assert.deepEqual(current.errors,[]);
  const audio=json(folder+'local/native-audio/browser.json');assert.equal(audio.simulatedAudio,false);assert.equal(audio.checks.length,268);assert.equal(audio.sheets.length,52);assert.deepEqual(audio.errors,[]);
  assert.equal(json(folder+'local/storage/checks.json').checks.length,6);
  assert.equal(json(folder+'local/writing/answer-storage.json').checks.length,12);
  const dialogs=json(folder+'local/dialogs/checks.json');assert.equal(dialogs.checks.length,48);assert.deepEqual(dialogs.errors,[]);
  assert.equal(json(folder+'local/help/browser.json').checks.length,8);
  assert.equal(json(folder+'local/existing-forms/bundle.json').rounds.length,42);
  assert.equal(read(folder+'local/types-final.log').toString(),'');assert(!read(folder+'local/lint-final.log').toString().includes('error '));
  for(const p of ['unit.log','curriculum.log','forms-navigation-unit.log'])assert(read(folder+'local/'+p).toString().includes('fail 0'));
  return {...r,successor};
}
export function verifyPracticeBundlesRelease(read=readFileSync){
  const r=verifyPracticeBundlesContent(read),b=JSON.parse(read(folder+'backup.json'));
  assert(b.driveId&&b.fullReadback&&b.zipIntegrity&&b.allPayloadHashesMatch);
  assert.deepEqual(b.files,r.files);assert.deepEqual(b.evidenceFiles,r.evidenceFiles);return r;
}
export function readBeforePracticeBundles(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeExerciseFlow(file,r.successor,read);}
