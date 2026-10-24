'use client';

import type { Portal } from '@/app/page';
import { ArrowLeft, ArrowRight, BookOpen, Building2, ChevronRight, CircleAlert, Headphones, KeyRound, Library, LockKeyhole } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
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
        <div className="entry-layout">
          <div className="entry-copy">
            {mode === 'choose' ? (
              <>
                <span className="landing-eyebrow">Klink · Van klank naar taal</span>
                <h1 className="landing-title">Stap voor stap Nederlands leren</h1>
                <p className="landing-intro">Met Klink oefen je klanken, woorden en uitspraak. Samen in de les, tijdens begeleiding of zelfstandig. Met ruimte om te luisteren, te herhalen en in je eigen tempo te oefenen.</p>
                <button className="landing-start" onClick={chooseLearner}><BookOpen aria-hidden="true" /><span>Start met oefenen</span><ArrowRight aria-hidden="true" /></button>
                <span className="landing-start-note">Voor cursisten · met je klascode en oefencode</span>
                <p className="landing-method-note">Onderdeel van Alfabeta+, de alfabetiseringsmethode van Taalroute.</p>
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
          <section className="landing-professionals" id="begeleiders" aria-label="Lesgeven, begeleiden en organiseren">
            <div className="landing-professional-grid">
              <article className="landing-professional-card">
                <Library aria-hidden="true" /><h2>Lesgeven en begeleiden</h2>
                <p>Gebruik Klink in je les of tijdens individuele begeleiding. Bekijk hoe je de oefeningen kunt inzetten en open je omgeving.</p>
                <details><summary>Voor docenten en begeleiders<ChevronRight aria-hidden="true" /></summary>
                  <Link href="/docenten">Bekijk hoe Klink werkt<ArrowRight aria-hidden="true" /></Link>
                  <button onClick={() => onPortal('teacher')}>Open je omgeving<ArrowRight aria-hidden="true" /></button>
                </details>
              </article>
              <article className="landing-professional-card">
                <Building2 aria-hidden="true" /><h2>Klink voor jouw organisatie</h2>
                <p>Wil je Klink inzetten binnen een school, gemeente of andere organisatie? Bekijk hoe het werkt en neem contact op over gebruik en aanschaf.</p>
                <details><summary>Gebruik en aanschaf<ChevronRight aria-hidden="true" /></summary>
                  <p>Klink is bedoeld voor volwassenen die werken aan alfabetisering en Nederlands. Bekijk de uitleg, probeer de oefeningen en bespreek met Taalroute wat past bij jouw organisatie.</p>
                  <Link href="/docenten/hoofdstuk-12">Lees over Klink<ArrowRight aria-hidden="true" /></Link>
                  <button onClick={chooseLearner}>Probeer de oefeningen<ArrowRight aria-hidden="true" /></button>
                  <a href="mailto:info@taalroute.nl?subject=Gebruik%20en%20aanschaf%20van%20Klink">Neem contact op met Taalroute<ArrowRight aria-hidden="true" /></a>
                </details>
              </article>
            </div>
          </section>
          <section className="landing-context" aria-label="Alfabeta+ en de Z-route">
            <div><h2>Onderdeel van Alfabeta+</h2><p>Alfabeta+ is de alfabetiseringsmethode van Taalroute voor volwassenen. Klink is het digitale oefenonderdeel: luisteren naar klanken, werken met letters en woorden, en stap voor stap oefenen met lezen en uitspraak. De docent verbindt de oefeningen aan de les en aan wat de cursist nodig heeft.</p></div>
            <div><h2>Oefenen binnen de Z-route</h2><p>Binnen de Z-route werken cursisten aan Nederlands en meedoen in het dagelijks leven. Je kunt Klink inzetten voor de alfabetisering en het oefenen met klanken, woorden en lezen. Combineer dit met begeleiding en taal gebruiken in echte situaties, als onderdeel van het bredere traject.</p></div>
          </section>
        </>}
        <footer className="landing-footer"><div className="landing-alfa"><span>Onderdeel van</span><Image src="/alfabetaplus-logo.png" alt="Alfabeta+" width={449} height={241} /><span>Alfabetisering voor volwassenen</span></div><div className="landing-footer-brand"><div className="landing-publisher"><span>Een leermiddel van</span><Image src="/taalroute-logo.svg" alt="Taalroute" width={750} height={94} /></div><span className="landing-address">klink.taalroute.nl</span></div></footer>
      </section>
    </main>
  );
}
