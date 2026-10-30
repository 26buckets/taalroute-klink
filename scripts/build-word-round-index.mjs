import { readFileSync, writeFileSync } from 'node:fs';
import { productionIndex, validateProductionCollection } from '../lib/production-practice.ts';
import { wordRoundActivities, wordRoundDefinitions } from '../lib/word-rounds.ts';

const entries = productionIndex.filter(row => wordRoundActivities.has(row.activity)).flatMap(row => {
  const exercises = validateProductionCollection(JSON.parse(readFileSync('public' + row.url)), row.id, row.count);
  const rounds = wordRoundDefinitions(exercises);
  return rounds.length ? [[row.url, rounds]] : [];
});
writeFileSync('data/klink-word-round-index.json', JSON.stringify(Object.fromEntries(entries)) + '\n');
console.log(`Indexed ${entries.length} existing word collections; no content or media changed`);
