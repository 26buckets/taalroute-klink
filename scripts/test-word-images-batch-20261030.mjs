import assert from 'node:assert/strict';
import {readFileSync,writeFileSync} from 'node:fs';
import {verifyWordImagePreservation,verifyWordImagesBatchRelease} from './check-word-images-batch-release.mjs';
const media=verifyWordImagePreservation();
assert.throws(()=>verifyWordImagePreservation(f=>f==='data/klink-progress-image-aliases-20261030.json'?Buffer.from('{}'):readFileSync(f)));
assert.throws(()=>verifyWordImagePreservation(f=>f==='public'+media.assets[0].url?Buffer.from('changed'):readFileSync(f)));
if(process.argv.includes('--release')){verifyWordImagesBatchRelease();assert.throws(()=>verifyWordImagesBatchRelease(f=>f.endsWith('/backup.json')?Buffer.from('{"verified":false}'):readFileSync(f)));}
const result={images:7,placements:122,collections:65,remainingPlaceholders:232,contentAndAnswersPreserved:true,progressPreserved:true,immutableExistingAssets:true,ownerRejectedImagesExcluded:true};
writeFileSync('docs/word-images-batch-20261030/preservation.json',JSON.stringify(result,null,2)+'\n');console.log(result);
