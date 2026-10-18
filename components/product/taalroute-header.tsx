import { BookOpen } from 'lucide-react';

export function TaalrouteHeader() {
  return (
    <header className="taalroute-header">
      <a className="taalroute-header-brand" href="/" aria-label="Taalroute Klink — naar de startpagina">
        <img src="/taalroute-logo.svg" alt="Taalroute" width="128" height="16" />
        <span>Klink</span>
      </a>
      <a className="taalroute-teacher-link" href="/docenten"><BookOpen aria-hidden="true" />Voor docenten</a>
    </header>
  );
}
