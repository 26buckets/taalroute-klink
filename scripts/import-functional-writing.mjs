// Recover the existing writing tasks only when the entire dialogue matches.
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const bank = JSON.parse(readFileSync('data/klink-connected-content.json')).items;
const normal = text => text.trim().replace(/\s+/g, ' ');
const items = [], sources = [];
for (let n = 2; n <= 16; n++) {
  const cp = `CP${String(n).padStart(3, '0')}`;
  const archive = `outputs/content-inventory-20261017/archives/${cp}.zip`;
  const entries = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).split('\n');
  const archived = entries.find(path => path.endsWith(`/bronnen/${cp}-frozen-source.json`));
  const entry = archived ?? `/Users/nicoknoester/Documents/Codex/2026-10-12/alfalabs-pakketten-002-016/pakketten/${cp}/bron.json`;
  const bytes = archived ? execFileSync('unzip', ['-p', archive, entry], { maxBuffer: 20e6 }) : readFileSync(entry);
  const parsed = JSON.parse(bytes);
  const source = parsed.source ?? parsed;
  sources.push({ package: cp, entry, sha256: createHash('sha256').update(bytes).digest('hex') });
  for (const dialogue of source.dialogues) {
    const [title, level, , speakerA, speakerB, turns, , , , , , prompt, criteria, example] = dialogue;
    if (!prompt || !Array.isArray(criteria) || !example) continue;
    const match = bank.find(item => item.kind === 'dialogue' && normal(item.text) === normal(turns.join(' ')));
    if (!match) continue;
    assert(!items.some(item => item.contentId === match.id), 'Duplicate source match');
    items.push({ id: `${match.id}-write`, contentId: match.id, title, level, prompt, criteria, example,
      speakers: [speakerA, speakerB], sourcePackage: cp, sourceStatus: 'existing-source', humanReview: 'combination-open' });
  }
}
assert(items.length >= 8, 'Too few exact source matches');
writeFileSync('data/klink-functional-writing.json', JSON.stringify({ edition: '20261017', items }, null, 2) + '\n');
writeFileSync('docs/klink-functional-writing-provenance.json', JSON.stringify({ sources, imported: items.length, rule: 'Exact whole-dialogue match; no rewritten source text; no release approval.' }, null, 2) + '\n');
console.log(`${items.length} existing functional writing tasks, exact dialogue matches.`);
