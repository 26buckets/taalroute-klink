import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
const out='outputs/timeout-publication-20261106/live',base='https://klink.taalroute.nl',http=JSON.parse(readFileSync(out+'/http/http.json'));
assert.equal(http.verified,20149);assert.equal(http.expected,http.verified);assert.equal(http.checks.length,http.expected);
const delivery=JSON.parse(readFileSync('data/klink-practice-delivery.json')),path=Object.keys(delivery)[0],original=readFileSync('public'+path),checks=[];
for(const headers of [{},{'Accept-Encoding':'identity'}]){
 const head=await fetch(base+path,{method:'HEAD',headers,signal:AbortSignal.timeout(15000)});assert.equal(head.status,200);assert.equal((await head.arrayBuffer()).byteLength,0);
 // CDN compression may omit the encoded length; compare exact length with identity encoding.
 if(headers['Accept-Encoding'])assert.equal(Number(head.headers.get('Content-Length')),original.length);
 else assert(head.headers.get('Content-Encoding')||Number(head.headers.get('Content-Length'))===original.length);
 const etag=head.headers.get('ETag');assert(etag);const cached=await fetch(base+path,{headers:{...headers,'If-None-Match':etag},signal:AbortSignal.timeout(15000)});assert.equal(cached.status,304);checks.push({headers,status:head.status,encoding:head.headers.get('Content-Encoding'),length:head.headers.get('Content-Length'),etag,cached:cached.status});
}
for(const[path,method,status]of [[Object.keys(delivery)[0],'POST',405],['/practice-content/unknown-bank.json','GET',404],[JSON.parse(readFileSync('data/klink-production-index.json')).find(r=>r.bundleUrl).url,'GET',404]]){const r=await fetch(base+path,{method,signal:AbortSignal.timeout(15000)});assert.equal(r.status,status);checks.push({path,method,status:r.status});}
writeFileSync(out+'/http-boundaries.json',JSON.stringify({exactFiles:http.verified,checks,passed:true,explanation:'Original boundary assertion expected an uncompressed Content-Length on a CDN-compressed HEAD. Identity length, empty HEAD body and both strong/weak conditional requests are correct.'},null,2)+'\n');console.log('PASS: 20149 exact files already verified; identity/compressed HEAD, conditional 304, POST 405 and both 404 boundaries.');
