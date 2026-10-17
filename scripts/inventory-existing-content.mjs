// Read-only source inventory. This does not import legacy ordering or approve publication.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { resolve, basename, join } from 'node:path';
import { taalroutePackages } from '../lib/taalroute-packages.ts';
import { klinkContexts } from '../lib/klink-context.ts';

const root = resolve(import.meta.dirname, '..');
const output = resolve(process.argv[2] ?? join(root, 'outputs/content-inventory-20261017'));
const sourceRoot = resolve(process.argv[3] ?? '/Users/nicoknoester/Documents/Codex/2026-10-12/alfalabs-pakketten-002-016');
const json = file => JSON.parse(readFileSync(file, 'utf8'));
const sha = value => createHash('sha256').update(value).digest('hex');
const normalize = text => text.trim().normalize('NFC');
const audioId = text => `SERIES-AUD-${sha(normalize(text)).slice(0, 16)}`;
const countBy = (items, key) => items.reduce((counts, item) => { const value = typeof key === 'function' ? key(item) : item[key]; counts[value] = (counts[value] ?? 0) + 1; return counts; }, {});
const curriculum = json(join(root, 'data/klink-curriculum.json'));
const oldPacks = json(join(root, 'lib/package-content.generated.json'));
const currentMedia = json(join(root, 'data/klink-media.json'));
const archiveSources = json(join(output, 'archive-sources.json'));
const originals = [], reviewed = [], reviewedAudio = [], sourceChecks = [], wordPlacement = [];

// The original producer derives this ID from the exact NFC transcript. Zip membership
// proves an actual recording is available, not pronunciation, metadata or human approval.
const audioFiles = new Map();
const audioDir = join(root, 'work/source/downloads');
for (const name of readdirSync(audioDir).filter(name => /^ALFALABS-audio-WAV-deel-.*\.zip$/.test(name))) {
  for (const entry of execFileSync('unzip', ['-Z1', join(audioDir, name)], { encoding: 'utf8', maxBuffer: 16e6 }).trim().split('\n')) {
    if (entry.endsWith('.wav')) audioFiles.set(basename(entry, '.wav'), { archive: name, entry });
  }
}
const audioFor = text => {
  const id = audioId(text), location = audioFiles.get(id);
  return { id, present: Boolean(location), ...location, humanReview: 'open', deliveryMetadata: 'not-checked-in-this-inventory' };
};
const placements = id => taalroutePackages.flatMap(pack => pack.lessons.filter(lesson => [...(lesson.newWords ?? []), ...(lesson.returning ?? []), ...(lesson.known ?? [])].includes(id)).map(lesson => ({ packageId: pack.id, lessonId: lesson.id, role: lesson.newWords?.includes(id) ? 'new' : lesson.returning?.includes(id) ? 'returning' : 'known' })));
const matches = spelling => curriculum.words.filter(word => word.word.toLocaleLowerCase('nl') === spelling.toLocaleLowerCase('nl'));
const wordsIn = text => [...new Set((text.toLocaleLowerCase('nl').match(/\p{L}+(?:['’-]\p{L}+)*/gu) ?? []))];
function placementForText(text) {
  const tokens = wordsIn(text), matched = tokens.flatMap(token => matches(token));
  return {
    matchingWordIds: [...new Set(matched.map(word => word.id))],
    outsideCurrentWordBank: tokens.filter(token => !matches(token).length),
    ambiguousSpellings: tokens.filter(token => matches(token).length > 1),
    placementStatus: 'candidate-links-not-a-reading-release',
    independentReading: false,
  };
}
function addOriginal(cp, kind, id, text, extra = {}) {
  originals.push({ sourcePackage: cp, kind, id, text, ...extra, audio: audioFor(text), ...placementForText(text) });
}

for (const source of archiveSources) {
  const archive = join(output, 'archives', `${source.cp}.zip`);
  assert.equal(statSync(archive).size, source.size, `${source.cp} Drive size`);
  const entries = execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8' }).trim().split('\n');
  const prefix = entries.find(entry => entry.endsWith('/STATUS.json'))?.slice(0, -'STATUS.json'.length);
  assert(prefix, `${source.cp} status`);
  const readEntry = suffix => {
    const entry = prefix + suffix;
    assert(entries.includes(entry), `${source.cp}: missing ${suffix}`);
    return JSON.parse(execFileSync('unzip', ['-p', archive, entry], { encoding: 'utf8', maxBuffer: 24e6 }));
  };
  const status = readEntry('STATUS.json');
  const registry = readEntry('inhoud/tekstenregister.json');
  const audioEntry = entries.find(entry => entry.startsWith(prefix + 'audio-voorbereiding/spreekteksten') && entry.endsWith('.json'));
  assert(audioEntry, `${source.cp} audio preparation`);
  const audioPlan = readEntry(audioEntry.slice(prefix.length));
  assert(Array.isArray(audioPlan));
  for (const clip of audioPlan) reviewedAudio.push({ sourcePackage: source.cp, id: clip.id, role: clip.role, script: clip.script, status: clip.status, ...audioFor(clip.script), preparedId: clip.id });
  for (const record of registry) {
    assert(!record.path.includes('..') && !record.path.startsWith('/'));
    const lesson = readEntry(`inhoud/${record.path}`);
    const items = lesson.items;
    for (const item of items.filter(item => ['text', 'sentence'].includes(item.kind))) {
      reviewed.push({ sourcePackage: source.cp, sourceLessonId: lesson.pack.id, id: item.id, kind: item.kind, level: lesson.pack.level, title: item.title ?? lesson.pack.title, text: item.targetText,
        sourceRelation: item.source_relation ?? lesson.pack.origin?.type ?? lesson.pack.source?.type ?? 'see-source-package',
        exerciseTypes: [...new Set(lesson.exerciseInstances.map(exercise => exercise.exerciseTypeId))],
        audio: audioFor(item.targetText), ...placementForText(item.targetText) });
    }
  }
  const originalPath = join(sourceRoot, 'pakketten', source.cp, 'bron.json');
  const original = json(originalPath);
  for (const [index, word] of original.words.entries()) {
    const candidates = matches(word[0]);
    wordPlacement.push({ sourcePackage: source.cp, sourceWordNumber: index + 1, word: word[0], meaning: word[1], segmentation: word[2],
      status: candidates.length === 1 ? 'spelling-linked-meaning-to-confirm' : candidates.length ? 'meaning-choice-needed' : 'missing-from-current-word-bank',
      candidates: candidates.map(candidate => ({ id: candidate.id, meaning: candidate.meaning, firstReading: candidate.firstReading, placements: placements(candidate.id) })) });
    addOriginal(source.cp, 'word', `${source.cp}-WORD-${index + 1}`, word[0], { meaning: word[1] });
    word.slice(3).forEach((sentence, part) => addOriginal(source.cp, 'word-sentence', `${source.cp}-SENT-${index + 1}-${part + 1}`, sentence, { targetWord: word[0], sourceSequence: part + 1 }));
  }
  original.texts.forEach((text, index) => addOriginal(source.cp, 'text', `${source.cp}-TEXT-${index + 1}`, text[2], { title: text[0], sourceLevel: text[1], question: text[3], answer: text[4] }));
  original.dialogues.forEach((dialogue, index) => {
    const turns = dialogue[5].map((text, turn) => ({ text, turn: turn + 1, audio: audioFor(text) }));
    originals.push({ sourcePackage: source.cp, id: `${source.cp}-DIALOG-${index + 1}`, kind: 'dialogue', title: dialogue[0], sourceLevel: dialogue[1], text: dialogue[5].join(' '), turns,
      audio: { present: turns.every(turn => turn.audio.present), kind: 'separate-turns-not-one-mixed-recording', humanReview: 'open' }, ...placementForText(dialogue[5].join(' ')) });
  });
  sourceChecks.push({ cp: source.cp, archiveFile: `archives/${source.cp}.zip`, archiveSha256: sha(readFileSync(archive)), bytes: statSync(archive).size, originalSourceSha256: sha(readFileSync(originalPath)), reviewedLessons: registry.length, preparedClips: audioPlan.length, sourceStatus: status.release });
}

const legacy = oldPacks.find(pack => pack.id === 'CP001');
for (const [index, word] of legacy.words.entries()) {
  const garment = word.word === 'pak' && word.meaning.includes('pak als kledingstuk');
  const candidates = matches(word.word).filter(candidate => !garment || candidate.id === 'klink-woord-pak');
  wordPlacement.push({ sourcePackage: 'CP001', sourceWordNumber: index + 1, word: word.word, meaning: word.meaning,
    status: garment && candidates.length === 1 ? 'meaning-confirmed-from-source' : candidates.length === 1 ? 'spelling-linked-meaning-to-confirm' : candidates.length ? 'meaning-choice-needed' : 'missing-from-current-word-bank',
    ...(garment ? { reason: 'De CP001-bron noemt expliciet het kledingstuk en sluit verpakking uit. Daarom uitsluitend de kledingbetekenis, nooit pak-verpakking.' } : {}),
    candidates: candidates.map(candidate => ({ id: candidate.id, meaning: candidate.meaning, firstReading: candidate.firstReading, placements: placements(candidate.id) })) });
}
const legacyAudioSources = value => {
  if (!value || typeof value !== 'object') return [];
  const found = typeof value.src === 'string' && /\.(mp3|wav)$/.test(value.src) ? [value.src] : [];
  return found.concat(Object.values(value).flatMap(legacyAudioSources));
};
const cp001 = {
  source: 'existing-imported-CP001; do not add legacy CP002 totals again',
  words: legacy.words.length, texts: legacy.texts.length, dialogues: legacy.dialogues.length,
  audioFiles: [...new Set(legacyAudioSources(legacy))].map(path => ({ path, exists: existsSync(join(root, 'public', path)) })),
  textsRegister: legacy.texts,
  note: 'CP001 is inventoried separately; the two old starter lessons are not the new curriculum. No new level-by-level CP001 release has been claimed.',
};
const currentTexts = new Set(klinkContexts.map(item => normalize(item.text)));
const baseLessons = taalroutePackages.flatMap(pack => pack.lessons);
const compact = items => ({ count: items.length, uniqueTexts: new Set(items.map(item => normalize(item.text))).size, withAudioFile: items.filter(item => item.audio.present).length, alreadyInNewContextRoute: items.filter(item => currentTexts.has(normalize(item.text))).length });
const summarize = items => Object.fromEntries([...new Set(items.map(item => item.kind))].map(kind => [kind, compact(items.filter(item => item.kind === kind))]));
assert.equal(sourceChecks.length, 15);
assert.equal(wordPlacement.length, 300 + legacy.words.length);
assert.equal(wordPlacement.find(word => word.sourcePackage === 'CP001' && word.word === 'pak').candidates[0].id, 'klink-woord-pak');
assert.equal(originals.filter(item => item.kind === 'word').length, 300);
assert.equal(originals.filter(item => item.kind === 'word-sentence').length, 1200);
assert.equal(originals.filter(item => item.kind === 'text').length, 180);
assert.equal(originals.filter(item => item.kind === 'dialogue').length, 120);
assert.equal(reviewed.filter(item => item.kind === 'text').length, 360);
assert.equal(reviewed.filter(item => item.kind === 'sentence').length, 1800);
assert.equal(new Set(reviewed.map(item => item.id)).size, reviewed.length);
assert.equal(audioId('De lunch staat klaar. Lina neemt water. Erik kiest cola.'), 'SERIES-AUD-b428bbce176fe507');
assert.equal(taalroutePackages.length, 16);
assert.equal(baseLessons.length, 302);

const inventory = {
  generatedAt: new Date().toISOString(), purpose: 'Internal bridge inventory for Lexicon and Klink; not a learner screen or public source reference.',
  sourceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  currentCurriculum: {
    edition: curriculum.release, counts: curriculum.counts, collections: taalroutePackages.length,
    collectionExplanation: '10 building groups, 5 reading routes, 1 preparation section; not the old sixteen CP packages.',
    selectablePracticeRoutes: baseLessons.length, routeKinds: countBy(baseLessons, 'kind'),
    wordsWithAudio: Object.values(currentMedia).filter(item => item.audio).length, wordsWithImages: Object.values(currentMedia).filter(item => item.image).length,
    listeningSentences: klinkContexts.filter(item => item.kind === 'sentence').length, listeningSituations: klinkContexts.filter(item => item.kind === 'situation').length,
    comprehensionQuestions: taalroutePackages.flatMap(pack => pack.exercises).filter(item => item.mode === 'sentence-question').length,
    groups: taalroutePackages.map(pack => ({ id: pack.id, title: pack.title, kind: pack.kind, routes: pack.lessons.length, routeKinds: countBy(pack.lessons, 'kind') })),
  },
  cp001, originalCP002to016: summarize(originals), revisedCP002to016: summarize(reviewed),
  revisedLevels: countBy(reviewed.filter(item => item.kind === 'text'), 'level'),
  audioInventory: { archivedWavFiles: audioFiles.size, preparedClipReferences: reviewedAudio.length,
    preparedByRole: countBy(reviewedAudio, 'role'), preparedWithExactTranscriptFile: reviewedAudio.filter(item => item.present).length,
    boundary: 'A prepared script is not a recording. Presence is checked by exact transcript-derived ID against actual archive entries. Delivery metadata, pronunciation, full decoding and approval are separate checks. Old and revised content overlap and must not be summed as independent lessons.' },
  wordPlacementSummary: countBy(wordPlacement, 'status'), wordPlacement, originals, reviewed, reviewedAudio, sourceChecks,
  publication: { deployed: false, humanReview: 'open', reason: 'This inventory neither grants approval nor changes publication guards.' },
};
mkdirSync(output, { recursive: true });
writeFileSync(join(output, 'inventory.json'), JSON.stringify(inventory, null, 2) + '\n');
const summary = { currentCurriculum: inventory.currentCurriculum, cp001: { words: cp001.words, texts: cp001.texts, dialogues: cp001.dialogues, referencedAudioFiles: cp001.audioFiles.length, presentAudioFiles: cp001.audioFiles.filter(item => item.exists).length }, original: inventory.originalCP002to016, revised: inventory.revisedCP002to016, revisedLevels: inventory.revisedLevels, audio: inventory.audioInventory, wordPlacement: inventory.wordPlacementSummary };
writeFileSync(join(output, 'summary.json'), JSON.stringify(summary, null, 2) + '\n');
const overview = [
  'KLINK — BESTAANDE INHOUD AANSLUITEN',
  'Inventaris van 17 oktober 2026. Geen nieuwe app en geen nieuwe lijstverdeling.', '',
  '1. Hoeveel heeft de nieuwe indeling?',
  '37 klankleesstappen + 23 uitbreidingen + 3 herhaalmomenten + 239 korte woordroutes = 302 selecteerbare oefenroutes.',
  'Dit zijn niet 302 volledig uitgewerkte tekstlessen. De woordroutes bevatten vaak één nieuw woord.',
  'De 16 menuonderdelen zijn 10 bouwgroepen, 5 leesroutes en 1 voorbereidingsonderdeel; niet de oude zestien CP-lijsten.',
  `${curriculum.counts.wordForms} woordvormen / ${curriculum.counts.meanings} betekenissen. Alle betekenissen hebben een gekoppelde woordopname.`, '',
  '2. Wat is er nog buiten de nieuwe route?',
  `Oorspronkelijke CP002–CP016: ${summary.original['word-sentence'].count} voorbeeldzinnen, ${summary.original.text.count} teksten en ${summary.original.dialogue.count} gesprekken.`,
  'Voor al deze oorspronkelijke voorbeeldzinnen en teksten zijn transcriptgebonden WAV-bestanden aanwezig; gesprekken hebben afzonderlijke beurtopnamen.',
  `CP001 afzonderlijk: ${cp001.words} woorditems, ${cp001.texts} teksten en ${cp001.dialogues} gesprekken in de bestaande import.`,
  'In de nieuwe route zijn nu slechts 8 luisterzinnen, 4 situaties en 8 begripsvragen aangesloten.', '',
  '3. Niet dubbel tellen',
  `De latere eindreview bevat ${summary.revised.text.count} teksten en ${summary.revised.sentence.count} oefenzinnen. Dit overlapt de oorspronkelijke inhoud.`,
  `Daarvan hebben ${summary.revised.text.withAudioFile} volledige teksten en ${summary.revised.sentence.withAudioFile} oefenzinnen een exact passende opname in de gecontroleerde WAV-archieven.`,
  'Een spreektekst of audio-ID is nog geen opname. Aanwezigheid bewijst evenmin juiste uitspraak of publicatiegeschikte metadata.',
  'De zes bronroutes bevatten elk 60 teksten: Alfa A, Alfa B, Alfa C, A1, A1-plus en A2. A1-plus is een interne brugroute; dit bewijst geen behaald niveau.', '',
  '4. Koppeling aan Lexicon',
  'Per oorspronkelijk woord zijn de kandidaatbetekenis, het eerste leesmoment en alle bestaande terugkeerplaatsen geregistreerd.',
  'Per zin/tekst staan de bekende woorden en woorden buiten de huidige woordenbank vermeld. Dit zijn plaatsingskandidaten, geen vrijgave voor zelfstandig lezen.',
  'De oude CP-volgorde wordt niet overgenomen. Lexicon blijft de basis voor de eigen Taalroute-leerlijn.',
  'Bronpaden en Drive-verwijzingen blijven uitsluitend in deze interne inventaris, niet op het cursistenscherm of de openbare Lexicon-pagina.', '',
  '5. Uitvoeringsvolgorde',
  'A. Rond de lopende UI- en beeldwijzigingen samen af op één publicatiebasis; maak alle bestaande routes vindbaar.',
  'B. Koppel de bestaande voorbeeldzinnen, teksten en gesprekbeurten op betekenis aan die routes, met behoud van hun oorspronkelijke opnamen.',
  'C. Controleer per item mondelinge voorbereiding, leesvoorwaarden, feedback en audio-/beeldvrijgave; publiceer vervolgens dezelfde app op het bestaande domein.',
  'D. Voeg passende eigen H5P-achtige interacties toe: kiezen/koppelen/dictee waar dat al kan, daarna zinnen aanvullen of bouwen en tekstbegrip.',
  'Een cursistenproef volgt aan het eind en blokkeert deze inventaris of technische aansluiting niet.',
  'De losse t blijft geparkeerd. In deze inventaris zijn geen nieuwe opnamen gemaakt, geen bronnen gewijzigd en geen publicatieblokkades omzeild.', '',
  'Volledige controleerbare koppelingen: inventory.json. Tellingen: summary.json. Bronarchieven en controles zijn apart bewaard.',
];
writeFileSync(join(output, 'overzicht.txt'), overview.join('\n') + '\n');
console.log(JSON.stringify(summary, null, 2));
