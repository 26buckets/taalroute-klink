import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyCompleteRelease} from './check-klink-complete-release-20261101.mjs';
const folder='docs/klink-complete-release-20261101/';
void test('complete source, audio, progress and backup evidence permits this exact release',()=>assert.equal(verifyCompleteRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['docs/klink-owner-release-complete-20261101.json',r=>{r.publicationApproved=false;}],
 ['docs/klink-owner-release-complete-20261101.json',r=>{r.appearanceChanged=true;}],
 [folder+'owner-instruction.json',r=>{r.newAudioAuthorized=false;}],
 [folder+'transcript-resolution.json',r=>{r.unresolved=1;}],
 [folder+'audio-file-audit.json',r=>{r.issues.push('missing brand metadata');}],
 [folder+'browser/checks.json',r=>{r.errors.push('player error');}],
 [folder+'progress-checks.json',r=>{r.checks.pop();}],
 [folder+'recorder-checks.json',r=>{r.errors.push('recording failure');}],
 [folder+'verification.json',r=>{r.progress=false;}],
 [folder+'backup.json',r=>{r.fullReadback=false;}],
 [folder+'backup.json',r=>{r.parts[0].verified=false;}],
])void test('rejects changed approval or evidence '+file+' '+edit.toString(),()=>assert.throws(()=>verifyCompleteRelease(f=>{
 if(f!==file)return readFileSync(f);const r=JSON.parse(readFileSync(f));edit(r);return Buffer.from(JSON.stringify(r));
})));
void test('rejects changed appearance source',()=>assert.throws(()=>verifyCompleteRelease(f=>f==='components/product/extended-practice-surface.tsx'?Buffer.concat([readFileSync(f),Buffer.from('\n// unapproved change')]):readFileSync(f))));
