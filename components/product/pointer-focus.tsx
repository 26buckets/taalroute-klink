'use client';

import { useEffect } from 'react';

export function PointerFocus() {
  useEffect(() => {
    const root = document.documentElement;
    const pointer = () => { root.dataset.pointerInput = 'true'; };
    const keyboard = () => { delete root.dataset.pointerInput; };
    window.addEventListener('pointerdown', pointer, true);
    window.addEventListener('keydown', keyboard, true);
    return () => {
      window.removeEventListener('pointerdown', pointer, true);
      window.removeEventListener('keydown', keyboard, true);
      keyboard();
    };
  }, []);
  return null;
}
