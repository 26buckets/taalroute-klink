import delivery from '../data/klink-audio-bundle-index.json' with { type: 'json' };
import {audioBundleBucket, AUDIO_BUNDLE_LIMIT} from './audio-bundle-key.ts';
import {isWithdrawnAudio} from './audio-policy.ts';
import {repairedAudioSource} from './audio-repairs.ts';
import {fetchWordRecording, type PackedWordRecording} from './word-listening.ts';

const loaded = new Map<number, Record<string, unknown>>();
const bundledOnly = new Set<string>(delivery.bundledOnly);
export const requiresAudioBundle = (source: string) => bundledOnly.has(repairedAudioSource(source));
export function hasAudioBundleIndex(source: string) {
  return /^\/package-audio\/[a-zA-Z0-9_./-]+\.(mp3|wav)$/.test(source) && !source.includes('..') && !source.endsWith('/listen-ready.wav');
}
export async function audioDeliveryRecording(source: string, signal: AbortSignal): Promise<PackedWordRecording | undefined> {
  signal.throwIfAborted();
  if (isWithdrawnAudio(source)) throw new Error('Withdrawn audio');
  source = repairedAudioSource(source);
  if (isWithdrawnAudio(source)) throw new Error('Withdrawn audio');
  if (!hasAudioBundleIndex(source)) return;
  const bucket = audioBundleBucket(source);
  let index = loaded.get(bucket);
  if (!index) {
    const response = await fetch(`/audio-bundles/v1/${delivery.indexes[bucket]}.json`, {signal});
    if (!response.ok) throw new Error('Audio index unavailable');
    const text = await response.text();
    if (text.length > 128 * 1024) throw new Error('Audio index too large');
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid audio index');
    index = value as Record<string, unknown>;
    signal.throwIfAborted(); loaded.set(bucket, index);
  }
  const row = index[source];
  if (row === undefined) return;
  if (!Array.isArray(row) || row.length !== 3 || !/^[a-f0-9]{64}$/.test(row[0]) || !Number.isSafeInteger(row[1]) || !Number.isSafeInteger(row[2]) || row[1] < 0 || row[2] < 12 || row[1] + row[2] > AUDIO_BUNDLE_LIMIT) throw new Error('Invalid audio bundle entry');
  return {src: `/audio-bundles/v1/${row[0]}.bin`, offset: row[1], length: row[2]};
}
export async function audioDeliveryBlob(source: string, signal: AbortSignal) {
  if (isWithdrawnAudio(source)) throw new Error('Withdrawn audio');
  const packed = source.match(/^(.+)#bytes=(\d+),(\d+)$/);
  if (packed) return fetchWordRecording({src: packed[1], offset: Number(packed[2]), length: Number(packed[3])}, signal);
  // Retained public files can stream immediately, without an index or bundle download.
  if (!requiresAudioBundle(source)) return;
  const recording = await audioDeliveryRecording(source, signal);
  return recording ? fetchWordRecording(recording, signal) : undefined;
}
