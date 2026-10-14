import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { basename, extname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const cp001Source = process.env.KLINK_CP001_SOURCE ?? '/Users/nicoknoester/Documents/Codex/2026-09-27/files-pasted-by-the-user-volgende/work/taalroute-alfalabs/content-source/cp001.json';
const cp001MediaRegister = process.env.KLINK_CP001_MEDIA_REGISTER ?? '/Users/nicoknoester/Documents/Codex/2026-09-27/files-pasted-by-the-user-volgende/work/taalroute-alfalabs/content-source/cp001-package-media.json';
const cp001MediaRoot = process.env.KLINK_CP001_MEDIA_ROOT ?? '/Users/nicoknoester/Documents/Codex/2026-09-27/files-pasted-by-the-user-volgende/work/taalroute-alfalabs/fixture-public/package-media';
const cp001PenImage = process.env.KLINK_CP001_PEN_IMAGE ?? '/Users/nicoknoester/Documents/Codex/2026-09-23/ku/outputs/losse-woordbeelden/volledige-collectie/WB_LOS_pen__TR-REBUS-KORT-33_p01.png';
const cp002Root = process.env.KLINK_CP002_ROOT ?? '/Users/nicoknoester/Documents/Codex/2026-10-12/alfalabs-pakketten-002-016/pakketten/CP002';
const cp002MediaCatalogSource = process.env.KLINK_CP002_MEDIA_CATALOG ?? '/Users/nicoknoester/Documents/Codex/2026-10-13/alfalabs-media-afronding-vervolg/outputs/herstelgegevens/pakketten/CP002/mediacatalogus.json';

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'));
const rows = (table) => {
  const [headers, ...values] = table;
  return values.map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]])));
};
const manifest = (table) => Object.fromEntries(table.slice(1));
const countComponents = (exercises) => new Set(Object.values(exercises).map((exercise) => exercise.componentId)).size;
const componentLabels = {
  'ALF-CMP-001': 'Kijk- en luisterkaart',
  'ALF-CMP-002': 'Kiezen uit beeld, woord of zin',
  'ALF-CMP-003': 'Klanken onderscheiden',
  'ALF-CMP-004': 'Woord, beeld en audio koppelen',
  'ALF-CMP-005': 'Letters, klanken of woorden bouwen',
  'ALF-CMP-006': 'Typen en invullen',
  'ALF-CMP-007': 'Zin, tekst of gesprek lezen',
  'ALF-CMP-008': 'Luistervraag beantwoorden',
  'ALF-CMP-009': 'Nazeggen, reageren en rollenspel',
  'ALF-CMP-010': 'Vrij schrijven',
  'ALF-CMP-011': 'Formulier invullen',
  'ALF-CMP-012': 'Handschrift oefenen',
  'ALF-CMP-013': 'Volgorde leggen',
  'ALF-CMP-014': 'Bingo en lotto',
  'ALF-CMP-015': 'Memory, domino, zoeken en sorteren',
  'ALF-CMP-016': 'Woord- en oefenkaarten',
  'ALF-CMP-017': 'Oefencheck en reflectie',
  'ALF-CMP-018': 'Aanbevolen extra route',
};

function attachMediaSources(value, publishedImages, publishedAudio, aliases = {}) {
  if (Array.isArray(value)) return value.map((item) => attachMediaSources(item, publishedImages, publishedAudio, aliases));
  if (!value || typeof value !== 'object') return value;
  const next = Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, attachMediaSources(item, publishedImages, publishedAudio, aliases)]),
  );
  if (typeof next.assetId === 'string') {
    const canonicalId = aliases[next.assetId] ?? next.assetId;
    const direct = publishedImages.get(canonicalId);
    const fallback = publishedImages.get(canonicalId.replace(/-V2$/, ''));
    const src = direct ?? fallback;
    if (src) next.src = src;
  }
  if (typeof next.audioId === 'string') {
    const src = publishedAudio.get(next.audioId);
    if (src) next.src = src;
  }
  return next;
}

function normalizeExercise(exercise, metadata, publishedImages, publishedAudio, aliases) {
  return attachMediaSources({
    ...exercise,
    title: metadata?.title || exercise.title,
    lessonId: metadata?.lesson_id || undefined,
    stepKey: metadata?.step_key || undefined,
    sourceStatus: metadata?.status || undefined,
  }, publishedImages, publishedAudio, aliases);
}

function summarizeComponents(exercises) {
  const groups = new Map();
  for (const exercise of exercises) {
    const id = exercise.componentId;
    if (!id) continue;
    const group = groups.get(id) ?? { id, label: componentLabels[id] ?? id, count: 0, modes: new Set(), examples: new Set() };
    group.count += 1;
    if (exercise.mode) group.modes.add(exercise.mode);
    if (exercise.title) group.examples.add(exercise.title);
    if (exercise.prompt?.text) group.examples.add(exercise.prompt.text);
    groups.set(id, group);
  }
  return [...groups.values()].sort((a, b) => a.id.localeCompare(b.id)).map((group) => ({
    id: group.id,
    label: group.label,
    count: group.count,
    modes: [...group.modes],
    examples: [...group.examples].slice(0, 3),
  }));
}

function unresolvedImageAssets(value, result = new Set()) {
  if (Array.isArray(value)) {
    value.forEach((item) => unresolvedImageAssets(item, result));
    return result;
  }
  if (!value || typeof value !== 'object') return result;
  if (typeof value.assetId === 'string' && !value.src) result.add(value.assetId);
  Object.values(value).forEach((item) => unresolvedImageAssets(item, result));
  return result;
}

function referencedAudioAssets(value, result = new Set()) {
  if (Array.isArray(value)) value.forEach((item) => referencedAudioAssets(item, result));
  else if (value && typeof value === 'object') {
    if (typeof value.audioId === 'string') result.add(value.audioId);
    Object.values(value).forEach((item) => referencedAudioAssets(item, result));
  }
  return result;
}

const mediaOutput = join(root, 'public', 'package-media');
const audioOutput = join(root, 'public', 'package-audio');
mkdirSync(mediaOutput, { recursive: true });
mkdirSync(audioOutput, { recursive: true });

function publishImage(source, packageId, name) {
  if (!source || !existsSync(source)) return undefined;
  const folder = join(mediaOutput, packageId.toLowerCase());
  mkdirSync(folder, { recursive: true });
  const extension = extname(source).toLowerCase();
  const safeName = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  if (extension === '.svg') {
    const target = join(folder, `${safeName}.svg`);
    copyFileSync(source, target);
    return `/package-media/${packageId.toLowerCase()}/${basename(target)}`;
  }
  const target = join(folder, `${safeName}.webp`);
  execFileSync('cwebp', ['-quiet', '-resize', '760', '0', '-q', '82', source, '-o', target]);
  return `/package-media/${packageId.toLowerCase()}/${basename(target)}`;
}

function publishAudio(source, packageId, id) {
  if (!source || !existsSync(source)) return undefined;
  const folder = join(audioOutput, packageId.toLowerCase());
  mkdirSync(folder, { recursive: true });
  const extension = extname(source).toLowerCase();
  const safeName = id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const target = join(folder, `${safeName}${extension}`);
  copyFileSync(source, target);
  return `/package-audio/${packageId.toLowerCase()}/${basename(target)}`;
}

const cp001 = readJson(cp001Source);
const cp001Register = readJson(cp001MediaRegister);
const cp001Manifest = manifest(cp001.tabs.Manifest);
const cp001WordImages = {
  pen: 'U01_ASSET_PEN_01',
  kam: 'AA_CP001_KAM_OBJECT_01',
  kat: 'AA_CP001_KAT_CONTEXT_02',
  kan: 'AA_CP001_KAN_CONTEXT_02',
  man: 'AA_CP001_MAN_CONTEXT_02',
  map: 'AA_CP001_MAP_CONTEXT_02',
  pan: 'AA_CP001_PAN_CONTEXT_02',
  pak: 'AA_CP001_PAK_ACTION_03',
  boom: 'AA_CP001_BOOM_CONTEXT_02',
  boon: 'AA_CP001_BOON_CONTEXT_02',
  boot: 'AA_CP001_BOOT_CONTEXT_02',
  noot: 'AA_CP001_NOOT_CONTEXT_02',
  kool: 'AA_CP001_KOOL_CONTEXT_02',
  roos: 'AA_CP001_ROOS_CONTEXT_02',
  rook: 'AA_CP001_ROOK_CONTEXT_02',
  tien: 'AA_CP001_TIEN_QUANTITY_02',
  kies: 'AA_CP001_KIES_CONTEXT_02',
  biet: 'AA_CP001_BIET_CONTEXT_02',
  vies: 'AA_CP001_VIES_WASH_ACTION_03',
  vier: 'AA_CP001_VIER_QUANTITY_02',
  riem: 'AA_CP001_RIEM_ACTION_03',
  boek: 'U01_ASSET_BOEK_CONTEXT_02',
};

const cp001PublishedImages = new Map();
for (const image of cp001Register.images) {
  cp001PublishedImages.set(image.id, publishImage(join(cp001MediaRoot, image.file), 'CP001', image.id));
}
cp001PublishedImages.set('U01_ASSET_PEN_01', publishImage(cp001PenImage, 'CP001', 'U01_ASSET_PEN_01'));
const cp001PublishedAudio = new Map();
for (const audio of cp001Register.audio) {
  cp001PublishedAudio.set(audio.id, publishAudio(join(cp001MediaRoot, audio.file), 'CP001', audio.id));
}
cp001PublishedAudio.set('U01-AUD-WORD-BOEK', publishAudio(join(root, 'public', 'audio', 'pb', 'boek.m4a'), 'CP001', 'U01-AUD-WORD-BOEK'));

const cp001WordRows = rows(cp001.tabs.Words);
const cp001ImageAliases = Object.fromEntries(
  cp001WordRows
    .filter((word) => cp001WordImages[word.word])
    .map((word) => [word.word_id, cp001WordImages[word.word]]),
);
cp001ImageAliases.U01_ASSET_BOEK_01 = 'U01_ASSET_BOEK_CONTEXT_02';

const cp001Words = cp001WordRows
  .filter((word) => word.position || word.word_id === 'AA_U01_WORD_PEN' || word.word_id === 'AA_U01_WORD_BOEK')
  .map((word) => {
    const audioId = word.word_id === 'AA_U01_WORD_PEN'
      ? 'U01-AUD-WORD-PEN'
      : word.word_id === 'AA_U01_WORD_BOEK'
        ? 'U01-AUD-WORD-BOEK'
        : `AA-L01-AUD-WORD-${String(word.position).padStart(2, '0')}`;
    return {
      id: word.word_id,
      word: word.word,
      segmentation: word.segmentation,
      focus: word.sound_focus,
      group: word.position ? 'kernwoorden' : 'startles',
      meaning: word.source_note,
      image: cp001PublishedImages.get(cp001WordImages[word.word]),
      audio: cp001PublishedAudio.get(audioId),
    };
  });

const cp001Scenes = cp001Register.images
  .filter((image) => image.id.includes('_SCENE_') || image.id === 'AA_CP001_SCENE_COMB')
  .map((image) => ({
    id: image.id,
    title: image.altText,
    image: cp001PublishedImages.get(image.id),
  }));

const cp001Dialogs = rows(cp001.tabs.Dialogs).map((dialog) => ({
  id: dialog.dialog_id,
  title: dialog.title,
  level: dialog.oral_target,
  goal: dialog.goal,
  turns: JSON.parse(dialog.turns_json).map((turn) => ({ speaker: turn.speaker, text: turn.text })),
}));
const cp001Exercises = rows(cp001.tabs.Exercises).map((exercise) => ({
  componentId: exercise.component_id,
  mode: exercise.mode,
  title: exercise.title,
}));
const cp001ExerciseRecords = rows(cp001.tabs.Exercises).map((exercise) =>
  normalizeExercise(
    JSON.parse(exercise.input_json),
    exercise,
    cp001PublishedImages,
    cp001PublishedAudio,
    cp001ImageAliases,
  ),
);
const cp001MissingExerciseImages = [...unresolvedImageAssets(cp001ExerciseRecords)];
const cp001ExpectedAudio = new Set([
  ...cp001Register.audio.map((audio) => audio.id),
  ...referencedAudioAssets(cp001ExerciseRecords),
]).size;

const cp001Package = {
  id: 'CP001',
  title: 'Start met pen en boek',
  subtitle: 'Twee lessen met woorden en klanken',
  description: 'Van pen en boek naar klank-tekenkoppeling, woordbouw, lezen, typen, spreken en context.',
  level: 'Alfa A',
  status: 'Testversie',
  statusNote: 'De lessen en audio zijn te proberen. De menselijke beeld-, luister- en rechtencontrole staat nog open.',
  counts: {
    lessons: Number(cp001Manifest.lesson_count),
    coreWords: Number(cp001Manifest.word_count),
    exercises: Number(cp001Manifest.exercise_count),
    exerciseTypes: Number(cp001Manifest.component_family_count),
    texts: Number(cp001Manifest.text_count),
    dialogues: Number(cp001Manifest.dialog_count),
    games: Number(cp001Manifest.game_count),
    images: cp001PublishedImages.size,
    audio: cp001PublishedAudio.size,
  },
  lessons: rows(cp001.tabs.Lessons).map((lesson) => ({
    id: lesson.lesson_id,
    title: lesson.lesson_id === 'AA-U01' ? 'Pen en boek' : 'Klanken a, oo en ie',
    scope: lesson.scope,
    words: lesson.lesson_id === 'AA-U01' ? ['pen', 'boek'] : cp001Words.filter((word) => word.group === 'kernwoorden').map((word) => word.word),
    steps: String(lesson.required_steps).split('|'),
  })),
  words: cp001Words,
  texts: rows(cp001.tabs.Texts).map((text) => ({ id: text.text_id, title: text.title, level: text.type, text: text.text })),
  dialogues: cp001Dialogs,
  games: rows(cp001.tabs.Games).map((game) => ({ id: game.game_id, title: game.display_name, mode: game.mode })),
  exercises: cp001ExerciseRecords,
  exerciseTypes: summarizeComponents(cp001Exercises),
  scenes: cp001Scenes,
  media: {
    imageAvailable: cp001PublishedImages.size,
    imageExpected: cp001PublishedImages.size,
    audioAvailable: cp001PublishedAudio.size,
    audioExpected: cp001ExpectedAudio,
    missing: cp001MissingExerciseImages,
    imageReview: 'Menselijke beeldcontrole open',
    audioReview: 'Afspelen is beschikbaar; luister- en rechtencontrole open',
    publication: cp001Register.publicationStatus,
  },
};

const cp002Source = readJson(join(cp002Root, 'bron.json'));
const cp002Authoring = readJson(join(cp002Root, 'authoring.json'));
const cp002Catalog = readJson(cp002MediaCatalogSource);
const cp002Control = readJson(join(cp002Root, 'mediacontrole.json'));
const cp002Exercises = readJson(join(cp002Root, 'oefeningen.json'));
const cp002ExerciseMetadata = new Map(
  rows(cp002Authoring.tabs.Exercises).map((exercise) => [exercise.exercise_id, exercise]),
);
const cp002ImageEntries = Object.entries(cp002Catalog.images);
const cp002PublishedImages = new Map();
for (const [id, image] of cp002ImageEntries) {
  cp002PublishedImages.set(id, publishImage(join(cp002Root, image.url), 'CP002', id));
}
const cp002PublishedAudio = new Map();
for (let index = 1; index <= cp002Source.words.length; index += 1) {
  const audioId = `CP002-AUD-WORD-${String(index).padStart(2, '0')}`;
  const source = ['mp3', 'm4a', 'wav']
    .map((extension) => join(audioOutput, 'cp002', `${audioId.toLowerCase()}.${extension}`))
    .find(existsSync);
  if (source) cp002PublishedAudio.set(audioId, `/package-audio/cp002/${basename(source)}`);
}

const cp002ExerciseRecords = Object.values(cp002Exercises).map((exercise) =>
  normalizeExercise(
    exercise,
    cp002ExerciseMetadata.get(exercise.exerciseId),
    cp002PublishedImages,
    cp002PublishedAudio,
    {},
  ),
);
const cp002MissingExerciseImages = [...unresolvedImageAssets(cp002ExerciseRecords)];

const cp002Words = cp002Source.words.map((word, index) => ({
  id: `CP002-WORD-${String(index + 1).padStart(2, '0')}`,
  word: word[0],
  meaning: word[1],
  segmentation: word[2],
  focus: word[2].split('|').find((part) => part.length > 1) ?? word[2].split('|')[1] ?? word[2].split('|')[0],
  group: `les-${Math.floor(index / 5) + 1}`,
  image: cp002PublishedImages.get(`CP002-IMG-WORD-${String(index + 1).padStart(2, '0')}-V1`),
  audio: cp002PublishedAudio.get(`CP002-AUD-WORD-${String(index + 1).padStart(2, '0')}`),
  examples: word.slice(3),
}));

const cp002Scenes = cp002Source.scenes.map((scene) => ({
  id: `CP002-SCENE-${scene[0]}`,
  title: scene[1],
  description: scene[2],
  words: scene[3],
  image: cp002PublishedImages.get(`CP002-SCENE-${scene[0]}`),
}));

const cp002Package = {
  id: 'CP002',
  title: cp002Source.title,
  subtitle: 'Vier lessen met twintig woorden',
  description: 'Woorden en situaties uit huis, les, kleding, eten, bibliotheek, boerderij en apotheek.',
  level: 'Alfa A met groei naar A1/A2-context',
  status: 'Testversie',
  statusNote: 'De lessen en kernwoorden zijn te proberen. Een deel van de audio en acht scènebindingen staan nog open.',
  counts: {
    lessons: rows(cp002Authoring.tabs.Lessons).length,
    coreWords: cp002Source.words.length,
    exercises: Object.keys(cp002Exercises).length,
    exerciseTypes: countComponents(cp002Exercises),
    texts: cp002Source.texts.length,
    dialogues: cp002Source.dialogues.length,
    games: rows(cp002Authoring.tabs.Games).length,
    images: cp002Control.images_available,
    audio: cp002PublishedAudio.size,
  },
  lessons: rows(cp002Authoring.tabs.Lessons).map((lesson, index) => ({
    id: lesson.lesson_id,
    title: cp002Words.slice(index * 5, index * 5 + 5).map((word) => word.word).join(', '),
    scope: lesson.scope,
    words: cp002Words.slice(index * 5, index * 5 + 5).map((word) => word.word),
    steps: String(lesson.required_steps).split('|'),
  })),
  words: cp002Words,
  texts: rows(cp002Authoring.tabs.Texts).map((text) => ({ id: text.text_id, title: text.title, level: text.level, text: text.text, question: text.question, answer: text.answer })),
  dialogues: rows(cp002Authoring.tabs.Dialogs).map((dialog) => ({
    id: dialog.dialogue_id,
    title: dialog.title,
    level: dialog.level,
    goal: dialog.question,
    turns: dialog.turns.map((text, index) => ({ speaker: index % 2 === 0 ? dialog.speaker_1 : dialog.speaker_2, text })),
  })),
  games: rows(cp002Authoring.tabs.Games).map((game) => ({ id: game.game_id, title: game.title, mode: game.mode })),
  exercises: cp002ExerciseRecords,
  exerciseTypes: summarizeComponents(Object.values(cp002Exercises)),
  scenes: cp002Scenes,
  media: {
    imageAvailable: cp002Control.images_available,
    imageExpected: cp002Control.expected_image_bindings,
    audioAvailable: cp002PublishedAudio.size,
    audioExpected: cp002Control.audio_available,
    missing: [...new Set([...cp002Control.missing_images, ...cp002MissingExerciseImages])],
    imageReview: cp002Control.human_review === 'OPEN' ? 'Menselijke beeldcontrole open' : cp002Control.human_review,
    audioReview: 'Kernwoorden afspeelbaar; overige audio en luistercontrole open',
    publication: cp002Control.publication,
  },
};

writeFileSync(join(root, 'lib', 'package-content.generated.json'), `${JSON.stringify([cp001Package, cp002Package], null, 2)}\n`);
console.log('Klink package catalog generated for CP001 and CP002.');
