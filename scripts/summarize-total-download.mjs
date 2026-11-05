import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const root = process.argv[2] || 'docs/total-download-20261105';
const read = name => JSON.parse(readFileSync(root + '/' + name, 'utf8'));
const stats = values => {
  assert(values.length && values.every(Number.isFinite));
  const sorted = [...values].sort((a, b) => a - b), middle = sorted.length / 2;
  return { n: sorted.length, median: sorted.length % 2 ? sorted[Math.floor(middle)] : (sorted[middle - 1] + sorted[middle]) / 2, min: sorted[0], max: sorted.at(-1) };
};
const sum = (rows, key) => rows.reduce((total, row) => total + row[key], 0);
const summary = {};
for (const [trial, expected] of [['normal', 64], ['3mbps', 64]]) {
  const data = read(trial + '/visits.json');
  assert.equal(data.rows.length, expected);
  assert.deepEqual(data.errors, []);
  summary[trial] = {};
  for (const portal of new Set(data.rows.map(row => row.portal))) for (const visit of ['first', 'repeat']) {
    const key = portal + '/' + visit;
    summary[trial][key] = {};
    for (const version of ['before', 'after']) {
      const rows = data.rows.filter(row => row.version === version && row.portal === portal && row.visit === visit);
      if (portal === 'learner' && version === 'after') assert(rows.every(row => !row.settledResources.some(item => /\/(?:learner-rounds|staff-apps|teacher-classroom)-/.test(item.path))), 'Player and teacher modules stay absent even after network idle');
      summary[trial][key][version] = {
        paintMs: stats(rows.map(row => row.paintReadyMs)),
        initialResourcesReceivedMs: stats(rows.map(row => Math.max(row.navigation.responseEnd, ...row.settledResources.map(item => item.endMs)))),
        totalBodyBytes: stats(rows.map(row => row.navigation.encodedBodySize + sum(row.settledResources, 'encodedBodySize'))),
        networkTransferBytes: stats(rows.map(row => row.navigation.transferSize + sum(row.settledResources, 'transferSize'))),
        javascriptBodyBytes: stats(rows.map(row => sum(row.settledResources.filter(item => item.path.endsWith('.js')), 'encodedBodySize'))),
        longestMainThreadTaskMs: Math.max(0, ...rows.flatMap(row => row.longTasks.map(task => task.durationMs))),
      };
    }
  }
}
const flow = read('first-exercise/visits.json');
assert.equal(flow.rows.length, 16);
assert.deepEqual(flow.errors, []);
assert.equal(new Set(flow.rows.filter(row => row.portal === 'learner').map(row => row.exerciseId)).size, 1);
summary.firstExercise3Mbps = {};
for (const version of ['before', 'after']) {
  const rows = flow.rows.filter(row => row.version === version && row.portal === 'learner');
  summary.firstExercise3Mbps[version] = Object.fromEntries(['chapterClickMs', 'activityClickMs', 'exerciseClickMs', 'firstChoiceToExerciseMs', 'openingToExerciseMs', 'exerciseMediaReadyMs'].map(key => [key, stats(rows.map(row => row[key]))]));
  summary.firstExercise3Mbps[version].deferredPlayerBodyBytes = stats(rows.map(row => sum(row.exercise.resources.filter(item => /\/learner-rounds[.-]/.test(item.path)), 'encodedBodySize')));
}
summary.firstLesson3Mbps = {};
for (const version of ['before', 'after']) {
  const rows = flow.rows.filter(row => row.version === version && row.portal === 'teacher/plus');
  assert(rows.every(row => row.lessonId === 'mat'));
  summary.firstLesson3Mbps[version] = Object.fromEntries(['lessonClickMs', 'openingToLessonMs', 'lessonMediaReadyMs'].map(key => [key, stats(rows.map(row => row[key]))]));
}
writeFileSync(root + '/summary.json', JSON.stringify(summary, null, 2) + '\n');
console.log(JSON.stringify(summary, null, 2));
