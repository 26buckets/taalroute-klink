import type { Metadata } from 'next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import chapters from '@/data/klink-teacher-manual.json';

export const metadata: Metadata = {
  title: 'Docentenhandleiding | Klink · Taalroute',
  description: 'Praktische begeleiding bij Klink: voorbereiden, kleine leesstappen, feedback, betekenisvol gebruiken en herhalen.',
};

export default function TeacherManual() {
  return (
    <main className="teacher-manual" id="handleiding">
      <a className="manual-back" href="/#learner/home"><ArrowLeft aria-hidden="true" />Naar Klink</a>
      <header className="manual-intro">
        <p className="manual-eyebrow">Klink · Voor docenten en begeleiders</p>
        <h1>Docentenhandleiding</h1>
        <p className="manual-subtitle">Begeleiden van betekenis naar lezen en gebruiken</p>
        <p>Kies één haalbaar doel, geef precies de hulp die nodig is en kijk wat de cursist zelf doet. Verbind het schermwerk steeds met betekenis en taalgebruik. Deze handleiding helpt je dat voorbereiden, uitvoeren en terughalen in de volgende bijeenkomst.</p>
        <a className="manual-teacher-entry" href="/#teacher/activities">Open de docentomgeving<ArrowRight aria-hidden="true" /></a>
      </header>
      <nav className="manual-contents" aria-label="Inhoudsopgave">
        <h2>In deze handleiding</h2>
        <ol>{chapters.map(chapter => <li key={chapter.id}><a href={`#${chapter.id}`}>{chapter.title.replace(/^\d+ /, '')}</a></li>)}</ol>
      </nav>
      <article className="manual-chapters">
        {chapters.map(chapter => (
          <section key={chapter.id} id={chapter.id} aria-labelledby={`${chapter.id}-titel`}>
            <h2 id={`${chapter.id}-titel`}>{chapter.title}</h2>
            {/* Trusted, reviewed text generated from docs/KLINK-DOCENTHANDLEIDING.md; no visitor input. */}
            <div dangerouslySetInnerHTML={{ __html: chapter.html }} />
            <a className="manual-top" href="#handleiding">Terug naar de inhoudsopgave</a>
          </section>
        ))}
      </article>
    </main>
  );
}
