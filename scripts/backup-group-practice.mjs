// Creates a source/verification archive; unchanged media remain in the existing Drive recovery packages.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
const connections = process.argv.includes('--connected-audio');
const phaseNavigation = process.argv.includes('--phase-navigation');
const completePhotos = process.argv.includes('--complete-photos');
const squarePhotos = process.argv.includes('--square-photos');
const publication = squarePhotos || completePhotos || phaseNavigation || process.argv.includes('--publication');
const cardsAndRate = process.argv.includes('--cards-and-rate');
const extraAudio = publication || cardsAndRate || connections || process.argv.includes('--extra-audio');
const extended = extraAudio || process.argv.includes('--extended');
const out = squarePhotos ? 'outputs/square-section-photos-20261017' : completePhotos ? 'outputs/complete-photos-20261017' : phaseNavigation ? 'outputs/phase-navigation-20261017' : publication ? 'outputs/publication-task-audio-20261017' : cardsAndRate ? 'outputs/card-layout-audio-rate-20261017' : connections ? 'outputs/instruction-connections-20261017' : extraAudio ? 'outputs/extended-instruction-audio-20261017/backup' : extended ? 'outputs/extended-practice-review-20261017' : 'outputs/group-practice-review-20261017';
mkdirSync(out, { recursive: true });
const archive = `${out}/${squarePhotos ? 'Klink-vierkante-fotos-7-9-14-15-20261017' : completePhotos ? 'Klink-compacte-kaarten-volledige-fotos-20261017' : phaseNavigation ? 'Klink-leerstappen-herstel-20261017' : publication ? 'Klink-publicatie-opdrachtaudio-20261017' : cardsAndRate ? 'Klink-online-kaartstijl-audio-085-20261017' : connections ? 'Klink-zestien-instructies-gekoppeld-20261017' : extraAudio ? 'Klink-zestien-instructies-bron-media-controles-20261017' : extended ? 'Klink-taalgebruik-bron-media-controles-20261017' : 'Klink-groepsoefeningen-bron-en-controles-20261017'}.zip`;
if (existsSync(archive)) throw Error('Existing archive must be retained; choose a new filename for a new backup.');
const tracked = execFileSync('git', ['ls-files', '-co', '--exclude-standard'], { encoding: 'utf8' }).split('\n').filter(Boolean);
const sources = [...new Set(tracked.filter(path => (/\.(ts|tsx|js|mjs|cjs|json|jsonc|css|md|html|toml|yml|yaml|lock)$/.test(path) || path === 'public/.assetsignore') && !path.startsWith('outputs/')))];
const checks = [out, 'outputs/mixed-practice-20261017', 'outputs/content-audio-register-20261017', 'outputs/diglin-comparison-20261017', 'outputs/ux-review-20261017', 'outputs/existing-player-integration', 'outputs/lesson-extension-20261016', 'outputs/sections-20261017', 'outputs/sentence-comprehension-20261017', 'outputs/content-connection-20261017'];
function walk(dir) { return !existsSync(dir) ? [] : readdirSync(dir).flatMap(name => { const path = join(dir, name); return statSync(path).isDirectory() ? walk(path) : /\.(json|png|jpg|md)$/.test(name) ? [path] : []; }); }
const newAudio = extended ? JSON.parse(readFileSync('data/klink-audio-candidates.json')).items.flatMap(item => {
  const recordPath = item.recordPath || `outputs/group-instruction-audio-20261017/${item.id}.json`;
  return [`public${item.src}`, JSON.parse(readFileSync(recordPath)).original, recordPath];
}) : [];
const photoFiles = squarePhotos ? JSON.parse(readFileSync('docs/klink-square-photo-cards-approval-20261017.json')).assets.flatMap(asset => [asset.image, asset.previousImage].map(path => `public${path}`)) : [];
const files = [...new Set([...sources, ...photoFiles, ...checks.flatMap(walk), ...(extended ? walk('outputs/group-instruction-audio-20261017') : []), ...(extraAudio ? walk('outputs/extended-instruction-audio-20261017') : []), ...newAudio])];
const manifest = {
  createdAt: new Date().toISOString(), baseCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
  branch: execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim(),
  publication, newMedia: extended,
  instructionAudioUsage: publication ? 'withdrawn-by-owner; archived originals are not public downloads' : 'See source release records',
  recovery: extended ? 'Complete source and verification snapshot, all registered instruction candidates, original recordings and production records. Restore separately. Existing media remain in the previous Drive recovery packages. Human listening and content review remain open; this is not a live release.' : 'Complete text/source snapshot plus current local verification. Restore into a separate checkout; do not overwrite a working project. Unchanged media are in the existing Alfabeta+ Klink Drive recovery packages; no new images or audio were generated.',
  mediaRecoveryIds: ['12_bQiJUlJEPdrl8s8rjYEJzycWmsIkXy', '1uHj2hVUO30HO9r17iW4TJ3_QBCBWptE-', '1zdlnhScWKaiwJpd5-Sqbk9acY746Bx-4'],
  files: files.map(path => ({ path, bytes: statSync(path).size, sha256: createHash('sha256').update(readFileSync(path)).digest('hex') })),
};
writeFileSync(`${out}/source-manifest.json`, JSON.stringify(manifest, null, 2));
execFileSync('zip', ['-q', archive, '-@'], { input: [...files, `${out}/source-manifest.json`].join('\n') + '\n' });
const verification = { archive, bytes: statSync(archive).size, sha256: createHash('sha256').update(readFileSync(archive)).digest('hex'), files: files.length + 1 };
writeFileSync(`${out}/local-backup.json`, JSON.stringify(verification, null, 2));
console.log(JSON.stringify(verification));
