import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {verifyWordLibraryRelease} from './check-word-library-release-20261031.mjs';
verifyWordLibraryRelease();
for(const[file,mutate]of[
 ['docs/klink-owner-release-word-library-20261031.json',o=>({...o,publicationApproved:false})],
 ['docs/klink-owner-release-word-library-20261031.json',o=>({...o,visualScope:'whole-app'})],
 ['docs/klink-owner-release-word-library-20261031.json',o=>({...o,baselineSourceCommit:'HEAD'})],
 ['docs/word-library-menu-20261031/backup.json',o=>({...o,verified:false})],
 ['docs/word-library-menu-20261031/review.json',o=>({...o,savedWords:false})],
 ['data/klink-word-library-index.json',o=>({...o,collections:[]})],
])assert.throws(()=>verifyWordLibraryRelease(f=>f===file?Buffer.from(JSON.stringify(mutate(JSON.parse(readFileSync(f))))):readFileSync(f)),file);
assert.throws(()=>verifyWordLibraryRelease(f=>f==='components/product/learner-app.tsx'?Buffer.from('broken'):readFileSync(f)));
console.log('PASS word-library scope, source, mapping, backup and seven rejection checks');
