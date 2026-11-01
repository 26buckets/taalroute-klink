import test from 'node:test';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyInstructionCandidate,readBeforeInstructionCandidate,instructionCandidateFile,instructionBaseline} from './check-instruction-candidate.mjs';
void test('Local preparation preserves the complete live source behind exact reviewed changes and cannot authorize publication',()=>{
 const proof=verifyInstructionCandidate();assert.equal(proof.publicationApproved,false);
 for(const file of Object.keys(proof.integration.liveFiles))assert.deepEqual(readBeforeInstructionCandidate(file,proof),execFileSync('git',['show',proof.integration.liveSourceCommit+':'+file],{maxBuffer:128e6}));
 const original=readFileSync('data/klink-media.json');assert.deepEqual(readBeforeInstructionCandidate('data/klink-media.json',proof),original);
 for(const mutate of [p=>p.publicationApproved=true,p=>p.localOnly=false,p=>p.baselineSourceCommit='0'.repeat(40),p=>delete p.files['data/klink-imported-practice.json'],p=>p.files['unreviewed.js']='0'.repeat(64),p=>p.userRequest='publish']){
  const bad=structuredClone(proof);mutate(bad);assert.throws(()=>verifyInstructionCandidate(f=>f===instructionCandidateFile?Buffer.from(JSON.stringify(bad)):readFileSync(f)));
 }
});
void test('Changing a hash in the preparation cannot bless unrelated source, audio timing, layout or route changes',()=>{
 const proof=verifyInstructionCandidate();
 for(const[file,mutate]of[
  ['data/klink-imported-practice.json',b=>{const d=JSON.parse(b);d.items[0].id+='-wrong';return Buffer.from(JSON.stringify(d));}],
  ['data/klink-alfa-c-readalong.json',b=>{const d=JSON.parse(b);d.clips[0].words[0].end+=1;return Buffer.from(JSON.stringify(d));}],
  ['app/learner-layout.css',b=>Buffer.from(b+'\n.cp-task-card{display:none}')],
  ['lib/learner-route.ts',b=>Buffer.from(b.toString().replace("'suitable-reply', ",''))],
  ['components/product/imported-teacher-workflow.tsx',b=>Buffer.from(b+'\n// unreviewed change')],
 ]){
  const bytes=mutate(readFileSync(file)),bad=structuredClone(proof);bad.files[file]=createHash('sha256').update(bytes).digest('hex');
  assert.throws(()=>verifyInstructionCandidate(f=>f===instructionCandidateFile?Buffer.from(JSON.stringify(bad)):f===file?bytes:readFileSync(f)));
 }
 const bytes=instructionBaseline('app/learner-layout.css');bytes.fill(0);assert.notDeepEqual(instructionBaseline('app/learner-layout.css'),bytes);
});
void test('The grammar lesson extension is local-only and rejects altered source or substituted recordings',()=>{
 const proof=verifyInstructionCandidate(),scope='docs/grammar-self-lessons-20261101/scope.json';
 assert.equal(proof.grammarExtension.publicationApproved,false);
 for(const file of [scope,'lib/word-audio.ts',Object.keys(proof.grammarExtension.files).find(f=>f.startsWith('public/package-audio/woordvormen-20261101/'))]) {
  assert.throws(()=>verifyInstructionCandidate(f=>f===file?Buffer.concat([readFileSync(f),Buffer.from('changed')]):readFileSync(f)));
 }
});
void test('Alfa/B1 original local content cannot authorize production or weaken previous source protection',()=>{
 const proof=verifyInstructionCandidate();assert.equal(proof.alfaExtension.productionBatch,false);assert.equal(proof.alfaExtension.publicationApproved,false);
 for(const file of ['docs/grammar-alfa-b1-20261101/scope.json','data/klink-grammar-self-local.json','lib/local-grammar-lessons.ts'])assert.throws(()=>verifyInstructionCandidate(f=>f===file?Buffer.concat([readFileSync(f),Buffer.from('changed')]):readFileSync(f)));
});

void test('Merged live writing, titles and keyboard sources cannot be changed or publication enabled',()=>{
 const proof=verifyInstructionCandidate();assert.equal(proof.integration.publicationApproved,false);
 for(const file of ['docs/grammar-live-integration-20261101/scope.json','components/product/package-exercise-browser.tsx','lib/group-practice.ts','scripts/check-reading-round-titles-release-20261101.mjs'])assert.throws(()=>verifyInstructionCandidate(f=>f===file?Buffer.concat([readFileSync(f),Buffer.from('changed')]):readFileSync(f)));
});
void test('Remote changes outside the reviewed merge intersections remain byte-identical to live',()=>{
 const live='be7d78289945084612b20a0aa3058bb7730a43a5',previous='f16073e9',base='b670d0c1337eea07e96662237de4b9508de9735c';
 const changed=revision=>execFileSync('git',['diff','--name-only',base,revision,'--','app','components','hooks','lib','data','public','scripts']).toString().trim().split('\n');
 const local=new Set(changed(previous));let checked=0;
 for(const file of changed(live)){
  if(local.has(file)||file==='scripts/check-reading-round-titles-release-20261101.mjs')continue;
  assert.deepEqual(readFileSync(file),execFileSync('git',['show',live+':'+file],{maxBuffer:128e6}),file);checked++;
 }
 assert(checked>70);
});
