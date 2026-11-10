import assert from 'node:assert/strict';import {test} from 'node:test';import {readFileSync} from 'node:fs';import {verifyInlineHeaderRelease} from './check-inline-header-release-20261110.mjs';
const record='docs/header-inline-20261110/approval.json';
await test('approved header release preserves the latest live basis',()=>assert(verifyInlineHeaderRelease().publicationApproved));
for(const[field,value]of[['publicationApproved',false],['appearanceChangeApproved',false],['liveSourceCommit','0'.repeat(40)],['liveAudioWorkerVersion','unknown'],['newMeteredServices',1]])await test('reject changed '+field,()=>assert.throws(()=>verifyInlineHeaderRelease(p=>p===record?JSON.stringify({...JSON.parse(readFileSync(p)),[field]:value}):readFileSync(p))));
await test('reject unreviewed runtime bytes',()=>assert.throws(()=>verifyInlineHeaderRelease(p=>p==='components/product/taalroute-header.tsx'?Buffer.concat([readFileSync(p),Buffer.from('\n// changed')]):readFileSync(p))));
