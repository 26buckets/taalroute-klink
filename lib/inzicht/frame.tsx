'use client';
import type { ReactNode } from 'react';
import { TaalrouteHeader } from '@/components/product/taalroute-header';
export function StagingFrame({ children }: { children: ReactNode }) {
  return (
    <div
      onClickCapture={(event) => {
        const link = (event.target as Element).closest('a');
        if (link?.getAttribute('href') === '/#teacher/plus') {
          event.preventDefault();
          event.stopPropagation();
          window.location.assign('https://klink.taalroute.nl/#teacher/plus');
        }
      }}
    >
      <TaalrouteHeader />
      {children}
    </div>
  );
}
