import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { groupInstructionNeeds } from '../lib/group-practice.ts';
import { extendedInstructionNeeds } from '../lib/extended-practice.ts';
const extended = process.argv.includes('--extended');
const items = (extended ? extendedInstructionNeeds : groupInstructionNeeds).map(need => {
  const recordPath = `outputs/${extended ? 'extended' : 'group'}-instruction-audio-20261017/${need.id}.json`;
  const record = JSON.parse(readFileSync(recordPath));
  assert.equal(record.text, need.text); assert.equal(record.voiceId, 'h6uBOiAjLKklte8hdYio');
  assert.equal(record.status, 'candidate');
  assert.equal(createHash('sha256').update(readFileSync(record.file)).digest('hex'), record.sha256);
  const tags = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format_tags', '-of', 'json', record.file])).format.tags;
  for (const key of ['artist', 'album_artist', 'publisher']) assert.equal(tags[key], 'Taalroute');
  return { id: record.id, text: record.text, src: record.src, voiceId: record.voiceId, role: 'instruction',
    duration: record.duration, sha256: record.sha256, metadataApproved: true, humanReview: 'open', recordPath };
});
const previous = existsSync('data/klink-audio-candidates.json') ? JSON.parse(readFileSync('data/klink-audio-candidates.json')).items : [];
for (const item of items) {
  const prior = previous.find(entry => entry.id === item.id);
  if (prior) { assert.equal(prior.sha256, item.sha256); assert.equal(prior.text, item.text); assert.equal(prior.humanReview, 'open', 'Do not overwrite a review decision.'); }
}
writeFileSync('data/klink-audio-candidates.json', JSON.stringify({ items: [...previous.filter(prior => !items.some(item => item.id === prior.id)), ...items] }, null, 2) + '\n');
console.log(`${items.length} verified candidates, no approval inferred.`);
