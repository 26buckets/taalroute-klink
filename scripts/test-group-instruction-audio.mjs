import { readFileSync, writeFileSync, mkdtempSync, unlinkSync, rmdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:18830';
const items = JSON.parse(readFileSync('data/klink-audio-candidates.json')).items;
const checks = [];
for (const item of items) {
  const response = await fetch(base + item.src); assert(response.ok);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256);
  // WAV INFO tags after the audio data require a seekable file for ffprobe.
  const temp = mkdtempSync(join(tmpdir(), 'klink-audio-verify-')), file = join(temp, 'served.wav');
  writeFileSync(file, bytes);
  let probe;
  try { probe = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags:stream=codec_name,sample_rate,channels', '-of', 'json', file])); }
  finally { unlinkSync(file); rmdirSync(temp); }
  for (const tag of ['artist','album_artist','publisher']) assert.equal(probe.format.tags[tag], 'Taalroute');
  assert(!/suno|elevenlabs|openai|generator/i.test(JSON.stringify(probe.format.tags)));
  const pcm = execFileSync('ffmpeg', ['-v','error','-i','pipe:0','-f','s16le','-acodec','pcm_s16le','pipe:1'], { input: bytes });
  const record = JSON.parse(readFileSync(item.recordPath || `outputs/group-instruction-audio-20261017/${item.id}.json`));
  assert.equal(createHash('sha256').update(pcm).digest('hex'), record.pcmSha256);
  checks.push({ id: item.id, bytes: bytes.length, duration: item.duration, servedHashMatches: true, branded: true, recordingUnchanged: true });
}
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  const page = await browser.newPage(); await page.goto(base);
  for (const item of items) {
    const duration = await page.evaluate(async src => { const context = new AudioContext(); try { return (await context.decodeAudioData(await (await fetch(src)).arrayBuffer())).duration; } finally { await context.close(); } }, item.src);
    assert(Math.abs(duration - item.duration) < .01);
  }
} finally { await browser.close(); }
writeFileSync('outputs/group-instruction-audio-20261017/served-verification.json', JSON.stringify({ base, checks, browserDecoding: 'passed', humanListeningReview: 'open', productionPublished: false }, null, 2));
console.log(`${checks.length} served recordings: exact bytes, branded metadata, unchanged PCM and Chrome decoding verified. Human listening remains open.`);
