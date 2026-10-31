import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { verifyImageSizeRelease } from './check-image-size-release-20261031.mjs';
const r=verifyImageSizeRelease();
for(const [file,mutate]of [
 ['docs/image-size-audit-20261031/backup.json',o=>({...o,verified:false})],
 ['docs/image-size-audit-20261031/review.json',o=>({...o,teacherGuard:false})],
 ['docs/image-size-audit-20261031/assets.json',o=>o.slice(1)],
 ['data/klink-compact-images-20261031.json',()=>({})],
])assert.throws(()=>verifyImageSizeRelease(f=>f===file?Buffer.from(JSON.stringify(mutate(JSON.parse(readFileSync(f))))):readFileSync(f)),file);
const image=r.changedFiles.find(f=>f.startsWith('public/compact-images'));
assert.throws(()=>verifyImageSizeRelease(f=>f===image?Buffer.from('corrupt'):readFileSync(f)));
console.log('PASS scoped release and five rejection checks');
