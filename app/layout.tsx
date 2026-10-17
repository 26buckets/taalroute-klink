import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './learner-ui.css';

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
  manifest: '/manifest.webmanifest',
  icons: {
    icon: '/favicon.svg?v=2',
    shortcut: '/favicon.ico?v=2',
    apple: '/favicon.ico?v=2',
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
