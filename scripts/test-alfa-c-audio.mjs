import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import audio from '../data/klink-alfa-c-audio.json' with {type:'json'};
import texts from '../data/klink-alfa-c-texts.json' with {type:'json'};
import {pilotBlocks,alfaCGuideAudio} from '../lib/alfa-c-practice.ts';
import {isWithdrawnAudio,instructionAudioEnabled} from '../lib/audio-policy.ts';
const sha=b=>createHash('sha256').update(b).digest('hex');
test('All revised Alfa C guidance has a separate voice and exact branded recordings; existing targets are unchanged',()=>{
 assert.equal(audio.voiceId,'h6uBOiAjLKklte8hdYio');assert.notEqual(audio.voiceId,audio.targetVoiceId);assert.equal(instructionAudioEnabled,false);
 assert.equal(sha(fs.readFileSync('data/klink-alfa-c-texts.json')),audio.textSourceSha256);
 assert.equal(Object.keys(audio.clips).length,36);
 for(const b of Object.values(texts.blocks)){assert(alfaCGuideAudio(b.start));assert(alfaCGuideAudio(b.end));}
 for(const c of Object.values(texts.common))assert(alfaCGuideAudio(c.text));
 for(const b of Object.values(texts.blocks))for(const s of b.steps)for(const [field,text] of Object.entries(s))if(field!=='screen'&&text)assert(alfaCGuideAudio(text),text);
 for(const c of Object.values(audio.clips)){
  assert.equal(c.voiceId,audio.voiceId);assert.equal(alfaCGuideAudio(c.text),c.src);assert(!isWithdrawnAudio(c.src));assert.equal(sha(fs.readFileSync('public'+c.src)),c.sha256);
  const tags=JSON.parse(execFileSync('/opt/homebrew/bin/ffprobe',['-v','error','-show_format','-of','json','public'+c.src])).format.tags;
  for(const k of ['artist','album_artist','publisher'])assert.equal(tags[k],'Taalroute');assert.equal(tags.album,'Klink - Alfa C - Uitleg en hulp');assert.equal(tags.title,c.text);assert(!/elevenlabs|suno|openai|generator/i.test(JSON.stringify(tags)));
 }
 const media=JSON.parse(fs.readFileSync('docs/klink-alfa-c-release-20261026/media.json')).media;
 for(const m of media)assert.equal(sha(fs.readFileSync('public'+m.src)),m.sha256,'Existing media '+m.src);
 for(const b of pilotBlocks)for(const s of b.steps)assert.equal(s.instructionAudio,alfaCGuideAudio(s.spokenInstruction));
 assert(isWithdrawnAudio('/package-audio/instructions/kijken.wav'));
});
