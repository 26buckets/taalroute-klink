import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join, basename, extname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const source = process.env.KLINK_SOURCE_ROOT;
const catalogs = process.env.KLINK_MEDIA_CATALOGS;
if (!source || !catalogs) throw Error('Geef de bestaande bronmap en mediacatalogusmap expliciet op.');
const read = file => JSON.parse(readFileSync(file, 'utf8'));
const release = read(join(root, 'data/klink-curriculum.json'));
const old = read(join(root, 'lib/package-content.generated.json'));
const candidates = new Map();
const sourceWords = new Map();
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const archiveRoot = process.env.KLINK_AUDIO_ARCHIVES ?? join(source, 'downloads');
const archives = readdirSync(archiveRoot).filter(name => /audio-WAV-deel.*\.zip$/.test(name));
const archiveEntries = new Map();
for (const name of archives) {
  const archive = join(archiveRoot, name);
  for (const entry of execFileSync('unzip', ['-Z1', archive], { encoding: 'utf8', maxBuffer: 16e6 }).split('\n')) {
    if (/\.wav$/i.test(entry)) archiveEntries.set(basename(entry), { archive, entry });
  }
}
// Delivery CSV supplies exact spoken word-to-record bindings; no synthesis or phoneme fallback.
for (const line of readFileSync(join(source, 'audio-levering/woordenlijst.csv'), 'utf8').split('\n').slice(1)) {
  const word = line.split(';')[2];
  const id = line.match(/SERIES-AUD-[a-f0-9]+/)?.[0];
  if (word && id && !candidates.has(word)) candidates.set(word, archiveEntries.get(`${id}.wav`));
}
for (let number = 2; !process.env.KLINK_SKIP_SOURCE_IMAGES && number <= 16; number++) {
  const part = `CP${String(number).padStart(3, '0')}`;
  const content = read(join(source, 'pakketten', part, 'bron.json'));
  const catalog = read(join(catalogs, part, 'mediacatalogus.json'));
  content.words.forEach((row, index) => {
    const image = catalog.images[`${part}-IMG-WORD-${String(index + 1).padStart(2, '0')}-V1`];
    if (!sourceWords.has(row[0])) sourceWords.set(row[0], { meaning: row[1], image: image?.url && join(source, 'pakketten', part, image.url) });
  });
}
const result = {}, evidence = [];
mkdirSync(join(root, 'public/package-audio/taalroute'), { recursive: true });
mkdirSync(join(root, 'public/package-media/taalroute'), { recursive: true });
mkdirSync(join(root, 'outputs/curriculum-rebuild/original-audio'), { recursive: true });
for (const word of release.words) {
  // The packaging sense of pak must never inherit the garment image or its spoken context.
  if (word.id === 'klink-woord-pak-verpakking') { result[word.id] = { review: 'open' }; continue; }
  const legacy = old.flatMap(pack => pack.words).find(item => item.word === word.word);
  const start = ['mat', 'tas'].includes(word.word) && existsSync(join(root, `public/start-tas/${word.word}.wav`));
  let audioBytes, audioOrigin;
  const archived = candidates.get(word.word);
  if (start) { audioOrigin = join(root, `public/start-tas/${word.word}.wav`); audioBytes = readFileSync(audioOrigin); }
  else if (archived) { audioOrigin = `${archived.archive}#${archived.entry}`; audioBytes = execFileSync('unzip', ['-p', archived.archive, archived.entry], { maxBuffer: 20e6 }); }
  else if (legacy?.audio && legacy.audioStatus !== 'rejected') { audioOrigin = join(root, 'public', legacy.audio); audioBytes = readFileSync(audioOrigin); }
  let audio;
  if (audioBytes) {
    const sourceHash = sha(audioBytes);
    const format = audioOrigin.split('#').at(-1).endsWith('.wav') ? '.wav' : extname(audioOrigin);
    const original = join(root, 'outputs/curriculum-rebuild/original-audio', sourceHash + format);
    writeFileSync(original, audioBytes);
    audio = `/package-audio/taalroute/${word.id}${format}`;
    const target = join(root, 'public', audio);
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', original, '-map_metadata', '-1', '-c:a', 'copy', '-metadata', 'artist=Taalroute', '-metadata', 'album_artist=Taalroute', '-metadata', 'publisher=Taalroute', '-metadata', 'album=Klink - Taalroute', '-metadata', `title=${word.word}`, target]);
    const pcm = file => execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-map', '0:a:0', '-f', 'hash', '-hash', 'sha256', '-'], { encoding: 'utf8' }).trim();
    if (pcm(original) !== pcm(target)) throw Error(`Geluidsdata gewijzigd: ${word.word}`);
    const tags = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', target], { encoding: 'utf8' })).format.tags;
    if (tags.artist !== 'Taalroute' || tags.album !== 'Klink - Taalroute') throw Error(`Metadata ontbreekt: ${word.word}`);
    evidence.push({ id: word.id, source: audioOrigin, sourceHash, outputHash: sha(readFileSync(target)), pcmUnchanged: true, tags, pronunciationReview: 'open' });
  }
  let image = start ? `/start-tas/${word.word}.webp` : legacy?.image;
  const sourceImage = sourceWords.get(word.word)?.image;
  if (!image && !process.env.KLINK_SKIP_SOURCE_IMAGES && sourceImage && existsSync(sourceImage)) {
    const extension = extname(sourceImage) === '.svg' ? '.svg' : '.webp';
    image = `/package-media/taalroute/${word.id}${extension}`;
    if (extension === '.svg') writeFileSync(join(root, 'public', image), readFileSync(sourceImage));
    else execFileSync('cwebp', ['-quiet', '-resize', '760', '0', '-q', '85', sourceImage, '-o', join(root, 'public', image)]);
  }
  result[word.id] = { ...(audio ? { audio } : {}), ...(image ? { image } : {}), review: 'open' };
}
writeFileSync(join(root, 'data/klink-media.json'), JSON.stringify(result, null, 2) + '\n');
writeFileSync(join(root, 'outputs/curriculum-rebuild/media-evidence.json'), JSON.stringify(evidence, null, 2) + '\n');
console.log(JSON.stringify({ meanings: release.words.length, audio: Object.values(result).filter(item => item.audio).length, images: Object.values(result).filter(item => item.image).length, humanReview: 'open', standaloneSounds: 0 }));
