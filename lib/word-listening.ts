import recordings from '../data/klink-word-listening.json' with { type: 'json' };
import { normalizeSpokenWord } from './word-listening-text.ts';

export type PackedWordRecording = { src: string; offset: number; length: number };
export type WordRecording = string | PackedWordRecording;
export const wordRecordingKey = (recording: WordRecording) => typeof recording === 'string' ? recording : `${recording.src}#bytes=${recording.offset},${recording.length}`;
const sources = new Map<string, WordRecording[]>(Object.entries(recordings));
// The asset host may return an entire immutable bundle for a Range request.
const bundles = new Map<string, ArrayBuffer>();
let bundleBytes = 0;
const maxBundleBytes = 8 * 1024 * 1024;
export function recordingForWord(word: string, preferredSource?: string) {
  const candidates = sources.get(normalizeSpokenWord(word));
  return candidates?.find(candidate => wordRecordingKey(candidate) === preferredSource) ?? candidates?.[0];
}

export async function fetchWordRecording(recording: PackedWordRecording, signal: AbortSignal) {
  const { src, offset, length } = recording;
  const lesson = /^\/package-audio\/klink10-[a-z-]+-\d{8}\/audio-[a-f0-9]{16}\.bin$/.test(src);
  if ((!lesson && !/^\/package-audio\/word-listening-20261101\/words-[a-f0-9]{16}\.bin$/.test(src)) || !Number.isSafeInteger(offset) || offset < 0 || !Number.isSafeInteger(length) || length < 10 || length > (lesson ? 524288 : 262144)) throw new Error('Invalid word recording');
  signal.throwIfAborted();
  const end = offset + length - 1;
  const cached = bundles.get(src);
  if (cached) {
    bundles.delete(src);
    bundleBytes -= cached.byteLength;
  }
  const response = cached ? undefined : await fetch(src, { headers: { Range: `bytes=${offset}-${end}` }, signal });
  if (response && response.status !== 200 && response.status !== 206) throw new Error('Word recording unavailable');
  if (response?.status === 206) {
    const range = response.headers.get('Content-Range')?.match(/^bytes (\d+)-(\d+)\/(\d+)$/);
    if (!range || Number(range[1]) !== offset || Number(range[2]) !== end || Number(range[3]) <= end) throw new Error('Incorrect audio range');
  }
  const body = cached ?? await response!.arrayBuffer();
  signal.throwIfAborted();
  const complete = Boolean(cached) || response?.status === 200;
  const bytes = complete ? body.slice(offset, end + 1) : body;
  if (bytes.byteLength !== length || body.byteLength > 4 * 1024 * 1024) throw new Error('Incomplete word recording');
  const header = new Uint8Array(bytes, 0, 3);
  if (header[0] !== 73 || header[1] !== 68 || header[2] !== 51) throw new Error('Invalid word audio');
  if (complete) {
    bundleBytes += body.byteLength;
    bundles.set(src, body);
    while (bundleBytes > maxBundleBytes) {
      const oldest = bundles.keys().next().value!;
      bundleBytes -= bundles.get(oldest)!.byteLength;
      bundles.delete(oldest);
    }
  }
  return new Blob([bytes], { type: 'audio/mpeg' });
}
