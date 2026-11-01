'use client';

import { useEffect, useRef } from 'react';
import './klink-opening-loader.css';

export function KlinkOpeningLoader({ onComplete }: { onComplete?: () => void }) {
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!onComplete || !image.current) return;
    let cancelled = false;
    let timer: number | undefined;
    const start = () => {
      if (!cancelled) timer = window.setTimeout(onComplete, 2000);
    };
    // Count the opening time from the decoded logo, including a cold image cache.
    void image.current.decode().then(start, start);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [onComplete]);
  return (
    <output className="klink-opening-loader" aria-live="polite" aria-atomic="true">
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet="/opening-loader-v4-20261101/klink-static.svg" />
        <img ref={image} src="/opening-loader-quick-20261101/klink-loader.svg" alt="" width="1942" height="1109" />
      </picture>
      <span className="klink-opening-label">Klink wordt geopend…</span>
    </output>
  );
}
