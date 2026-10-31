import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {verifyPackageGridRelease} from './check-package-grid-release-20261031.mjs';
verifyPackageGridRelease();
for(const [file,field,value] of [
 ['docs/klink-owner-release-package-grid-20261031.json','appearanceChangeApproved',false],
 ['docs/klink-owner-release-package-grid-20261031.json','baselineSourceCommit','HEAD'],
 ['docs/package-grid-width-20261031/review.json','progress',false],
 ['docs/package-grid-width-20261031/backup.json','verified',false],
])assert.throws(()=>verifyPackageGridRelease(p=>p===file?Buffer.from(JSON.stringify({...JSON.parse(read(p)),[field]:value})):read(p)),field);
assert.throws(()=>verifyPackageGridRelease(p=>p==='app/globals.css'?Buffer.concat([read(p),Buffer.from('\nbody {display:none}')]):read(p)));
console.log('5 rejected mutations: unauthorized visual change, wrong base, missing progress check, unverified backup, extra CSS');
