'use client';

import type { Portal } from '@/app/page';
import { ArrowLeft, ArrowRight, BookOpen, Building2, ChevronRight, CircleAlert, Headphones, KeyRound, Library, LockKeyhole, MessageCircle } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

export function EntryScreen({ onPortal }: { onPortal: (portal: Portal) => void }) {
  const [mode, setMode] = useState<'choose' | 'learner'>('choose');
  const [code, setCode] = useState('ALFA1');
  const [pin, setPin] = useState('2580');
  const [error, setError] = useState('');

  function submitLearner(event: { preventDefault(): void }) {
    event.preventDefault();
    if (code.trim().toUpperCase() !== 'ALFA1' || pin !== '2580') {
      setError('Vul ALFA1 en 2580 in. Tik daarna op Begin.');
      return;
    }
    onPortal('learner');
  }

  function chooseLearner() {
    setMode('learner');
    setError('');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }

  return (
    <main className="entry-screen klink-landing">
      <section className="entry-window">
        <header className="entry-appbar">
          {mode === 'choose' && <nav aria-label="Op deze pagina"><a href="#begeleiders">Voor begeleiders<ArrowRight aria-hidden="true" /></a></nav>}
          <div className="landing-publisher"><span>Een leermiddel van</span><Image src="/taalroute-logo.svg" alt="Taalroute" width={750} height={94} priority /></div>
        </header>
        <div className="entry-layout">
          <div className="entry-copy">
            {mode === 'choose' ? (
              <>
                <span className="landing-eyebrow">Nederlands, stap voor stap</span>
                <h1 className="landing-title">Klink jij ook?</h1>
                <p className="landing-intro">Samen in de klas of zelf aan de slag. Geef jezelf de ruimte om te oefenen.</p>
                <button className="landing-start" onClick={chooseLearner}><BookOpen aria-hidden="true" /><span>Open je lessen</span><ArrowRight aria-hidden="true" /></button>
                <span className="landing-start-note">Voor cursisten · met je klascode</span>
              </>
            ) : (
              <form className="learner-login" onSubmit={submitLearner}>
                <button type="button" className="text-back" onClick={() => setMode('choose')}><ArrowLeft />Terug</button>
                <span className="entry-kicker">Cursist</span>
                <h1>Open je lessen</h1>
                <p>Vul de klascode en de oefencode in.</p>
                <label><span><Building2 />Klascode</span><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} autoComplete="organization" /></label>
                <label><span><KeyRound />Oefencode</span><input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" autoComplete="off" maxLength={4} /></label>
                {error && <p className="form-error" role="alert"><CircleAlert />{error}</p>}
                <button className="primary-button wide" type="submit"><LockKeyhole />Begin<ArrowRight /></button>
                <div className="demo-code"><span>Proberen</span><b>ALFA1</b><b>2580</b></div>
              </form>
            )}
          </div>
          <figure className="entry-visual"><Image src="/klink-entry-hero.webp" alt="Een volwassen cursist oefent woorden samen met een docent" fill priority sizes="(max-width: 700px) 100vw, 45vw" /><figcaption><Headphones aria-hidden="true" /><span>Alle ruimte om te oefenen.</span></figcaption></figure>
        </div>
        {mode === 'choose' && <>
          <div className="landing-wordrow" aria-label="Luisteren, oefenen, groeien"><span>Luisteren.</span><span>Oefenen.</span><span>Groeien.</span></div>
          <section className="landing-professionals" id="begeleiders" aria-label="Voor begeleiders">
            <div className="landing-professional-grid">
              <article className="landing-professional-card"><Library aria-hidden="true" /><h2>Met je klas</h2><p>Voor docenten die samen willen oefenen.</p><button onClick={() => onPortal('teacher')}>Naar de docentomgeving<ArrowRight aria-hidden="true" /></button></article>
              <article className="landing-professional-card"><MessageCircle aria-hidden="true" /><h2>Tijdens je begeleiding</h2><p>Ontdek de oefeningen als therapeut.</p><details><summary>Bekijk de mogelijkheden<ChevronRight aria-hidden="true" /></summary><p>Luister samen naar klanken, woorden en zinnen. Laat de cursist oefenen en herhaal waar nodig. Je gebruikt hiervoor dezelfde oefeningen.</p><button onClick={chooseLearner}>Open de oefeningen<ArrowRight aria-hidden="true" /></button></details></article>
            </div>
          </section>
        </>}
        <footer className="landing-footer"><div className="landing-alfa"><Image src="/alfabetaplus-logo.png" alt="Alfabeta+" width={449} height={241} /><span><strong>Klink hoort bij Alfabeta+.</strong><span>De specialistische alfa-leerlijn van Taalroute.</span></span></div><span className="landing-address">klink.taalroute.nl</span></footer>
      </section>
    </main>
  );
}
