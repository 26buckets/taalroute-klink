import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync as read} from 'node:fs';
import {contentById} from '../lib/connected-content.ts';
import {chapterCollections} from '../lib/practice-chapters.ts';
import review from '../data/klink-long-content-levels.json' with {type:'json'};
const id='klink-dialogue-32f962399de8f4c3';
void test('Cooking story and every linked dialogue variant share Sara, Ali and the shopping agreement',()=>{
 const d=contentById.get(id),t=contentById.get('klink-text-b31a7d8975c8b492');
 assert.deepEqual(d.blocks.map(b=>b.speaker),['Sara','Ali','Sara','Ali']);
 assert.equal(d.blocks[1].text,'Ja, dat is goed. Ik neem een biet mee.');assert(t.text.includes('Sara zou kool meenemen en Ali een biet.'));
 for(const b of [d.blocks[1],d.blocks[3]])assert.equal(b.voiceId,'Pk1wM1jtot5sJaptlRWQ');
 const clips=JSON.parse(read('docs/cooking-release-20261030/audio.json'));
 for(const c of clips)assert.equal(d.blocks.find(b=>b.id===c.blockId).audio.src,c.src);
 let n=0;for(const a of ['dialogues','dialogue-question','text-question','texts','functional-message'])for(const c of chapterCollections(a))for(const e of c.exercises){if(e.contextId===id){assert.deepEqual(e.sourceBlocks??e.textBlocks,d.blocks);assert.equal((e.sourceBlocks??e.textBlocks).map(b=>b.text).join(' '),d.text);n++;}}
 assert(n>0);
});
void test('Owner decisions are resolved; borderline texts retain A2 and explicit preparation',()=>{
 for(const ref of ['T153','T179']){const r=review.items.find(r=>r.ref===ref),c=contentById.get(r.contentId);assert.equal(r.level,'A2');assert.equal(r.ownerReview,false);assert.equal(c.independentReading,false);assert.equal(c.access,'supported-listening');assert(r.preparation.includes('Bespreek vooraf'));}
 assert(JSON.parse(read('docs/long-content-review-20261030/owner-review.json')).every(x=>x.status==='resolved-by-owner'));
});
