import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyInstructionCandidate,readBeforeInstructionCandidate,instructionCandidateFile,instructionBaseline} from './check-instruction-candidate.mjs';
test('Local preparation preserves the complete live source behind exact reviewed changes and cannot authorize publication',()=>{
 const proof=verifyInstructionCandidate();assert.equal(proof.publicationApproved,false);
 for(const file of Object.keys(proof.files).filter(f=>/^(app|components|data|lib|public)\//.test(f)&&f!=='components/product/grammar-instruction-example.tsx'))assert.deepEqual(readBeforeInstructionCandidate(file,proof),instructionBaseline(file));
 const original=readFileSync('data/klink-media.json');assert.deepEqual(readBeforeInstructionCandidate('data/klink-media.json',proof),original);
 for(const mutate of [p=>p.publicationApproved=true,p=>p.localOnly=false,p=>p.baselineSourceCommit='0'.repeat(40),p=>delete p.files['data/klink-imported-practice.json'],p=>p.files['unreviewed.js']='0'.repeat(64),p=>p.userRequest='publish']){
  const bad=structuredClone(proof);mutate(bad);assert.throws(()=>verifyInstructionCandidate(f=>f===instructionCandidateFile?Buffer.from(JSON.stringify(bad)):readFileSync(f)));
 }
});
test('Changing a hash in the preparation cannot bless unrelated source, audio timing, layout or route changes',()=>{
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
