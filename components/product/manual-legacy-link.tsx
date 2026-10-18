'use client';
import { useEffect } from 'react';

export function ManualLegacyLink() {
  useEffect(() => {
    const chapter = window.location.hash.match(/^#(hoofdstuk-(?:1[0-2]|[1-9]))$/)?.[1];
    if (chapter) window.location.replace(`/docenten/${chapter}`);
  }, []);
  return null;
}
