import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyCopyACRelease} from './check-klink10-copy-ac-release.mjs';
const m=JSON.parse(readFileSync('docs/klink10-copy-ac-20261103/manifest.json'));
verifyCopyACRelease();
for(const path of ['data/klink-production-index.json','public'+m.row.url,'public'+m.oldRow.url])assert.throws(()=>verifyCopyACRelease(p=>p===path?Buffer.concat([readFileSync(p),Buffer.from(' ')]):readFileSync(p)),undefined,path);
const owner='docs/klink-owner-release-ten-copy-ac-20261103.json';
assert.throws(()=>verifyCopyACRelease(p=>p===owner?Buffer.from(JSON.stringify({...JSON.parse(readFileSync(p)),publicationApproved:false})):readFileSync(p)));
console.log('Copy access release and four negative cases passed.');
