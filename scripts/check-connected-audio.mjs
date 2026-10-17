import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import bank from '../data/klink-connected-content.json' with { type: 'json' };
const exec = promisify(execFile);
const files = [...new Set(bank.items.flatMap(item => item.blocks.map(block => block.audio.src)))];
const result = []; let next = 0;
await Promise.all(Array.from({ length: 6 }, async () => {
  while (next < files.length) {
    const src = files[next++];
    const { stdout } = await exec('ffprobe', ['-v', 'error', '-show_entries', 'format=duration:format_tags:stream=codec_name', '-of', 'json', `public${src}`]);
    const probe = JSON.parse(stdout), tags = probe.format.tags;
    for (const key of ['artist', 'album_artist', 'publisher']) assert.equal(tags[key], 'Taalroute', `${src} ${key}`);
    assert.equal(tags.album, 'Klink - Taalroute');
    assert(!/suno|openai|elevenlabs|generator|text.to.speech/i.test(JSON.stringify(tags)));
    assert(Number(probe.format.duration) > 0 && Number(probe.format.duration) < 180);
    assert(probe.streams.length === 1 && ['pcm_s16le', 'mp3'].includes(probe.streams[0].codec_name));
    result.push({ src, duration: Number(probe.format.duration), sha256: createHash('sha256').update(readFileSync(`public${src}`)).digest('hex'), metadata: 'passed' });
  }
}));
mkdirSync('outputs/content-connection-20261017', { recursive: true });
writeFileSync('outputs/content-connection-20261017/audio-check.json', JSON.stringify({ checkedAt: new Date().toISOString(), files: result.sort((a, b) => a.src.localeCompare(b.src)) }, null, 2));
console.log(JSON.stringify({ files: result.length, metadata: 'passed', pronunciationApproval: 'not-inferred' }));
