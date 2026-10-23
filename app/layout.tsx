import type { Metadata, Viewport } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import './learner-ui.css';
import './landing.css';
import './taalroute-header.css';
import { TaalrouteHeader } from '@/components/product/taalroute-header';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://klink.taalroute.nl'),
  openGraph: {
    title: 'KLINK | Taalroute',
    description: 'Van klank naar woord en lezen. Kijk. Luister. Lees.',
    url: 'https://klink.taalroute.nl/',
    siteName: 'Taalroute',
    locale: 'nl_NL',
    type: 'website',
    images: [{ url: '/social/klink-social-20261023.jpg', width: 1200, height: 630, alt: 'Taalroute KLINK. Van klank naar woord en lezen. Kijk. Luister. Lees.' }],
  },
  twitter: { card: 'summary_large_image', title: 'KLINK | Taalroute', description: 'Van klank naar woord en lezen. Kijk. Luister. Lees.', images: ['/social/klink-social-20261023.jpg'] },
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
        <TaalrouteHeader />
        {children}
      </body>
    </html>
  );
}
