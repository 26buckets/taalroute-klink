import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { taalroutePackages as packs, exercisesForLesson } from '../lib/taalroute-packages.ts';
import { sentenceQuestions, sentenceQuestionFor } from '../lib/sentence-comprehension.ts';
import { klinkContexts } from '../lib/klink-context.ts';
import { parseProgress } from '../lib/learner-progress.ts';
import { buildChecklist, sentenceBridge } from '../lib/build-checklist.ts';
import audioPlan from '../data/klink-comprehension-audio.json' with { type: 'json' };
import release from '../data/klink-release-readiness.json' with { type: 'json' };

const questions = packs.flatMap(pack => pack.exercises.filter(item => item.mode === 'sentence-question'));
void test('Eight authored questions cover the existing sentences with real evidence, feedback and stable bindings', () => {
  assert.equal(sentenceQuestions.length, 8);
  assert.equal(questions.length, 8);
  assert.deepEqual(new Set(questions.map(item => item.contextId)), new Set(klinkContexts.filter(item => item.kind === 'sentence').map(item => item.id)));
  const positions = new Set();
  for (const item of questions) {
    const context = klinkContexts.find(context => context.id === item.contextId);
    assert.equal(item.prompt.audio.src, context.audio);
    assert(context.text.toLowerCase().includes(item.evidence.toLowerCase()));
    assert.equal(item.assessment, 'answer');
    assert.equal(item.access, 'supported-listening');
    assert.equal(item.independentReading, false);
    assert.equal(item.humanReview, 'approved');
    assert.equal(item.options.length, 2);
    assert.equal(new Set(item.options.map(option => option.id)).size, 2);
    assert.equal(item.answer.correctOptionIds.length, 1);
    positions.add(item.options.findIndex(option => option.id === item.answer.correctOptionIds[0]));
    assert(item.distractorReason.length > 80); assert(item.feedback.length > 20);
    assert.equal(item.exampleWord, undefined); assert.equal(item.textBlocks, undefined); assert.equal(item.prompt.image, undefined);
    for (const path of [item.prompt.audio.src, item.questionAudio.src, item.instructionAudio.src, item.feedbackAudio.src, ...item.options.map(option => option.image?.src ?? option.audio?.src)]) {
      assert(path?.startsWith('/package-')); assert(existsSync(`public${path}`));
    }
  }
  assert.equal(positions.size, 2);
});
void test('Guided questions use prepared options; oral contrasts stay explicit and optional', () => {
  let guided = 0;
  for (const pack of packs) for (const lesson of pack.lessons) {
    const route = exercisesForLesson(pack, lesson);
    assert(route.length <= 16);
    const prepared = new Set([...lesson.known, ...lesson.newWords, ...lesson.returning]);
    for (const item of route.filter(item => item.mode === 'sentence-question')) {
      guided++;
      assert.deepEqual(item.oralPreparation, []);
      assert(item.preparedWordIds.every(id => prepared.has(id)));
      assert(item.options.every(option => prepared.has(option.id)));
      assert.equal(route.some(other => other.exerciseId === item.replacesExerciseId), false, 'No compulsory duplicate passive presentation');
      const restored = parseProgress(JSON.stringify({ position: { packageId: pack.id, lessonId: lesson.id, exerciseId: item.replacesExerciseId }, completed: [] }), packs);
      assert.equal(restored.position.exerciseId, item.exerciseId);
    }
  }
  assert.equal(guided, 5);
  assert.equal(sentenceQuestionFor('zin-man', ['klink-woord-man']), undefined);
  for (const id of ['begrip-biet', 'begrip-kool']) {
    const item = questions.find(item => item.questionId === id);
    assert(item.oralPreparation.length > 0);
    assert(item.options.every(option => option.audio?.src));
    assert(!packs.some(pack => pack.lessons.some(lesson => lesson.guidedExerciseIds.includes(item.exerciseId))));
  }
});
void test('Condition and conjunction items cannot be solved by spotting only the subject word', () => {
  const biet = questions.find(item => item.questionId === 'begrip-biet');
  assert.equal(biet.comprehensionFocus, 'property');
  assert.deepEqual(biet.options.map(option => option.label), ['Schoon', 'Vies']);
  const kool = questions.find(item => item.questionId === 'begrip-kool');
  assert.equal(kool.comprehensionFocus, 'combination');
  assert(kool.options.every(option => option.label.toLowerCase().includes('kool')));
  assert.equal(kool.answer.correctOptionIds[0], 'beide');
});
void test('Teacher checklist reports connected, optional and absent comprehension without claiming independent reading', () => {
  const pack = packs.find(item => item.id === 'groep-1');
  const lesson = pack.lessons.find(item => item.id === 'klink-leesstap-04');
  const list = buildChecklist(pack, lesson);
  assert.equal(list.find(item => item.id === 'sentence-listening').status, 'works');
  assert.equal(list.find(item => item.id === 'sentence-reading').status, 'missing');
  assert.equal(sentenceBridge(pack, lesson).models.flatMap(model => model.questions).length, 2);
  const bietPack = packs.find(item => item.id === 'groep-6');
  const bietLesson = bietPack.lessons.find(item => item.id === 'woord-klink-woord-biet');
  assert.equal(buildChecklist(bietPack, bietLesson).find(item => item.id === 'sentence-listening').status, 'partial');
  assert(sentenceBridge(bietPack, bietLesson).models.flatMap(model => model.questions).some(item => item.preparation.length && !item.guided));
  assert.equal(buildChecklist(packs[0], packs[0].lessons[0]).find(item => item.id === 'sentence-listening').status, 'missing');
});
void test('Released audio retains separate roles, embedded Taalroute branding and explicit user approval', () => {
  assert.notEqual(audioPlan.instructionVoiceId, audioPlan.targetVoiceId);
  assert.equal(audioPlan.items.length, 8);
  for (const item of audioPlan.items) {
    const file = `public${item.src}`;
    const tags = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', file])).format.tags;
    for (const name of ['artist', 'album_artist', 'publisher']) assert.equal(tags[name], 'Taalroute');
    assert.equal(tags.album, 'Klink - Taalroute'); assert.equal(tags.title, item.text);
    assert(!/elevenlabs|suno|openai|generator/i.test(JSON.stringify(tags)));
  }
  assert.equal(release.publicationApproved, true);
  assert.equal(audioPlan.humanReview, 'approved');
  assert.equal(release.sentenceComprehensionReview, 'approved');
  const approval = JSON.parse(readFileSync(release.approvalRecord));
  assert.equal(approval.approvedBy, 'Nico');
  assert(approval.scope.includes('sentence-comprehension'));
  assert.equal(approval.independentReadingOrMasteryApproved, false);
  assert(!/drive\.google|diglin/i.test(JSON.stringify(questions)));
  assert(readFileSync('components/product/package-exercise-browser.tsx', 'utf8').includes("independentReading: false"));
});
