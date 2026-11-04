import { performance } from 'node:perf_hooks';
const importStart = performance.now();
const { chapterCollections, practiceChapters } = await import('../lib/practice-chapters.ts');
const imported = performance.now();
let collections = 0, exercises = 0;
for (const activity of new Set(practiceChapters.flatMap(chapter => chapter.activities))) {
  const items = chapterCollections(activity);
  collections += items.length;
  exercises += items.reduce((sum, item) => sum + (item.exerciseCount ?? item.exercises.length), 0);
}
console.log(JSON.stringify({ importMs: imported - importStart, collectionsMs: performance.now() - imported, totalMs: performance.now() - importStart, collections, exercises }));
