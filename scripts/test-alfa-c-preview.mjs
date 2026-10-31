import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  pilotBlocks,
  readPilotProgress,
  practiceAgain,
  pilotStorageKey,
} from '../lib/alfa-c-practice.ts';
import { contentById, sentenceLevelReviews } from '../lib/connected-content.ts';
import { allPackageWords } from '../lib/package-content.ts';
test('Three bounded pilots reuse real source media without modifying source levels', () => {
  assert.equal(pilotBlocks.length, 3);
  const ids = [];
  for (const b of pilotBlocks) {
    assert.equal(b.steps.length, 12);
    for (const s of b.steps) {
      ids.push(s.id);
      assert(s.sourceIds.length);
      for (const id of s.sourceIds)
        assert(contentById.has(id) || allPackageWords.some((w) => w.id === id));
      for (const url of [
        s.instructionAudio,
        s.exercise.questionAudio,
        s.exercise.prompt?.audio?.src,
        s.exercise.prompt?.image?.src,
        ...(s.exercise.options ?? []).map((o) => o.image?.src),
      ].filter(Boolean))
        assert(fs.existsSync('public' + url), url);
      assert.equal(s.exercise.independentReading, false);
      assert.equal(s.exercise.reviewEligible, false);
      assert(s.exercise.prompt.audio.audioId);
      if (s.exercise.options) {
        assert.equal(
          s.exercise.options.filter((o) =>
            s.exercise.answer.correctOptionIds.includes(o.id),
          ).length,
          1,
        );
        assert(
          new Set(s.exercise.options.map((o) => o.id)).size ===
            s.exercise.options.length,
        );
      }
      if (s.exercise.tiles) {
        assert.equal(
          new Set(s.exercise.tiles.map((t) => t.id)).size,
          s.exercise.tiles.length,
        );
        assert.equal(
          s.exercise.answer.targetTileIds
            .map((id) => s.exercise.tiles.find((t) => t.id === id).token)
            .join(s.exercise.buildKind === 'sentence' ? ' ' : ''),
          s.model,
        );
      }
    }
  }
  assert.equal(new Set(ids).size, 36);
  assert(
    [...contentById.values()]
      .filter((s) => s.kind === 'sentence')
      .every((s) => sentenceLevelReviews.get(s.id)?.text === s.text && s.sourceLevel === sentenceLevelReviews.get(s.id)?.level && s.independentReading === false),
  );
});
test('Preview progress rejects malformed records and stays in a separate namespace', () => {
  assert.equal(pilotStorageKey, 'klink.preview.alfa-c.v1');
  for (const raw of [
    'null',
    '{',
    '{}',
    '{"version":2}',
    '{"version":1,"positions":{"winkel":999},"records":{}}',
  ])
    assert.deepEqual(readPilotProgress(raw), {
      version: 1,
      positions: {},
      records: {},
    });
  const s = pilotBlocks[0].steps[3];
  assert.equal(
    readPilotProgress(
      JSON.stringify({
        version: 1,
        positions: { winkel: 4 },
        records: {
          [s.id]: {
            correct: true,
            helpUsed: false,
            tries: 1,
            assessment: 'answer',
          },
        },
      }),
    ).positions.winkel,
    4,
  );
});
test('Repeat uses help and actual attempts, never merely seeing a model', () => {
  const b = pilotBlocks[0];
  const row = {
    correct: true,
    helpUsed: false,
    tries: 1,
    assessment: 'answer',
  };
  const records = {
    [b.steps[0].id]: { ...row, assessment: 'participation', helpUsed: true },
    [b.steps[3].id]: { ...row, tries: 2 },
    [b.steps[4].id]: row,
    [b.steps[5].id]: { ...row, helpUsed: true },
  };
  assert.deepEqual(
    practiceAgain(b, records).map((s) => s.id),
    [b.steps[3].id, b.steps[5].id],
  );
});
test('The reviewed preview address opens the normal learner route', () =>
  assert(
    fs
      .readFileSync('app/proef-alfa-c/page.tsx', 'utf8')
      .includes("redirect('/#learner/alfa-c')"),
  ));
test('Correct choices use all three positions and retries stay stable', () => {
  for (const block of pilotBlocks) {
    const steps = block.steps.filter((s) => s.exercise.options);
    assert.equal(
      new Set(
        steps.map((s) =>
          s.exercise.options.findIndex((o) =>
            s.exercise.answer.correctOptionIds.includes(o.id),
          ),
        ),
      ).size,
      3,
    );
    assert.notDeepEqual(
      steps[0].exercise.options.map((o) => o.id),
      steps.at(-1).exercise.options.map((o) => o.id),
    );
  }
});
