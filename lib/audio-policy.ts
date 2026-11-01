import productionInstructions from '../data/klink-production-instructions.json' with { type: 'json' };
import wordUseAudio from '../data/klink-word-use-audio.json' with { type: 'json' };
import policy from '../data/klink-audio-policy.json' with { type: 'json' };
export const instructionAudioEnabled = policy.instructionAudioEnabled;
export function isWithdrawnAudio(source?: string) {
  if (!source || policy.instructionAudioEnabled) return false;
  const path = new URL(source, 'https://klink.taalroute.nl').pathname;
  return policy.withdrawnPrefixes.some(prefix => path.startsWith(prefix)) || policy.withdrawnFiles.includes(path);
}

const approvedInstructions = new Set([...productionInstructions.map(item => item.src), ...Object.values(wordUseAudio as Record<string, { src: string; role: string; review: string; metadataApproved: boolean }>).filter(item => item.role === 'instruction' && item.review === 'approved' && item.metadataApproved).map(item => item.src)]);
export function isInstructionAudioEnabled(source?: string) {
  return Boolean(source && (instructionAudioEnabled || approvedInstructions.has(source)));
}
