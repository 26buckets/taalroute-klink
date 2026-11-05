import { readProductionBank } from './read-production-bank.mjs';
import { writeFileSync } from 'node:fs';
import { productionIndex } from '../lib/production-practice.ts';
import { wordRoundActivities, wordRoundDefinitions } from '../lib/word-rounds.ts';

const entries = productionIndex.filter(row => wordRoundActivities.has(row.activity)).flatMap(row => {
  const exercises = readProductionBank(row).exercises;
  const rounds = wordRoundDefinitions(exercises);
  return rounds.length ? [[row.url, rounds]] : [];
});
writeFileSync('data/klink-word-round-index.json', JSON.stringify(Object.fromEntries(entries)) + '\n');
console.log(`Indexed ${entries.length} existing word collections; no content or media changed`);
