import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import {
  teacherTasks,
  emptyTeacherStore,
  startSession,
  startProblem,
  appendEvent,
  firstResponse,
  readTeacherStore,
  normalizeWord,
  assistance,
} from '../lib/alfa-c-docent.ts';
const now = '2026-10-29T12:00:00.000Z';
const prep = (t) => ({
  learner: 'test',
  meeting: 'les2',
  lesson: 'Lesplan test',
  preparedMeeting: 'les1',
  preparedAt: '2026-10-28T11:00:00.000Z',
  timezone: 'Europe/Amsterdam',
  evidence: 'Voorbereiding geobserveerd',
  checks: t.preparation.map(() => true),
  exposure: 'Geen nieuw model; voorbereid op 28 oktober',
  interveningActivity: 'Andere lesactiviteit',
  paperPresent: true,
});
function ready(t, store = emptyTeacherStore()) {
  const s = startSession(store, t, prep(t), now);
  const id = s.sessions.at(-1).id;
  return { s, id };
}
const event = (type, extra = {}) => ({ type, at: now, stage: 0, ...extra });
void test('27 canonical IDs and 13 phases in one grammar item; no new fictional source tasks', () => {
  assert.equal(teacherTasks.length, 27);
  assert.equal(new Set(teacherTasks.map((t) => t.id)).size, 27);
  assert.equal(
    teacherTasks.find((t) => t.kind === 'grammar').stages.length,
    13,
  );
  assert.equal(teacherTasks.filter((t) => t.kind === 'recall').length, 12);
});
void test('unknown/corrupt storage never resets or silently discards data', () => {
  assert.throws(() => readTeacherStore('{'));
  assert.throws(() => readTeacherStore('{"version":2,"sessions":[]}'));
  assert.throws(() => readTeacherStore('{"version":1,"sessions":[{}]}'));
  assert.deepEqual(readTeacherStore(null), emptyTeacherStore());
});
void test('per-person preparation and real dated evidence required', () => {
  for (const t of teacherTasks.filter((t) => t.kind !== 'check')) {
    const p = prep(t);
    assert.equal(
      startProblem(emptyTeacherStore(), t, p, Date.parse(now)),
      undefined,
    );
    for (const key of [
      'learner',
      'meeting',
      'lesson',
      'evidence',
      'exposure',
      'preparedMeeting',
      'preparedAt',
      'timezone',
    ])
      assert(
        startProblem(
          emptyTeacherStore(),
          t,
          { ...p, [key]: '' },
          Date.parse(now),
        ),
        t.id + key,
      );
    assert(
      startProblem(
        emptyTeacherStore(),
        t,
        { ...p, checks: [] },
        Date.parse(now),
      ),
    );
    assert(
      startProblem(
        emptyTeacherStore(),
        t,
        { ...p, preparedAt: '2030-01-01' },
        Date.parse(now),
      ),
    );
  }
});
void test('recall needs exactly >=24 hours, different actual meeting, max four started tasks', () => {
  const tasks = teacherTasks.filter((t) => t.kind === 'recall'),
    t = tasks[0],
    p = prep(t);
  assert(
    startProblem(
      emptyTeacherStore(),
      t,
      { ...p, preparedAt: '2026-10-28T12:00:00.001Z' },
      Date.parse(now),
    ),
  );
  assert.equal(
    startProblem(
      emptyTeacherStore(),
      t,
      { ...p, preparedAt: '2026-10-28T12:00:00.000Z' },
      Date.parse(now),
    ),
    undefined,
  );
  assert(
    startProblem(
      emptyTeacherStore(),
      t,
      { ...p, preparedMeeting: p.meeting },
      Date.parse(now),
    ),
  );
  let s = emptyTeacherStore();
  for (const t of tasks.slice(0, 4)) s = startSession(s, t, prep(t), now);
  assert(startProblem(s, tasks[4], prep(tasks[4]), Date.parse(now)));
  assert.equal(startSession(s, tasks[0], prep(tasks[0]), now), s);
  assert.equal(
    startProblem(
      s,
      tasks[4],
      { ...prep(tasks[4]), learner: 'ander' },
      Date.parse(now),
    ),
    undefined,
  );
});
void test('grammar has no invented 24-hour gate; preparation still mandatory', () => {
  const t = teacherTasks.find((t) => t.kind === 'grammar');
  assert.equal(
    startProblem(
      emptyTeacherStore(),
      t,
      { ...prep(t), preparedAt: now, preparedMeeting: 'les2' },
      Date.parse(now),
    ),
    undefined,
  );
});
void test('first attempts immutable, incorrect order retained, replays/models/hints persist across reload', () => {
  const t = teacherTasks.find((t) => t.kind === 'recall');
  const initial = ready(t);
  let { s } = initial;
  const { id } = initial;
  assert.throws(
    () => appendEvent(s, id, event('first', { text: 'x', tokens: t.order })),
    /volledige/,
  );
  s = appendEvent(s, id, event('audio-error', { src: t.stages[0].audio[0] }));
  assert.throws(() =>
    appendEvent(s, id, event('first', { text: 'x', tokens: t.order })),
  );
  s = appendEvent(s, id, event('audio', { src: t.stages[0].audio[0] }));
  assert.throws(() =>
    appendEvent(s, id, event('first', { text: 'x', tokens: [0, 0, 1, 2] })),
  );
  s = appendEvent(
    s,
    id,
    event('first', { text: 'wrong order', tokens: t.order }),
  );
  assert.throws(() =>
    appendEvent(
      s,
      id,
      event('first', { text: 'correct', tokens: [0, 1, 2, 3] }),
    ),
  );
  s = appendEvent(s, id, event('model'));
  s = appendEvent(s, id, event('audio', { src: t.stages[0].audio[0] }));
  s = appendEvent(
    s,
    id,
    event('retry', { text: t.stages[0].model, tokens: [0, 1, 2, 3] }),
  );
  s = readTeacherStore(JSON.stringify(s));
  assert.equal(firstResponse(s.sessions[0], 0).text, 'wrong order');
  assert.deepEqual(assistance(s.sessions[0], 0), {
    modelEverShown: true,
    helpEverUsed: true,
    replayCount: 1,
  });
});
void test('model and recovery audio blocked before reading response; later phases require earlier observations', () => {
  const t = teacherTasks.find((t) => t.kind === 'grammar');
  const initial = ready(t);
  let { s } = initial;
  const { id } = initial;
  assert.throws(() => appendEvent(s, id, event('model')));
  assert.throws(() =>
    appendEvent(s, id, event('audio', { src: t.stages[0].audio[0] })),
  );
  assert.throws(() =>
    appendEvent(s, id, event('first', { stage: 1, text: 'read' })),
  );
  s = appendEvent(s, id, event('first', { text: 'read' }));
  assert.throws(() =>
    appendEvent(
      s,
      id,
      event('review', { observations: {}, nextMeeting: 'next' }),
    ),
  );
  s = appendEvent(
    s,
    id,
    event('review', {
      observations: Object.fromEntries(
        t.stages[0].criteria.map((c) => [
          c,
          { value: 'niet beoordeelbaar', evidence: 'niet waargenomen' },
        ]),
      ),
      nextMeeting: 'volgende les',
    }),
  );
  assert.doesNotThrow(() =>
    appendEvent(s, id, event('first', { stage: 1, text: 'read' })),
  );
});
void test('actual paper reference required; checking requires same learner/session preserved dictation', () => {
  const t = teacherTasks.find((t) => t.kind === 'dictation'),
    check = teacherTasks.find((t) => t.kind === 'check');
  assert(
    startProblem(emptyTeacherStore(), check, prep(check), Date.parse(now)),
  );
  const initial = ready(t);
  let { s } = initial;
  const { id } = initial;
  s = appendEvent(s, id, event('audio', { src: t.stages[0].audio[0] }));
  assert.throws(() =>
    appendEvent(s, id, event('first', { text: 'De pen...' })),
  );
  s = appendEvent(
    s,
    id,
    event('first', { text: 'De pen...', paperRef: 'origineel les2' }),
  );
  assert.equal(startProblem(s, check, prep(check), Date.parse(now)), undefined);
  assert(
    startProblem(
      s,
      check,
      { ...prep(check), learner: 'ander' },
      Date.parse(now),
    ),
  );
  assert(
    startProblem(
      s,
      check,
      { ...prep(check), paperPresent: false },
      Date.parse(now),
    ),
  );
  const next = startSession(s, check, prep(check), now);
  assert.equal(next.sessions[1].linkedSessionId, id);
  assert(assistance(next.sessions[1], 0).modelEverShown);
});
void test('whole spelling normalization does not fix accents, punctuation, interior spaces or spelling', () => {
  assert.equal(normalizeWord(' CAMERA '), 'camera');
  for (const s of ['caméra', 'ca mera', 'camera.', 'kamara'])
    assert.notEqual(normalizeWord(s), 'camera');
});
void test('33 exact audio bindings with embedded Taalroute metadata and 6 approved review-package recordings', () => {
  const m = JSON.parse(fs.readFileSync('data/klink-alfa-c-docent-audio.json'));
  assert.equal(m.clips.length, 33);
  assert.equal(m.clips.filter((c) => c.new).length, 6);
  for (const c of m.clips) {
    assert.equal(
      createHash('sha256')
        .update(fs.readFileSync('public' + c.src))
        .digest('hex'),
      c.sha256,
    );
    for (const k of ['artist', 'album_artist', 'publisher'])
      assert.equal(c.metadata[k], 'Taalroute');
    assert(c.duration > 0);
  }
});
