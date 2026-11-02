import assert from 'node:assert/strict';
import {parseOwnSentence,checkSentenceAnswer} from '../lib/sentence-answer.ts';
assert.deepEqual(parseOwnSentence('{broken'),{draft:''});
assert.deepEqual(parseOwnSentence(JSON.stringify({draft:'Mijn eigen zin.',first:{medium:'typed',text:'Mijn eerste zin.'}})),{draft:'Mijn eigen zin.',first:{medium:'typed',text:'Mijn eerste zin.'}});
assert.deepEqual(parseOwnSentence(JSON.stringify({draft:'',first:{medium:'model',text:'Gekopieerd model'}})),{draft:''});
assert.equal(parseOwnSentence(JSON.stringify({draft:'',first:{medium:'spoken',text:'hardop geoefend'}})).first.medium,'spoken');
assert.deepEqual(parseOwnSentence(JSON.stringify({draft:'a'.repeat(10001)})),{draft:''});
for(const text of ['Ik werk hier.','Mijn collega’s helpen.','Stuur een e-mail.','Eerst lees ik. Dan schrijf ik.']){
 assert(checkSentenceAnswer(text,text,true).correct);assert(checkSentenceAnswer(text,text.toLowerCase(),false).correct);
 assert(!checkSentenceAnswer(text,'helemaal iets anders',false).correct);
}
assert(!checkSentenceAnswer('Ik werk hier.','ik werk hier',true).correct);
assert(checkSentenceAnswer('Ik werk hier.','ik werk hier',false).correct);
assert(!checkSentenceAnswer('Ik werk hier.','Hier werk ik.',false).correct);
assert.match(checkSentenceAnswer('Ik werk hier.','Hier werk ik.',false).feedback,/volgorde/);
assert.match(checkSentenceAnswer('Ik werk hier.','Ik werk hier daar.',false).feedback,/woord 4/);
assert(!checkSentenceAnswer('Ik werk hier.','Ik werkt hier.',false).correct);
console.log('Sentence copying/dictation distinctions and first-own-response validation passed.');
