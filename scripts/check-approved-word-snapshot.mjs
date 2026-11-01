import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const bytes=readFileSync('docs/instruction-integration-20261101/live-words.json');
assert.equal(createHash('sha256').update(bytes).digest('hex'),'1640d7e76ffdb93cea399351f914a0a72d2c64e2faa07e997791a82edb68b04d');
const snapshot=JSON.parse(bytes);
assert.equal(snapshot.sourceCommit,'f7fb187b7901b824234d83478313dcafff7d69a4');
assert.equal(snapshot.words.length,5127);
export const approvedWords=new Map(snapshot.words.map(word=>[word.id,word]));
