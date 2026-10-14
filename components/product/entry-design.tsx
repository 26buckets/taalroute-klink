'use client';

import type { Portal } from '@/app/page';
import { Brand } from '@/components/product/shared';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  ChevronRight,
  CircleAlert,
  Headphones,
  KeyRound,
  Library,
  LockKeyhole,
} from 'lucide-react';
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
      setError('Deze combinatie klopt niet. Gebruik voor de demo ALFA1 en 2580.');
      return;
    }
    onPortal('learner');
  }

  function chooseLearner() {
    setMode('learner');
    setError('');
  }

  return (
    <main className="entry-screen">
      <section className="entry-window">
        <header className="entry-appbar">
          <Brand />
          <span>Alfabeta+</span>
        </header>
        <div className="entry-layout">
          <div className="entry-copy">
            {mode === 'choose' ? (
              <>
                <span className="entry-kicker">Luisteren · oefenen · groeien</span>
                <h1>Welkom bij Klink</h1>
                <p>Oefen Nederlandse klanken, woorden en zinnen stap voor stap.</p>
                <div className="entry-roles">
                  <button className="role-choice role-choice-primary" onClick={chooseLearner}><span className="role-icon"><BookOpen /></span><span><strong>Cursist</strong><small>Open je lessen</small></span><ChevronRight /></button>
                  <button className="role-choice" onClick={() => onPortal('teacher')}><span className="role-icon"><Library /></span><span><strong>Docent</strong><small>Bekijk lessen en voortgang</small></span><ChevronRight /></button>
                </div>
                <div className="entry-method" aria-label="De vijf stappen van Klink">
                  {['Kijken', 'Luisteren', 'Inoefenen', 'Nazeggen', 'Koppelen'].map((step, index) => <span key={step}><b>{'KLINK'[index]}</b>{step}</span>)}
                </div>
              </>
            ) : (
              <form className="learner-login" onSubmit={submitLearner}>
                <button type="button" className="text-back" onClick={() => setMode('choose')}><ArrowLeft />Terug</button>
                <span className="entry-kicker">Cursist</span>
                <h1>Open je lessen</h1>
                <p>Vul de klascode en je persoonlijke pincode in.</p>
                <label><span><Building2 />Klascode</span><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} autoComplete="organization" /></label>
                <label><span><KeyRound />Persoonlijke pincode</span><input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" autoComplete="one-time-code" maxLength={4} /></label>
                {error && <p className="form-error"><CircleAlert />{error}</p>}
                <button className="primary-button wide" type="submit"><LockKeyhole />Begin<ArrowRight /></button>
                <div className="demo-code"><span>Proberen</span><b>ALFA1</b><b>2580</b></div>
              </form>
            )}
          </div>
          <figure className="entry-visual">
            <Image src="/klink-entry-hero.webp" alt="Een volwassen cursist oefent woorden samen met een docent" fill priority sizes="(max-width: 760px) 100vw, 52vw" />
            <figcaption><Headphones /><span><strong>Luister zo vaak als je wilt</strong><small>In je eigen tempo, op elk apparaat</small></span></figcaption>
          </figure>
        </div>
      </section>
    </main>
  );
}
