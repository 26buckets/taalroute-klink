import assert from 'node:assert/strict';
import test from 'node:test';
import { learnerCollectionLabel as label } from '../lib/learner-copy.ts';
import { displayedChapterCollections } from '../lib/practice-chapters.ts';
import { groupActivities } from '../lib/group-practice.ts';

test('Short labels separate authored rounds, levels and support without clipping topics', () => {
  assert.deepEqual(label('Zeg de zin · Ronde 2'), { title: 'Zinnen oefenen', round: '2', support: undefined });
  assert.equal(label('Zeg de zin ronde 2').round, '2');
  assert.equal(label('Zinnenronde 1 · Werk en dagelijks leven').title, 'Werk en dagelijks leven');
  assert.deepEqual(label('Leesronde 23 · De wijkvergadering, De begraafplaats, Een reservering'), { title: 'De wijkvergadering, De begraafplaats, Een reservering', round: '23', support: undefined });
  assert.deepEqual(label('Basis · Woorden 02 · 13'), { title: 'Woorden oefenen', round: '2.13', support: 'Basis' });
  assert.equal(label('Hetzelfde woord · A2 · 2').title, 'Hetzelfde woord');
  assert.equal(label('Een ronde afmaken').title, 'Een ronde afmaken');
  assert.equal(label('Bus 2').title, 'Bus 2');
  assert.equal(label('Leesronde 35 · Een nieuw onderwerp').title, 'Een nieuw onderwerp');
  assert.equal(label('Leesronde 35').title, 'Lees een tekst');
  assert.equal(label('verzekeringsmaatschappij · personeelszaken').title, 'verzekeringsmaatschappij · personeelszaken');
  assert.equal(label('Uitbreiding met je docent · alsook · beogen').support, 'Uitbreiding met je docent');
});

test('All visible collection labels separate round and level prefixes', () => {
  let checked = 0;
  for (const activity of groupActivities) for (const collection of displayedChapterCollections(activity.id, { level: 'all' })) {
    const result = label(collection.title);
    assert(result.title.trim(), collection.id);
    assert(!/^(Leesronde|Zinnenronde)\s+\d|·\s*Ronde\s+\d/.test(result.title), collection.title);
    assert(!/·\s*(?:Alfa [ABC]|[AB][12])(?:\s*·|$)/.test(result.title), collection.title);
    assert(!result.title.includes('…'), 'Do not truncate a distinguishing topic');
    checked++;
  }
  assert(checked > 1000);
});
