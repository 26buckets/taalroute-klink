import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
const folder = 'docs/exercise-flow-20261106/publication/';
const baseline = 'f9299b107610c25975fcd2cfb164c0981928385d';
const git = (...args) => execFileSync('git', args, { maxBuffer: 128e6 });
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const lines = bytes => bytes.toString().trim().split('\n').filter(Boolean).sort((a,b)=>a<b?-1:a>b?1:0);
const roots = ['app','components','hooks','data','lib','public','scripts','db','drizzle','.github','AGENTS.md','PUBLICATIE.md','VORMGEVING-VASTGEZET.md','docs/appearance-floor-20261031','docs/KLINK-DOCENTHANDLEIDING.md','vite.config.ts','next.config.ts','package.json','package-lock.json','wrangler.jsonc','middleware.ts','.gitignore'];
const expected = [
 'app/exercise-flow.css','app/layout.tsx','app/learner-layout.css',
 'components/product/package-exercise-browser.tsx','components/product/practice-action.tsx','components/product/standard-practice-surface.tsx',
 'docs/appearance-floor-20261031/floor.json','docs/appearance-floor-20261031/approved-updates/exercise-flow-20261106.json',
 'scripts/check-exercise-flow-release-20261106.mjs','scripts/check-practice-bundles-release-20261106.mjs',
 'scripts/test-exercise-flow-release-20261106.mjs','scripts/test-exercise-flow-browser.mjs','scripts/test-exercise-flow-forms-browser.mjs','scripts/test-exercise-flow-mobile-browser.mjs','scripts/test-exercise-flow-native-browser.mjs','scripts/test-keyboard-all-forms-browser.mjs','scripts/test-package-photo-space-browser.mjs','scripts/test-hear-type-focus-guards-20261105.mjs',
].sort((a,b)=>a<b?-1:a>b?1:0);
export function verifyExerciseFlowContent(read = readFileSync) {
 const json = path => JSON.parse(read(path)), r = json(folder+'approval.json');
 assert.equal(r.approvedBy,'Nico'); assert.equal(r.publicationApproved,true); assert.equal(r.designChangeApproved,true);
 assert.equal(r.userRequest,'Ja, dit ziet er goed uit. Rond de controles af en zet deze nieuwe indeling live voor de hele app. Behoud alle inhoud en voortgang, laat PR12 en staging ongemoeid');
 assert.equal(r.baselineSourceCommit,baseline);assert.equal(r.checkedCandidateCommit,'62c3bab4edf460142321b837834e50e07d453439');
 git('merge-base','--is-ancestor',baseline,'HEAD');
 const live=json(folder+'live-before.json'); assert.equal(live.sourceCommit,'db57924f60e8d632eed0d1b75c9b48a7491da709'); assert(live.sourceClean);assert.equal(live.branch,'main');
 assert.deepEqual([...new Set([...lines(git('diff','--name-only',baseline,'--',...roots)),...lines(git('ls-files','--others','--exclude-standard','--',...roots))])].sort((a,b)=>a<b?-1:a>b?1:0),expected);
 assert.deepEqual(r.changedFiles,expected); assert.deepEqual(Object.keys(r.files).sort((a,b)=>a<b?-1:a>b?1:0),expected);
 for (const [p,h] of Object.entries({...r.files,...r.evidenceFiles})) assert.equal(sha(read(p)),h,p);
 // The approved preview fixes the runtime scope; release preparation cannot add another feature.
 for (const p of expected.filter(p=>p.startsWith('app/')||p.startsWith('components/'))) assert.equal(sha(read(p)),sha(git('show',r.checkedCandidateCommit+':'+p)),p);
 assert.equal(git('diff','--name-only',baseline,'--','data','lib','public','hooks','db','drizzle','middleware.ts','vite.config.ts','package.json','package-lock.json','.github').toString().trim(),'');
 const floor=json('docs/appearance-floor-20261031/floor.json'),old=JSON.parse(git('show',baseline+':docs/appearance-floor-20261031/floor.json'));
 assert.deepEqual({...floor,approvedUpdates:old.approvedUpdates},old);assert.deepEqual(floor.approvedUpdates,[...old.approvedUpdates,'docs/appearance-floor-20261031/approved-updates/exercise-flow-20261106.json']);
 const v=json(folder+'verification.json');
 assert(v.typesPassed&&v.lintPassed&&v.normalBuildPassed&&v.contentMediaStorageUnchanged&&v.pr12StagingUntouched);
 assert.equal(v.physicalPhoneTest,false);
 for (const p of ['unit.log','curriculum.log']) assert(read(folder+'local/'+p).toString().includes('fail 0'),p);
 const examples=json(folder+'local/examples/checks.json'); assert.equal(examples.checks.length,24);assert.deepEqual(examples.errors,[]);
 const guards=json(folder+'local/focus/guards.json');assert.equal(guards.checks.length,2);
 const storage=json(folder+'local/storage/checks.json');assert.equal(storage.checks.length,6);assert.deepEqual(storage.errors,[]);
 const native=json(folder+'local/native/native-check.json');assert(native.nativeEnded.length>0&&native.keyboardAnswer&&native.next&&native.fullscreen);
 const preservation=json(folder+'local/preservation/checks.json');assert.equal(preservation.visual.length,16);assert(preservation.visual.every(x=>x.changedPixels===0));assert.deepEqual(preservation.errors,[]);
 const preview=json('docs/exercise-flow-20261106/validation.json');assert.equal(preview.formLayouts,366);assert.equal(preview.keyboardButtonParityChecksIncludingGates,490);
 const b=json(folder+'backup.json');assert(b.driveId&&b.fullReadback&&b.zipIntegrity&&b.allPayloadHashesMatch);assert.deepEqual(b.files,r.files);assert.deepEqual(b.evidenceFiles,r.evidenceFiles);
 return r;
}
export const verifyExerciseFlowRelease = verifyExerciseFlowContent;
export function readBeforeExerciseFlow(file,r,read=readFileSync) { return r.changedFiles.includes(file)?git('show',r.baselineSourceCommit+':'+file):read(file); }
