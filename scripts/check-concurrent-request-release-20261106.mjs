import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
const folder='docs/concurrent-request-repair-20261106/publication/';
const baseline='d4c68ec06b2d521bb70e40f32cd8aa2139f74d8d';
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const sha=b=>createHash('sha256').update(b).digest('hex');
const lines=b=>b.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a<b?-1:a>b?1:0);
const roots=['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc','middleware.ts','worker.ts','.gitignore'];
const expected=['middleware.ts','worker.ts','vite.config.ts','scripts/check-exercise-flow-release-20261106.mjs','scripts/check-concurrent-request-release-20261106.mjs','scripts/test-concurrent-request-release-20261106.mjs','scripts/test-public-asset-worker.mjs','scripts/test-public-asset-concurrency.mjs','scripts/test-practice-delivery-browser.mjs','scripts/test-exercise-flow-browser.mjs','scripts/test-hear-type-focus-browser-20261105.mjs'].sort((a,b)=>a<b?-1:a>b?1:0);
export function verifyConcurrentRequestRelease(read=readFileSync){
 const json=p=>JSON.parse(read(p)),r=json(folder+'approval.json');
 assert.equal(r.approvedBy,'Nico');assert.equal(r.publicationApproved,true);assert.equal(r.designChangeApproved,false);
 assert.equal(r.userRequest,'Oké, ik ben nieuwsgierig welke... wat is de volgende stap om ruimte te besparen? Zet deze alvast maar even online. Publiceer het maar.');
 assert.equal(r.baselineSourceCommit,git('rev-parse',baseline).toString().trim());
 assert.equal(r.checkedCandidateCommit,'de6b3617a98ad2880372aba9e0b8c221f31bdf9f');
 git('merge-base','--is-ancestor',r.baselineSourceCommit,'HEAD');git('merge-base','--is-ancestor',r.checkedCandidateCommit,'HEAD');
 const live=json(folder+'live-before.json');assert.equal(live.sourceCommit,'3e1e49e914893039b234e20620d22b1a399abe9f');assert(live.sourceClean);assert.equal(live.branch,'main');
 const changed=[...new Set([...lines(git('diff','--name-only',r.baselineSourceCommit,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a<b?-1:a>b?1:0);
 assert.deepEqual(changed,expected);assert.deepEqual(r.changedFiles,expected);
 assert.deepEqual(Object.keys(r.files).sort((a,b)=>a<b?-1:a>b?1:0),expected.filter(p=>p!=='middleware.ts'));assert.deepEqual(r.deleted,['middleware.ts']);assert(!existsSync('middleware.ts'));
 for(const[p,h]of Object.entries({...r.files,...r.evidenceFiles}))assert.equal(sha(read(p)),h,p);
 for(const p of ['worker.ts','vite.config.ts'])assert.equal(sha(read(p)),sha(git('show',r.checkedCandidateCommit+':'+p)),p);
 assert.equal(git('diff','--name-only',r.baselineSourceCommit,'--','app','components','hooks','data','lib','public','db','drizzle','.github','package.json','package-lock.json','docs/appearance-floor-20261031').toString().trim(),'');
 const v=json(folder+'verification.json');assert(v.typesPassed&&v.lintPassed&&v.normalBuildPassed&&v.currentAppearancePreserved&&v.contentMediaStorageUnchanged);assert.equal(v.actualLiveTriggerProven,false);
 const c=json(folder+'local/concurrency/summary.json');assert.equal(c.completed,4312);assert.equal(c.concurrency,24);assert.deepEqual(c.errors,[]);assert.equal(c.afterCancellation,24);
 const h=json(folder+'local/http.json');assert.equal(h.verified,20149);assert.equal(h.expected,h.verified);
 const a=json(folder+'local/appearance/checks.json');assert.equal(a.visual.length,32);assert(a.visual.every(x=>x.changedPixels===0));assert.deepEqual(a.errors,[]);
 const n=json(folder+'local/native-audio/browser.json');assert.equal(n.simulatedAudio,false);assert.equal(n.checks.length,268);assert.equal(n.sheets.length,52);assert.deepEqual(n.errors,[]);
 const b=json(folder+'backup.json');assert(b.driveId&&b.fullReadback&&b.zipIntegrity&&b.allPayloadHashesMatch);assert.deepEqual(b.files,r.files);assert.deepEqual(b.evidenceFiles,r.evidenceFiles);
 return r;
}
export function readBeforeConcurrentRequest(file,r,read=readFileSync){return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file);}
