import test from 'node:test';
import assert from 'node:assert/strict';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { groupExercises } from '../lib/group-practice.ts';
import { standardActivities, standardExercises, standardMediaNeeds } from '../lib/standard-practice.ts';
import { markTask, sameSelection, orderAccepted, normalizeAnswer, validStandardTask } from '../lib/standard-player-contract.ts';
import { contentById } from '../lib/connected-content.ts';
import { practiceStages } from '../lib/learner-route.ts';
import { chapterCollections } from '../lib/practice-chapters.ts';
import { updateLearningReview } from '../lib/learning-review.ts';
const starter = packs.find(p => p.id === 'groep-1');

test('Three starter sorting boards use precisely the six existing short-a words and no invented phonemic contrast', () => {
  const items = groupExercises(starter, 'word-sort'); assert.equal(items.length, 3);
  for (const item of items) {
    assert(validStandardTask(item.standardTask));
    assert.deepEqual(item.standardTask.items.map(i => i.label).sort(), ['jas','man','map','mat','pan','tas']);
    assert.notEqual(item.standardTask.basis, 'sound');
    assert(item.readingConditions.every(Boolean)); assert(item.sourceLessonIds.length);
    assert.equal(item.reviewEligible, false); assert.equal(item.independentReading, false);
    assert(!JSON.stringify(item).includes('audioId')); assert(item.manualAdvance);
  }
  assert.deepEqual(items, groupExercises(starter, 'word-sort'));
});
test('Sound sorting rejects unapproved or missing recordings', () => {
  const task = structuredClone(groupExercises(starter, 'word-sort')[0].standardTask); task.basis = 'sound';
  assert.equal(validStandardTask(task), false);
  task.items.forEach(i => { i.audio = { audioId: i.id, src: '/existing.wav' }; });
  assert.equal(validStandardTask(task), false);
  task.items.forEach(i => { i.audioApproved = true; }); assert(validStandardTask(task));
});
test('Precise text selection preserves source token offsets and only accepts a complete exact answer span', () => {
  const task = markTask('Zij zit bij het raam. De tas ligt bij het raam.', 'Zij zit bij het raam.', 'Bij het raam.');
  assert(validStandardTask(task)); assert.equal(task.acceptedSelections.length, 1);
  const ids = task.acceptedSelections[0]; assert.equal(ids.length, 3);
  assert(sameSelection([...ids].reverse(), ids)); assert(!sameSelection(ids.slice(1), ids));
  assert(!sameSelection([...ids, ids[0]], ids)); assert(!sameSelection([...ids, task.tokens.at(-1).id], ids));
  assert.equal(markTask('De jas is nat.', 'De jas is nat.', 'Hij hangt aan een haak.'), undefined);
});
test('Every attached precise mark task refers literally to its existing source and question', () => {
  const items = packs.flatMap(p => groupExercises(p, 'text-evidence')).filter(i => i.standardTask);
  assert(items.length >= 8);
  for (const item of items) { assert(validStandardTask(item.standardTask)); const source = contentById.get(item.contextId); assert.equal(item.standardTask.text, source.text); assert.equal(item.question, source.discussion.question); }
});
test('Gap players preserve the existing full sentence while withholding the complete model', () => {
  const items = packs.flatMap(p => groupExercises(p, 'verb-choice')); assert(items.length >= 8);
  for (const item of items) {
    const task = item.standardTask; assert(validStandardTask(task)); assert.equal(task.kind, 'gap'); assert(task.cue.startsWith('Werkwoord: ')); assert(!task.cue.includes('undefined')); assert(item.additionalReadingCondition);
    assert.equal(task.before + task.acceptedAnswers[0] + task.after, contentById.get(item.contextId).text);
    assert.deepEqual(task.acceptedAnswers, item.answer.correctOptionIds);
    assert(!item.sourceText); assert.deepEqual(item.sourceBlocks, []);
  }
  assert.equal(normalizeAnswer('  DRINK. '), 'drink'); assert.notEqual(normalizeAnswer('drinkt'), 'drink');
});
test('Order player accepts explicitly authorized alternatives but never incomplete or duplicate orders', () => {
  assert(orderAccepted(['b','a','c'], ['a','b','c'], [['b','a','c']]));
  assert(!orderAccepted(['a','a','c'], ['a','b','c'])); assert(!orderAccepted(['a','b'], ['a','b','c']));
  assert(!orderAccepted(['b','a','c'], ['a','b','c']));
  for (const collection of chapterCollections('context-order')) for (const item of collection.exercises) {
    assert.equal(item.componentId, 'ALF-CMP-013'); assert(item.items.length >= 3); assert.equal(item.items.length, item.targetOrderIds.length);
    const source = contentById.get(item.contextId); assert(source); assert(item.items.every(i => source.text.includes(i.text.replace(/^[^:]+: /, ''))));
  }
});
test('Scene task stays unoffered without approved media and valid normalized regions', () => {
  const attached = groupExercises(starter, 'situation-point')[0];
  assert.equal(attached.contextId, 'situatie-map'); assert(validStandardTask(attached.standardTask));
  assert.equal(attached.standardTask.image.src, '/package-media/cp001/aa-cp001-scene-table-on.webp');
  assert(!attached.requiresAudio); assert(!JSON.stringify(attached).includes('audioId'));
  assert.equal(standardExercises({...starter,exercises:[]},'situation-point').length,0);
  const task = {kind:'hotspot',image:{src:'/fixture.svg'},imageReview:'open',regions:[{id:'a',label:'A',x:.1,y:.2,width:.3,height:.4}],correctRegionIds:['a'],help:'Kijk.'};
  assert(!validStandardTask(task)); task.imageReview='approved'; assert(validStandardTask(task));
  task.regions[0].width=2; assert(!validStandardTask(task));
  assert(standardMediaNeeds.some(n=>n.activity==='situation-point'&&n.status==='paused'));
});
test('All branching paths contain two or three meaningful choices and finish as participation', () => {
  const item = groupExercises(starter,'practice-branch')[0]; assert(item); const task = item.standardTask; assert(validStandardTask(task));
  assert.equal(item.assessment,'participation'); assert.equal(item.requiresExplicitCompletion,true); assert.equal(item.reviewEligible,false);
  function walk(id,path=[]) { const node=task.nodes.find(n=>n.id===id); for(const choice of node.choices) { assert(choice.consequence); assert(!path.includes(choice.next)); if(choice.next) walk(choice.next,[...path,id]); else assert([2,3].includes(path.length+1)); } }
  walk(task.start);
  const broken=structuredClone(task); broken.nodes[0].choices[0].next='missing'; assert(!validStandardTask(broken));
});
test('Standard activities are reachable in existing stages and preserve source/lesson references', () => {
  for (const activity of standardActivities) {
    assert(practiceStages.some(s=>s.activities.includes(activity.id)));
    for(const p of packs) for(const item of standardExercises(p,activity.id)) {
      assert.equal(item.sourceStatus,'concept'); assert.equal(item.independentReading,false); assert(item.sourceExerciseId); assert(item.targetWordIds.every(id=>p.words.some(word=>word.id===id)));
      assert(item.sourceLessonIds.every(id=>p.lessons.some(l=>l.id===id)));
      if(item.standardTask) assert(validStandardTask(item.standardTask));
      assert.deepEqual(item,groupExercises(p,activity.id).find(i=>i.exerciseId===item.exerciseId));
    }
  }
});

test('Completion and model-supported answers do not add standard players to mastery/review', () => {
  const state = { preserved: { last: 1, due: 2, streak: 1 } };
  for(const mode of ['word-sort','verb-choice','text-evidence','practice-branch']) {
    const item=groupExercises(starter,mode)[0] ?? packs.flatMap(p=>groupExercises(p,mode))[0];
    const attempt={exerciseId:item.exerciseId,assessment:item.assessment,reviewEligible:item.reviewEligible,correct:true,attempts:1,helpUsed:true,support:'requested-help'};
    assert.equal(updateLearningReview(state,attempt),state);
  }
});

test('Expanded list coverage retains every word, all six players and distinct scene targets', () => {
  for (const pack of packs) {
    const sorts = groupExercises(pack, 'word-sort');
    assert(sorts.length, pack.id);
    assert.deepEqual(new Set(sorts.flatMap(item => item.targetWordIds)), new Set(pack.words.map(word => word.id)), `${pack.id}: every existing word can be sorted`);
    for (const item of sorts) {
      assert(item.standardTask.items.length >= 4 && item.standardTask.items.length <= 6);
      assert.equal(new Set(item.standardTask.items.map(word => word.categoryId)).size, 2);
    }
    assert(groupExercises(pack, 'context-order').length, `${pack.id}: source order`);
    assert(groupExercises(pack, 'practice-branch').length, `${pack.id}: source conversation`);
    for (const mode of ['text-evidence','verb-choice']) for (const item of groupExercises(pack, mode)) assert(validStandardTask(item.standardTask));
  }
  const unique = mode => new Set(chapterCollections(mode).flatMap(c => c.exercises).map(e => `${String(e.contextId)}:${typeof e.collectionVariant === 'string' ? e.collectionVariant : ''}`));
  assert.equal(unique('situation-point').size, 8, 'No loss of book/pen/folder or pan/cabbage/beet/nut when deduplicating a scene');
  assert(unique('verb-choice').size >= 200);
  assert(unique('context-order').size >= 300);
  assert(unique('practice-branch').size >= 16);
});

test('Every new branch keeps source identities and terminates after two or three decisions', () => {
  for (const collection of chapterCollections('practice-branch')) for (const item of collection.exercises) {
    const task=item.standardTask, source=contentById.get(item.contextId);
    assert(validStandardTask(task)); assert.equal(item.assessment,'participation'); assert.equal(item.reviewEligible,false);
    assert(task.nodes[0].prompt.includes(source.blocks[0].speaker));
    assert(task.nodes[0].prompt.includes(source.blocks[1].speaker));
    assert(task.nodes.some(n=>n.choices.some(c=>c.label===source.blocks[1].text)));
    function visit(id,path=[]) { assert(!path.includes(id)); const node=task.nodes.find(n=>n.id===id); for(const choice of node.choices) { if(choice.next) visit(choice.next,[...path,id]); else assert([2,3].includes(path.length+1)); } }
    visit(task.start);
    const pack=collection.pack;
    const sourceLessons=[...new Set(pack.exercises.filter(e=>e.contextId===item.contextId).map(e=>e.lessonId))];
    assert.deepEqual(new Set(item.sourceLessonIds),new Set(sourceLessons));
  }
});
