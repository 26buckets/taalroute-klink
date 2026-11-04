import assert from 'node:assert/strict';
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { allPackageWords } from '../lib/package-content.ts';
import { practiceChapters, displayedChapterCollections } from '../lib/practice-chapters.ts';
import { productionIndex, validateProductionCollection } from '../lib/production-practice.ts';
import { exerciseVocabularyLevels } from '../lib/content-levels.ts';
import { groupActivities } from '../lib/group-practice.ts';
import { readProductionBank } from './read-production-bank.mjs';

export function buildWordLibraryIndex() {
  const known = new Set(allPackageWords.map(word => word.id));
  const loaded = new Map(), collections = [], unmapped = new Set();
  for (const activity of new Set(practiceChapters.flatMap(chapter => chapter.activities))) {
    // Scheduled review depends on personal history; its static source exercises are indexed elsewhere.
    if (activity === 'learning-review') continue;
    for (const collection of displayedChapterCollections(activity, { level: 'all' })) {
      let exercises = collection.exercises;
      if (collection.contentUrl) {
        if (!loaded.has(collection.contentUrl)) {
          const row = productionIndex.find(row => row.url === collection.contentUrl);
          assert(row, collection.contentUrl);
          loaded.set(collection.contentUrl, validateProductionCollection(readProductionBank(row), row.id, row.count));
        }
        exercises = loaded.get(collection.contentUrl);
        const selected = collection.wordRound?.exerciseIds ?? collection.readingSelection?.exerciseIds;
        if (selected) { const ids = new Set(selected); exercises = exercises.filter(exercise => ids.has(exercise.exerciseId)); }
      }
      const levels = {};
      for (const exercise of exercises) {
        const ids = [...new Set([...((Array.isArray(exercise.targetWordIds) && exercise.targetWordIds.length) ? exercise.targetWordIds : []), ...(typeof exercise.wordId === 'string' ? [exercise.wordId] : [])])];
        for (const id of ids) if (!known.has(id)) unmapped.add(id);
        for (const level of exerciseVocabularyLevels(exercise)) {
          levels[level] ??= new Set();
          for (const id of ids) if (known.has(id)) levels[level].add(id);
        }
      }
      const membership = Object.fromEntries(Object.entries(levels).filter(([, ids]) => ids.size).map(([level, ids]) => [level, [...ids].sort((a, b) => a.localeCompare(b))]));
      if (Object.keys(membership).length) collections.push({ id: `${activity}/${collection.id}`, activity, title: collection.title, levels: membership });
    }
  }
  const linked = new Set(collections.flatMap(collection => Object.values(collection.levels).flat()));
  assert.equal(linked.size, known.size, 'Every existing word card must retain a real exercise membership');
  assert.equal(new Set(collections.map(row => row.id)).size, collections.length);
  return { chapters: practiceChapters.map(({ id, title, activities }) => ({ id, title, activities })), activities: groupActivities.map(({ id, label }) => ({ id, label })), collections, unmappedTargetIds: [...unmapped].sort((a, b) => a.localeCompare(b)) };
}
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const text = JSON.stringify(buildWordLibraryIndex()) + '\n';
  const file = 'data/klink-word-library-index.json';
  if (process.argv.includes('--check')) assert.equal(readFileSync(file, 'utf8'), text, 'Rebuild the exercise index after changing course content');
  else writeFileSync(file, text);
  console.log(`Word library: ${allPackageWords.length} cards linked; index ${Buffer.byteLength(text)} bytes`);
}
