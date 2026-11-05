import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyHelpContextRelease } from './check-help-en-context-release-20261105.mjs';
const folder = 'docs/help-en-context-20261105/';
verifyHelpContextRelease();
for (const file of [folder + 'owner-request.json',folder + 'local-browser.json','app/learner-layout.css','data/klink-media.json']) {
  assert.throws(() => verifyHelpContextRelease(path => path === file ? Buffer.concat([readFileSync(path),Buffer.from('\n')]) : readFileSync(path)));
}
assert.throws(() => verifyHelpContextRelease(path => path === folder+'backup.json' ? Buffer.from(JSON.stringify({...JSON.parse(readFileSync(path)), fullReadback:false})) : readFileSync(path)));
console.log('PASS unapproved content, evidence and backup mutations are rejected');
