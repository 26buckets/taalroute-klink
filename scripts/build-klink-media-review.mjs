import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { basename } from 'node:path';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import { klinkContexts } from '../lib/klink-context.ts';
import { sentenceQuestions } from '../lib/sentence-comprehension.ts';

const read = file => JSON.parse(readFileSync(file));
const curriculum = read('data/klink-curriculum.json');
const media = read('data/klink-media.json');
const instructions = read('data/klink-instructions.json');
const comprehension = read('data/klink-comprehension-audio.json');
const productionPath = 'outputs/alfa-publicatie-20261017/image-production.json';
const production = existsSync(productionPath) ? read(productionPath) : [];
const batch = read('docs/klink-beeldbatch-20261016.json');
const out = 'outputs/media-review-20261016';
mkdirSync(`${out}/assets`, { recursive: true });
const sha = file => createHash('sha256').update(readFileSync(file)).digest('hex');
const copy = source => {
  assert(/^\/(package-audio|package-media|start-tas)\//.test(source));
  assert(!source.includes('..'));
  const hash = sha(`public${source}`);
  const path = `assets/${hash.slice(0, 16)}-${basename(source)}`;
  copyFileSync(`public${source}`, `${out}/${path}`);
  assert.equal(sha(`${out}/${path}`), hash);
  return { path, sha256: hash, source };
};
const items = [];
for (const word of curriculum.words) {
  const record = media[word.id];
  if (record.audio) items.push({ id: `audio:${word.id}`, wordId: word.id, kind: 'audio', group: record.audioCandidate ? 'Nieuwe woordaudio' : 'Bestaande woordaudio', title: word.word, text: word.meaning, transcript: word.word, ...copy(record.audio) });
  if (record.image) {
    const entry = batch.items.find(item => item.id === word.id);
    const generated = production.findLast(item => item.id === word.id && item.linked && item.imageSha256 === sha(`public${record.image}`));
    const note = [record.imageReview === 'approved' ? 'Eerder expliciet goedgekeurd door Nico; die bronbeslissing blijft behouden.' : '', record.imageUse === 'context' ? 'Contextbeeld: betekenis mondeling bespreken. Niet gebruiken als zelfstandige goed/fout-fotokeuze.' : '', generated?.note ?? entry?.reviewNote ?? ''].filter(Boolean).join(' ');
    items.push({ id: `image:${word.id}`, wordId: word.id, kind: 'image', group: record.imageReview === 'approved' ? 'Eerder goedgekeurde beelden' : record.imageCandidate || record.imageReview === 'machine-checked-human-open' ? 'Nieuwe beelden' : 'Bestaande beelden', title: word.word, text: word.meaning, note, task: 'Kijk naar de foto. Luister naar het woord.', audio: record.audio ? copy(record.audio).path : null, original: entry && existsSync(`${out}/${entry.original}`) ? entry.original : null, ...copy(record.image) });
  }
}
for (const instruction of instructions.items) if (instruction.src) items.push({ id: `instruction:${instruction.id}`, kind: 'audio', group: 'Instructies', title: instruction.id.replaceAll('-', ' '), text: 'Controleer: duidelijk, rustig en passend bij de handeling. Deze stem is anders dan de woordstem.', transcript: instruction.text, ...copy(instruction.src) });
for (const context of klinkContexts) items.push({ id: `context:${context.id}`, kind: 'audio', group: 'Zinnen en situaties', title: context.title, text: 'Luisteren met tekststeun, geen toets zelfstandig lezen. Beoordeel tekst, uitspraak en eventueel beeld samen.', transcript: context.text, image: context.image ? copy(context.image).path : null, ...copy(context.audio) });
for (const item of comprehension.items.filter(item => !instructions.items.some(instruction => instruction.src === item.src))) items.push({ id: `comprehension:${item.id}`, kind: 'audio', group: 'Begripsaudio', title: item.id.replaceAll('-', ' '), text: item.role === 'target' ? 'Antwoord in de doeltaalstem.' : 'Vraag of hulp in de aparte instructiestem.', transcript: item.text, ...copy(item.src) });
for (const question of sentenceQuestions) {
  const context = klinkContexts.find(item => item.id === question.contextId);
  assert(context, question.id);
  items.push({ id: `question:${question.id}`, kind: 'audio', group: 'Begripsvragen', title: context.title, text: `${question.question} Antwoorden: ${question.options.map(option => option.label).join(' / ')}. Goed: ${question.options.find(option => option.id === question.correctOptionId).label}.`, transcript: context.text, note: `${question.objective} ${question.distractorReason} ${question.oralPreparation.join(' ')}`, ...copy(context.audio) });
}
const order = ['Nieuwe beelden', 'Nieuwe woordaudio', 'Instructies', 'Zinnen en situaties', 'Begripsaudio', 'Begripsvragen', 'Bestaande beelden', 'Bestaande woordaudio', 'Eerder goedgekeurde beelden'];
items.sort((a, b) => order.indexOf(a.group) - order.indexOf(b.group) || a.title.localeCompare(b.title, 'nl'));
assert.equal(new Set(items.map(item => item.id)).size, items.length);
const missing = curriculum.words.filter(word => !media[word.id]?.image).map(word => ({ id: word.id, word: word.word, meaning: word.meaning, firstMoment: word.firstReading }));
const manifest = { title: 'Klink — media beoordelen', date: '2026-10-17', reviewerSelected: 'Nico', publicationApproved: false, items, missingImages: missing };
writeFileSync(`${out}/review-manifest.json`, JSON.stringify(manifest, null, 2));
const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const json = JSON.stringify(manifest).replaceAll('<', '\\u003c');
const template = readFileSync('scripts/klink-media-review.html', 'utf8');
assert(template.includes('/*REVIEW_DATA*/'));
writeFileSync(`${out}/index.html`, template.replace('/*REVIEW_DATA*/', json));
writeFileSync(`${out}/contactblad.html`, `<!doctype html><html lang="nl"><meta charset="utf-8"><title>Klink — contactblad nieuwe woordbeelden</title><style>body{font:16px system-ui;background:#eee;margin:20px}.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}figure{margin:0;background:#fff;padding:8px}img{width:100%;height:210px;object-fit:contain}figcaption{font-size:12px;padding-top:6px}</style><h1>Nieuwe woordbeelden — nog te beoordelen</h1><div class="grid">${items.filter(item => item.group === 'Nieuwe beelden').map(item => `<figure><img src="${esc(item.path)}" alt="${esc(item.title)}"><figcaption>${esc(item.wordId)} · woordfoto · beoordeling open</figcaption></figure>`).join('')}</div></html>`);
console.log(JSON.stringify({ reviewItems: items.length, newImages: items.filter(item => item.group === 'Nieuwe beelden').length, missingImages: missing.length, publicationApproved: false }));
