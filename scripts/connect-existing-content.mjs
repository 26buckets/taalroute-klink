// Reuse the recorded edition verbatim. Source IDs and archives stay in the private ledger.
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { extname } from 'node:path';
import { addWaveBrandTags } from './complete-klink-wav-metadata.mjs';

const read = file => JSON.parse(readFileSync(file, 'utf8'));
const hash = value => createHash('sha256').update(value).digest('hex');
const unique = values => [...new Set(values)];
const tokens = text => unique(text.toLocaleLowerCase('nl').match(/\p{L}+(?:['’-]\p{L}+)*/gu) ?? []);
const root = 'outputs/content-inventory-20261017';
const output = 'outputs/content-connection-20261017';
const curriculum = read('data/klink-curriculum.json');
const inventory = read(`${root}/inventory.json`);
const legacy = read('lib/package-content.generated.json').find(pack => pack.id === 'CP001');
const audioIndex = new Map(inventory.originals.flatMap(item => item.kind === 'dialogue' ? item.turns.map(turn => turn.audio) : [item.audio]).map(item => [item.id, item]));
const meaningFor = spelling => curriculum.words.filter(word => word.word === spelling);
const items = new Map(), media = new Map(), sources = [], unresolved = [];
mkdirSync(output, { recursive: true });
mkdirSync('public/package-audio/connected', { recursive: true });
const sourceAudio = text => {
  const id = `SERIES-AUD-${hash(text.trim().normalize('NFC')).slice(0, 16)}`;
  const found = audioIndex.get(id);
  assert(found?.present, `No exact recorded transcript: ${id}`);
  return { archive: found.archive, entry: found.entry };
};
function audioFor(text, location) {
  const extension = extname(location.path ?? location.entry);
  const key = hash(JSON.stringify(location)).slice(0, 20);
  const src = `/package-audio/connected/${key}${extension}`;
  if (media.has(src)) assert.equal(media.get(src).text, text, 'One recording cannot have two transcripts');
  else media.set(src, { src, text, ...location });
  return { src, audioId: `klink-opname-${key}` };
}
// These spellings frequently function as grammar instead of the target meaning.
const weakAnchors = new Set(['ik', 'in', 'op', 'is', 'en', 'een', 'de', 'het', 'aan', 'uit', 'om', 'bij', 'voor', 'met', 'zijn', 'kan', 'pak', 'kies', 'was', 'ze', 'er', 'wel', 'wil', 'zit', 'dat', 'die', 'dit', 'van']);
function senseIn(text, word) {
  if (!tokens(text).includes(word.word)) return false;
  if (word.word === 'pak') return /\b(?:het|een|dit|dat|mijn|jouw|zijn|haar) (?:\p{L}+ ){0,2}pak\b/iu.test(text) && !/\bpak (?:melk|sap|rijst|papier)\b/iu.test(text) && word.id === 'klink-woord-pak';
  if (word.word === 'kan') return /\b(?:de|een|deze|die|mijn) (?:\p{L}+ ){0,2}kan\b/iu.test(text);
  if (word.word === 'kies') return /\b(?:de|een|mijn|jouw|zijn|haar) (?:\p{L}+ ){0,2}kies\b/iu.test(text);
  return true;
}
function add({ sourceId, kind, title, blocks, anchorWords, sourceLevel, question, answer, distractors, evidence, goal, names = [] }) {
  const text = blocks.map(block => block.text).join(' ');
  const signature = JSON.stringify([kind, blocks.map(({ text, speaker }) => [text, speaker ?? ''])]);
  const id = `klink-${kind}-${hash(signature).slice(0, 16)}`;
  const candidates = kind === 'sentence' ? anchorWords.flatMap(meaningFor) : curriculum.words;
  const eligible = candidates.filter(word => senseIn(text, word) && !names.includes(word.word));
  const strong = eligible.filter(word => !weakAnchors.has(word.word));
  const anchors = kind === 'sentence' ? eligible : strong.length ? strong : eligible;
  const wordIds = unique(anchors.map(word => word.id));
  if (!wordIds.length) unresolved.push({ sourceId, text, anchorWords });
  const lexical = tokens(text);
  const readingWordIds = unique(lexical.flatMap(meaningFor).filter(word => senseIn(text, word)).map(word => word.id));
  const source = { contentId: id, sourceId, sourceLevel, originalText: text, blocks: blocks.map(({ text, speaker, location }) => ({ text, speaker, location })), question, answer, distractors, evidence, goal };
  sources.push(source);
  if (items.has(id)) {
    items.get(id).wordIds = unique([...items.get(id).wordIds, ...wordIds]);
    return;
  }
  items.set(id, { id, kind, title: title ?? text, text, wordIds, readingWordIds,
    blocks: blocks.map((block, index) => ({ id: `${id}-${index + 1}`, text: block.text, ...(block.speaker ? { speaker: block.speaker } : {}), audio: audioFor(block.text, block.location) })),
    sourceLevel, access: 'supported-listening', independentReading: false, humanReview: 'open',
    reading: { outsideWordBank: lexical.filter(token => !meaningFor(token).length), meaningCheck: 'teacher-guided', syntaxCheck: 'teacher-guided', release: 'not-independent-reading' },
    ...(question ? { discussion: { question, answer, distractors: distractors ?? [], evidence: evidence ?? '', assessment: 'teacher-guided' } } : {}),
    ...(goal ? { goal } : {}),
  });
}

for (let number = 2; number <= 16; number++) {
  const cp = `CP${String(number).padStart(3, '0')}`;
  const bytes = execFileSync('tar', ['-xOzf', `${root}/original-word-and-text-sources.tar.gz`, `pakketten/${cp}/bron.json`]);
  assert.equal(hash(bytes), inventory.sourceChecks.find(item => item.cp === cp).originalSourceSha256);
  const source = JSON.parse(bytes);
  const anchorWords = source.words.map(word => word[0]);
  const names = (source.people ?? []).flatMap(person => typeof person === 'string' ? [person.toLocaleLowerCase('nl')] : []);
  const blocks = texts => texts.map(text => ({ text, location: sourceAudio(text) }));
  source.words.forEach((word, index) => word.slice(3).forEach((text, part) => add({ sourceId: `${cp}-SENT-${index + 1}-${part + 1}`, kind: 'sentence', blocks: blocks([text]), anchorWords: [word[0]], sourceLevel: 'with-support' })));
  source.texts.forEach((text, index) => add({ sourceId: `${cp}-TEXT-${index + 1}`, kind: 'text', title: text[0], sourceLevel: text[1], blocks: blocks([text[2]]), anchorWords, names, question: text[3], answer: text[4], distractors: text.slice(5, 7), evidence: text[7] }));
  source.dialogues.forEach((dialogue, index) => add({ sourceId: `${cp}-DIALOG-${index + 1}`, kind: 'dialogue', title: dialogue[0], sourceLevel: dialogue[1], blocks: blocks(dialogue[5]).map((block, turn) => ({ ...block, speaker: dialogue[3 + turn % 2] })), anchorWords, names, question: dialogue[6], answer: dialogue[7], distractors: dialogue.slice(8, 10), evidence: dialogue[10] }));
}
const legacyBlocks = legacy.exercises.flatMap(exercise => exercise.textBlocks ?? []);
for (const text of legacy.texts) {
  const block = legacyBlocks.find(block => block.id === text.id && block.audio?.src);
  assert(block, text.id);
  // The recorded player edition of text 009 differs from its register; keep that edition.
  assert(block.text === text.text || text.id === 'AA-TEXT-009', 'Unexpected register/player divergence');
  add({ sourceId: text.id, kind: 'text', title: text.title, sourceLevel: text.level, blocks: [{ text: block.text, location: { path: block.audio.src } }], anchorWords: legacy.words.map(word => word.word) });
}
for (const dialogue of legacy.dialogues) {
  const blocks = dialogue.turns.map((turn, index) => {
    const block = legacyBlocks.find(block => block.id === `${dialogue.id}-T${index + 1}`);
    assert.equal(block?.text, `${turn.speaker}: ${turn.text}`, dialogue.id);
    assert(block.audio?.src);
    return { ...turn, location: { path: block.audio.src } };
  });
  add({ sourceId: dialogue.id, kind: 'dialogue', title: dialogue.title, sourceLevel: dialogue.level, blocks, anchorWords: legacy.words.map(word => word.word), goal: dialogue.goal });
}
const exampleCards = legacy.exercises.filter(exercise => /^AA-X-CARD-\d+-\d+$/.test(exercise.exerciseId));
for (const exercise of exampleCards) {
  const index = Number(exercise.exerciseId.split('-').at(-2)) - 1;
  assert(exercise.prompt.audio?.src);
  add({ sourceId: exercise.exerciseId, kind: 'sentence', sourceLevel: 'with-support', blocks: [{ text: exercise.text.primary, location: { path: exercise.prompt.audio.src } }], anchorWords: [legacy.words[index].word] });
}
for (const exercise of legacy.exercises.filter(exercise => exercise.componentId === 'ALF-CMP-007' && exercise.mode === 'sentence')) {
  for (const block of exercise.textBlocks) add({ sourceId: exercise.exerciseId, kind: 'sentence', sourceLevel: 'with-support', blocks: [{ text: block.text, location: { path: block.audio.src } }], anchorWords: legacy.words.map(word => word.word).filter(word => !weakAnchors.has(word)) });
}
writeFileSync(`${output}/unresolved.json`, JSON.stringify(unresolved, null, 2));
assert.equal(unresolved.length, 0, `${unresolved.length} items need an explicit anchor; see private unresolved.json`);

function brandedWave(source, title) {
  assert.equal(source.toString('ascii', 0, 4), 'RIFF'); assert.equal(source.toString('ascii', 8, 12), 'WAVE');
  assert.equal(source.readUInt32LE(4) + 8, source.length);
  const chunks = [], sound = []; let offset = 12;
  while (offset + 8 <= source.length) {
    const id = source.toString('ascii', offset, offset + 4), size = source.readUInt32LE(offset + 4), end = offset + 8 + size + size % 2;
    assert(end <= source.length, 'Truncated WAVE');
    if (!['LIST', 'id3 ', 'ID3 ', 'bext', 'iXML', 'axml'].includes(id)) chunks.push(source.subarray(offset, end));
    if (id === 'data') sound.push(source.subarray(offset + 8, offset + 8 + size));
    offset = end;
  }
  assert.equal(offset, source.length); assert.equal(sound.length, 1);
  const fields = Object.entries({ IART: 'Taalroute', IPRD: 'Klink - Taalroute', ICOP: 'Taalroute', INAM: title }).map(([id, text]) => {
    const bytes = Buffer.from(`${text}\0`, 'utf8'), header = Buffer.alloc(8); header.write(id); header.writeUInt32LE(bytes.length, 4);
    return Buffer.concat([header, bytes, Buffer.alloc(bytes.length % 2)]);
  });
  const info = Buffer.concat([Buffer.from('INFO'), ...fields]), list = Buffer.alloc(8); list.write('LIST'); list.writeUInt32LE(info.length, 4);
  const base = Buffer.concat([source.subarray(0, 12), ...chunks, list, info]); base.writeUInt32LE(base.length - 8, 4);
  const tagged = addWaveBrandTags(base);
  assert.equal(tagged.audioSha256, hash(sound[0]), 'Sound changed during metadata repair');
  return tagged;
}
const ledger = [];
for (const [index, entry] of [...media.values()].entries()) {
  const file = `public${entry.src}`;
  const original = entry.path ? readFileSync(`public${entry.path}`) : execFileSync('unzip', ['-p', `work/source/downloads/${entry.archive}`, entry.entry], { maxBuffer: 32e6 });
  let audioSha256;
  if (entry.src.endsWith('.wav')) {
    const tagged = brandedWave(original, entry.text); audioSha256 = tagged.audioSha256;
    if (existsSync(file)) assert(readFileSync(file).equals(tagged.output), 'Refuse to overwrite a different delivery recording');
    else writeFileSync(file, tagged.output);
  } else {
    if (!existsSync(file)) execFileSync('ffmpeg', ['-v', 'error', '-n', '-i', `public${entry.path}`, '-map', '0:a:0', '-map_metadata', '-1', '-c:a', 'copy', '-id3v2_version', '3', '-metadata', 'artist=Taalroute', '-metadata', 'album_artist=Taalroute', '-metadata', 'publisher=Taalroute', '-metadata', 'album=Klink - Taalroute', '-metadata', `title=${entry.text}`, '-metadata', 'copyright=Taalroute', '-metadata', 'encoder=', file]);
    const streamHash = path => execFileSync('ffmpeg', ['-v', 'error', '-i', path, '-map', '0:a:0', '-c:a', 'copy', '-f', 'hash', '-hash', 'sha256', '-'], { encoding: 'utf8' }).trim();
    audioSha256 = streamHash(`public${entry.path}`); assert.equal(streamHash(file), audioSha256, 'Original MP3 sound changed');
  }
  ledger.push({ ...entry, originalSha256: hash(original), deliverySha256: hash(readFileSync(file)), audioSha256, soundUnchanged: true });
  if ((index + 1) % 400 === 0) console.log(`${index + 1} original recordings connected; no new synthesis`);
}
const content = { schemaVersion: 1, curriculumEdition: curriculum.release.id, access: 'supported-listening', humanReview: 'open', items: [...items.values()] };
assert(!/drive\.google|docs\.google|diglin|CP0\d\d|ALFALABS|SERIES-AUD/i.test(JSON.stringify(content)), 'Internal source reference leaked into public content');
writeFileSync('data/klink-connected-content.json', JSON.stringify(content) + '\n');
writeFileSync(`${output}/source-ledger.json`, JSON.stringify({ sourceChecks: inventory.sourceChecks, sources, media: ledger }, null, 2));
const summary = { sourceOccurrences: sources.length, uniqueItems: items.size, counts: Object.fromEntries(['sentence', 'text', 'dialogue'].map(kind => [kind, [...items.values()].filter(item => item.kind === kind).length])), recordings: media.size, bytes: [...media.keys()].reduce((sum, src) => sum + readFileSync(`public${src}`).length, 0), humanReview: 'open', independentReadingReleased: 0, published: false };
writeFileSync(`${output}/summary.json`, JSON.stringify(summary, null, 2));
console.log(JSON.stringify(summary));
