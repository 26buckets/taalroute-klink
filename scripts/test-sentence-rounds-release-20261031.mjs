import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {verifySentenceRoundsRelease} from './check-sentence-rounds-release-20261031.mjs';
verifySentenceRoundsRelease();
for(const[file,mutate]of[
 ['docs/klink-owner-release-sentence-rounds-20261031.json',v=>({...v,publicationApproved:false})],
 ['docs/klink-owner-release-sentence-rounds-20261031.json',v=>({...v,appearanceChanged:true})],
 ['docs/klink-owner-release-sentence-rounds-20261031.json',v=>({...v,newAudioGenerated:true})],
 ['docs/zinnen-a1-a2-20261031/review.json',v=>({...v,progress:false})],
 ['docs/zinnen-a1-a2-20261031/backup.json',v=>({...v,verified:false})],
 ['docs/zinnen-a1-a2-20261031/audio-check.json',v=>({...v,recordings:[]})],
 ['docs/zinnen-a1-a2-20261031/player-check.json',v=>({...v,checks:[]})],
 ['docs/zinnen-a1-a2-20261031/appearance-check.json',v=>({...v,equal:false})],
 ['docs/zinnen-a1-a2-20261031/existing-audio-live.json',v=>({...v,checks:[]})]
])assert.throws(()=>verifySentenceRoundsRelease(p=>p===file?Buffer.from(JSON.stringify(mutate(JSON.parse(read(p))))):read(p)),file);
for(const file of ['data/klink-production-index.json','data/klink-connected-content.json','docs/appearance-floor-20261031/floor.json'])assert.throws(()=>verifySentenceRoundsRelease(p=>p===file?Buffer.from('unapproved change'):read(p)),file);
console.log('PASS release guard rejects twelve unapproved, incomplete or unverified variants');
