import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyLetterAARelease} from './check-klink10-letter-aa-release.mjs';
const m=JSON.parse(readFileSync('docs/klink10-letter-aa-20261103/manifest.json'));
verifyLetterAARelease();
for(const path of ['data/klink-production-index.json','public'+m.row.url,'public'+m.instruction.src]){
 assert.throws(()=>verifyLetterAARelease(p=>p===path?Buffer.concat([readFileSync(p),Buffer.from(' ') ]):readFileSync(p)),undefined,path);
}
const owner='docs/klink-owner-release-ten-letters-aa-20261103.json';
assert.throws(()=>verifyLetterAARelease(p=>p===owner?Buffer.from(JSON.stringify({...JSON.parse(readFileSync(p)),publicationApproved:false})):readFileSync(p)));
console.log('Letter release proof and four negative release cases passed.');
