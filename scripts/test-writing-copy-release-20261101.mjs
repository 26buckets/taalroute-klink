import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyWritingCopyRelease} from './check-writing-copy-release-20261101.mjs';
test('writing batch has source, browser, preservation and verified Drive proof',()=>assert.equal(verifyWritingCopyRelease().ownerApproval,'standing-owner-approval'));
for(const[file,edit]of[
  ['components/product/package-exercise-browser.tsx',s=>s.replace("exercise.answerPolicy === 'exact-copy'",'false')],
  ['lib/copy-answer.ts',s=>s.replace(".normalize('NFC').trim()", ".toLowerCase().trim()")],
  ['data/klink-production-index.json',s=>s.replace('KSW-AC-TN-001-020','KSW-AC-TN-001-999')],
  ['docs/writing-copy-20261101/source.json',s=>s.replace('"hand"','"Hand"')],
  ['docs/writing-copy-20261101/local/browser-checks.json',s=>s.replace('"modelAlwaysVisible": true','"modelAlwaysVisible": false')],
  ['docs/writing-copy-20261101/content-review.json',s=>s.replace('"independentHumanReview": false','"independentHumanReview": true')],
  ['docs/writing-copy-20261101/verification.json',s=>s.replace('"progressPreserved": true','"progressPreserved": false')],
  ['docs/writing-copy-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
  ['docs/klink-owner-release-writing-copy-20261101.json',s=>s.replace('"publicationApproved": true','"publicationApproved": false')],
])test('release rejects altered '+file,()=>assert.throws(()=>verifyWritingCopyRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
