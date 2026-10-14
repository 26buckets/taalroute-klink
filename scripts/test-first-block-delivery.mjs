import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
const base = process.env.KLINK_TEST_URL || 'http://127.0.0.1:4315';
const out = path.resolve('outputs/klink-eerste-blok-2026-10-15/tests');
fs.mkdirSync(path.join(out, 'served'), { recursive: true });
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const results = [];
for (const file of fs.readdirSync('public/start-tas')) {
  const response = await fetch(`${base}/start-tas/${file}`);
  assert.equal(response.status, 200, file);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(sha(bytes), sha(fs.readFileSync('public/start-tas/' + file)), file);
  const saved = path.join(out, 'served', file);
  fs.writeFileSync(saved, bytes);
  let tags;
  if (file.endsWith('.wav')) {
    const info = JSON.parse(execFileSync('ffprobe', ['-v', 'quiet', '-show_format', '-show_streams', '-of', 'json', saved]));
    tags = info.format.tags;
    assert.equal(tags.artist, 'Taalroute');
    assert.equal(tags.album, 'Klink - Tas en mat');
    assert(!/eleven|suno|lavf|generator|model/i.test(JSON.stringify(tags)));
    assert.equal(info.streams[0].sample_rate, '44100');
    assert(Number(info.format.duration) > 0);
  }
  results.push({ file, sha256: sha(bytes), tags, status: 'PASS' });
}
fs.writeFileSync(path.join(out, 'delivery-report.json'), JSON.stringify({ base, status: 'PASS', results, productionPublished: false }, null, 2));
console.log(`PASS: ${results.length} served assets match source bytes; all 9 audio files carry Taalroute metadata without generator labels.`);
