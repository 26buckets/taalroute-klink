export const AUDIO_BUNDLE_LIMIT = 128 * 1024;
export function audioBundleBucket(source: string) {
  let hash = 2166136261;
  for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
  return (hash >>> 0) % 128;
}
