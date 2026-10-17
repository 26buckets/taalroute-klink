// Small, resumable candidate batch; never approves or publishes its output.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
import plan from '../data/klink-comprehension-audio.json' with { type: 'json' };
import { addWaveBrandTags } from './complete-klink-wav-metadata.mjs';

assert(process.argv[2], 'Pass the existing speech credential file, not a secret value.');
const key = readFileSync(process.argv[2], 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, '');
assert(key, 'Speech credential unavailable.');
assert.notEqual(plan.instructionVoiceId, plan.targetVoiceId);
assert.equal(plan.items.length, 8);
const characters = plan.items.reduce((n, item) => n + item.text.length, 0);
assert(characters < 500);
const headers = { 'xi-api-key': key, 'Content-Type': 'application/json' };
const get = async path => {
  const response = await fetch(`https://api.elevenlabs.io/v1/${path}`, { headers, signal: AbortSignal.timeout(20000) });
  assert(response.ok, `Speech preflight failed (${response.status})`); return response.json();
};
for (const voice of [plan.instructionVoiceId, plan.targetVoiceId]) assert.equal((await get(`voices/${voice}`)).voice_id, voice);
const subscription = await get('user/subscription');
assert(subscription.character_limit - subscription.character_count >= characters * 4, 'Not enough included speech credits.');
const out = 'outputs/sentence-comprehension-20261017';
mkdirSync(`${out}/audio-originals`, { recursive: true });
const manifest = { ...plan, characters, model: 'eleven_multilingual_v2', settings: { stability: 0.6, similarity_boost: 0.75, speed: 0.95 }, published: false };
if (existsSync(`${out}/audio-plan.json`)) assert.deepEqual(JSON.parse(readFileSync(`${out}/audio-plan.json`)), manifest);
else writeFileSync(`${out}/audio-plan.json`, JSON.stringify(manifest, null, 2));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
for (const item of plan.items) {
  const recordFile = `${out}/${item.id}.json`, file = `public${item.src}`, original = `${out}/audio-originals/${item.id}.wav`;
  if (existsSync(recordFile)) {
    const previous = JSON.parse(readFileSync(recordFile));
    assert.equal(previous.status, 'candidate', 'Inspect an uncertain request before retrying.');
    assert.equal(sha(readFileSync(file)), previous.sha256); continue;
  }
  assert(!existsSync(file), 'Do not replace an existing recording.');
  const voiceId = item.role === 'instruction' ? plan.instructionVoiceId : plan.targetVoiceId;
  const record = { ...item, voiceId, file, original, status: 'request-started', humanReview: 'open', published: false };
  writeFileSync(recordFile, JSON.stringify(record, null, 2));
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=pcm_44100`, {
    method: 'POST', headers, body: JSON.stringify({ text: item.text, model_id: manifest.model, voice_settings: manifest.settings }), signal: AbortSignal.timeout(60000),
  });
  assert(response.ok, `Speech request failed (${response.status}); no automatic retry.`);
  const pcm = Buffer.from(await response.arrayBuffer());
  assert(pcm.length % 2 === 0 && pcm.length >= 17640 && pcm.length < 1764000);
  const header = Buffer.alloc(44);
  header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8); header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(44100, 24); header.writeUInt32LE(88200, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  writeFileSync(original, Buffer.concat([header, pcm])); mkdirSync(dirname(file), { recursive: true });
  execFileSync('ffmpeg', ['-v', 'error', '-n', '-i', original, '-map_metadata', '-1', '-c:a', 'copy', '-metadata', 'artist=Taalroute', '-metadata', 'album=Klink - Taalroute', '-metadata', `title=${item.text}`, '-metadata', 'copyright=Taalroute', '-metadata', 'encoder=', file]);
  writeFileSync(file, addWaveBrandTags(readFileSync(file)).output);
  assert.equal(sha(execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 's16le', '-acodec', 'pcm_s16le', 'pipe:1'])), sha(pcm));
  const tags = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', file])).format.tags;
  for (const key of ['artist', 'album_artist', 'publisher']) assert.equal(tags[key], 'Taalroute');
  assert(!/suno|elevenlabs|openai|generator/i.test(JSON.stringify(tags)));
  let peak = 0, clipped = 0;
  for (let i = 0; i < pcm.length; i += 2) { const value = Math.abs(pcm.readInt16LE(i)); peak = Math.max(peak, value); if (value >= 32760) clipped++; }
  assert(peak >= 200 && clipped / (pcm.length / 2) < 0.001);
  Object.assign(record, { status: 'candidate', duration: pcm.length / 88200, peak, clipped, sha256: sha(readFileSync(file)), originalSha256: sha(readFileSync(original)), pcmSha256: sha(pcm), metadata: tags, requestId: response.headers.get('request-id') });
  writeFileSync(recordFile, JSON.stringify(record, null, 2)); console.log(`${item.id}: candidate saved; human review open`);
}
