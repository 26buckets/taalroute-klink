import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';

export const cleanupFile='docs/local-code-cleanup-20261101/scope.json';
const scopeHash='f988951a7ed8ec55c0f3d550ee11f0ab6d3744551ee2e96b802d5e862df6e170';
const baseline='422d7fcc';
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const git=(...args)=>execFileSync('git',args,{maxBuffer:128e6});
const lines=bytes=>bytes.toString().trim().split('\n').filter(Boolean);
const snapshots=new Map();
function before(file){
 if(!snapshots.has(file))snapshots.set(file,git('show',baseline+':'+file));
 return Buffer.from(snapshots.get(file));
}
export function verifyCodeCleanup(read=readFileSync){
 const bytes=read(cleanupFile);assert.equal(sha(bytes),scopeHash,'Only the reviewed local code cleanup is allowed');
 const proof=JSON.parse(bytes);
 assert.equal(proof.baselineSourceCommit,baseline);assert.equal(proof.localOnly,true);
 assert.equal(proof.publicationApproved,false);assert.equal(proof.productionBatch,false);
 git('merge-base','--is-ancestor',baseline,'HEAD');
 const changed=[...new Set([...lines(git('diff','--name-only',baseline)),...lines(git('ls-files','--others','--exclude-standard'))])].filter(f=>!f.startsWith('docs/local-code-cleanup-20261101/')&&f!=='scripts/check-local-code-cleanup.mjs').toSorted((a,b)=>a<b?-1:a>b?1:0);
 assert.deepEqual(changed,Object.keys(proof.files).toSorted((a,b)=>a<b?-1:a>b?1:0),'Every cleanup change must be accounted for');
 for(const[file,record]of Object.entries(proof.files)){
  assert(/^(scripts\/.*\.mjs|docs\/.*\.(?:mjs|cjs)|components\/product\/(?:shared|entry-design|compact-learner-app)\.tsx)$/.test(file),'No content, media, settings or layout changes: '+file);
  assert.equal(sha(read(file)),record.after,file);
  if(record.before)assert.equal(sha(before(file)),record.before,file);
 }
 return proof;
}
export function readBeforeCodeCleanup(file,proof,read=readFileSync){
 return proof?.files[file]?.before?before(file):read(file);
}
