import {approvedWords} from './check-approved-word-snapshot.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { assertWordAudioMappings } from './check-word-audio-release.mjs';
import { allPackageWords } from '../lib/package-content.ts';

const voiceId='0qLmDzgqulxcvv0yf3kg';
const recording=(id,text)=>({id,text,src:`/package-audio/woorden-20261025/${id}.mp3`,role:'target',voiceId,metadataApproved:true,humanReview:'open'});
void test('New word audio preserves pictures and only the explicitly named existing recording can be replaced',()=>{
  const before={new:{image:'/approved.webp',review:'open'},'klink-woord-man':{audio:'/old-man.mp3',image:'/man.webp'}};
  const rows=[recording('new','nieuw'),recording('klink-woord-man','man')],words=new Map([['new','nieuw'],['klink-woord-man','man']]);
  const after=structuredClone(before);for(const row of rows)after[row.id]={...after[row.id],audio:row.src};
  assert.equal(assertWordAudioMappings(before,after,rows,words),2);
  const picture=structuredClone(after);picture.new.image='/other.webp';assert.throws(()=>assertWordAudioMappings(before,picture,rows,words));
  const retained=structuredClone(before);retained.new.audio='/approved.mp3';assert.throws(()=>assertWordAudioMappings(retained,after,rows,words));
  for(const patch of [{text:'ander'},{role:'instruction'},{voiceId:'other'},{src:'/package-audio/woorden-20261025/../escape.mp3'},{metadataApproved:false},{humanReview:'approved'}])assert.throws(()=>assertWordAudioMappings(before,after,[{...rows[0],...patch},rows[1]],words));
  assert.throws(()=>assertWordAudioMappings(before,after,[rows[0],rows[0]],words));
});
void test('All 5127 displayed word cards resolve audio and keep the latest approved images',()=>{
  assert.equal(allPackageWords.length,5127);assert(allPackageWords.every(word=>word.audio));
  const manifest=JSON.parse(readFileSync('docs/klink-wordaudio-publication-20261025/audio-manifest.json'));
  for(const row of manifest){const word=allPackageWords.find(word=>word.id===row.id);assert.equal(word.word,row.text);assert.equal(word.audio,approvedWords.get(word.id).audio);}
  const images=JSON.parse(readFileSync('docs/klink-images-20261025/images.json'));
  for(const image of images)for(const id of image.ids)assert.equal(allPackageWords.find(word=>word.id===id).image,approvedWords.get(id).image,id);
});
