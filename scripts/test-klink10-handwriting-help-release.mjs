import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyHandwritingHelpContent} from './check-klink10-handwriting-help-release.mjs';
verifyHandwritingHelpContent();
for(const path of ['components/product/package-exercise-browser.tsx','data/klink-handwriting-help-20261103.json','docs/klink10-handwriting-help-ac-20261103/browser.json','docs/klink10-handwriting-help-ac-20261103/capacity-review.json','docs/klink10-handwriting-help-ac-20261103/offered-build-assets.json']){
 assert.throws(()=>verifyHandwritingHelpContent(p=>p===path?Buffer.concat([readFileSync(p),Buffer.from(' ')]):readFileSync(p)),undefined,path);
}
const owner='docs/klink-owner-release-handwriting-help-ac-20261103.json';
assert.throws(()=>verifyHandwritingHelpContent(p=>p===owner?Buffer.from(JSON.stringify({...JSON.parse(readFileSync(p)),publicationApproved:false})):readFileSync(p)));
console.log('Source-bound handwriting gate and six tamper checks passed.');
