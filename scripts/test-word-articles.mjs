import {approvedWords} from './check-approved-word-snapshot.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { allPackageWords } from '../lib/package-content.ts';
import { wordWithArticle } from '../lib/word-articles.ts';
import articles from '../data/klink-word-articles.json' with { type: 'json' };
const review = JSON.parse(readFileSync('docs/klink-articles-20261025/meaning-review.json'));
test('Every current meaning is reviewed, with articles separate from spelling and answers', () => {
 assert.equal(review.rows.length, allPackageWords.length);
 const rows = new Map(review.rows.map(row => [row.id, row]));
 for (const word of allPackageWords) {
  const row = rows.get(word.id);
  assert.equal(row.word, word.word);
  assert.equal(word.meaning, approvedWords.get(word.id).meaning);
  assert.equal(wordWithArticle(word), row.article ? `${row.article} ${word.word}` : undefined);
 }
 assert.equal(Object.keys(articles).length, 2520);
 assert.equal(wordWithArticle(undefined), undefined);
 assert.equal(wordWithArticle({id:'unknown',word:'tas'}), undefined);
});
test('Articles follow the selected sense, plurals and diminutives', () => {
 for (const [word, expected] of Object.entries({tas:'de tas',jas:'de jas',man:'de man',pan:'de pan',map:'de map',mat:'de mat',lam:'het lam',haar:'het haar',doek:'de doek',want:'de want',koekje:'het koekje',koekjes:'de koekjes',bos:'het bos',blik:'het blik',tablet:'de tablet'})) {
  assert.equal(wordWithArticle(allPackageWords.find(w=>w.word===word)),expected);
 }
 for (const word of ['bij','leer','koop','slaap','staat','meer','pakken','de','het','drinken','eten','druk','au']) {
  assert.equal(wordWithArticle(allPackageWords.find(w=>w.word===word)),undefined,word);
 }
});
