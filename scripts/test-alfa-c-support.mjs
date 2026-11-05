import { dailyAudio, functionalAudio } from '../lib/alfa-c-audio.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { dailyBlocks} from '../lib/alfa-c-dagelijks.ts';
import { functionalBlocks} from '../lib/alfa-c-functioneel.ts';
import { pilotBlocks, alfaCGuideAudio } from '../lib/alfa-c-practice.ts';
const read = path => JSON.parse(fs.readFileSync(path));
const alignment = read('data/klink-alfa-c-readalong.json');
void test('Every daily source button reads every complete visible document, including the final line', () => {
  const clips = new Map(read('data/klink-alfa-c-dagelijks-audio.json').clips.map(c => [c.id, c]));
  for (const block of dailyBlocks) for (const step of block.steps) {
    assert.equal(step.speech.O, step.documents.map(d => d.text).join('\n\n'), step.id);
    for (const [role,id] of Object.entries(step.audio)) if(id) {
      assert.equal(clips.get(id)?.text, step.speech[role]);
      assert.equal(dailyAudio(id), clips.get(id).src);
      assert(fs.existsSync('public'+dailyAudio(id)));
    }
  }
});
void test('Explanation timings match exact text and unchanged audio, across all three players', () => {
  const bySource = new Map(alignment.clips.map(c => [c.src,c]));
  for (const c of alignment.clips) {
    assert.equal(createHash('sha256').update(fs.readFileSync('public'+c.src)).digest('hex'), c.sha256);
    assert.equal(c.words.map(w=>w.text).join('').replace(/\s/g,''),c.text.replace(/\s/g,''));
    assert(c.words.every((w,i)=>w.end>=w.start && (!i || w.start>=c.words[i-1].start)));
  }
  const expected=[];
  for(const b of dailyBlocks){expected.push([dailyAudio(b.startAudio),read('data/klink-alfa-c-dagelijks-audio.json').clips.find(c=>c.id===b.startAudio).text]);for(const s of b.steps)expected.push([dailyAudio(s.audio.I),s.speech.I]);}
  for(const b of functionalBlocks){expected.push([functionalAudio('guide',b.start),b.start]);for(const s of b.steps)for(const text of [s.instruction,s.exampleInstruction])if(text)expected.push([functionalAudio('guide',text),text]);}
  for(const b of pilotBlocks)for(const s of b.steps)expected.push([alfaCGuideAudio(s.spokenInstruction),s.spokenInstruction]);
  for(const [src,text] of expected)assert.equal(bySource.get(src)?.text,text,src);
});
void test('Correct-answer feedback varies and every phrase has the proper guide recording', () => {
  const phrases=new Set();
  for(const b of dailyBlocks)for(const s of b.steps)phrases.add(s.speech.G.split('.')[0]);
  assert(phrases.size>=8);
  for(const b of functionalBlocks)for(const s of b.steps)if(s.kind==='choice')assert(functionalAudio('guide',s.successFeedback));
  for(const b of pilotBlocks)for(const s of b.steps)if(s.goodFeedback)assert(alfaCGuideAudio(s.goodFeedback));
});
