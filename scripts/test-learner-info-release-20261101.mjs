import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyLearnerInfoRelease} from './check-learner-info-release-20261101.mjs';
const owner='docs/klink-owner-release-learner-info-20261101.json';
test('approved source, scope, local checks and verified backup pass',()=>assert.equal(verifyLearnerInfoRelease().approvedBy,'Nico'));
for(const file of ['hooks/use-practice-keyboard.ts','components/product/imported-practice-surface.tsx'])test('reject changed source '+file,()=>assert.throws(()=>verifyLearnerInfoRelease(f=>f===file?Buffer.concat([readFileSync(f),Buffer.from('\n// altered')]):readFileSync(f))));
for(const [file,change]of[[owner,r=>({...r,publicationApproved:false})],['docs/learner-info-release-20261101/backup.json',r=>({...r,fullReadback:false})],['docs/learner-info-release-20261101/local/info/checks.json',r=>({...r,checks:r.checks.map((c,i)=>i?c:{...c,keyboardContained:false})})]])test('reject invalid evidence '+file,()=>assert.throws(()=>verifyLearnerInfoRelease(f=>f===file?Buffer.from(JSON.stringify(change(JSON.parse(readFileSync(f))))):readFileSync(f))));
