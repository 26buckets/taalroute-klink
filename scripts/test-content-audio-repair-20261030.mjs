import {readBeforeSentenceRevision} from './check-sentence-revision.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {connectedContent} from '../lib/connected-content.ts';
import {verifyContentAmendments} from './check-content-repair-release.mjs';
import {allPackageWords} from '../lib/package-content.ts';
const read=p=>JSON.parse(readFileSync(p));
const clips=read('docs/content-audio-repair-20261030/audio.json');
void test('Every repaired recording reaches the current source and has exact metadata and intact packets',()=>{
 assert.equal(clips.length,7);verifyContentAmendments(readBeforeSentenceRevision);
 for(const c of clips){
  const actual=c.wordId?allPackageWords.find(w=>w.id===c.wordId).audio:connectedContent.find(x=>x.id===c.contentId).blocks[(c.turn??1)-1].audio.src;
  assert.equal(actual,c.src);assert.notEqual(c.src,c.originalSrc);
  assert.equal(createHash('sha256').update(readFileSync('public'+c.src)).digest('hex'),c.sha256);
  const tags=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format_tags','-of','json','public'+c.src])).format.tags;
  for(const k of ['artist','album_artist','publisher'])assert.equal(tags[k],'Taalroute');
  assert(tags.album.startsWith('Klink'));assert(!/suno|elevenlabs|openai|generator/i.test(JSON.stringify(tags)));assert(c.audioPacketsUnchanged);
 }
});
void test('The medical response identifies the term and the throat source uses its physical meaning',()=>{
 const medical=connectedContent.find(x=>x.id==='klink-dialogue-579b29dc10de977f');
 assert.equal(medical.blocks[2].text,'Kunt u het woord diagnose in gewone woorden uitleggen?');
 assert.equal(medical.discussion.evidence,medical.blocks[2].text);assert.equal(medical.sourceLevel,'A2');
 const writing=read('data/klink-functional-writing.json').items.find(x=>x.contentId===medical.id);assert.match(writing.example,/woord diagnose/);
 const throat=connectedContent.find(x=>x.id==='klink-sentence-790dabeb9573eae5');assert.equal(throat.text,'Mijn keel doet pijn.');assert.deepEqual(throat.wordIds,['klink-woord-keel']);assert.deepEqual(throat.readingWordIds,['klink-woord-keel','klink-woord-pijn']);assert.deepEqual(throat.reading.outsideWordBank,['mijn','doet']);
 assert.equal(throat.sourceLevel,'A1');assert.equal(throat.independentReading,false);
});
void test('Amendment proof rejects an unapproved change to a linked answer',()=>{
 assert.throws(()=>verifyContentAmendments(file=>{const bytes=readBeforeSentenceRevision(file);if(file!=='data/klink-connected-content.json')return bytes;const value=JSON.parse(bytes);value.items[0].text+=' ongevraagd';return Buffer.from(JSON.stringify(value));}));
});
