import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import test from 'node:test';
import {prepareAudioPublication, audioRoute} from './prepare-static-audio-publication.mjs';
import {publishInOrder, waitForDeployment} from './deploy-static-audio.mjs';
import {publicationCounts, assetLevel} from './check-asset-limit.mjs';

await test('free limit applies separately and still blocks either part exceeding its allowance', () => {
  const paths = Array.from({length: 18000}, (_, i) => 'package-audio/' + i).concat(Array.from({length: 5000}, (_, i) => 'page/' + i));
  assert.deepEqual(publicationCounts(paths), {app: 5000, audio: 18000});
  assert.equal(assetLevel(publicationCounts(paths).audio), 'warning');
  paths.push(...Array.from({length: 2001}, (_, i) => 'package-audio/new-' + i));
  assert.equal(assetLevel(publicationCounts(paths).audio), 'error');
  assert.deepEqual(publicationCounts(['package-audio-other/1', 'release.json']), {app: 2, audio: 0});
});

await test('production split preserves app configuration and makes audio asset-only on the exact existing path', () => {
  const root = mkdtempSync(tmpdir() + '/klink-publication-');
  try {
    const source = root + '/build', output = root + '/publish';
    mkdirSync(source + '/client/package-audio', {recursive: true}); mkdirSync(source + '/server');
    const release = {sourceCommit: 'a'.repeat(40), sourceClean: true, branch: 'main'};
    writeFileSync(source + '/client/release.json', JSON.stringify(release));
    writeFileSync(source + '/client/.assetsignore', ''); writeFileSync(source + '/client/package-audio/test.mp3', 'unchanged');
    const config = {name: 'taalroute-klink', main: 'index.js', compatibility_date: '2026-05-15', assets: {directory: '../client', binding: 'ASSETS'}, routes: [{pattern: 'klink.taalroute.nl', custom_domain: true}], d1_databases: [{binding: 'DB', database_id: 'unchanged'}]};
    const save = () => writeFileSync(source + '/server/wrangler.json', JSON.stringify(config)); save();
    const prepared = prepareAudioPublication(source, output);
    assert.deepEqual(prepared.assets, {before: 2, main: 1, audio: 1});
    assert.deepEqual(JSON.parse(readFileSync(output + '/app/server/wrangler.json')), config);
    assert.deepEqual(JSON.parse(readFileSync(output + '/audio/wrangler.json')), {name: 'taalroute-klink-audio', compatibility_date: config.compatibility_date, workers_dev: false, preview_urls: false, routes: [audioRoute], assets: {directory: './client', html_handling: 'none', not_found_handling: 'none'}});
    assert(readFileSync(output + '/audio/client/_headers', 'utf8').includes(release.sourceCommit));
    assert.equal(readFileSync(source + '/client/package-audio/test.mp3', 'utf8'), 'unchanged');
    prepareAudioPublication(source, output);
    assert.throws(() => prepareAudioPublication(source, source));
    config.routes = [{pattern: '*taalroute.nl/*'}]; save(); assert.throws(() => prepareAudioPublication(source, output));
    config.routes = [{pattern: 'klink.taalroute.nl', custom_domain: true}]; config.assets.run_worker_first = true; save(); assert.throws(() => prepareAudioPublication(source, output));
    config.assets.run_worker_first = false; save(); release.sourceClean = false; writeFileSync(source + '/client/release.json', JSON.stringify(release)); assert.throws(() => prepareAudioPublication(source, output));
  } finally { rmSync(root, {recursive: true, force: true}); }
});
await test('failure recovery never removes main audio before verification and restores app before any audio removal', async () => {
  for (const fail of ['', 'audio', 'verifyAudio', 'app', 'verifyApp']) {
    const seen = [], actions = Object.fromEntries(['audio', 'verifyAudio', 'app', 'verifyApp', 'removeNewAudio', 'restoreApp'].map(name => [name, async () => {seen.push(name); if (name === fail) throw Error('injected failure');}]));
    if (fail) await assert.rejects(publishInOrder(actions), /injected/); else await publishInOrder(actions);
    const expected = {audio: ['audio', 'removeNewAudio'], verifyAudio: ['audio', 'verifyAudio', 'removeNewAudio'], app: ['audio', 'verifyAudio', 'app', 'restoreApp'], verifyApp: ['audio', 'verifyAudio', 'app', 'verifyApp', 'restoreApp'], '': ['audio', 'verifyAudio', 'app', 'verifyApp']};
    assert.deepEqual(seen, expected[fail]);
  }
});
await test('edge propagation waits for two consecutive ready probes and never accepts a permanently old route', async () => {
  const probes = [false, true, false, true, true]; let checked = 0;
  await waitForDeployment(async () => probes[checked++], async () => {});
  assert.equal(checked, 5);
  checked = 0;
  await assert.rejects(waitForDeployment(async () => {checked++; return false;}, async () => {}), /bounded readiness/);
  assert.equal(checked, 30);
  await assert.rejects(waitForDeployment(async () => {throw Error('wrong release');}, async () => {}), /wrong release/);
});
