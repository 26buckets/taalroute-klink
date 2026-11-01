import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {verifyGrammarPublication,readBeforeGrammarPublication,grammarPublicationFile} from './check-grammar-publication-20261101.mjs';

void test('Publication binds explicit owner approval, full archive results and every changed source byte',()=>{
 const proof=verifyGrammarPublication();
 assert.equal(proof.publicationApproved,true);assert.equal(proof.productionBatch,false);
 for(const file of [grammarPublicationFile,'data/klink-grammar-self-local.json','components/product/word-audio-text.tsx','app/learner-layout.css','docs/grammar-publication-20261101/archive-results.json']){
  assert.throws(()=>verifyGrammarPublication(path=>path===file?Buffer.concat([readFileSync(path),Buffer.from('unreviewed')]):readFileSync(path)),file);
 }
 for(const file of ['app/learner-layout.css','scripts/check-mobile-choice-visibility-release-20261101.mjs'])assert.deepEqual(readBeforeGrammarPublication(file,proof),execFileSync('git',['show',proof.baselineSourceCommit+':'+file],{maxBuffer:128e6}));
 for(const file of ['docs/local-code-cleanup-20261101/scope.json','docs/grammar-alfa-b1-20261101/scope.json']){
  assert.deepEqual(readFileSync(file),execFileSync('git',['show',proof.localCandidate+':'+file],{maxBuffer:128e6}));
  assert.equal(JSON.parse(readFileSync(file)).publicationApproved,false);
 }
});
