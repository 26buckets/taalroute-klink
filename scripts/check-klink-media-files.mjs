import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { klinkContexts } from '../lib/klink-context.ts';
const media = JSON.parse(readFileSync('data/klink-media.json'));
const words = JSON.parse(readFileSync('data/klink-curriculum.json')).words;
const instructions = JSON.parse(readFileSync('data/klink-instructions.json'));
const comprehension = JSON.parse(readFileSync('data/klink-comprehension-audio.json'));
const result = { date: new Date().toISOString(), audio: 0, images: 0, contextAudio: 0, instructionAudio: 0, comprehensionAudio: 0, missingAudio: [], missingImages: [] };
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
    assert.equal(tags.album_artist, 'Taalroute', word.id);
    assert.equal(tags.publisher, 'Taalroute', word.id);
    assert.equal(tags.album, 'Klink - Taalroute', word.id);
    assert(!/suno|openai|elevenlabs|generator|text.to.speech/i.test(JSON.stringify(tags)), `Unwanted delivery metadata ${word.id}`);
    result.audio++;
  } else result.missingAudio.push({ id: word.id, word: word.word });
  if (item.image) result.images++; else result.missingImages.push({ id: word.id, word: word.word });
}
assert.notEqual(media['klink-woord-pak-verpakking'].image, media['klink-woord-pak'].image, 'Packaging must not inherit the garment image');
for (const item of klinkContexts) {
  assert(existsSync(`public${item.audio}`), item.id);
  if (item.image) assert(existsSync(`public${item.image}`), item.id);
  const tags = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', `public${item.audio}`])).format.tags;
  assert.equal(tags.artist, 'Taalroute'); assert.equal(tags.album_artist, 'Taalroute');
  assert.equal(tags.publisher, 'Taalroute');
  assert(['Klink - Taalroute', 'Taalroute Klink'].includes(tags.album));
  assert(!/suno|openai|elevenlabs|generator|text.to.speech/i.test(JSON.stringify(tags)));
  result.contextAudio++;
}
const extraComprehensionAudio = comprehension.items.filter(item => !instructions.items.some(instruction => instruction.src === item.src));
for (const item of [...instructions.items, ...extraComprehensionAudio]) if (item.src) {
  assert(existsSync(`public${item.src}`));
  const tags = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', `public${item.src}`])).format.tags;
  assert.equal(tags.artist, 'Taalroute'); assert.equal(tags.album, 'Klink - Taalroute');
  assert.equal(tags.album_artist, 'Taalroute'); assert.equal(tags.publisher, 'Taalroute');
  assert(!/suno|openai|elevenlabs|generator|text.to.speech/i.test(JSON.stringify(tags)));
  if (instructions.items.includes(item)) result.instructionAudio++; else result.comprehensionAudio++;
}
mkdirSync('outputs/media-connection', { recursive: true });
writeFileSync('outputs/media-connection/media-check.json', JSON.stringify(result, null, 2));
console.log(JSON.stringify({ audio: result.audio, images: result.images, contextAudio: result.contextAudio, instructionAudio: result.instructionAudio, comprehensionAudio: result.comprehensionAudio, missingAudio: result.missingAudio.length, missingImages: result.missingImages.length }));
