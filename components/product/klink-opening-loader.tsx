'use client';

import { useEffect, useState } from 'react';
import './klink-opening-loader.css';

// Later loading boundaries keep the final logo for this page visit.
let openingAnimationShown = false;

export function KlinkOpeningLoader() {
  const [animate] = useState(() => !openingAnimationShown);
  useEffect(() => { openingAnimationShown = true; }, []);
  return (
    <output className="klink-opening-loader" aria-live="polite" aria-atomic="true">
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet="/opening-loader-v4-20261101/klink-static.svg" />
        <img src={animate ? "/opening-loader-quick-20261101/klink-loader.svg" : "/opening-loader-v4-20261101/klink-static.svg"} alt="" width="1942" height="1109" />
      </picture>
      <span className="klink-opening-label">Klink wordt geopend…</span>
    </output>
  );
}
