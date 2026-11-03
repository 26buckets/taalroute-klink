import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {verifyWritingFormsRelease,readBeforeWritingForms} from './check-writing-forms-release-20261102.mjs';
const folder='docs/writing-forms-20261102/',approval='docs/klink-owner-release-writing-forms-20261102.json',backup=folder+'backup.json',json=p=>JSON.parse(readFileSync(p)),encode=x=>Buffer.from(JSON.stringify(x)),sha=b=>createHash('sha256').update(b).digest('hex');
const release=verifyWritingFormsRelease();
assert.deepEqual(JSON.parse(readBeforeWritingForms('data/klink-production-index.json',release)),json('data/klink-production-index.json').slice(0,json(folder+'import-manifest.json').priorRowsCount));
function reject(file,change){const value=json(file);change(value);assert.throws(()=>verifyWritingFormsRelease(p=>p===file?encode(value):readFileSync(p)));}
reject(approval,r=>{r.publicationApproved=false;});
reject(approval,r=>{r.humanListeningPerformed=true;});
reject(backup,b=>{b.fullReadback=false;});
reject(folder+'native-documents-revision.json',s=>{s.documents.pop();});
reject(folder+'local/browser.json',b=>{b.checks.pop();});
const bundle=json(folder+'word-audio-review.json').bundles[0];
assert.throws(()=>verifyWritingFormsRelease(p=>p==='public'+bundle.src?readFileSync(p).subarray(0,-1):readFileSync(p)));
const index='data/klink-word-listening.json',recordings=json(index),oldWord=Object.keys(JSON.parse(readBeforeWritingForms(index,release)))[0];delete recordings[oldWord];
const changed=encode(recordings),r=json(approval),b=json(backup);r.files[index]=sha(changed);b.files[index]=sha(changed);
assert.throws(()=>verifyWritingFormsRelease(p=>p===index?changed:p===approval?encode(r):p===backup?encode(b):readFileSync(p)));
console.log('Passed the real forms release and seven negative owner/evidence, prior model, media and Drive readback cases.');
