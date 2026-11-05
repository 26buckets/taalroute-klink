import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {verifySpeakingA1Release,readBeforeSpeakingA1} from './check-speaking-a1-repeat-release.mjs';

const root='docs/performance-publication-20261104/';
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc'];
const runtime=['components/product/classroom-boundary.tsx','components/product/klink-opening-loader.tsx','components/product/practice-workspace.tsx','lib/word-listening.ts'];
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean);
const sort=a=>a.sort((a,b)=>a.localeCompare(b));

export function verifyPerformanceContent(read=readFileSync){
  const successor=verifySpeakingA1Release(read),currentRead=read;
  read=file=>readBeforeSpeakingA1(file,successor,currentRead);
  const json=p=>JSON.parse(read(p)), r=json(root+'approval.json');
  assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);
  assert.equal(r.userRequest,'Prima, controleer de snelheidswijzigingen nog één keer op de nieuwste versie en publiceer ze daarna voor Klink, +docent en Inzicht. Stem af met het lopende werk en laat zien of de winst ook live merkbaar is.');
  const live=json(root+'baseline-live-release.json');
  assert.equal(live.sourceCommit,r.liveSourceCommit);assert(live.sourceClean&&live.branch==='main');
  git('merge-base','--is-ancestor',r.liveSourceCommit,r.baselineSourceCommit);
  git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');
  const changed=sort(lines(git('diff','--name-only',r.baselineSourceCommit,successor.baselineSourceCommit,'--',...roots)));
  assert.deepEqual(changed,r.changedFiles);assert.deepEqual(sort(Object.keys(r.files)),changed);
  assert.deepEqual(changed.filter(p=>!p.startsWith('scripts/')),[...runtime,'vite.config.ts']);
  for(const [p,h] of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
  const proof=json(root+'verification.json');
  assert(proof.typesPassed&&proof.targetedLintPassed&&proof.normalBuildPassed&&proof.holdPreserved&&proof.allOtherRuntimeUnchanged);
  assert.equal(proof.unitTestsPassed,34);
  assert.deepEqual(json(root+'local/regression/checks.json').errors,[]);
  assert.equal(json(root+'local/regression/checks.json').checks.length,16);
  assert.deepEqual(json(root+'local/word/checks.json').errors,[]);
  assert.equal(json(root+'local/word/checks.json').checks.length,44);
  const appearance=json(root+'local/appearance/comparison.json');assert.equal(appearance.length,24);assert(appearance.every(x=>x.changedPixels===0));
  const loader=json(root+'local/loader/checks.json');assert.equal(loader.checks.length,16);assert(loader.checks.every(x=>x.finalFrameIdentical&&x.readyDriven));
  const navigation=json(root+'local/navigation/checks.json');assert.equal(navigation.checks.length,8);assert(navigation.checks.every(x=>x.finalFrameKept&&x.opens&&x.storagePreserved));
  const manual=json(root+'local/manual.json');assert.equal(manual.checks.length,4);assert.deepEqual(manual.errors,[]);
  assert(proof.offeredStaticAssets<=20000);
  return {...r,successor};
}
export function verifyPerformanceRelease(read=readFileSync){
  const r=verifyPerformanceContent(read),backup=JSON.parse(read(root+'backup.json'));
  assert(backup.driveId&&backup.fullReadback&&backup.zipIntegrity);
  assert.deepEqual(backup.files,r.files);assert.deepEqual(backup.evidenceFiles,r.evidenceFiles);
  return r;
}
export function readBeforePerformance(file,r,read=readFileSync){
  return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):readBeforeSpeakingA1(file,r.successor,read);
}
