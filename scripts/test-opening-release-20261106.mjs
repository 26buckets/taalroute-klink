import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyOpeningRelease} from './check-opening-release-20261106.mjs';
const folder='docs/pr12-publication-20261106/',r=verifyOpeningRelease();let rejected=0;
for(const p of Object.keys({...r.files,...r.evidenceFiles})) { assert.throws(()=>verifyOpeningRelease(f=>f===p?Buffer.concat([readFileSync(f),Buffer.from('changed')]):readFileSync(f)),p);rejected++; }
for(const key of ['publicationApproved','baselineSourceCommit','checkedCandidateCommit']) { assert.throws(()=>verifyOpeningRelease(f=>f===folder+'approval.json'?Buffer.from(JSON.stringify({...r,[key]:false})):readFileSync(f)));rejected++; }
for(const key of ['fullReadback','allPayloadHashesMatch']) { assert.throws(()=>verifyOpeningRelease(f=>f===folder+'backup.json'?Buffer.from(JSON.stringify({...JSON.parse(readFileSync(f)),[key]:false})):readFileSync(f)));rejected++; }
console.log('PASS',rejected,'source, authorization, evidence and recovery mutations rejected');
