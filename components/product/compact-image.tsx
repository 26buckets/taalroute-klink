'use client';

import Image, { type ImageProps } from 'next/image';
import { forwardRef } from 'react';
import { compactImageSrc } from '@/lib/compact-images';

// Local images are pre-compressed: the runtime endpoint otherwise serves the full source unchanged.
export default forwardRef<HTMLImageElement, ImageProps>(function CompactImage(props, ref) {
  const local = typeof props.src === 'string' && props.src.startsWith('/');
  return <Image {...props} ref={ref} src={typeof props.src === 'string' ? compactImageSrc(props.src) : props.src} unoptimized={local || props.unoptimized} />;
});
