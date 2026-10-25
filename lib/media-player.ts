import type { AudioOptions } from './package-content';
import { isWithdrawnAudio } from './audio-policy.ts';

let activeAudio: HTMLAudioElement | undefined;
let cancelPlayback: (() => void) | undefined;

export const DEFAULT_AUDIO_RATE = 0.85;

export function applyDefaultAudioRate(audio: HTMLMediaElement | null, rate = DEFAULT_AUDIO_RATE) {
  if (!audio) return;
  audio.defaultPlaybackRate = rate;
  audio.playbackRate = rate;
  audio.preservesPitch = true;
}

export function stopMedia() {
  cancelPlayback?.();
  activeAudio?.pause();
}

export function playMedia(source: string, options: AudioOptions = {}): Promise<boolean> {
  stopMedia();
  if (isWithdrawnAudio(source)) return Promise.resolve(false);
  if (options.signal?.aborted) return Promise.resolve(false);
  // Reuse the element unlocked by the learner's gesture, including on mobile.
  const audio = activeAudio ??= new Audio();
  audio.src = source;
  applyDefaultAudioRate(audio, options.playbackRate);
  return new Promise((resolve, reject) => {
    let settled = false;
    const cleanup = () => {
      clearTimeout(timeout);
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
    const timeout = setTimeout(failed, 60000 / DEFAULT_AUDIO_RATE);
    cancelPlayback = cancel;
    audio.addEventListener('ended', ended);
    audio.addEventListener('error', failed);
    options.signal?.addEventListener('abort', cancel, { once: true });
    audio.play().then(() => {
      if (settled) return;
      options.onStarted?.();
      if (!options.waitUntilEnd) finish(true);
    }, error => finish(false, error));
  });
}
