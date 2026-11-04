import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.argv[2];
assert(file?.endsWith('/visits.json'));
const data = JSON.parse(readFileSync(file));
assert.deepEqual(data.errors, []);
assert([32, 64].includes(data.rows.length));
assert(data.rows.every(row => row.status === 200 && row.widthFits));
const median = values => { const sorted = values.toSorted((a, b) => a - b); return (sorted[(sorted.length - 1) >> 1] + sorted[sorted.length >> 1]) / 2; };
const summarize = rows => ({ n: rows.length, readyMedianMs: median(rows.map(row => row.readyMs)), readyMaxMs: Math.max(...rows.map(row => row.readyMs)), paintReadyMedianMs: median(rows.map(row => row.paintReadyMs)), paintReadyMaxMs: Math.max(...rows.map(row => row.paintReadyMs)), measurementLagMaxMs: Math.max(...rows.map(row => row.readyMs - row.paintReadyMs)), afterDocumentMedianMs: median(rows.map(row => row.readyMs - row.navigation.responseEnd)), firstByteMedianMs: median(rows.map(row => row.navigation.responseStart)), over4100Ms: rows.filter(row => row.readyMs > 4100).length });
const result = {};
for (const version of ['before', 'after']) {
  const rows = data.rows.filter(row => row.version === version);
  result[version] = {
    first: summarize(rows.filter(row => row.visit === 'first')),
    repeat: summarize(rows.filter(row => row.visit === 'repeat')),
    byPortal: Object.fromEntries(['learner', 'teacher/plus'].map(portal => [portal, Object.fromEntries(['first', 'repeat'].map(visit => [visit, summarize(rows.filter(row => row.portal === portal && row.visit === visit))]))])),
    chromiumLongTasks: { n: rows.filter(row => row.engine === 'chromium').length, medianTotalMs: median(rows.filter(row => row.engine === 'chromium').map(row => row.longTasks.reduce((sum, task) => sum + task.durationMs, 0))), longestMs: Math.max(...rows.filter(row => row.engine === 'chromium').flatMap(row => row.longTasks.map(task => task.durationMs))) },
    nextClick: { n: data.nextClicks.filter(row => row.version === version).length, medianMs: median(data.nextClicks.filter(row => row.version === version).map(row => row.durationMs)), maxMs: Math.max(...data.nextClicks.filter(row => row.version === version).map(row => row.durationMs)) },
  };
}
writeFileSync(file.replace('/visits.json', '/summary.json'), JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify(result));
