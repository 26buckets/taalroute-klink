import { BookOpen } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export function TaalrouteHeader() {
  return (
    <header className="taalroute-header">
      <Link className="taalroute-header-brand" href="/" aria-label="Taalroute Klink — naar de startpagina">
        <Image className="header-taalroute-logo" src="/taalroute-logo.svg" alt="Taalroute" width={750} height={94} priority />
        <span className="header-brand-divider" aria-hidden="true" />
        <Image className="header-klink-logo" src="/klink-wordmark.svg" alt="Klink" width={770} height={252} priority />
      </Link>
      <Link className="taalroute-teacher-link" href="/docenten" aria-label="Voor docenten"><BookOpen aria-hidden="true" /><span>Voor docenten</span></Link>
    </header>
  );
}
