import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {audioBundleBucket} from '../lib/audio-bundle-key.ts';
import delivery from '../data/klink-audio-bundle-index.json' with {type: 'json'};

const entries = JSON.parse(readFileSync('outputs/audio-bundles/manifest.json')).entries;
const sources = [...new Map(entries.map(row => [audioBundleBucket(row.source), row.source])).values()];
assert.deepEqual(delivery.bundledOnly, [], 'All current original files remain public');
// Exercise future bundle-only delivery without modifying any source file or public content.
delivery.bundledOnly.push(...sources.slice(0, 8));
const {audioDeliveryBlob, audioDeliveryRecording, hasAudioBundleIndex, requiresAudioBundle} = await import('../lib/audio-delivery.ts');
const {playMedia, stopMedia, setSlowAudio} = await import('../lib/media-player.ts');
const localFetch = async path => new Response(readFileSync('public' + path));
await test('Lazy audio index, strict entries, exact bytes, cancellation, retry and no public URL changes', async () => {
  const previous = globalThis.fetch;
  try {
    let requests = 0;
    globalThis.fetch = (...args) => { requests++; return localFetch(...args); };
    for (const source of sources.slice(0, 3)) {
      const blob = await audioDeliveryBlob(source, new AbortController().signal);
      assert(Buffer.from(await blob.arrayBuffer()).equals(readFileSync('public' + source)));
    }
    const before = requests;
    await audioDeliveryBlob(sources[0], new AbortController().signal);
    assert.equal(requests, before, 'successful indexes and bundles are reused');
    for (const source of ['/outside.mp3', '//other.example/a.mp3', '/package-audio/../private.mp3', '/package-audio/a.mp3?url=bad', '/package-audio/word-listening-20261101/listen-ready.wav']) assert(!hasAudioBundleIndex(source));
    await assert.rejects(audioDeliveryRecording('/package-audio/instructions/KLINK-INS-test.mp3', new AbortController().signal), /Withdrawn/);
    const aborted = new AbortController(); aborted.abort();
    await assert.rejects(audioDeliveryRecording(sources[3], aborted.signal), {name: 'AbortError'});
    globalThis.fetch = async () => new Response('{}', {status: 503});
    await assert.rejects(audioDeliveryRecording(sources[3], new AbortController().signal), /unavailable/);
    globalThis.fetch = localFetch;
    assert(await audioDeliveryRecording(sources[3], new AbortController().signal), 'failed fetch does not poison the index');
    globalThis.fetch = async () => new Response(JSON.stringify({[sources[4]]: ['../../private', -1, 999999]}));
    await assert.rejects(audioDeliveryRecording(sources[4], new AbortController().signal), /Invalid/);
  } finally { globalThis.fetch = previous; }
});
await test('Both players stream retained URLs directly, use exact bundle-only bytes, preserve speed and abort superseded requests', async () => {
  const old = {Audio: globalThis.Audio, fetch: globalThis.fetch, create: URL.createObjectURL.bind(URL), revoke: URL.revokeObjectURL.bind(URL), window: globalThis.window, document: globalThis.document};
  globalThis.window = {dispatchEvent() {}};
  Object.defineProperty(globalThis, 'document', {configurable: true, writable: true, value: {querySelectorAll: () => []}});
  let audio, serial = 0; const blobs = [], revoked = [];
  globalThis.Audio = class extends EventTarget {dataset = {}; constructor() {super(); audio = this;} play() {this.paused = false; return Promise.resolve();} pause() {this.paused = true;} };
  URL.createObjectURL = blob => {blobs.push(blob); return 'blob:test-' + (++serial);};
  URL.revokeObjectURL = url => revoked.push(url);
  try {
    globalThis.fetch = localFetch;
    setSlowAudio(true);
    assert(!requiresAudioBundle(sources[8]));
    let directRequests = 0;
    globalThis.fetch = () => { directRequests++; throw Error('Direct playback must not fetch an index'); };
    assert.equal(await audioDeliveryBlob(sources[8], new AbortController().signal), undefined);
    assert.equal(await playMedia(sources[8]), true); assert.equal(audio.src, sources[8]);
    assert.equal(directRequests, 0);
    globalThis.fetch = localFetch;
    assert.equal(await playMedia(sources[5]), true);
    assert.equal(audio.dataset.klinkSource, sources[5]); assert.equal(audio.playbackRate, .65);
    assert(Buffer.from(await blobs.at(-1).arrayBuffer()).equals(readFileSync('public' + sources[5])));
    stopMedia(); assert(revoked.length > 0);
    let requestSignal;
    globalThis.fetch = (_url, {signal}) => new Promise((_, reject) => { requestSignal = signal; signal.addEventListener('abort', () => reject(signal.reason)); });
    const pending = playMedia(sources[6]);
    await new Promise(resolve => setImmediate(resolve));
    await playMedia('/next.mp3');
    assert(requestSignal.aborted); assert.equal(await pending, false); assert.equal(audio.src, '/next.mp3');
    globalThis.fetch = async () => new Response('', {status: 503});
    await assert.rejects(playMedia(sources[7]), /unavailable/);
    assert.equal(await playMedia('/package-audio/instructions/KLINK-INS-test.mp3'), false);
  } finally { stopMedia(); setSlowAudio(false); globalThis.Audio = old.Audio; globalThis.fetch = old.fetch; URL.createObjectURL = old.create; URL.revokeObjectURL = old.revoke; globalThis.window = old.window; globalThis.document = old.document; }
});
