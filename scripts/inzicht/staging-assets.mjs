import assert from 'node:assert/strict';
import { mkdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { taalroutePackages } from '../../lib/taalroute-packages.ts';
import { groupExercises } from '../../lib/group-practice.ts';
import { createHash } from 'node:crypto';
const config = JSON.parse(readFileSync('scripts/inzicht/online-config.json'));
assert.equal(config.name, 'klink-inzicht-pr8-staging');
const files = new Set([
  '/favicon.svg',
  '/favicon.ico',
  '/manifest.webmanifest',
  '/klink-wordmark.svg',
  '/klink-wordmark-dark.svg',
  '/klanken/Inter.ttf',
  '/klanken/Inter-OFL.txt',
  '/taalroute-menu/appearance.js',
  '/taalroute-menu/menu-controls.js',
  '/taalroute-menu/klink.svg',
]);
const pack = taalroutePackages.find((p) =>
  p.words.some((w) => w.id === 'klink-woord-mat'),
);
function collect(value) {
  if (
    typeof value === 'string' &&
    /^\/[\w/.-]+\.(?:mp3|wav|png|webp|svg)$/.test(value)
  )
    files.add(value);
  else if (Array.isArray(value)) value.forEach(collect);
  else if (value && typeof value === 'object')
    Object.values(value).forEach(collect);
}
collect(pack.words);
for (const word of ['mat', 'man', 'map'])
  collect(
    groupExercises(pack, 'same-word').find(
      (e) => e.wordId === `klink-woord-${word}`,
    ),
  );
files.add('/taalroute-logo.svg');
files.add('/taalroute-menu/share-card.png');
const header = readFileSync('components/product/taalroute-header.tsx', 'utf8');
const apps = JSON.parse(header.match(/const apps = (\[.*\]);/)[1]);
for (const [id] of apps)
  files.add(`/taalroute-menu/${id === 'klink' ? 'klink-brand' : id}.svg`);
const compact = JSON.parse(
  readFileSync('data/klink-compact-images-20261031.json'),
);
for (const file of files) if (compact[file]) files.add(compact[file]);
const manifest = [];
for (const file of files) {
  const src = `public${file}`,
    dst = `.wrangler/inzicht-assets${file}`;
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  const hash = (p) =>
    createHash('sha256').update(readFileSync(p)).digest('hex');
  assert.equal(hash(src), hash(dst));
  manifest.push({ file, sha256: hash(dst) });
}
writeFileSync(
  'docs/inzicht-20261101/evidence/staging-assets.json',
  JSON.stringify(manifest, null, 2),
);
console.log(
  `${files.size} unchanged original assets copied for the three-exercise staging catalog.`,
);

writeFileSync(
  '.wrangler/inzicht-assets/_headers',
  `/*
  X-Robots-Tag: noindex, nofollow, noarchive
  Referrer-Policy: no-referrer
  X-Content-Type-Options: nosniff
  Content-Security-Policy: frame-ancestors 'none'; base-uri 'self'; form-action 'self'
`,
);
