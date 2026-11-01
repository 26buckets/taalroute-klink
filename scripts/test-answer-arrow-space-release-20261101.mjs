import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyAnswerArrowSpaceRelease} from './check-answer-arrow-space-release-20261101.mjs';
test('approved keyboard repair with mouse-focus and real-audio evidence passes',()=>assert.equal(verifyAnswerArrowSpaceRelease().approvedBy,'Nico'));
for(const file of ['hooks/use-practice-keyboard.ts','docs/KLINK-DOCENTHANDLEIDING.md','docs/answer-arrow-space-20261101/local/focus.json','docs/answer-arrow-space-20261101/local/audio.json']) {
  test('reject changed source or evidence: '+file,()=>assert.throws(()=>verifyAnswerArrowSpaceRelease(f=>f===file?Buffer.concat([readFileSync(f),Buffer.from(' ')]):readFileSync(f))));
}
for(const [file,field] of [['docs/klink-owner-release-answer-arrow-space-20261101.json','publicationApproved'],['docs/answer-arrow-space-20261101/backup.json','fullReadback']]) {
  test('reject absent approval or unverified backup: '+field,()=>assert.throws(()=>verifyAnswerArrowSpaceRelease(f=>{
    const bytes=readFileSync(f);return f===file?Buffer.from(JSON.stringify({...JSON.parse(bytes),[field]:false})):bytes;
  })));
}
