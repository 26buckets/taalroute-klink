import images from '../data/klink-image-word-listening.json' with { type: 'json' };

export function imageListeningWords(source: string) {
  return (images as Record<string, { words: { text: string; box: number[] }[] }>)[source]?.words ?? [];
}

export function imageWordRectangle(rect: { left: number; top: number; width: number; height: number }, naturalWidth: number, naturalHeight: number, fit: string, box: number[]) {
  let { left, top, width, height } = rect;
  if (naturalWidth && naturalHeight && (fit === 'contain' || fit === 'cover')) {
    const scale = Math[fit === 'contain' ? 'min' : 'max'](width / naturalWidth, height / naturalHeight);
    const drawnWidth = naturalWidth * scale, drawnHeight = naturalHeight * scale;
    left += (width - drawnWidth) / 2; top += (height - drawnHeight) / 2;
    width = drawnWidth; height = drawnHeight;
  }
  return { left: left + box[0] * width, right: left + box[2] * width, top: top + box[1] * height, bottom: top + box[3] * height };
}
