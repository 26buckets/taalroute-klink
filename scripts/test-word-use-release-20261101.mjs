import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyWordUseRelease,readBeforeWordUse} from './check-word-use-release-20261101.mjs';
test('release is tied to the explicit owner request, all reviewed content, active audio and verified backup',()=>{
 const r=verifyWordUseRelease();assert.equal(r.provider,'ElevenLabs');assert.equal(r.appearanceUnchanged,true);
 assert.notDeepEqual(readBeforeWordUse('lib/group-practice.ts',r),readFileSync('lib/group-practice.ts'));
 assert.deepEqual(readBeforeWordUse('data/klink-synonyms.json',r),readFileSync('data/klink-synonyms.json'));
});
test('publication refuses missing approval, incomplete checks, missing cloud readback and modified content or audio',()=>{
 for(const[file,key,value]of [['docs/klink-owner-release-word-use-20261101.json','publicationApproved',false],['docs/word-use-20261101/backup.json','fullReadback',false],['docs/word-use-20261101/verification.json','all288Questions',false]]){
  const x=JSON.parse(readFileSync(file));x[key]=value;assert.throws(()=>verifyWordUseRelease(f=>f===file?Buffer.from(JSON.stringify(x)):readFileSync(f)),file);
 }
 const receipt=JSON.parse(readFileSync('docs/word-use-20261101/backup.json'));receipt.parts[0].verified=false;assert.throws(()=>verifyWordUseRelease(f=>f==='docs/word-use-20261101/backup.json'?Buffer.from(JSON.stringify(receipt)):readFileSync(f)));
 const changed=JSON.parse(readFileSync('docs/klink-owner-release-word-use-20261101.json')).changedFiles;
 for(const file of ['data/klink-word-use.json','data/klink-word-use-audio.json',changed.find(f=>f.endsWith('.mp3'))])assert.throws(()=>verifyWordUseRelease(f=>f===file?Buffer.concat([readFileSync(f),Buffer.from('x')]):readFileSync(f)),file);
});
