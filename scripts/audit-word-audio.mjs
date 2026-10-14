import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const packs = JSON.parse(readFileSync(join(root, 'lib/package-content.generated.json'), 'utf8'));
const hash = (path) => createHash('sha256').update(readFileSync(path)).digest('hex');
const prototypeDir = join(root, 'public/audio/pb');
const prototypes = readdirSync(prototypeDir).filter((name) => /\.(m4a|mp3|wav)$/.test(name))
  .map((name) => ({ path: `/audio/pb/${name}`, sha256: hash(join(prototypeDir, name)) }));
const cp001 = packs.find((pack) => pack.id === 'CP001');
const cp002 = packs.find((pack) => pack.id === 'CP002');
const rows = cp002.words.map((word, index) => {
  const audioId = `CP002-AUD-WORD-${String(index + 1).padStart(2, '0')}`;
  const retainedPath = ['m4a', 'mp3', 'wav'].map((ext) => `/package-audio/cp002/${audioId.toLowerCase()}.${ext}`)
    .find((path) => existsSync(join(root, 'public', path)));
  const sha256 = retainedPath ? hash(join(root, 'public', retainedPath)) : null;
  return {
    word: word.word,
    audioId,
    playbackPath: word.audio ?? null,
    retainedPath: retainedPath ?? null,
    sha256,
    exactPrototypeMatches: prototypes.filter((item) => item.sha256 === sha256).map((item) => item.path),
    exactCP001Matches: cp001.words.filter((item) => item.audio && hash(join(root, 'public', item.audio)) === sha256).map((item) => item.word),
    expectedText: word.word,
    voiceId: null,
    generationSourceVerified: false,
    listeningReview: word.audioStatus,
  };
});
writeFileSync(join(root, 'docs/word-audio-audit.json'), `${JSON.stringify({
  auditedAt: new Date().toISOString(),
  scope: 'CP002: alle twintig woordopnamen; hashes bewijzen alleen bestandsidentiteit, geen uitspraak of originele stemherkomst.',
  note: 'Voice-IDs en generatieregisters ontbreken. Boek is bewaard voor herstel maar niet gekoppeld in de app.',
  counts: packs.map((pack) => ({ id: pack.id, linkedAudio: pack.counts.audio })),
  words: rows,
}, null, 2)}\n`);
console.log(`Audioregister geschreven: ${rows.length} woorden; ${rows.filter((row) => row.exactPrototypeMatches.length).length} exacte prototype-matches.`);
