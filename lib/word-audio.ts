import { allPackageWords, type PackageWord } from './package-content.ts';
import { isWithdrawnAudio } from './audio-policy.ts';
import supplementalAudio from '../data/klink-inline-word-audio.json' with { type: 'json' };

type WordAudioBinding = { src?: string; status: 'available' | 'missing' | 'blocked' | 'ambiguous'; reviewOpen?: boolean; localOnly?: boolean };
type SupplementalAudio = { word: string; src: string; voiceId: string; role: string; metadataApproved: boolean; localOnly: boolean; humanReview?: string };

export const wordAudioKey = (text: string) => text.normalize('NFC').toLocaleLowerCase('nl').replaceAll('’', "'");
export function wordAudioParts(text: string) {
  const parts: { text: string; word?: string; start: number }[] = [];
  let at = 0;
  for (const match of text.matchAll(/[\p{L}\p{M}\p{N}]+(?:['’-][\p{L}\p{M}\p{N}]+)*/gu)) {
    if (match.index > at) parts.push({ text: text.slice(at, match.index), start: at });
    parts.push({ text: match[0], word: wordAudioKey(match[0]), start: match.index });
    at = match.index + match[0].length;
  }
  if (at < text.length) parts.push({ text: text.slice(at), start: at });
  return parts;
}
export function createWordAudioIndex(words: Pick<PackageWord, 'word' | 'audio' | 'audioStatus'>[]) {
  const index = new Map<string, WordAudioBinding>();
  for (const word of words) {
    const key = wordAudioKey(word.word);
    if (wordAudioParts(word.word).filter(part => part.word).length !== 1) continue;
    const current = index.get(key);
    const usable = word.audio && word.audioStatus !== 'rejected' && word.audioStatus !== 'missing' && !isWithdrawnAudio(word.audio) && /^\/package-audio\/[a-zA-Z0-9_./-]+\.(wav|mp3|ogg|m4a)$/.test(word.audio) && !word.audio.includes('..') && !/\/(candidates|archive)\//.test(word.audio);
    if (!usable) { if (!current) index.set(key, { status: word.audio ? 'blocked' : 'missing' }); continue; }
    if (current?.status === 'ambiguous') continue;
    if (current?.src && current.src !== word.audio) { index.set(key, { status: 'ambiguous' }); continue; }
    index.set(key, { src: word.audio, status: 'available', reviewOpen: current?.reviewOpen || word.audioStatus !== 'approved' });
  }
  return index;
}
export function addLocalWordAudio(index: Map<string, WordAudioBinding>, recordings: SupplementalAudio[]) {
  for (const clip of recordings) {
    const key = wordAudioKey(clip.word);
    if (index.has(key) || clip.role !== 'target' || clip.humanReview === 'rejected' || !clip.voiceId || !clip.metadataApproved || clip.localOnly !== true) continue;
    const binding = createWordAudioIndex([{ word: clip.word, audio: clip.src, audioStatus: 'review-open' }]).get(key);
    if (binding?.status === 'available') index.set(key, { ...binding, localOnly: true });
  }
  return index;
}
export const isLocalWordAudioHost = (hostname: string) => ['localhost', '127.0.0.1', '[::1]', '::1'].includes(hostname);
// Never infer inflections or derive sentence clips at runtime. Local recordings have no publication approval.
export const wordAudioIndex = createWordAudioIndex(allPackageWords);
addLocalWordAudio(wordAudioIndex, supplementalAudio);
