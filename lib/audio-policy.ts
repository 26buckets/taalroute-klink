import policy from '../data/klink-audio-policy.json' with { type: 'json' };
export const instructionAudioEnabled = policy.instructionAudioEnabled;
export function isWithdrawnAudio(source?: string) {
  if (!source || policy.instructionAudioEnabled) return false;
  const path = new URL(source, 'https://klink.taalroute.nl').pathname;
  return policy.withdrawnPrefixes.some(prefix => path.startsWith(prefix)) || policy.withdrawnFiles.includes(path);
}
