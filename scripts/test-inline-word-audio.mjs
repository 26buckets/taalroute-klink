import test from 'node:test';
import assert from 'node:assert/strict';
import { wordAudioParts, createWordAudioIndex, wordAudioKey, addLocalWordAudio, isLocalWordAudioHost } from '../lib/word-audio.ts';
test('Exact text survives tokenisation: repeated words, punctuation, Unicode and line breaks',()=>{
 for(const text of ['De kok belt de kok op.','Eén café, café.\nZij vraagt: “Hoe?”','Ik heb … euro.','e-mail: zo’n woord.','', '12:30']) assert.equal(wordAudioParts(text).map(p=>p.text).join(''),text);
 assert.deepEqual(wordAudioParts('De kok, de kok.').filter(p=>p.word==='kok').map(p=>p.start),[3,11]);
 assert.equal(wordAudioKey('ÉÉN'),'één');
});
test('Only exact, unambiguous, released-path word recordings are usable',()=>{
 const words=[{word:'huis',audio:'/package-audio/house.mp3',audioStatus:'approved'}, {word:'huizen'}, {word:'pak',audio:'/package-audio/a.mp3'}, {word:'pak',audio:'/package-audio/b.mp3'}, {word:'kwaad',audio:'/package-audio/reject.mp3',audioStatus:'rejected'}, {word:'nieuw',audio:'/package-audio/candidates/test.wav'}, {word:'pad',audio:'/package-audio/../private.wav'}, {word:'twee woorden',audio:'/package-audio/phrase.mp3'}, {word:'extern',audio:'https://example.com/file.mp3'}];
 const index=createWordAudioIndex(words);
 assert.equal(index.get('huis').src,'/package-audio/house.mp3'); assert.equal(index.get('huis').reviewOpen,false);
 assert.equal(index.get('huizen').status,'missing'); assert.equal(index.get('pak').status,'ambiguous');
 for(const key of ['kwaad','nieuw','pad','extern']) assert.equal(index.get(key).status,'blocked');
 assert(!index.has('twee woorden')); assert(!index.has('hUis')); assert(!index.has('huisje'));
 assert.deepEqual(createWordAudioIndex(words.slice().reverse()),index);
});
test('Duplicate bindings stay usable and review status is not silently upgraded',()=>{
 const index=createWordAudioIndex([{word:'De',audio:'/package-audio/de.wav',audioStatus:'approved'},{word:'de',audio:'/package-audio/de.wav',audioStatus:'review-open'}]);
 assert.equal(index.get('de').status,'available');assert.equal(index.get('de').reviewOpen,true);
});
test('Local supplementation cannot replace existing audio or bypass provenance and publication limits',()=>{
 const index=createWordAudioIndex([{word:'de',audio:'/package-audio/de.wav',audioStatus:'approved'}]);
 const clip={word:'loopt',src:'/package-audio/woordvormen-20261101/test.mp3',voiceId:'target-voice',role:'target',metadataApproved:true,localOnly:true};
 addLocalWordAudio(index,[clip,{...clip,word:'de'},{...clip,word:'onbekend',metadataApproved:false},{...clip,word:'uitleg',role:'guide'},{...clip,word:'verborgen',src:'/package-audio/candidates/test.mp3'},{...clip,word:'online',localOnly:false}]);
 assert.equal(index.get('de').src,'/package-audio/de.wav');assert.equal(index.get('loopt').localOnly,true);assert.equal(index.get('loopt').reviewOpen,true);
 for(const key of ['onbekend','uitleg','verborgen','online'])assert(!index.has(key));
 for(const host of ['localhost','127.0.0.1','[::1]'])assert(isLocalWordAudioHost(host));
 for(const host of ['klink.taalroute.nl','localhost.example.com','127.0.0.1.example.com',''])assert(!isLocalWordAudioHost(host));
});

test('A rejected local recording cannot remain audible, and a replacement keeps its own review state',()=>{
 const index=createWordAudioIndex([]);
 const clip={word:'we',src:'/package-audio/woordvormen-20261101/rejected.wav',voiceId:'target-voice',role:'target',metadataApproved:true,localOnly:true,humanReview:'rejected'};
 addLocalWordAudio(index,[clip]);assert(!index.has('we'));
 addLocalWordAudio(index,[{...clip,src:'/package-audio/woordvormen-20261101/replacement.wav',humanReview:'open'}]);
 assert.equal(index.get('we').src,'/package-audio/woordvormen-20261101/replacement.wav');assert.equal(index.get('we').reviewOpen,true);
});
