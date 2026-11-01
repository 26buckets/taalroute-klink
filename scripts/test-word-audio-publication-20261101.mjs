import test from 'node:test';
import assert from 'node:assert/strict';
import {addLocalWordAudio,wordAudioIndex,wordAudioKey} from '../lib/word-audio.ts';
import recordings from '../data/klink-inline-word-audio.json' with {type:'json'};
import publication from '../data/klink-word-audio-publication-20261101.json' with {type:'json'};

void test('Exactly the existing owner-approved word recordings can play outside localhost',()=>{
 assert.equal(publication.publicationApproved,true);
 assert.deepEqual(publication.bindings,recordings.map(({word,src})=>({word,src})));
 const index=addLocalWordAudio(new Map(),recordings);
 for(const recording of recordings.filter(row=>row.humanReview!=='rejected')){
  const binding=index.get(wordAudioKey(recording.word));
  assert.equal(binding?.status,'available',recording.word);
  assert.equal(binding.localOnly,false,recording.word);
 }
 assert.equal(wordAudioIndex.get('we')?.localOnly,false);
 const unapproved={...recordings[0],word:'onvrijgegeven',src:'/package-audio/new/unapproved.mp3'};
 const local=addLocalWordAudio(new Map(),[unapproved]);assert.equal(local.get(unapproved.word)?.localOnly,true);
 const changed=addLocalWordAudio(new Map(),[{...recordings[0],src:unapproved.src}]);assert.equal(changed.get(wordAudioKey(recordings[0].word))?.localOnly,true);
 const rejected=addLocalWordAudio(new Map(),[{...recordings[0],humanReview:'rejected'}]);assert.equal(rejected.size,0);
});
