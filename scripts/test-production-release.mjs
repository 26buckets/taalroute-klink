import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyProductionRelease} from './check-production-release.mjs';
const path='docs/klink-owner-release-production-20261029.json';
const read=readFileSync;
const manifest=JSON.parse(read(path));
const cases=[
 ['owner',file=>file===path?Buffer.from(JSON.stringify({...manifest,approvedBy:'unknown'})):read(file)],
 ['scope',file=>file===path?Buffer.from(JSON.stringify({...manifest,newImageGenerationApproved:true})):read(file)],
 ['lineage',file=>file===path?Buffer.from(JSON.stringify({...manifest,baselineSourceCommit:'0'.repeat(40)})):read(file)],
 ['runtime bytes',file=>file==='lib/production-practice.ts'?Buffer.from('changed'):read(file)],
 ['audio bytes',file=>file===manifest.changedFiles.find(f=>f.startsWith('public/package-audio/'))?Buffer.from('changed'):read(file)],
 ['missing evidence',file=>file===manifest.reviewPath?Buffer.from('{}'):read(file)],
];
verifyProductionRelease();
for(const [name,source] of cases)assert.throws(()=>verifyProductionRelease(source),undefined,name);
console.log('PASS exact release; rejects wrong owner, scope, lineage, runtime/audio bytes and missing review evidence.');
