import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyInsightsMenuRelease} from './check-insights-menu-link-release-20261101.mjs';
await test('Accepts the exact checked external Inzichten menu addition',()=>assert.equal(verifyInsightsMenuRelease().baselineSourceCommit,'08fda5b385ed384d7bf6bebae7a8a2d388c4ac39'));
for(const [name,file,change]of [
 ['unsafe destination','components/product/taalroute-header.tsx',s=>s.replace('https://inzicht.taalroute.nl/','https://other.invalid/')],
 ['lost separate tab','components/product/taalroute-header.tsx',s=>s.replace('target="_blank"','target="_self"')],
 ['failed browser proof','docs/insights-menu-link-20261101/local/checks.json',s=>s.replace('"realDestination": true','"realDestination": false')],
 ['unverified backup','docs/insights-menu-link-20261101/backup.json',s=>s.replace('"verified": true','"verified": false')]
])await test('Rejects '+name,()=>assert.throws(()=>verifyInsightsMenuRelease(f=>f===file?Buffer.from(change(readFileSync(f).toString())):readFileSync(f))));
