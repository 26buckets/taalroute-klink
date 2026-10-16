// Bounded production of seven missing word candidates, never public delivery.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const keyFile = process.argv[2];
if (!keyFile) throw Error('Pass the existing speech-service credential file; never the secret itself.');
const key = readFileSync(keyFile, 'utf8').match(/^ELEVENLABS_API_KEY=(.+)$/m)?.[1].trim().replace(/^["']|["']$/g, '');
if (!key) throw Error('Speech-service authentication unavailable.');
const words = JSON.parse(readFileSync('data/klink-curriculum.json')).words;
const media = JSON.parse(readFileSync('data/klink-media.json'));
const missing = words.filter(word => !media[word.id]?.audio);
assert.deepEqual(missing.map(word => word.word).sort(), ['fit', 'koekje', 'pak', 'sap', 'spuit', 'tomaat', 'zeef']);
const out = 'outputs/media-completion-20261016/word-audio';
mkdirSync(`${out}/originals`, { recursive: true });
const voice = '0qLmDzgqulxcvv0yf3kg';
const model = 'eleven_v4';
const settings = { stability: 0.5, similarity_boost: 0.75, speed: 0.9 };
const characters = missing.reduce((n, word) => n + word.word.length, 0);
assert(characters < 100, 'Bounded production only');
const headers = { 'xi-api-key': key, 'Content-Type': 'application/json' };
const subscriptionResponse = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers, signal: AbortSignal.timeout(20000) });
assert(subscriptionResponse.ok, 'Cannot verify available speech credits');
const subscription = await subscriptionResponse.json();
assert(subscription.character_limit - subscription.character_count >= characters * 4, 'Insufficient included credits');
const manifest = { date: new Date().toISOString(), authorization: 'Nico: ontbrekende media afronden, 16 oktober 2026', role: 'word_model', voiceId: voice, voiceName: 'Remko - Clear Dutch Narrator', model, settings, characterLimit: 100, characters, published: false, humanReview: 'open', words: missing.map(word => ({ id: word.id, text: word.word, meaning: word.meaning })) };
const manifestFile = `${out}/production-plan.json`;
if (existsSync(manifestFile)) {
  const prior = JSON.parse(readFileSync(manifestFile));
  assert.equal(prior.voiceId, voice);
  assert.deepEqual(prior.words, manifest.words);
} else writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
for (const word of missing) {
  const recordPath = `${out}/${word.id}.json`;
  if (existsSync(recordPath)) {
    const prior = JSON.parse(readFileSync(recordPath));
    assert.equal(prior.status, 'candidate', 'An uncertain prior request requires inspection, not a paid retry.');
    assert.equal(sha(readFileSync(prior.file)), prior.sha256);
    continue;
  }
  const file = `${out}/${word.id}.wav`;
  const original = `${out}/originals/${word.id}.wav`;
  const record = { id: word.id, text: word.word, meaning: word.meaning, voiceId: voice, role: 'word_model', status: 'request-started', humanReview: 'open', published: false, file, original };
  writeFileSync(recordPath, JSON.stringify(record, null, 2));
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice}?output_format=pcm_44100`, {
    method: 'POST', headers, body: JSON.stringify({ text: word.word, model_id: model, language_code: 'nl', voice_settings: settings }), signal: AbortSignal.timeout(60000),
  });
  assert(response.ok, `Speech request failed (${response.status}); no automatic retry`);
  const pcm = Buffer.from(await response.arrayBuffer());
  assert(pcm.length % 2 === 0 && pcm.length >= 17640 && pcm.length <= 705600, 'Invalid or unusually long word recording');
  const header = Buffer.alloc(44);
  header.write('RIFF'); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8); header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22); header.writeUInt32LE(44100, 24); header.writeUInt32LE(88200, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  writeFileSync(original, Buffer.concat([header, pcm]));
  execFileSync('ffmpeg', ['-v', 'error', '-n', '-i', original, '-map_metadata', '-1', '-c:a', 'copy', '-metadata', 'artist=Taalroute', '-metadata', 'album_artist=Taalroute', '-metadata', 'album=Klink - Taalroute', '-metadata', `title=${word.word}`, '-metadata', 'copyright=Taalroute', '-metadata', 'encoder=', file]);
  const delivered = execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 's16le', '-acodec', 'pcm_s16le', 'pipe:1']);
  assert.equal(sha(delivered), sha(pcm), 'Metadata changes altered the audio');
  const tags = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', file])).format.tags;
  assert.equal(tags.artist, 'Taalroute'); assert.equal(tags.album, 'Klink - Taalroute');
  assert(!/suno|elevenlabs|openai|generator/i.test(JSON.stringify(tags)));
  let peak = 0, clipped = 0, energy = 0;
  for (let i = 0; i < pcm.length; i += 2) { const value = Math.abs(pcm.readInt16LE(i)); peak = Math.max(peak, value); energy += value * value; if (value >= 32760) clipped++; }
  assert(peak >= 200 && clipped / (pcm.length / 2) <= 0.001, 'Audio level check failed');
  Object.assign(record, { status: 'candidate', sha256: sha(readFileSync(file)), pcmSha256: sha(pcm), originalSha256: sha(readFileSync(original)), metadata: tags, duration: pcm.length / 88200, peak, rms: Math.sqrt(energy / (pcm.length / 2)), clippedSamples: clipped, requestId: response.headers.get('request-id'), credits: response.headers.get('character-cost') });
  writeFileSync(recordPath, JSON.stringify(record, null, 2));
  console.log(`${word.word}: candidate saved; pronunciation review open`);
}
