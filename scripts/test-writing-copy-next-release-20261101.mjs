import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyWritingCopyNextRelease} from './check-writing-copy-next-release-20261101.mjs';
const alias='public'+JSON.parse(readFileSync('data/klink-production-index.json')).find(r=>r.id==='production:copy:alfa-c:KSW-AC-TN-081-100').url;
test('the next writing release has source, answer, layout, retention and Drive proof',()=>assert.equal(verifyWritingCopyNextRelease().ownerApproval,'standing-owner-approval'));
for(const[file,edit]of[
  ['components/product/package-exercise-browser.tsx',s=>s.replace('copyDifferenceFeedback(accepted[0], value, exercise.feedback)','undefined')],
  ['lib/copy-answer.ts',s=>s.replace('${i + 1}','${i + 2}')],
  ['lib/production-practice.ts',s=>s.replace("throw new Error('Invalid copy model')","return data.exercises")],
  [alias,s=>s.replace('"KSW-AC-TN-097": "KSW-AC-TN-020"','"KSW-AC-TN-097": "KSW-AC-TN-021"')],
  ['docs/writing-copy-next-20261101/source.json',s=>s.replace('de docent','de dokter')],
  ['docs/writing-copy-next-20261101/local/browser-checks.json',s=>s.replace('"firstDifferenceExplained": true','"firstDifferenceExplained": false')],
  ['docs/writing-copy-next-20261101/local/layout-checks.json',s=>s.replace('"modelReachable": true','"modelReachable": false')],
  ['docs/writing-copy-next-20261101/local/loading-checks.json',s=>s.replace('"oldProgressPreserved": true','"oldProgressPreserved": false')],
  ['docs/writing-copy-next-20261101/verification.json',s=>s.replace('"progressPreserved": true','"progressPreserved": false')],
  ['docs/writing-copy-next-20261101/backup.json',s=>s.replace('"fullReadback": true','"fullReadback": false')],
  ['docs/klink-owner-release-writing-copy-next-20261101.json',s=>s.replace('"publicationApproved": true','"publicationApproved": false')],
])test('release rejects altered '+file,()=>assert.throws(()=>verifyWritingCopyNextRelease(f=>f===file?Buffer.from(edit(readFileSync(f).toString())):readFileSync(f))));
