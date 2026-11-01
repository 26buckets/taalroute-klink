import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {wordAudioIndex,wordAudioKey,createWordAudioIndex,addLocalWordAudio} from '../lib/word-audio.ts';
import {allPackageWords} from '../lib/package-content.ts';
import oldRecordings from '../data/klink-inline-word-audio.json' with {type:'json'};
import reviewed from '../data/klink-word-audio-twenty-reviewed-20261101.json' with {type:'json'};
import {verifyTwentyWordAudioRelease,twentyWordApprovalFile} from './check-twenty-word-audio-release-20261101.mjs';

void test('Twenty reviewed exact word forms fill gaps without replacing any existing audio',()=>{
 const before=addLocalWordAudio(createWordAudioIndex(allPackageWords),oldRecordings);
 for(const[word,binding]of before)assert.deepEqual(wordAudioIndex.get(word),binding,word);
 assert.equal(wordAudioIndex.size,before.size+20);
 for(const c of reviewed.clips){
  const key=wordAudioKey(c.word);assert.equal(before.has(key),false,c.word);
  assert.deepEqual(wordAudioIndex.get(key),{src:c.src,status:'available',reviewOpen:false,localOnly:false},c.word);
  assert.equal(wordAudioIndex.get(wordAudioKey(c.word.toUpperCase())).src,c.src);
 }
 assert.equal(wordAudioIndex.get('we').src,'/package-audio/woordvormen-20261101/WA-dc7c811b9561-r5.wav');
 const changed={...reviewed.clips[0],src:'/package-audio/future/not-reviewed.wav'};
 assert.equal(addLocalWordAudio(new Map(),[changed]).get(changed.word).localOnly,true);
 assert.equal(addLocalWordAudio(new Map(),[{...reviewed.clips[0],humanReview:'rejected'}]).size,0);
});

void test('Publication rejects changes to the listening approval, binding, media or predecessor gate',()=>{
 const r=verifyTwentyWordAudioRelease();assert.equal(r.words.length,20);
 for(const file of [twentyWordApprovalFile,'data/klink-word-audio-twenty-reviewed-20261101.json','lib/word-audio.ts','scripts/check-grammar-publication-20261101.mjs','public'+reviewed.clips[0].src]){
  assert.throws(()=>verifyTwentyWordAudioRelease(path=>path===file?Buffer.concat([readFileSync(path),Buffer.from('unreviewed')]):readFileSync(path)),file);
 }
});
