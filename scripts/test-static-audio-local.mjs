import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import test from 'node:test';
import {prepareStaticAudio, audioPath} from './prepare-static-audio-local.mjs';

await test('splitting preserves published paths and bytes, headers and the source; excluded files stay excluded', () => {
  const root = mkdtempSync(join(tmpdir(), 'klink-audio-test-'));
  try {
    const source = root + '/source', output = root + '/preview';
    mkdirSync(source + '/client/package-audio', {recursive: true}); mkdirSync(source + '/server');
    const files = {'release.json': '{"sourceCommit":"test"}', 'package-audio/clip.mp3': 'original audio bytes', 'package-audio/packed.bin': 'original packed bytes', 'package-audio/withdrawn.mp3': 'must remain excluded', '_headers': '/*\n  X-Test: preserved\n', '.assetsignore': '/package-audio/withdrawn.mp3\n'};
    for (const [name, value] of Object.entries(files)) writeFileSync(source + '/client/' + name, value);
    writeFileSync(source + '/server/index.js', 'unchanged server');
    const config = {name: 'original', main: 'index.js', compatibility_date: '2026-05-15', assets: {directory: '../client', binding: 'ASSETS'}, routes: [{pattern: 'klink.taalroute.nl', custom_domain: true}]};
    writeFileSync(source + '/server/wrangler.json', JSON.stringify(config));
    const result = prepareStaticAudio(source, output);
    assert.deepEqual(result.assets, {before: 3, main: 1, audio: 2});
    for (const [name, value] of Object.entries(files)) assert.equal(readFileSync(source + '/client/' + name, 'utf8'), value);
    assert.equal(readFileSync(output + '/audio/client/package-audio/clip.mp3', 'utf8'), files['package-audio/clip.mp3']);
    assert(!existsSync(output + '/app/client/package-audio/clip.mp3'));
    assert(!existsSync(output + '/audio/client/package-audio/withdrawn.mp3'));
    assert.equal(readFileSync(output + '/audio/client/_headers', 'utf8'), files._headers);
    assert.equal(readFileSync(output + '/app/server/index.js', 'utf8'), 'unchanged server');
    assert.deepEqual(JSON.parse(readFileSync(source + '/server/wrangler.json')), config);
    const audio = JSON.parse(readFileSync(output + '/audio/wrangler.json'));
    assert(!audio.main && !audio.routes && !audio.services && !audio.r2_buckets && !audio.d1_databases && !audio.assets.run_worker_first);
    assert.equal(audio.assets.not_found_handling, 'none');
    assert.throws(() => prepareStaticAudio(source, source), /Separate/);
    mkdirSync(root + '/unrelated'); assert.throws(() => prepareStaticAudio(source, root + '/unrelated'), /unrelated/);
    writeFileSync(source + '/client/package-audio/oversized.mp3', Buffer.alloc(25 * 1024 * 1024 + 1));
    assert.throws(() => prepareStaticAudio(source, output), /25 MiB/);
    rmSync(source + '/client/package-audio/oversized.mp3');
    config.assets.run_worker_first = true; writeFileSync(source + '/server/wrangler.json', JSON.stringify(config));
    assert.throws(() => prepareStaticAudio(source, output), /Worker-first/);
  } finally { rmSync(root, {recursive: true, force: true}); }
});
await test('only the exact audio directory changes local backend', () => {
  for (const path of ['/package-audio/a.mp3', '/package-audio/a/b.bin']) assert(audioPath(path));
  for (const path of ['/api/grammar-aa-assets/a.mp3', '/audio/a.m4a', '/package-audio-other/a.mp3', '/package-audio', '/release.json']) assert(!audioPath(path));
});
