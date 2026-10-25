import { verifyDialogueRelease, readBeforeDialogueRelease } from './check-dialogue-release.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {verifySoundAudioRelease} from './check-sound-audio-release.mjs';
const manifest=JSON.parse(readFileSync('docs/klink-klanken-release-20261025/audio-manifest.json'));
const approved={a:'f706527d4e02fe284c0f56672605963b394ad81ae3b7c8aa5e105537be25520a',e:'ab2424d20ff6ec3b397324795d77400f72eaa805c59c2dfcf63e01b3c7c32baf',i:'70694198792822ecb0f58d50c7b04a67469cf5d229707ecdac5d802545564cd6',aa:'3d18837d43089da92815b065227ab639fbe973a5db3960e729a3c8040a0119bb',ee:'89073188e87b1dff8dc35e7e105c86ae0f19f7b17ba74acdd29028dc16e8c2dc',ie:'6a52df09738e0d1a8db1a712765d4accf1b6745a51ed8a8184ee1b030afd986c',s:'a778704594994af717af499d641d814724642cf66ce1ee2d3f2c1b232b6c3bed',m:'985703b9edfae43638a8144a29ec082b07cd9cf3b2dff9b92a323ff96f3eaf44'};
test('All 46 delivered files carry brand metadata; the eight owner-approved sounds remain exact',()=>{
 assert.equal(manifest.files.length,46);assert.equal(manifest.humanReviewNewRecordings,false);
 for(const row of manifest.files){
  assert.equal(createHash('sha256').update(readFileSync(row.path)).digest('hex'),row.sha256);
  if(row.ownerApproved)assert.equal(row.sha256,approved[row.id]);
  else assert.equal(row.humanReviewed,false);
  const tags=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-of','json',row.path])).format.tags;
  for(const field of ['artist','album_artist','publisher'])assert.equal(tags[field],'Taalroute');
  assert(!/eleven|suno|openai|generator/i.test(JSON.stringify(tags)));
 }
 const a=manifest.files.find(row=>row.id==='a');assert(a.activeSpan<.4 && a.duration<.7);
});
test('The bounded release cannot drop prior approval, scope, backup or the open human review status',()=>{
 const release=JSON.parse(readFileSync('docs/klink-owner-release-klankaudio-20261025.json'));
 const dialogue=verifyDialogueRelease();
 const verify=r=>verifySoundAudioRelease(r,file=>readBeforeDialogueRelease(file,dialogue),dialogue.baselineSourceCommit);
 verify(release);
 for(const mutate of [r=>r.publicationApproved=false,r=>r.newAudio=8,r=>r.ownerApprovedAudio=46,r=>r.humanReviewNewRecordings=true,r=>r.baselineSourceCommit='0'.repeat(40),r=>delete r.files['components/product/sound-reference.tsx'],r=>delete r.files['docs/klink-klanken-release-20261025/source-drive-verification.json'],r=>r.previousAuthorization='unrelated.json']){
  const changed=structuredClone(release);mutate(changed);assert.throws(()=>verify(changed));
 }
});
