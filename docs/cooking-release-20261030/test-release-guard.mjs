import assert from 'node:assert/strict';import {readFileSync as read} from 'node:fs';import {verifyLongContentRelease} from '../../scripts/check-long-content-release-20261030.mjs';
const r=verifyLongContentRelease();let rejected=0;
for(const file of ['data/klink-connected-content.json','data/klink-dialogue-repair.json','data/klink-long-content-levels.json','public/content-register/active.json','lib/practice-chapters.ts','public/package-audio/kookherstel-20261030/d128-2.mp3']){assert.throws(()=>verifyLongContentRelease(f=>f===file?Buffer.concat([read(f),Buffer.from('tampered')]):read(f)));rejected++;}
assert.throws(()=>verifyLongContentRelease(f=>{if(f!=='docs/klink-owner-release-long-content-20261030.json')return read(f);return Buffer.from(JSON.stringify({...r,publicationApproved:false}));}));rejected++;
console.log(rejected+' targeted tampering cases rejected; normal release accepted');
