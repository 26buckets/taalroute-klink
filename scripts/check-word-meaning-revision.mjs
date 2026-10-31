import{readFileSync as read}from'node:fs';import{createHash}from'node:crypto';import assert from'node:assert/strict';
const amendments=new Map(JSON.parse(read('docs/word-meanings-release-20261031/package-amendments.json')).map(row=>[row.id,row]));
export function beforeWordMeaningRevisionExercise(exercise){const change=amendments.get(exercise.exerciseId);if(!change)return exercise;assert.equal(createHash('sha256').update(JSON.stringify(exercise)).digest('hex'),change.afterSha256,exercise.exerciseId);return change.before;}
