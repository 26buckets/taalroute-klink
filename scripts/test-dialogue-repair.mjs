import {readBeforeSentenceRevision} from './check-sentence-revision.mjs';
import {verifyContentAmendments,repairBaseline} from './check-content-repair-release.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import source from '../data/klink-connected-content.json' with {type:'json'};
import repairs from '../data/klink-dialogue-repair.json' with {type:'json'};
import {connectedContent} from '../lib/connected-content.ts';
import {repairedDialogue} from '../lib/dialogue-repair.ts';
const hash=b=>createHash('sha256').update(b).digest('hex');
void test('128 complete voice repairs preserve source text, IDs, levels and all other content',()=>{
 assert.equal(repairs.dialogues.length,128);assert.equal(repairs.dialogues.flatMap(d=>d.turns).length,512);
 verifyContentAmendments(readBeforeSentenceRevision);
 assert.equal(hash(execFileSync('git',['show',repairBaseline+':data/klink-connected-content.json'],{maxBuffer:10e6})),hash(execFileSync('git',['show','40625330feb9018798dfd9d30308a31733cf0f3c:data/klink-connected-content.json'],{maxBuffer:10e6})));
 const cast=new Map(repairs.cast.map(c=>[c.personId,c]));
 for(const item of source.items){
  const result=repairedDialogue(item);
  if(item.kind!=='dialogue'){assert.equal(result,item);continue;}
  assert.equal(result.id,item.id);assert.equal(result.sourceLevel,item.sourceLevel);assert.equal(result.text,item.text);assert.equal(result.independentReading,false);
  const edited=repairs.dialogues.find(d=>d.id===item.id);assert(existsSync('public'+edited.image.src));
  assert.equal(new Set(edited.turns.map(t=>t.personId)).size,2);assert.equal(new Set(edited.turns.map(t=>t.voiceId)).size,2);
  for(let i=0;i<4;i++){
   const before=item.blocks[i],after=result.blocks[i],t=edited.turns[i];assert.equal(after.id,before.id);assert.equal(after.text,before.text);assert.deepEqual(after.originalAudio,before.audio);assert.equal(after.speaker,t.speaker);assert.equal(t.voiceId,cast.get(t.personId).voiceId);assert.notEqual(t.voiceId,'h6uBOiAjLKklte8hdYio');assert.equal(hash(readFileSync('public'+after.audio.src)),t.sha256);assert(t.metadataVerified&&t.audioPacketsUnchanged);assert.equal(t.metadata.artist,'Taalroute');
  }
 }
 const pilot=connectedContent.find(d=>d.id==='klink-dialogue-32f962399de8f4c3');assert.deepEqual(pilot.blocks.map(b=>b.speaker),['Sara','Ali','Sara','Ali']);
});
void test('A changed source or a partially edited source fails before wrong audio can be shown',()=>{
 const pilot=structuredClone(source.items.find(d=>d.id==='klink-dialogue-32f962399de8f4c3'));pilot.blocks[0].text+=' changed';assert.throws(()=>repairedDialogue(pilot),/source mismatch/);
 pilot.blocks.pop();assert.throws(()=>repairedDialogue(pilot),/Incomplete/);
});
void test('Women/women, men/men and mixed conversations have distinct recurring cast identities',()=>{
 const cast=new Map(repairs.cast.map(c=>[c.personId,c]));const counts={};
 for(const d of repairs.dialogues){const key=d.people.map(id=>cast.get(id).gender).sort().join('/');counts[key]=(counts[key]||0)+1;}
 assert.deepEqual(counts,{'female/male':77,'female/female':28,'male/male':23});
 const daan=repairs.cast.filter(c=>c.name==='Daan');assert.equal(daan.length,1);assert.equal(daan[0].voiceId,'60CwgZt94Yf7yYIXMDDe');
});
