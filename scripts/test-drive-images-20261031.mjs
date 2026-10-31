import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyDriveImagePreservation,verifyDriveImagesRelease} from './check-drive-images-release-20261031.mjs';
const m=verifyDriveImagePreservation();
assert.throws(()=>verifyDriveImagePreservation(f=>f==='data/klink-progress-image-aliases-20261030.json'?Buffer.from('{}'):readFileSync(f)));
assert.throws(()=>verifyDriveImagePreservation(f=>f==='public'+m.assets[0].url?Buffer.from('corrupt'):readFileSync(f)));
if(process.argv.includes('--release')){verifyDriveImagesRelease();assert.throws(()=>verifyDriveImagesRelease(f=>f==='docs/drive-images-20261031/backup.json'?Buffer.from('{"verified":false}'):readFileSync(f)));}
const r={...m.summary,contentAndAnswersPreserved:true,progressPreserved:true,existingAssetsUnchanged:true,newImageGeneration:false};writeFileSync('docs/drive-images-20261031/preservation.json',JSON.stringify(r,null,2)+'\n');console.log(r);
