import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifySentenceRelease,readBeforeSentenceRelease} from './check-sentence-release.mjs';
import {verifyHiddenB2Release} from './check-hidden-b2-release.mjs';
const release=verifySentenceRelease();
verifyHiddenB2Release();
for(const file of ['data/klink-sentence-levels.json','public/package-audio/zinsherstel-20261030/zin-22-volledig.mp3','docs/sentence-publication-20261030/owner-request.json','docs/sentence-publication-20261030/audio-quality.json']){
 assert.throws(()=>verifySentenceRelease(f=>f===file?Buffer.from('{}'):readFileSync(f)),file);
}
assert.throws(()=>verifySentenceRelease(f=>f==='docs/sentence-publication-20261030/backup.json'?Buffer.from('{"verified":false}'):readFileSync(f)));
assert.equal(JSON.parse(readBeforeSentenceRelease('data/klink-connected-content.json',release)).items.length,JSON.parse(readFileSync('data/klink-connected-content.json')).items.length);
console.log('Sentence release and prior B2 release pass; changed levels, audio, authorization, evidence and unverified backup are rejected.');
