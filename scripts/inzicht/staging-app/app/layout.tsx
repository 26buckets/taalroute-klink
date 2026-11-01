import type { ReactNode } from 'react';
import Script from 'next/script';
import { Geist, Geist_Mono } from 'next/font/google';
import { StagingFrame } from '@/lib/inzicht/frame';
import '@/public/taalroute-menu/header-controls.css';
import '@/public/taalroute-menu/app-chooser.css';
import '@/public/taalroute-menu/menu-controls.css';
import '@/app/globals.css';
import '@/app/learner-ui.css';
import '@/app/landing.css';
import '@/app/taalroute-header.css';
import '@/app/learner-layout.css';
import '@/app/sounds.css';
import '@/app/teaching.css';
import '@/app/motion.css';
const sans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const mono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });
export const metadata = {
  title: 'Klink Inzicht — testomgeving',
  robots: { index: false, follow: false },
};
export default function StagingLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="nl">
      <head>
        <Script
          strategy="beforeInteractive"
          src="/taalroute-menu/appearance.js"
          data-preference-key="taalroute-klink-appearance-v1"
        />
        <Script
          strategy="beforeInteractive"
          src="/taalroute-menu/menu-controls.js?v=delen-20261024"
          data-share-app="klink"
        />
      </head>
      <body
        className={`${sans.variable} ${mono.variable} antialiased klink-motion`}
      >
        <StagingFrame>{children}</StagingFrame>
      </body>
    </html>
  );
}
