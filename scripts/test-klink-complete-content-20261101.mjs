import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {collectionProgressId} from '../lib/round-progress.ts';
import {verifyCompleteContent} from './check-klink-complete-content-20261101.mjs';
const folder='docs/klink-complete-release-20261101/';
// Check the original release against its approved index; later reviewed B1 and other replacements have separate release checks.
const publication=JSON.parse(readFileSync(folder+'online-publication.json'));
const approvedIndex=execFileSync('git',['show',publication.initialPublicationSource+':data/klink-production-index.json'],{maxBuffer:64e6});
assert.equal(createHash('sha256').update(approvedIndex).digest('hex'),JSON.parse(readFileSync('docs/klink-owner-release-complete-20261101.json')).files['data/klink-production-index.json']);
const readContentScope=file=>file==='data/klink-production-index.json'?approvedIndex:readFileSync(file);
void test('The original approved release retains all source texts, answers, feedback, goals and legacy records',()=>{
 const result=verifyCompleteContent(readContentScope);assert.equal(result.exercises,1740);assert.equal(result.optionExplanations,3720);
});
void test('All six changed collections retain the original progress key, including pre-existing audio aliases',()=>{
 const baseline=JSON.parse(readFileSync(folder+'baseline.json'));
 const oldAliases=JSON.parse(execFileSync('git',['show',baseline.sourceBase+':data/klink-progress-image-aliases-20261030.json']));
 const current=JSON.parse(readFileSync(folder+'import-manifest.json')).rows;
 for(const old of baseline.originalRows){
  const row=current.find(r=>r.id===old.id);
  assert.equal(collectionProgressId(row.activity,row.id,row.url),`collection:${old.activity}:${old.id}:${oldAliases[old.url]??old.url}`);
 }
});
const manifest=JSON.parse(readFileSync(folder+'import-manifest.json'));
const target='public'+manifest.rows.find(r=>r.id.startsWith('klink-teksten-zelf-a1-r02-')).url;
function changed(mutate){return file=>{const bytes=readContentScope(file);if(file!==target)return bytes;const value=JSON.parse(bytes);mutate(value.exercises[0]);return Buffer.from(JSON.stringify(value));};}
void test('A wrong answer key is rejected even when counts still match',()=>assert.throws(()=>verifyCompleteContent(changed(e=>e.answer.correctOptionIds=[e.options.find(o=>o.id!==e.answer.correctOptionIds[0]).id]))));
void test('Missing choice-specific feedback is rejected',()=>assert.throws(()=>verifyCompleteContent(changed(e=>delete e.optionFeedback[e.options[0].id]))));
void test('A fabricated evidence segment is rejected',()=>assert.throws(()=>verifyCompleteContent(changed(e=>e.sourceEvidenceSegments=['Deze zin staat niet in de brontekst.']))));
void test('A lost second source fragment is rejected',()=>{
 const row=manifest.rows.find(r=>r.activity==='sentences'&&JSON.parse(readFileSync('public'+r.url)).exercises.some(e=>e.sourceBlocks.length===2));assert(row);
 const file='public'+row.url;
 assert.throws(()=>verifyCompleteContent(path=>{const bytes=readContentScope(path);if(path!==file)return bytes;const value=JSON.parse(bytes);value.exercises.find(e=>e.sourceBlocks.length===2).sourceBlocks.pop();return Buffer.from(JSON.stringify(value));}));
});
