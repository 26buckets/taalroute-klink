import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {verifyReadingAudioRelease} from './check-reading-audio-release-20261031.mjs';
verifyReadingAudioRelease();
for(const[file,mutate]of[
 ['docs/klink-owner-release-reading-audio-20261031.json',v=>({...v,publicationApproved:false})],
 ['docs/klink-owner-release-reading-audio-20261031.json',v=>({...v,appearanceChanged:true})],
 ['docs/klink-owner-release-reading-audio-20261031.json',v=>({...v,baselineSourceCommit:'c5555f21'})],
 ['docs/leesrondes-audio-20261031/voice-plan.json',v=>({...v,items:v.items.slice(1)})],
 ['docs/leesrondes-audio-20261031/recordings.json',v=>({...v,recordings:v.recordings.map((r,i)=>i? r:{...r,voiceId:'h6uBOiAjLKklte8hdYio'})})],
 ['docs/leesrondes-audio-20261031/recordings.json',v=>({...v,recordings:v.recordings.map((r,i)=>i? r:{...r,metadata:{}})})],
 ['docs/leesrondes-audio-20261031/text-check.json',v=>({...v,passed:false})],
 ['docs/leesrondes-audio-20261031/progress-check.json',v=>({...v,checks:[]})],
 ['docs/leesrondes-audio-20261031/appearance-check.json',v=>({...v,equal:false})],
 ['docs/leesrondes-audio-20261031/review.json',v=>({...v,progress:false})],
 ['docs/leesrondes-audio-20261031/backup.json',v=>({...v,verified:false})]
])assert.throws(()=>verifyReadingAudioRelease(p=>p===file?Buffer.from(JSON.stringify(mutate(JSON.parse(read(p))))):read(p)),file);
for(const file of ['data/klink-production-index.json','data/klink-progress-image-aliases-20261030.json','docs/appearance-floor-20261031/floor.json','docs/leesrondes-a1-a2-20261031/source.json','public/package-audio/reading-rounds-20261031/a1-t01.wav'])assert.throws(()=>verifyReadingAudioRelease(p=>p===file?Buffer.from('unapproved change'):read(p)),file);
console.log('PASS release guard rejects sixteen incomplete, altered, unapproved or unverified variants');
