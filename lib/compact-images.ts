import images from '../data/klink-compact-images-20261031.json' with { type: 'json' };

export function compactImageSrc(src: string): string {
  return (images as Record<string, string>)[src] ?? src;
}
