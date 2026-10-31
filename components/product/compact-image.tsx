'use client';

import Image, { type ImageProps } from 'next/image';
import { forwardRef, useState } from 'react';
import { compactImageSrc } from '@/lib/compact-images';
import { WordPlaceholder } from './word-placeholder';

type WordImageProps = ImageProps & { fallbackWord?: string; placeholderClassName?: string };

// Local images are pre-compressed: the runtime endpoint otherwise serves the full source unchanged.
export default forwardRef<HTMLImageElement, WordImageProps>(function CompactImage({ fallbackWord, placeholderClassName, ...props }, ref) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const local = typeof props.src === 'string' && props.src.startsWith('/');
  const src = typeof props.src === 'string' ? compactImageSrc(props.src) : props.src;
  if (fallbackWord && (!src || failedSrc === src)) return <WordPlaceholder word={fallbackWord} className={placeholderClassName} decorative={!props.alt} />;
  return <Image {...props} ref={ref} src={src} unoptimized={local || props.unoptimized} onError={event => { if (fallbackWord && typeof src === 'string') setFailedSrc(src); props.onError?.(event); }} />;
});
