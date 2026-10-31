import test from 'node:test';
import { execFileSync } from 'node:child_process';
const approvedFeedback = JSON.parse(execFileSync('git', ['show', '02f16c1fdcb540550de91510c1a11c7ca29c4bbd:data/klink-alfa-c-texts.json']));
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pilotBlocks, alfaCCommonTexts } from '../lib/alfa-c-practice.ts';
const reviewed = JSON.parse(readFileSync('docs/klink-alfa-c-texts-20261027/reviewed-text-package.json'));
test('All 36 learner texts match the reviewed package without changing answers or source media', () => {
  assert.equal(pilotBlocks.length, 3);
  for (const [b, block] of pilotBlocks.entries()) {
    const source = reviewed.blocks[b];
    assert.equal(block.startText, source.theme.start);
    assert.equal(block.endText, source.theme.end);
    assert.deepEqual(block.words, source.theme.words);
    assert.equal(block.steps.length, 12);
    for (const [i, step] of block.steps.entries()) {
      const s = source.steps[i];
      assert.equal(step.model, s.target);
      assert.equal(step.instruction, s.screen);
      assert.equal(step.spokenInstruction, s.spoken);
      assert.equal(step.exampleInstruction, s.example_spoken);
      assert.equal(step.help, s.help_visible ?? '');
      assert.equal(step.errorFeedback, s.error);
      assert.equal(step.goodFeedback, approvedFeedback.blocks[block.id].steps[i].good);
      assert.equal(step.afterListening, s.finish_spoken);
      if (step.exercise.tiles) {
        assert.match(step.errorFeedback, /Eén terug.*leeg/);
        assert(!step.help.includes(step.model));
      }
      if (i < 3) assert.equal(step.help, '');
    }
  }
  for (const [title, text] of reviewed.commonTexts) assert.equal(alfaCCommonTexts[title].text, text);
});
