import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
const media = JSON.parse(readFileSync('data/klink-media.json'));
const words = JSON.parse(readFileSync('data/klink-curriculum.json')).words;
const result = { date: new Date().toISOString(), audio: 0, images: 0, missingAudio: [], missingImages: [] };
for (const word of words) {
  const item = media[word.id];
  assert(item, `Missing media record ${word.id}`);
  for (const kind of ['audio', 'image']) if (item[kind]) {
    assert(/^\/(package-audio|package-media|start-tas)\//.test(item[kind]), `Nonlocal asset ${word.id}`);
    assert(existsSync(`public${item[kind]}`), `Missing file ${word.id}`);
  }
  if (item.audio) {
    const tags = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', `public${item.audio}`])).format.tags;
    assert.equal(tags.artist, 'Taalroute', word.id);
    assert.equal(tags.album, 'Klink - Taalroute', word.id);
    assert(!/suno|openai|elevenlabs|generator|text.to.speech/i.test(JSON.stringify(tags)), `Unwanted delivery metadata ${word.id}`);
    result.audio++;
  } else result.missingAudio.push({ id: word.id, word: word.word });
  if (item.image) result.images++; else result.missingImages.push({ id: word.id, word: word.word });
}
assert(!media['klink-woord-pak-verpakking'].image, 'Packaging must not inherit the garment image');
mkdirSync('outputs/media-connection', { recursive: true });
writeFileSync('outputs/media-connection/media-check.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ audio: result.audio, images: result.images, missingAudio: result.missingAudio.length, missingImages: result.missingImages.length }));
