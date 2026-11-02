import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { allPackageWords, contentPackages } from '../lib/package-content.ts';
import { groupExercises } from '../lib/group-practice.ts';
import { writingDictationRounds } from '../lib/writing-dictation.ts';
import { displayedChapterCollections, chapterHash, parseChapterHash, selectedChapterCollection, chapterExerciseChoices } from '../lib/practice-chapters.ts';
import { wordRoundDefinitions } from '../lib/word-rounds.ts';
import { learningGoalFor } from '../lib/learning-goals.ts';
import { isInstructionAudioEnabled } from '../lib/audio-policy.ts';
import { wordAudioParts } from '../lib/word-audio.ts';
import { recordingForWord } from '../lib/word-listening.ts';

const data = JSON.parse(readFileSync('data/klink-writing-dictation-20261101.json'));
const originals = new Map(contentPackages.flatMap(pack => groupExercises(pack,'dictation').map(e => [e.exerciseId,e])));
const sourceIds = [];
test('100 source positions retain the answer contract: 54 references, 46 new canonical questions', () => {
  const snapshot = JSON.stringify([...originals]);
  let references=0,newQuestions=0;
  for (const round of writingDictationRounds) {
    assert([6,7].includes(round.exercises.length));
    const definitions=wordRoundDefinitions(round.exercises);
    assert.equal(definitions.length,round.exercises.every(e=>e.wordId)?1:0);
    if(definitions.length){assert.equal(definitions[0].image,undefined);assert.deepEqual(definitions[0].exerciseIds,round.exercises.map(e=>e.exerciseId));}
    for (const [i,e] of round.exercises.entries()) {
      const position=round.positions[i];sourceIds.push(position.id);
      assert.equal(e.writingSourceId,position.id);assert.equal(e.exerciseId,position.sourceId);
      assert.deepEqual(e.fields,[{id:'word',acceptedAnswers:[position.target]}]);
      assert.equal(e.mode,'word-dictation');assert.equal(e.componentId,'ALF-CMP-006');
      assert(e.requiresAudio&&e.audioOnly);assert.equal(e.prompt.audio.src,position.audio);
      assert.equal(e.exampleWord,undefined);assert.equal(e.displayWord,undefined);assert.equal(e.prompt.image,undefined);
      assert.equal(e.helpWord,position.target);assert.equal(e.independentReading,false);assert.equal(e.reviewEligible,false);
      assert.equal(e.meaning,position.helpFeedback);assert.deepEqual(e.writingHintUnits,position.hintUnits);
      assert(!wordAudioParts(e.feedback).some(part=>part.word===position.target));
      assert(position.hintUnits.every(start=>wordAudioParts(position.helpFeedback).some(part=>part.word&&part.start===start)));
      if(position.wordId)assert.equal(allPackageWords.find(w=>w.id===position.wordId)?.word,position.target);
      assert(isInstructionAudioEnabled(e.instructionAudio.src));
      assert(learningGoalFor(e)?.learnerText);
      const source=originals.get(e.exerciseId);
      if(source){references++;assert.deepEqual(e.fields,source.fields);assert.notEqual(e,source);assert.notEqual(e.fields,source.fields);}
      else{newQuestions++;assert.equal(e.exerciseId,position.id);}
      e.fields[0].acceptedAnswers.push('mutation cannot change source');
    }
  }
  assert.equal(references,54);assert.equal(newQuestions,46);assert.equal(new Set(sourceIds).size,100);
  assert.equal(JSON.stringify([...originals]),snapshot);
  // Undo local test mutation so later navigation tests inspect the original accepted answers.
  for(const round of writingDictationRounds)for(const e of round.exercises)e.fields[0].acceptedAnswers.pop();
});
test('fifteen short stable rounds open through both writing and spelling without changing old collections', () => {
  for(const chapter of ['writing','spelling']) {
    const rows=displayedChapterCollections('dictation',{chapter,level:'alfa-c',help:'practice'}).filter(row=>row.id.startsWith('ksw-ac-ht-'));
    assert.equal(rows.length,15);assert.equal(rows.reduce((n,row)=>n+row.exercises.length,0),100);
    for(const row of rows){
      const location={chapter,activity:'dictation',collection:row.id,level:'alfa-c',help:'practice'};
      assert.equal(selectedChapterCollection(parseChapterHash(chapterHash(location)))?.id,row.id);
      assert.equal(row.help,'practice');assert.equal(row.image,undefined);
      assert.equal(Boolean(row.wordRound),row.exercises.every(e=>e.wordId));
      for(const level of ['alfa-c','all'])for(const help of ['practice','all',undefined])for(const choice of chapterExerciseChoices({...location,level,help})){
        const selected=selectedChapterCollection({...location,level,help,chapter:choice.chapter,activity:choice.id,collection:choice.collection,...(choice.words?{words:choice.words}:{})});
        assert(selected);assert.equal(selected.level,'alfa-c');assert.equal(selected.help??'practice','practice');
        if(row.wordRound)assert.deepEqual(new Set(selected.wordRound.wordIds),new Set(row.wordRound.wordIds),'Other exercise keeps the same complete word set');
        else assert.equal(choice.id,'dictation','A missing shared word identity must not offer a different word set');
      }
    }
    assert.equal(displayedChapterCollections('dictation',{chapter,level:'alfa-a',help:'practice'}).some(row=>row.id.startsWith('ksw-ac-ht-')),false);
    assert.equal(displayedChapterCollections('dictation',{chapter,level:'alfa-c',help:'guided'}).some(row=>row.id.startsWith('ksw-ac-ht-')),false);
  }
});
test('six meaning cues identify the sense without displaying the spelling answer', () => {
  const cues=writingDictationRounds.flatMap(r=>r.positions).filter(p=>p.meaningCue);
  assert.deepEqual(cues.map(p=>p.id),['007','043','047','082','088','100'].map(id=>'KSW-AC-HT-'+id));
  for(const p of cues){assert(!p.meaningCue.toLocaleLowerCase('nl-NL').split(/\W+/).includes(p.target));assert(p.instructionAudio.includes(p.id));}
  assert.equal(data.rounds.length,15);
});
test('every full word in the new tasks, feedback and Help has an individual recording',()=>{
  const words=new Set(),missing=[];
  for(const round of writingDictationRounds)for(const e of round.exercises)for(const field of ['title','meaningCue','helpWord','feedback','correctFeedback','meaning'])for(const part of wordAudioParts(e[field]||'')){
    if(!part.word||(field==='meaning'&&e.writingHintUnits.includes(part.start)))continue;
    words.add(part.word);if(!recordingForWord(part.text))missing.push({sourceId:e.writingSourceId,field,word:part.text});
  }
  writeFileSync('docs/writing-dictation-20261101/local/word-audio-coverage.json',JSON.stringify({sourcePositions:100,distinctOrdinaryWords:words.size,missing,spellingUnitsExcluded:true},null,2)+'\n');
  assert.deepEqual(missing,[]);
});
