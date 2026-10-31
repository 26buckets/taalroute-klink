import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {verifyReadingRoundsRelease} from './check-reading-rounds-release-20261031.mjs';
verifyReadingRoundsRelease();
for(const[file,mutate]of[
 ['docs/klink-owner-release-reading-rounds-20261031.json',v=>({...v,publicationApproved:false})],
 ['docs/klink-owner-release-reading-rounds-20261031.json',v=>({...v,appearanceChanged:true})],
 ['docs/klink-owner-release-reading-rounds-20261031.json',v=>({...v,newAudioGenerated:true})],
 ['docs/leesrondes-a1-a2-20261031/review.json',v=>({...v,progress:false})],
 ['docs/leesrondes-a1-a2-20261031/backup.json',v=>({...v,verified:false})],
 ['docs/leesrondes-a1-a2-20261031/player-check.json',v=>({...v,checks:[]})],
 ['docs/leesrondes-a1-a2-20261031/appearance-check.json',v=>({...v,equal:false})]
])assert.throws(()=>verifyReadingRoundsRelease(p=>p===file?Buffer.from(JSON.stringify(mutate(JSON.parse(read(p))))):read(p)),file);
for(const file of ['data/klink-production-index.json','components/product/extended-practice-surface.tsx','docs/appearance-floor-20261031/floor.json'])assert.throws(()=>verifyReadingRoundsRelease(p=>p===file?Buffer.from('unapproved change'):read(p)),file);
console.log('PASS release guard rejects ten unapproved, incomplete or unverified variants');
