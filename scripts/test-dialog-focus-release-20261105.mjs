import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyDialogFocusContent, verifyDialogFocusRelease } from './check-dialog-focus-release-20261105.mjs';
const folder='docs/focus-audit-all-20261105/publication-final/';
verifyDialogFocusRelease();
for (const file of ['app/globals.css','components/product/motion-feedback.tsx','components/product/practice-line.tsx',folder+'owner-request.json',folder+'dialogs-after/checks.json',folder+'base-dialogs-final/checks.json',folder+'help/browser.json']) {
  assert.throws(()=>verifyDialogFocusContent(path=>path===file ? Buffer.concat([readFileSync(path),Buffer.from('changed')]) : readFileSync(path)));
}
for (const key of ['fullReadback','zipIntegrity','allPayloadHashesMatch']) assert.throws(()=>verifyDialogFocusRelease(path=>path===folder+'backup.json' ? Buffer.from(JSON.stringify({...JSON.parse(readFileSync(path)),[key]:false})) : readFileSync(path)));
for (const key of ['baselineSourceCommit','liveSourceCommit','checkedCandidateCommit']) assert.throws(()=>verifyDialogFocusContent(path=>path===folder+'approval.json' ? Buffer.from(JSON.stringify({...JSON.parse(readFileSync(path)),[key]:'0'.repeat(40)})) : readFileSync(path)));
console.log('PASS dialog focus release and 13 rejected source, evidence, ancestry and backup mutations.');
