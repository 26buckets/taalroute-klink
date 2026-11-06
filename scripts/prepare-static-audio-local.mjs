import assert from 'node:assert/strict';
import {copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {assetPaths, assetLevel, ASSET_LIMIT} from './check-asset-limit.mjs';

export const audioPath = path => path.startsWith('/package-audio/');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

export function prepareStaticAudio(source, output) {
  source = resolve(source); output = resolve(output);
  assert(output !== source && !source.startsWith(output + '/') && !output.startsWith(source + '/'), 'Separate build and preview directories required');
  const config = JSON.parse(readFileSync(source + '/server/wrangler.json'));
  assert.equal(config.assets.directory, '../client');
  assert(!config.assets.run_worker_first, 'Review Worker-first routing before splitting audio');
  const paths = assetPaths(source + '/client');
  const audio = paths.filter(path => audioPath('/' + path)), main = paths.filter(path => !audioPath('/' + path));
  assert(audio.length && main.length, 'Both publications must contain assets');
  assert(audio.length <= ASSET_LIMIT && main.length <= ASSET_LIMIT, 'Free asset limit exceeded');
  for (const path of paths) assert(statSync(source + '/client/' + path).size <= 25 * 1024 * 1024, 'Static asset exceeds 25 MiB: ' + path);
  // Only replace our generated preview, never the normal deployment or source assets.
  if (existsSync(output)) assert(existsSync(output + '/LOCAL-ONLY'), 'Refuse to replace an unrelated directory');
  rmSync(output, {recursive: true, force: true}); mkdirSync(output, {recursive: true});
  writeFileSync(output + '/LOCAL-ONLY', 'Local preview only. Normal deployment remains unchanged.\n');
  cpSync(source + '/server', output + '/app/server', {recursive: true});
  const manifest = [];
  for (const path of paths) {
    const part = audioPath('/' + path) ? 'audio' : 'app';
    const target = output + '/' + part + '/client/' + path;
    mkdirSync(dirname(target), {recursive: true}); copyFileSync(source + '/client/' + path, target);
    const bytes = readFileSync(target), sha256 = hash(bytes);
    assert.equal(sha256, hash(readFileSync(source + '/client/' + path)), path);
    manifest.push({path: '/' + path, part, bytes: bytes.length, sha256});
  }
  for (const part of ['audio', 'app']) {
    for (const name of ['_headers', '_redirects']) if (existsSync(source + '/client/' + name)) copyFileSync(source + '/client/' + name, output + '/' + part + '/client/' + name);
    writeFileSync(output + '/' + part + '/client/.assetsignore', '# Only the original published allowlist is copied.\n');
  }
  const local = {...config, name: 'klink-main-local-only', routes: [], workers_dev: false, preview_urls: false};
  for (const binding of local.d1_databases ?? []) assert(binding.remote !== true, 'No remote database in local preview');
  writeFileSync(output + '/app/server/wrangler.json', JSON.stringify(local, null, 2) + '\n');
  writeFileSync(output + '/audio/wrangler.json', JSON.stringify({name: 'klink-audio-local-only', compatibility_date: config.compatibility_date, workers_dev: false, preview_urls: false,
    assets: {directory: './client', html_handling: 'none', not_found_handling: 'none'}}, null, 2) + '\n');
  const summary = {localOnly: true, sourceRelease: JSON.parse(readFileSync(source + '/client/release.json')), assets: {before: paths.length, main: main.length, audio: audio.length},
    free: {main: ASSET_LIMIT - main.length, audio: ASSET_LIMIT - audio.length}, rule: '/package-audio/*', manifest};
  writeFileSync(output + '/manifest.json', JSON.stringify(summary, null, 2) + '\n');
  for (const [part, count] of [['app', main.length], ['audio', audio.length]]) if (assetLevel(count) === 'warning') console.warn(`WAARSCHUWING: ${part} gebruikt ${count}/${ASSET_LIMIT} bestandsplaatsen.`);
  assert.equal(assetPaths(output + '/app/client').length + assetPaths(output + '/audio/client').length, paths.length);
  return summary;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  assert(process.argv.length <= 3, 'Usage: node scripts/prepare-static-audio-local.mjs [build-directory]');
  const result = prepareStaticAudio(process.argv[2] || 'dist', 'outputs/static-audio-local');
  console.log(JSON.stringify({localOnly: result.localOnly, assets: result.assets, free: result.free}));
}
