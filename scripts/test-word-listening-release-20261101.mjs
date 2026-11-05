import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {checkedWordMp3,verifyWordListeningRelease} from './check-word-listening-release-20261101.mjs';

void test('A real released word retains its brand, exact title and original MPEG payload',()=>{
  const registry=JSON.parse(readFileSync('data/klink-word-listening-audio.json'));
  const [word,row]=Object.entries(registry).find(([,row])=>typeof row.source==='object');
  const {src,offset,length}=row.source;
  const bytes=readFileSync('public'+src).subarray(offset,offset+length);
  const proof=JSON.parse(readFileSync('docs/word-listening-20261101/audio-manifest.json')).records.find(row=>row.word===word);
  checkedWordMp3(bytes,word,proof.mpegPayloadSha256);
  assert.throws(()=>checkedWordMp3(bytes,'anderwoord',proof.mpegPayloadSha256));
  const wrongBrand=Buffer.from(bytes);wrongBrand.write('WrongMark',wrongBrand.indexOf('Taalroute'));
  assert.throws(()=>checkedWordMp3(wrongBrand,word,proof.mpegPayloadSha256));
  const changedSound=Buffer.from(bytes);changedSound[changedSound.length-1]^=1;
  assert.throws(()=>checkedWordMp3(changedSound,word,proof.mpegPayloadSha256));
  assert.throws(()=>checkedWordMp3(bytes.subarray(0,bytes.length-1),word,proof.mpegPayloadSha256));
});

void test('The concrete release refuses missing authority and a changed reviewed file',()=>{
  const file='docs/klink-owner-release-word-listening-20261101.json';
  const owner=JSON.parse(readFileSync(file));
  for(const patch of [{approvedBy:'unknown'},{publicationApproved:false},{baselineSourceCommit:'old'}]) {
    assert.throws(()=>verifyWordListeningRelease(path=>path===file?Buffer.from(JSON.stringify({...owner,...patch})):readFileSync(path)));
  }
  const reviewed='components/product/word-listening.tsx';
  assert.throws(()=>verifyWordListeningRelease(path=>path===reviewed?Buffer.concat([readFileSync(path),Buffer.from('\nchanged')]):readFileSync(path)));
});
