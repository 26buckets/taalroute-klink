import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addWaveBrandTags } from './complete-klink-wav-metadata.mjs';

function fixture() {
  const wav = Buffer.alloc(48);
  wav.write('RIFF'); wav.writeUInt32LE(40, 4); wav.write('WAVEfmt ', 8); wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(44100, 24);
  wav.writeUInt32LE(88200, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
  wav.write('data', 36); wav.writeUInt32LE(4, 40); wav.writeInt16LE(1234, 44); wav.writeInt16LE(-987, 46);
  return wav;
}
void test('WAVE album artist and publisher are appended without changing any existing sound or tags', () => {
  const source = fixture(), original = Buffer.from(source), { output, audioSha256 } = addWaveBrandTags(source);
  assert(source.equals(original)); assert(output.subarray(8, source.length).equals(source.subarray(8)));
  assert.equal(output.readUInt32LE(4) + 8, output.length);
  assert.match(audioSha256, /^[a-f0-9]{64}$/);
  assert(output.includes(Buffer.from('TPE2'))); assert(output.includes(Buffer.from('TPUB')));
  assert.throws(() => addWaveBrandTags(output), /Existing ID3/);
});
void test('Malformed, truncated and non-WAVE files are rejected before mutation', () => {
  assert.throws(() => addWaveBrandTags(Buffer.from('not a wav file')));
  assert.throws(() => addWaveBrandTags(fixture().subarray(0, 47)));
  const damaged = fixture(); damaged.writeUInt32LE(200, 40);
  assert.throws(() => addWaveBrandTags(damaged), /Truncated/);
});
