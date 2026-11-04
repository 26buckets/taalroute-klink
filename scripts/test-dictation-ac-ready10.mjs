import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {availableChapterCollections} from '../lib/practice-chapters.ts';
import {isInstructionAudioEnabled} from '../lib/audio-policy.ts';
import {checkSentenceAnswer} from '../lib/sentence-answer.ts';
const root='docs/dictation-ac-ready10-20261104/',m=JSON.parse(readFileSync(root+'manifest.json'));
const bank=JSON.parse(readFileSync(root+'source-bank.json')),source=JSON.parse(readFileSync(root+'selected-sentences.json'));
const hash=b=>createHash('sha256').update(b).digest('hex');
assert.equal(hash(readFileSync(root+'source-bank.json')),m.bankSha256);
const audio=readFileSync(root+'audio-original.bin');assert.equal(hash(audio),m.audioBundle.sha256);
for(const c of Object.values(m.audioBundle.clips))assert.equal(hash(audio.subarray(c.offset,c.offset+c.length)),c.sha256);
assert(availableChapterCollections('sentence-dictation',{chapter:'writing',level:'alfa-c',help:'practice'}).some(r=>r.id===m.row.id));
assert.equal(bank.exercises.length,10);assert.equal(new Set(bank.exercises.map(e=>e.exerciseId)).size,10);
for(const [i,e]of bank.exercises.entries()){
 assert.equal(e.exerciseId,source[i].id);assert.equal(e.writingSourceId,e.exerciseId);
 assert.equal(e.sourceDocumentId,'1GPKZxvJqZypCO-GkyDGHV7k7LX3wFz4B5D7ZGFp3RYc');
 const accepted=e.fields[0].acceptedAnswers;
 assert.deepEqual(accepted,i===1?[source[i].model,source[i].model.replace('acht','8')]:[source[i].model]);
 assert(!e.helpWord&&!e.exampleWord&&!e.prompt.text&&!e.independentReading&&!e.reviewEligible);
 assert(e.requiresAudio&&e.audioOnly&&e.requiresExplicitCompletion&&e.manualAdvance);
 assert.equal(e.sentenceAnswerPolicy,'dictation');assert.equal(e.assessment,'answer');
 assert(isInstructionAudioEnabled(e.instructionAudio.src));
 assert.notEqual(m.audioBundle.clips[e.exerciseId].voiceId,m.instruction.voiceId);
 for(const a of accepted)assert(checkSentenceAnswer(accepted,a,false).correct);
 assert(!checkSentenceAnswer(accepted,'Een andere zin.',false).correct);
}
console.log('Ten exact source models, explicit variants, hidden targets, separate voices, audio slices and menu attachment verified.');
