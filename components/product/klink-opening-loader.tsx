'use client';

import './klink-opening-loader.css';

export function KlinkOpeningLoader() {
  return (
    <output className="klink-opening-loader" aria-live="polite" aria-atomic="true">
      <picture>
        <source media="(prefers-reduced-motion: reduce)" srcSet="/opening-loader-v4-20261101/klink-static.svg" />
        <img src="/opening-loader-quick-20261101/klink-loader.svg" alt="" width="1942" height="1109" />
      </picture>
      <span className="klink-opening-label">Klink wordt geopend…</span>
    </output>
  );
}
