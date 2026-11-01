import assert from 'node:assert/strict';
import test from 'node:test';
import { dailyBlocks, dailyAnswer, emptyDailyRecord, readDailyProgress, recordDailyAnswer } from '../lib/alfa-c-dagelijks.ts';

void test('72 source-bound tasks have unique IDs, complete audio and unambiguous responses', () => {
  const steps = dailyBlocks.flatMap(b => b.steps);
  assert.equal(steps.length, 72); assert.equal(new Set(steps.map(s => s.id)).size, 72);
  assert.equal(steps.filter(s => s.interaction === 'keuze').length, 64);
  for (const b of dailyBlocks) {
    assert.equal(b.steps.length, 12); assert(b.startAudio && b.endAudio);
    for (const s of b.steps) {
      for (const k of ['I', 'V', 'H', 'F', 'G']) assert(s.audio[k] && s.speech[k], s.id + k);
      assert(s.documents.length && s.documents.every(d => d.text.trim()));
      assert(!dailyAnswer(s, []));
      if (s.interaction === 'keuze') {
        assert.equal(s.options.filter(o => o.correct).length, 1);
        for (const o of s.options) assert.equal(dailyAnswer(s, [o.code]), o.correct);
      } else {
        assert.deepEqual([...s.cards].sort(), [...s.answerOrder].sort());
        assert.equal(new Set(s.cards).size, s.cards.length);
        assert(dailyAnswer(s, s.answerOrder)); assert(!dailyAnswer(s, [...s.answerOrder].reverse()));
      }
    }
  }
});
void test('first response and support survive correction and storage roundtrip', () => {
  for (const b of dailyBlocks) for (const s of b.steps) {
    const wrong = s.interaction === 'keuze' ? [s.options.find(o => !o.correct).code] : [...s.answerOrder].reverse();
    const right = s.interaction === 'keuze' ? [s.options.find(o => o.correct).code] : s.answerOrder;
    const first = recordDailyAnswer(s, emptyDailyRecord(), wrong);
    const corrected = recordDailyAnswer(s, { ...first, support: { ...first.support, example: 1, help: 1 } }, right);
    assert.equal(corrected.first.correct, false); assert.equal(corrected.first.support.example, 0);
    assert.equal(corrected.last.correct, true); assert.equal(corrected.last.support.example, 1); assert.equal(corrected.attempts, 2);
    const saved = { version: 1, positions: { [b.id]: 3 }, records: { [s.id]: corrected } };
    assert.deepEqual(readDailyProgress(JSON.stringify(saved)), saved);
  }
  assert.deepEqual(readDailyProgress('{broken'), { version: 1, positions: {}, records: {} });
  assert.deepEqual(readDailyProgress('{"version":2}'), readDailyProgress(null));
});
void test('latest Drive corrections and context survive adaptation', () => {
  const get = id => dailyBlocks.flatMap(b => b.steps).find(s => s.id === id);
  assert.equal(get('AFSPRAAK-07').instruction, 'Wat moet Idris eerst doen?');
  assert.equal(get('BON-07').instruction, 'Wat moet Nina met de bon doen?');
  assert(get('PAKJE-11').context[0].includes('14.00 uur'));
  assert.deepEqual(get('LES-11').documents.map(d => d.title), ['Bericht A', 'Bericht B']);
  assert.deepEqual(get('BON-12').documents.map(d => d.title), ['Bon A', 'Bon B']);
});
