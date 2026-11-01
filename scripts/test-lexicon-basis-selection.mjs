import test from 'node:test';
import assert from 'node:assert/strict';
import {contentPackages,lessonPackages} from '../lib/package-content.ts';
import {taalroutePackages} from '../lib/taalroute-packages.ts';
import {chapterCollections,matchesChapterSelection,chapterHash,parseChapterHash} from '../lib/practice-chapters.ts';
import {selectExerciseSet,exerciseSetHelp} from '../lib/content-levels.ts';
import data from '../data/klink-lexicon-wordbuild-rest.json' with {type:'json'};

void test('Exact Basis selection is reachable at six levels, counted once and remains guided',()=>{
 const supplements=contentPackages.filter(pack=>pack.practiceActivities?.includes('build-model'));
 const ids=new Set(supplements.map(pack=>pack.id));
 const rows=chapterCollections('build-model').filter(row=>ids.has(row.pack.id));
 assert.equal(rows.flatMap(row=>row.exercises).length,4789);
 assert.equal(new Set(rows.flatMap(row=>row.exercises.map(e=>e.exerciseId))).size,4789);
 const expected={'alfa-a':777,'alfa-b':777,'alfa-c':777,a1:777,a2:1793,b1:4729};
 for(const [level,count] of Object.entries(expected)){
   const selected=rows.filter(row=>matchesChapterSelection(row,{level}));
   assert.equal(selected.flatMap(row=>row.exercises).length,count,level);
   for(const row of selected){
     assert.equal(exerciseSetHelp(row.exercises),'guided');
     assert.deepEqual(selectExerciseSet(row.exercises,{level}),row.exercises);
     assert.equal(parseChapterHash(chapterHash({chapter:'spelling',activity:'build-model',level,collection:row.id})).collection,row.id);
   }
 }
 assert.deepEqual(rows.filter(row=>matchesChapterSelection(row,{level:'support'})),[]);
 assert.deepEqual(rows.filter(row=>matchesChapterSelection(row,{level:'all',help:'practice'})),[]);
});

void test('Excluded IDs never enter model tasks or word banks; original lesson route is preserved',()=>{
 const exclusions=new Set(data.selectionPolicy.excludedLexemeIds);
 assert(contentPackages.every(pack=>pack.words.every(word=>!exclusions.has(word.id))));
 assert.deepEqual(lessonPackages,taalroutePackages);
 assert.equal(lessonPackages.length,15);
 assert.equal(lessonPackages.flatMap(pack=>pack.lessons).length,302);
 for(const pack of data.packs)for(const word of pack.words){
   assert(word.selectedMeaningIds.length>0);
   for(const level of word.vocabularyLevels)assert(word.vocabularyCollections.includes(data.selectionPolicy.levelCollections[level]));
 }
});
