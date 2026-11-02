import repairs from '../data/klink-word-audio-repairs.json' with { type: 'json' };

export function repairedAudioSource(source: string) {
  return (repairs as Record<string, string>)[source] ?? source;
}
