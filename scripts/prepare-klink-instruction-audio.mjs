// Produce a bounded review batch. This never approves or deploys recordings.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';
const keyFile = process.argv[2];
assert(keyFile, 'Pass the existing speech credential file, never the secret itself.');
const key = readFileSync(keyFile, 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, '');
assert(key, 'Speech authentication unavailable.');
const plan = JSON.parse(readFileSync('data/klink-instructions.json'));
assert.notEqual(plan.voiceId, plan.targetVoiceId);
assert.equal(plan.items.length, 17);
const characters = plan.items.reduce((count, item) => count + item.text.length, 0);
assert(characters < 1200, 'Bounded instruction production only.');
const headers = { 'xi-api-key': key, 'Content-Type': 'application/json' };
const get = async path => {
  const response = await fetch(`https://api.elevenlabs.io/v1/${path}`, { headers, signal: AbortSignal.timeout(20000) });
  assert(response.ok, `Speech preflight failed (${response.status})`);
  return response.json();
};
const voice = await get(`voices/${plan.voiceId}`);
assert.equal(voice.voice_id, plan.voiceId);
const subscription = await get('user/subscription');
assert(subscription.character_limit - subscription.character_count >= characters * 4, 'Insufficient included speech credits.');
const out = 'outputs/continuous-flow-20261016/instruction-audio';
mkdirSync(`${out}/originals`, { recursive: true });
const model = 'eleven_multilingual_v2';
const settings = { stability: 0.6, similarity_boost: 0.75, speed: 0.95 };
const manifest = { date: new Date().toISOString(), authorization: 'Nico: instructies en audio afronden voor Klink, 16 oktober 2026', voiceId: plan.voiceId, voiceName: voice.name, targetVoiceId: plan.targetVoiceId, role: 'instruction', model, settings, characters, published: false, humanReview: 'open', items: plan.items.map(({ id, text }) => ({ id, text })) };
if (existsSync(`${out}/production-plan.json`)) {
  const prior = JSON.parse(readFileSync(`${out}/production-plan.json`));
  assert.equal(prior.voiceId, manifest.voiceId); assert.deepEqual(prior.items, manifest.items);
} else writeFileSync(`${out}/production-plan.json`, JSON.stringify(manifest, null, 2));
const sha = value => createHash('sha256').update(value).digest('hex');
for (const item of plan.items) {
  const recordPath = `${out}/${item.id}.json`;
  if (existsSync(recordPath)) {
    const prior = JSON.parse(readFileSync(recordPath));
    assert.equal(prior.status, 'candidate', 'An uncertain earlier request needs inspection, not a paid retry.');
    assert.equal(sha(readFileSync(prior.file)), prior.sha256);
    continue;
  }
  const file = `${out}/${item.id}.wav`, original = `${out}/originals/${item.id}.wav`;
  const record = { id: item.id, text: item.text, role: 'instruction', voiceId: plan.voiceId, status: 'request-started', published: false, humanReview: 'open', file, original };
  writeFileSync(recordPath, JSON.stringify(record, null, 2));
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${plan.voiceId}?output_format=pcm_44100`, { method: 'POST', headers,
    body: JSON.stringify({ text: item.text, model_id: model, language_code: 'nl', voice_settings: settings }), signal: AbortSignal.timeout(60000) });
  assert(response.ok, `Speech request failed (${response.status}); no automatic retry.`);
  const pcm = Buffer.from(await response.arrayBuffer());
  assert(pcm.length % 2 === 0 && pcm.length >= 17640 && pcm.length < 1764000, 'Unexpected audio duration/format.');
  const header = Buffer.alloc(44);
  header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8); header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(44100, 24); header.writeUInt32LE(88200, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  writeFileSync(original, Buffer.concat([header, pcm]));
  execFileSync('ffmpeg', ['-v', 'error', '-n', '-i', original, '-map_metadata', '-1', '-c:a', 'copy', '-metadata', 'artist=Taalroute', '-metadata', 'album_artist=Taalroute', '-metadata', 'album=Klink - Taalroute', '-metadata', `title=${item.text}`, '-metadata', 'copyright=Taalroute', '-metadata', 'encoder=', file]);
  assert.equal(sha(execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 's16le', '-acodec', 'pcm_s16le', 'pipe:1'])), sha(pcm), 'Metadata altered the recording.');
  const tags = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', file])).format.tags;
  assert.equal(tags.artist, 'Taalroute'); assert.equal(tags.album, 'Klink - Taalroute');
  assert(!/suno|elevenlabs|openai|generator/i.test(JSON.stringify(tags)));
  let peak = 0, clipped = 0;
  for (let i = 0; i < pcm.length; i += 2) { const value = Math.abs(pcm.readInt16LE(i)); peak = Math.max(peak, value); if (value >= 32760) clipped++; }
  assert(peak >= 200 && clipped / (pcm.length / 2) < 0.001, 'Audio level check failed.');
  Object.assign(record, { status: 'candidate', duration: pcm.length / 88200, peak, clipped, sha256: sha(readFileSync(file)), originalSha256: sha(readFileSync(original)), pcmSha256: sha(pcm), metadata: tags, requestId: response.headers.get('request-id'), credits: response.headers.get('character-cost') });
  writeFileSync(recordPath, JSON.stringify(record, null, 2));
  console.log(`${item.id}: instruction candidate saved, pronunciation review open`);
}
