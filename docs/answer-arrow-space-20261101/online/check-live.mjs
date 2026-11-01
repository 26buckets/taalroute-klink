import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
const base='https://klink.taalroute.nl';
const release=await(await fetch(base+'/release.json?keys='+Date.now(),{cache:'no-store'})).json();
assert.equal(release.sourceCommit,'17f9db234295127531719cebb3df45d666d8ccac');assert(release.sourceClean);
const baseline=JSON.parse(readFileSync('docs/answer-arrow-space-20261101/live-baseline.json'));
for(const key of Object.keys(baseline).filter(k=>k.endsWith('Sha256')))assert.equal(release[key],baseline[key],key);
const prior=JSON.parse(readFileSync('docs/enter-focus-20261101/online/published.json'));
const files=[];
for(const file of prior.files) {
 const response=await fetch(base+file.path);assert.equal(response.status,200,file.path);
 const bytes=Buffer.from(await response.arrayBuffer());assert(bytes.equals(readFileSync('public'+file.path)),file.path);
 const sha256=createHash('sha256').update(bytes).digest('hex');assert.equal(sha256,file.sha256);
 files.push({path:file.path,bytes:bytes.length,sha256});
}
mkdirSync('outputs/answer-arrow-space-20261101/online',{recursive:true});
writeFileSync('outputs/answer-arrow-space-20261101/online/published.json',JSON.stringify({release,fingerprintsPreserved:true,files,allBytesEqual:true},null,2)+'\n');
console.log('PASS exact clean live source, all release content hashes and seven actually offered content/audio files.');
