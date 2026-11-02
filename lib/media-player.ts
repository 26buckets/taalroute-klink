import type { AudioOptions } from './package-content';
import { isWithdrawnAudio } from './audio-policy.ts';
import { repairedAudioSource } from './audio-repairs.ts';

let activeAudio: HTMLAudioElement | undefined;
let cancelPlayback: (() => void) | undefined;
let audioUnlocked = false;

export const DEFAULT_AUDIO_RATE = 0.85;
export const SLOW_AUDIO_RATE = 0.65;
const slowAudioKey = 'klink.slow-audio.v1';
let slowAudio: boolean | undefined;
const rateListeners = new Set<() => void>();
const baseRates = new WeakMap<HTMLMediaElement, number>();

export function getSlowAudio() {
  if (typeof window === 'undefined') return false;
  if (slowAudio === undefined) {
    try { slowAudio = sessionStorage.getItem(slowAudioKey) === 'true'; }
    catch { slowAudio = false; }
  }
  return slowAudio;
}

export function subscribeSlowAudio(listener: () => void) {
  rateListeners.add(listener);
  return () => { rateListeners.delete(listener); };
}

export function setSlowAudio(slow: boolean) {
  slowAudio = slow;
  try { if (slow) sessionStorage.setItem(slowAudioKey, 'true'); else sessionStorage.removeItem(slowAudioKey); }
  catch { /* The session preference still works when storage is blocked. */ }
  if (activeAudio) applyDefaultAudioRate(activeAudio, baseRates.get(activeAudio));
  if (typeof document !== 'undefined') {
    document.querySelectorAll('audio').forEach(audio => applyDefaultAudioRate(audio, baseRates.get(audio)));
  }
  rateListeners.forEach(listener => listener());
}

export function applyDefaultAudioRate(audio: HTMLMediaElement | null, rate = DEFAULT_AUDIO_RATE) {
  if (!audio) return;
  baseRates.set(audio, rate);
  const selectedRate = getSlowAudio() ? Math.min(rate, SLOW_AUDIO_RATE) : rate;
  audio.defaultPlaybackRate = selectedRate;
  audio.playbackRate = selectedRate;
  audio.preservesPitch = true;
}

export function stopMedia() {
  cancelPlayback?.();
  activeAudio?.pause();
}

export function unlockMedia() {
  stopMedia();
  if (audioUnlocked) return Promise.resolve();
  const audio = activeAudio ??= new Audio();
  audio.src = '/package-audio/word-listening-20261101/listen-ready.wav';
  return audio.play().then(() => { audioUnlocked = true; });
}

export function playMedia(source: string, options: AudioOptions = {}): Promise<boolean> {
  stopMedia();
  if (isWithdrawnAudio(source)) return Promise.resolve(false);
  source = repairedAudioSource(source);
  if (isWithdrawnAudio(source)) return Promise.resolve(false);
  if (options.signal?.aborted) return Promise.resolve(false);
  // Reuse the element unlocked by the learner's gesture, including on mobile.
  const audio = activeAudio ??= new Audio();
  audio.src = source;
  audio.dataset.klinkSource = options.wordSourceKey ?? source;
  audio.dataset.wordListening = options.wordSourceKey ? 'true' : 'false';
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('klink-audio-source', { detail: audio }));
  applyDefaultAudioRate(audio, options.playbackRate);
  return new Promise((resolve, reject) => {
    let settled = false;
    let frame: number | undefined;
    const progress = () => {
      options.onProgress?.(audio.currentTime);
      if (!settled && options.onProgress) frame = requestAnimationFrame(progress);
    };
    const cleanup = () => {
      clearTimeout(timeout);
      if (frame !== undefined) cancelAnimationFrame(frame);
      audio.removeEventListener('ended', ended);
      audio.removeEventListener('error', failed);
      options.signal?.removeEventListener('abort', cancel);
      if (cancelPlayback === cancel) cancelPlayback = undefined;
    };
    const finish = (played: boolean, error?: Error) => {
      if (settled) return;
      settled = true;
      cleanup();
      if (error) reject(error); else resolve(played);
    };
    const cancel = () => { audio.pause(); finish(false); };
    const ended = () => finish(true);
    const failed = () => { audio.pause(); finish(false, new Error('audio unavailable')); };
    // A stalled recording must leave a usable retry instead of an endless lock.
    const timeout = setTimeout(failed, 60000 / Math.min(audio.playbackRate, SLOW_AUDIO_RATE));
    cancelPlayback = cancel;
    audio.addEventListener('ended', ended);
    audio.addEventListener('error', failed);
    options.signal?.addEventListener('abort', cancel, { once: true });
    audio.play().then(() => {
      if (settled) return;
      audioUnlocked = true;
      options.onStarted?.();
      if (options.onProgress) progress();
      if (!options.waitUntilEnd) finish(true);
    }, error => finish(false, error));
  });
}
