import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {verifyWordPlaceholderRelease} from './check-word-placeholder-release-20261031.mjs';
verifyWordPlaceholderRelease();
for(const[file,field,value]of[
 ['docs/klink-owner-release-word-placeholder-20261031.json','appearanceChangeApproved',false],
 ['docs/klink-owner-release-word-placeholder-20261031.json','baselineSourceCommit','HEAD'],
 ['docs/word-placeholder-20261031/review.json','savedWords',false],
 ['docs/word-placeholder-20261031/backup.json','verified',false],
])assert.throws(()=>verifyWordPlaceholderRelease(p=>p===file?Buffer.from(JSON.stringify({...JSON.parse(read(p)),[field]:value})):read(p)),field);
assert.throws(()=>verifyWordPlaceholderRelease(p=>p==='app/learner-layout.css'?Buffer.from(read(p).toString().replace('opacity: .035','opacity: 1')):read(p)));
console.log('PASS: approved scope; rejected unauthorized appearance, wrong base, missing saved-word check, unverified backup and stronger logo');
