import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyDictation50Release} from './check-dictation-50-release-20261105.mjs';
const root='docs/dictation-50-20261105/';
verifyDictation50Release();
for(const file of ['data/klink-production-index.json','data/klink-grammar-aa-assets.json',root+'owner-request.json',root+'source-50.json',root+'media-50.json',root+'local/browser.json']){
 assert.throws(()=>verifyDictation50Release(p=>p===file?Buffer.concat([readFileSync(p),Buffer.from('\n')]):readFileSync(p)));
}
for(const mutation of [{publicationApproved:false},{ownerAcceptsDisclosedOpenHumanReview:false},{humanReview:'APPROVED'}]){
 assert.throws(()=>verifyDictation50Release(p=>p===root+'owner-request.json'?Buffer.from(JSON.stringify({...JSON.parse(readFileSync(p)),...mutation})):readFileSync(p)));
}
assert.throws(()=>verifyDictation50Release(p=>p===root+'backup.json'?Buffer.from(JSON.stringify({...JSON.parse(readFileSync(p)),fullReadback:false})):readFileSync(p)));
console.log('PASS exact 50-item scope, source/media preservation, honest owner approval and 10 negative release checks');
