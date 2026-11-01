import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyTextQuestionSpacingRelease} from './check-text-question-spacing-release-20261101.mjs';
test('approved compact source questions preserve text, audio, keyboard and old progress',()=>assert.equal(verifyTextQuestionSpacingRelease().approvedBy,'Nico'));
for(const[file,edit]of[
 ['app/learner-layout.css',s=>s+'\n.learner-app button {font-size:10px;}'],
 ['docs/klink-owner-release-text-question-spacing-20261101.json',s=>s.replace('"appearanceChangeApproved": true','"appearanceChangeApproved": false')],
 ['docs/text-question-spacing-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
])test('rejects altered '+file,()=>assert.throws(()=>verifyTextQuestionSpacingRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
