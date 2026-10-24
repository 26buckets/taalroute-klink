'use client';

import type { Portal } from '@/app/page';
import { ArrowLeft, ArrowRight, BookOpen, Building2, ChevronRight, CircleAlert, Headphones, KeyRound, Library } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export function EntryScreen({ onPortal }: { onPortal: (portal: Portal) => void }) {
  const [mode, setMode] = useState<'choose' | 'learner'>('choose');
  const [code, setCode] = useState('ALFA1');
  const [pin, setPin] = useState('2580');
  const [error, setError] = useState('');
  const beginButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (mode === 'learner') beginButton.current?.focus({ preventScroll: true });
  }, [mode]);

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
        <div className="entry-layout">
          <div className="entry-copy">
            {mode === 'choose' ? (
              <>
                <span className="landing-eyebrow">Klink · Van klank naar taal</span>
                <h1 className="landing-title">Oefen klanken, letters en woorden</h1>
                <p className="landing-intro">Luister, kijk en oefen. Werk stap voor stap aan lezen en uitspraak, in je eigen tempo. Samen met je docent of begeleider, of zelf.</p>
                <button className="landing-start" onClick={chooseLearner}><BookOpen aria-hidden="true" /><span>Start met oefenen</span><ArrowRight aria-hidden="true" /></button>
                <span className="landing-start-note">Voor cursisten · de oefencodes staan al klaar</span>
                <p className="landing-method-note">Onderdeel van Alfabeta+, de alfabetiseringsmethode van Taalroute.</p>
              </>
            ) : (
              <form className="learner-login" onSubmit={submitLearner}>
                <button type="button" className="text-back" onClick={() => setMode('choose')}><ArrowLeft />Terug</button>
                <span className="entry-kicker">Cursist</span>
                <h1>Begin met oefenen</h1>
                <p>De codes staan al ingevuld. Tik op Begin.</p>
                <label><span><Building2 />Klascode</span><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} autoComplete="organization" /></label>
                <label><span><KeyRound />Oefencode</span><input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" autoComplete="off" maxLength={4} /></label>
                {error && <p className="form-error" role="alert"><CircleAlert />{error}</p>}
                <button className="primary-button wide" type="submit" ref={beginButton}><BookOpen aria-hidden="true" />Begin<ArrowRight /></button>
                <div className="demo-code"><span>Om te oefenen</span><b>ALFA1</b><b>2580</b></div>
                <p>Je oefenplek blijft in deze browser bewaard.</p>
              </form>
            )}
          </div>
          <figure className="entry-visual"><Image src="/klink-entry-hero.webp" alt="Een volwassen cursist oefent woorden samen met een docent" fill priority sizes="(max-width: 700px) 100vw, 45vw" /><figcaption><Headphones aria-hidden="true" /><span>Alle ruimte om te oefenen.</span></figcaption></figure>
        </div>
        {mode === 'choose' && <>
          <div className="landing-wordrow" aria-label="Luisteren, oefenen, groeien"><span>Luisteren.</span><span>Oefenen.</span><span>Groeien.</span></div>
          <section className="landing-professionals" id="begeleiders" aria-label="Lesgeven, begeleiden en organiseren">
            <div className="landing-professional-grid">
              <article className="landing-professional-card">
                <Library aria-hidden="true" /><h2>Lesgeven en begeleiden</h2>
                <p>Kies passende oefeningen voor je les of individuele begeleiding. De handleiding helpt je bij de keuze en uitvoering.</p>
                <button onClick={() => onPortal('teacher')}>Open de docentomgeving<ArrowRight aria-hidden="true" /></button>
                <Link href="/docenten">Bekijk de handleiding<ArrowRight aria-hidden="true" /></Link>
                <details><summary>Samen oefenen of zelf oefenen?<ChevronRight aria-hidden="true" /></summary>
                  <p>Begin samen en kies oefeningen die passen bij wat de cursist al kan. Daarna kan de cursist dezelfde oefening zelfstandig herhalen. De docent of begeleider blijft helpen bij de keuze en de voortgang.</p>
                </details>
              </article>
              <article className="landing-professional-card">
                <Building2 aria-hidden="true" /><h2>Klink voor jouw organisatie</h2>
                <p>Voor scholen, taalaanbieders, gemeenten en begeleidingsorganisaties. Probeer het oefenaanbod en bespreek welke inzet en kosten bij jouw organisatie passen.</p>
                <a href="mailto:info@taalroute.nl?subject=Gebruik%20en%20aanschaf%20van%20Klink">Mail over gebruik en kosten<ArrowRight aria-hidden="true" /></a>
                <button onClick={chooseLearner}>Probeer de oefeningen<ArrowRight aria-hidden="true" /></button>
                <details><summary>Wat moet ik vooraf weten?<ChevronRight aria-hidden="true" /></summary>
                  <p>De oefencodes geven toegang tot de huidige oefeningen. Ze horen niet bij een persoonlijk account. Voortgang en bewaarde woorden blijven in deze browser op dit apparaat. Op een gedeeld apparaat zien gebruikers dezelfde oefenplek. Bespreek met Taalroute wat past bij jouw groep.</p>
                  <p>Mail naar info@taalroute.nl en vermeld je doelgroep, groepsgrootte en gewenste start.</p>
                  <Link href="/docenten/hoofdstuk-12">Lees over de aanpak van Klink<ArrowRight aria-hidden="true" /></Link>
                </details>
              </article>
            </div>
          </section>
          <section className="landing-context" aria-label="Alfabeta+ en de Z-route">
            <div><h2>Onderdeel van Alfabeta+</h2><p>Klink is het digitale oefenonderdeel van Alfabeta+, de alfabetiseringsmethode van Taalroute voor volwassenen. Gebruik de oefeningen naast de lessen, met begeleiding die past bij de cursist.</p></div>
            <div><h2>Oefenen binnen de Z-route</h2><p>Klink ondersteunt het oefenen met klanken, woorden en lezen binnen de Z-route. De docent of begeleider verbindt de oefeningen aan taal gebruiken in het dagelijks leven. Klink is een onderdeel van het bredere traject met taalles, begeleiding en participatie.</p></div>
          </section>
        </>}
        <footer className="landing-footer"><div className="landing-alfa"><span>Onderdeel van</span><Image src="/alfabetaplus-logo.png" alt="Alfabeta+" width={449} height={241} /><span>Alfabetisering voor volwassenen</span></div><div className="landing-footer-brand"><div className="landing-publisher"><span>Een leermiddel van</span><Image src="/taalroute-logo.svg" alt="Taalroute" width={750} height={94} /></div><span className="landing-address">klink.taalroute.nl</span></div></footer>
      </section>
    </main>
  );
}
