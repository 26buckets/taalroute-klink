import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, readdirSync, mkdirSync, renameSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import sharp from 'sharp';

export const imageBudget = 96 * 1024;
const mapFile = 'data/klink-compact-images-20261031.json';
const recordFile = 'data/klink-image-preparation.json';
const imageExtension = /\.(png|jpe?g|webp|avif|gif|tiff?|heic|svg|ico)$/i;
const outputDirectory = '/compact-images-20261031/';
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const json = (root, file) => JSON.parse(readFileSync(join(root, file), 'utf8'));
function save(root, file, value) {
  const target = join(root, file), content = JSON.stringify(value, null, 2) + '\n';
  if (existsSync(target) && readFileSync(target, 'utf8') === content) return;
  mkdirSync(resolve(target, '..'), { recursive: true });
  writeFileSync(target + '.tmp', content);
  renameSync(target + '.tmp', target);
}
function imagePaths(directory, prefix = '') {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const src = prefix + '/' + entry.name;
    assert(!entry.isSymbolicLink(), 'Geen verwijzing buiten public: ' + src);
    return entry.isDirectory() ? imagePaths(join(directory, entry.name), src) : imageExtension.test(entry.name) ? [src] : [];
  }).sort((a, b) => a.localeCompare(b));
}
const limit = src => src.includes('/handschrift/') ? 1280 : src.includes('hero') ? 960 : 640;
async function inspect(bytes, src) {
  assert(bytes.length <= imageBudget, `Beeld groter dan 96 KiB: ${src}`);
  if (/\.ico$/i.test(src)) return;
  const metadata = await sharp(bytes).metadata();
  assert(metadata.width && metadata.height, 'Onleesbaar beeld: ' + src);
}

export async function prepareImages(root = process.cwd(), { check = false } = {}) {
  const mapping = json(root, mapFile);
  const records = json(root, recordFile);
  const old = json(root, 'docs/image-size-audit-20261031/assets.json');
  const approved = new Map(old.map(asset => [asset.src, asset]));
  const originalPaths = new Set(json(root, 'docs/image-size-audit-20261031/inventory.json').map(row => row.path.slice(6)));
  const read = src => {
    assert(src.startsWith('/') && !src.includes('..') && !src.includes('\\'), 'Ongeldig beeldpad: ' + src);
    return readFileSync(join(root, 'public', src));
  };
  let processed = 0, prepared = 0, before = 0, after = 0;
  const sources = imagePaths(join(root, 'public'));
  for (const src of sources) {
    const source = read(src);
    if (src.startsWith(outputDirectory)) {
      assert.equal(src, outputDirectory + sha(source).slice(0, 20) + src.slice(src.lastIndexOf('.')), 'Veranderd compact bestand: ' + src);
      await inspect(source, src);
      continue;
    }
    processed++; before += source.length;
    const sourceSha256 = sha(source), cached = records[src] || approved.get(src);
    if (cached && cached.sourceSha256 === sourceSha256) {
      assert.equal(mapping[src], cached.url === src ? undefined : cached.url, 'Ontbrekende beeldkoppeling: ' + src);
      const output = read(cached.url);
      assert.equal(sha(output), cached.sha256, 'Beschadigd compact beeld: ' + src);
      await inspect(output, cached.url); after += output.length;
      continue;
    }
    assert(!approved.has(src), 'Bestaande goedgekeurde bron gewijzigd; bewaar de vervanging onder een nieuw pad: ' + src);
    assert(!check || !cached, 'Gewijzigde bron moet opnieuw worden voorbereid: ' + src);
    assert(!mapping[src] || records[src], 'Onbekende compacte koppeling: ' + src);
    if (originalPaths.has(src) || /\.(svg|ico)$/i.test(src)) {
      // Large vectors need a deliberate review to retain lettering and layout.
      await inspect(source, src); after += source.length;
      continue;
    }
    const metadata = await sharp(source).metadata();
    assert((metadata.pages || 1) === 1, 'Animatie vraagt afzonderlijke controle: ' + src);
    let output = source;
    if (source.length > 32 * 1024 || Math.max(metadata.width, metadata.height) > limit(src)) {
      assert(!check, 'Nieuw/gewijzigd beeld moet eerst worden verkleind: ' + src + '. Voer npm run images:prepare uit en neem het resultaat mee in de broncontrole.');
      for (const quality of [70, 60, 55]) {
        output = await sharp(source).rotate().resize({ width: limit(src), height: limit(src), fit: 'inside', withoutEnlargement: true }).webp({ quality, effort: 6 }).toBuffer();
        if (output.length <= imageBudget) break;
      }
      await inspect(output, src);
      // Do not trade quality for a larger file when the source already fits.
      if (output.length >= source.length && source.length <= imageBudget) output = source;
    }
    await inspect(output, src);
    const url = output === source ? src : outputDirectory + sha(output).slice(0, 20) + '.webp';
    if (!check) {
      if (url !== src) {
        mkdirSync(join(root, 'public', outputDirectory), { recursive: true });
        writeFileSync(join(root, 'public', url), output);
        mapping[src] = url;
      } else delete mapping[src];
      const size = await sharp(output).metadata();
      records[src] = { sourceSha256, url, sha256: sha(output), bytes: output.length, width: size.width, height: size.height };
      prepared++;
    }
    after += output.length;
  }
  const existing = new Set(sources);
  for (const src of Object.keys(mapping)) assert(existing.has(src), 'Bron ontbreekt: ' + src);
  if (!check) { save(root, mapFile, mapping); save(root, recordFile, records); }
  return { checked: processed, prepared, sourceBytes: before, appBytes: after, maxBytes: imageBudget };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(JSON.stringify(await prepareImages(process.cwd(), { check: process.argv.includes('--check') }))); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
