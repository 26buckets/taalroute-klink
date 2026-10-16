import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { klinkContexts } from '../lib/klink-context.ts';

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function addWaveBrandTags(source) {
  assert.equal(source.toString('ascii', 0, 4), 'RIFF');
  assert.equal(source.toString('ascii', 8, 12), 'WAVE');
  assert.equal(source.readUInt32LE(4) + 8, source.length);
  let offset = 12, audio;
  while (offset + 8 <= source.length) {
    const id = source.toString('ascii', offset, offset + 4), size = source.readUInt32LE(offset + 4);
    assert(offset + 8 + size <= source.length, 'Truncated WAVE chunk');
    assert(!/^id3 $/i.test(id), 'Existing ID3 needs separate inspection; do not append duplicate tags');
    if (id === 'data') { assert(!audio, 'Multiple audio chunks'); audio = source.subarray(offset + 8, offset + 8 + size); }
    offset += 8 + size + size % 2;
  }
  assert.equal(offset, source.length);
  assert(audio?.length, 'No audio data');
  const frames = ['TPE2', 'TPUB'].map(id => {
    const value = Buffer.from('\0Taalroute', 'latin1'), header = Buffer.alloc(10);
    header.write(id); header.writeUInt32BE(value.length, 4);
    return Buffer.concat([header, value]);
  });
  const body = Buffer.concat(frames), header = Buffer.alloc(10);
  header.write('ID3'); header[3] = 3;
  header[6] = (body.length >>> 21) & 127; header[7] = (body.length >>> 14) & 127;
  header[8] = (body.length >>> 7) & 127; header[9] = body.length & 127;
  const tag = Buffer.concat([header, body]), chunk = Buffer.alloc(8);
  chunk.write('id3 '); chunk.writeUInt32LE(tag.length, 4);
  const output = Buffer.concat([source, chunk, tag, Buffer.alloc(tag.length % 2)]);
  output.writeUInt32LE(output.length - 8, 4);
  // Everything except the RIFF length remains byte-identical, including the whole audio stream.
  assert(output.subarray(8, source.length).equals(source.subarray(8)));
  return { output, audioSha256: hash(audio) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const media = JSON.parse(readFileSync('data/klink-media.json'));
  const instructions = JSON.parse(readFileSync('data/klink-instructions.json'));
  const paths = [...new Set([...Object.values(media).map(item => item.audio), ...instructions.items.map(item => item.src), ...klinkContexts.map(item => item.audio)].filter(path => path?.endsWith('.wav')))];
  const folder = 'outputs/media-review-20261016', evidence = [];
  for (const path of paths) {
    assert(/^\/(package-audio|start-tas)\//.test(path) && !path.includes('..'));
    const file = `public${path}`, source = readFileSync(file);
    const probe = () => JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', file])).format.tags;
    const tags = probe();
    if (tags.album_artist === 'Taalroute' && tags.publisher === 'Taalroute') continue;
    const backup = `${folder}/audio-before-metadata${path}`;
    mkdirSync(dirname(backup), { recursive: true });
    if (existsSync(backup)) assert.equal(hash(readFileSync(backup)), hash(source), 'Do not overwrite an earlier backup');
    else copyFileSync(file, backup);
    const { output, audioSha256 } = addWaveBrandTags(source);
    writeFileSync(file, output);
    const after = probe();
    assert.equal(after.artist, 'Taalroute'); assert.equal(after.album_artist, 'Taalroute'); assert.equal(after.publisher, 'Taalroute');
    assert.equal(after.album, 'Klink - Taalroute');
    const decodedHash = input => execFileSync('ffmpeg', ['-v', 'error', '-i', input, '-map', '0:a:0', '-f', 'hash', '-hash', 'sha256', '-'], { encoding: 'utf8' }).trim();
    assert.equal(decodedHash(file), decodedHash(backup), `Audio changed: ${path}`);
    evidence.push({ path, backup: backup.slice(folder.length + 1), beforeSha256: hash(source), afterSha256: hash(output), audioSha256, decodedAudioIdentical: true });
  }
  if (evidence.length) writeFileSync(`${folder}/audio-metadata-evidence.json`, JSON.stringify({ date: '2026-10-16', contentUnchanged: true, files: evidence }, null, 2));
  console.log(JSON.stringify({ wavChecked: paths.length, repaired: evidence.length, audioReencoded: false }));
}
