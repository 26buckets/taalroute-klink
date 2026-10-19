import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import additional from '../data/klink-lexicon-wordbuild-rest.json' with {type:'json'};
import {contentPackages,allPackageWords,getPackage} from '../lib/package-content.ts';
import {taalroutePackages} from '../lib/taalroute-packages.ts';
import {groupActivities,groupExercises} from '../lib/group-practice.ts';
import {chapterCollections} from '../lib/practice-chapters.ts';
const spell=w=>w.normalize('NFC').toLocaleLowerCase('nl');
test('Every added word has exactly one new model task, with preserved sources and routes',()=>{
 assert.equal(additional.publicationAllowed,false);
 assert.deepEqual(contentPackages.slice(0,15),taalroutePackages);
 assert.equal(additional.packs.length,52);
 assert.equal(additional.packs.flatMap(p=>p.words).length,4769);
 const old=new Set(contentPackages.slice(0,16).flatMap(p=>p.words.map(w=>spell(w.word))));
 const seen=new Set(),ids=new Set();
 for(const pack of additional.packs){
  assert.equal(getPackage(pack.id).id,pack.id);assert(pack.words.length<=100);assert.equal(pack.media.publication,'blocked');
  assert.deepEqual(pack.practiceActivities,['build-model','worksheet']);
  assert.equal(pack.words.length,pack.exercises.length);
  assert.equal(new Set(pack.lessons.flatMap(l=>l.guidedExerciseIds)).size,pack.exercises.length);
  for(const word of pack.words){assert(!old.has(spell(word.word)));assert(!seen.has(spell(word.word)));seen.add(spell(word.word));assert(!ids.has(word.id));ids.add(word.id);assert.equal(word.audioStatus,'missing');assert.equal(word.audio,undefined);}
  for(const exercise of pack.exercises){
   const word=pack.words.find(w=>w.id===exercise.wordId);assert(word);
   assert.equal(exercise.exampleWord,word.word);assert.equal(exercise.requiresAudio,false);assert.equal(exercise.prompt.audio,undefined);
   assert.equal(exercise.answer.targetTileIds.map(id=>exercise.tiles.find(t=>t.id===id).token).join(''),word.word);
   assert.notEqual(exercise.tiles.map(t=>t.token).join(''),word.word);
   assert.equal(new Set(exercise.tiles.map(t=>t.id)).size,exercise.tiles.length);
   assert.equal(exercise.slots.length,exercise.tiles.length);
  }
 }
 assert.equal(new Set(allPackageWords.map(w=>w.id)).size,allPackageWords.length);
 assert.equal(new Set(allPackageWords.map(w=>spell(w.word))).size,5126);
});
test('All supplementary packs are selectable, with no generated audio-dependent or unrelated activities',()=>{
 const collections=chapterCollections('build-model');
 for(const pack of additional.packs){
  for(const activity of groupActivities){const rows=groupExercises(pack,activity.id);assert.equal(rows.length,pack.practiceActivities.includes(activity.id)?pack.exercises.length:0,`${pack.id}/${activity.id}`);}
  const selected=collections.filter(c=>c.pack.id===pack.id);assert.equal(selected.flatMap(c=>c.exercises).length,pack.exercises.length);
  assert(selected.every(c=>c.levels?.length && c.exercises.every(e=>JSON.stringify(e.vocabularyLevels)===JSON.stringify(c.levels))),'Exact shared vocabulary membership, without duplicate tasks');
 }
});
test('Local export matches installed data exactly',()=>{
 const local=JSON.parse(readFileSync('/Users/nicoknoester/Documents/Codex/2026-10-19/klink-lexicon-alle-woorden/woordbouw-pakketten.json'));
 assert.deepEqual(additional,local);
});
