import productionInstructions from '../data/klink-production-instructions.json' with { type: 'json' };
import policy from '../data/klink-audio-policy.json' with { type: 'json' };
export const instructionAudioEnabled = policy.instructionAudioEnabled;
export function isWithdrawnAudio(source?: string) {
  if (!source || policy.instructionAudioEnabled) return false;
  const path = new URL(source, 'https://klink.taalroute.nl').pathname;
  return policy.withdrawnPrefixes.some(prefix => path.startsWith(prefix)) || policy.withdrawnFiles.includes(path);
}

const approvedInstructions = new Set(productionInstructions.map(item => item.src));
export function isInstructionAudioEnabled(source?: string) {
  return Boolean(source && (instructionAudioEnabled || approvedInstructions.has(source)));
}
