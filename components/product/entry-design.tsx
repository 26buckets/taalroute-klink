'use client';

import type { Portal } from '@/app/page';
import { Brand } from '@/components/product/shared';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronRight,
  CircleAlert,
  GraduationCap,
  KeyRound,
  LockKeyhole,
  PanelsTopLeft,
  ScanLine,
} from 'lucide-react';
import { useState } from 'react';

export function EntryScreen({ onPortal }: { onPortal: (portal: Portal) => void }) {
  const [mode, setMode] = useState<'choose' | 'learner'>('choose');
  const [learnerPortal, setLearnerPortal] = useState<'learner' | 'compact'>('learner');
  const [code, setCode] = useState('ALFA1');
  const [pin, setPin] = useState('2580');
  const [error, setError] = useState('');

  function submitLearner(event: { preventDefault(): void }) {
    event.preventDefault();
    if (code.trim().toUpperCase() !== 'ALFA1' || pin !== '2580') {
      setError('Deze combinatie klopt niet. Gebruik voor de demo ALFA1 en 2580.');
      return;
    }
    onPortal(learnerPortal);
  }

  function chooseLearner(portal: 'learner' | 'compact') {
    setLearnerPortal(portal);
    setMode('learner');
    setError('');
  }

  return (
    <main className="entry-screen">
      <section className="entry-window">
        <header className="entry-appbar">
          <Brand />
          <span className="window-controls" aria-hidden="true"><i /><i /><i /></span>
        </header>
        {mode === 'choose' ? (
          <div className="entry-roles">
            <h1 className="sr-only">Klink</h1>
            <button className="role-choice role-choice-primary" onClick={() => chooseLearner('learner')}><span className="role-icon"><ScanLine /></span><strong>Cursist</strong><small>Huidige versie</small><ChevronRight /></button>
            <button className="role-choice role-choice-compact" onClick={() => chooseLearner('compact')}><span className="role-icon"><PanelsTopLeft /></span><strong>Compact</strong><small>Nieuwe leerwerkplek</small><ChevronRight /></button>
            <button className="role-choice" onClick={() => onPortal('teacher')}><span className="role-icon"><GraduationCap /></span><strong>Docent</strong><small>Beheer en voortgang</small><ChevronRight /></button>
          </div>
        ) : (
          <form className="learner-login" onSubmit={submitLearner}>
            <button type="button" className="text-back" onClick={() => setMode('choose')}><ArrowLeft />Terug</button>
            <h1>{learnerPortal === 'compact' ? 'Compacte speler' : 'Cursist'}</h1>
            <label><span><Building2 />Klascode</span><input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} autoComplete="organization" /></label>
            <label><span><KeyRound />Persoonlijke PIN</span><input value={pin} onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" autoComplete="one-time-code" maxLength={4} /></label>
            {error && <p className="form-error"><CircleAlert />{error}</p>}
            <button className="primary-button wide" type="submit"><LockKeyhole />Open<ArrowRight /></button>
            <div className="demo-code"><span>Demo</span><b>ALFA1</b><b>2580</b></div>
          </form>
        )}
      </section>
    </main>
  );
}
