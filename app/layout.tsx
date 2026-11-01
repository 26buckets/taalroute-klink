import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import '../public/taalroute-menu/header-controls.css';
import '../public/taalroute-menu/app-chooser.css';
import '../public/taalroute-menu/menu-controls.css';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './learner-ui.css';
import './landing.css';
import './taalroute-header.css';
import './learner-layout.css';
import './sounds.css';
import './teaching.css';
import './motion.css';
import { MotionFeedback } from '@/components/product/motion-feedback';
import { ClassroomBoundary } from '@/components/product/classroom-boundary';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Taalroute | Klink',
  description:
    'Klink — Van klank naar taal. Kijken, luisteren, inoefenen, nazeggen en koppelen met Alfabeta+.',
  openGraph: {type:'website', title:'Taalroute KLINK', description:'Van klank naar taal.', url:'https://klink.taalroute.nl/', images:[{url:'https://klink.taalroute.nl/taalroute-menu/klink-share-logo-20261101.png',alt:'Taalroute KLINK'}]},
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg?v=logo-20261101',
    shortcut: '/favicon.ico?v=logo-20261101',
    apple: '/favicon.ico?v=logo-20261101',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Klink',
  },
};

export const viewport: Viewport = {
  themeColor: '#173f4b',
  colorScheme: 'light',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl">
      <head><Script strategy="beforeInteractive" src="/taalroute-menu/appearance.js" data-preference-key="taalroute-klink-appearance-v1"/><Script strategy="beforeInteractive" src="/taalroute-menu/menu-controls.js?v=delen-20261024" data-share-app="klink"/></head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased klink-motion`}
      >
        <MotionFeedback />
        <ClassroomBoundary>{children}</ClassroomBoundary>
      </body>
    </html>
  );
}
