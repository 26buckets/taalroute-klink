'use client';

import { Brand, playMedia } from '@/components/product/shared';
import { PackageLibrary, PackagePlayer } from '@/components/product/package-experience';
import {
  allPackageWords,
  contentPackages,
  getPackage,
  type PackageId,
} from '@/lib/package-content';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Home,
  Layers3,
  LogOut,
  PackageOpen,
  RefreshCw,
  Route,
  Volume2,
  WholeWord,
} from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';

type LearnerView = 'home' | 'packages' | 'package' | 'words' | 'review';
type WordFilter = string;

export function LearnerApp({ onExit, onToast }: { onExit: () => void; onToast: (message: string) => void }) {
  const [view, setView] = useState<LearnerView>('home');
  const [selectedPackage, setSelectedPackage] = useState<PackageId>(contentPackages[0].id);
  const [savedWordIds, setSavedWordIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = JSON.parse(window.localStorage.getItem('klink.taalroute.savedWords.v1') ?? '[]') as unknown;
      return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  });

  function openPackage(packageId: PackageId) {
    setSelectedPackage(packageId);
    setView('package');
  }

  function toggleSavedWord(wordId: string) {
    setSavedWordIds((current) => {
      const next = current.includes(wordId) ? current.filter((item) => item !== wordId) : [...current, wordId];
      try { window.localStorage.setItem('klink.taalroute.savedWords.v1', JSON.stringify(next)); } catch { onToast('Bewaren lukt niet op dit apparaat. Oefenen kan doorgaan.'); }
      return next;
    });
  }

  return (
    <div className="learner-app">
      <aside className="learner-nav">
        <button className="brand-button" onClick={() => setView('home')} aria-label="Naar de leerhome"><Brand /></button>
        <nav aria-label="Cursistnavigatie">
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}><Home /><span>Verder</span></button>
          <button className={view === 'packages' || view === 'package' ? 'active' : ''} onClick={() => setView('packages')}><PackageOpen /><span>Lessen</span></button>
          <button className={view === 'words' ? 'active' : ''} onClick={() => setView('words')}><WholeWord /><span>Woorden</span></button>
          <button className={view === 'review' ? 'active' : ''} onClick={() => setView('review')}><RefreshCw /><span>Herhalen</span></button>
        </nav>
        <button className="learner-profile" onClick={onExit}><small>Afsluiten</small><LogOut /></button>
      </aside>
      <main className="learner-main">
        {view === 'home' && <LearnerHome onPackage={openPackage} onPackages={() => setView('packages')} onWords={() => setView('words')} onReview={() => setView('review')} savedCount={savedWordIds.length} />}
        {view === 'packages' && <PackageLibrary onBack={() => setView('home')} onOpen={openPackage} />}
        {view === 'package' && <PackagePlayer packageId={selectedPackage} onClose={() => setView('packages')} savedWordIds={savedWordIds} onToggleWord={toggleSavedWord} onToast={onToast} />}
        {view === 'words' && <WordLibrary savedWordIds={savedWordIds} onToggleWord={toggleSavedWord} onBack={() => setView('home')} onToast={onToast} />}
        {view === 'review' && <ReviewQueue savedWordIds={savedWordIds} onWords={() => setView('words')} onBack={() => setView('home')} onToast={onToast} />}
      </main>
    </div>
  );
}

function LearnerHome({ onPackage, onPackages, onWords, onReview, savedCount }: { onPackage: (packageId: PackageId) => void; onPackages: () => void; onWords: () => void; onReview: () => void; savedCount: number }) {
  const first = contentPackages[0];
  const second = contentPackages[1];
  return (
    <div className="learner-page cp-home">
      <header className="learner-page-head">
        <div><span className="cp-home-mark"><Layers3 /></span><span>Welkom bij Klink</span><h1>Kies waar je verdergaat</h1></div>
      </header>

      <section className="cp-home-hero">
        <div>
          <span className="eyebrow light">Begin met de eerste leesstappen</span>
          <h2>{first.title}</h2>
          <p>{first.description}</p>
          <button className="accent-button" onClick={() => onPackage(first.id)}>Begin hier<ArrowRight /></button>
        </div>
        <div className="cp-home-facts">
          <span><strong>{first.counts.lessons}</strong><small>lessen</small></span>
          <span><strong>{first.counts.coreWords}</strong><small>kernwoorden</small></span>
          <span><strong>{first.counts.exercises}</strong><small>oefeningen</small></span>
          <span><strong>{first.counts.exerciseTypes}</strong><small>activiteitsoorten</small></span>
        </div>
      </section>

      <section className="cp-home-second">
        <span><PackageOpen /></span>
        <div><small>Volgende bouwgroep</small><strong>{second.title}</strong><p>{second.counts.lessons} lessen · {second.counts.coreWords} woorden · {second.counts.exercises} oefeningen</p></div>
        <button className="secondary-button" onClick={() => onPackage(second.id)}>Bekijk deze groep<ArrowRight /></button>
      </section>

      <section className="cp-home-actions">
        <button onClick={onPackages}><span><Route /></span><div><small>Alles bij elkaar</small><strong>Bekijk de lessen</strong><p>Open een lessenreeks en kies waar je wilt beginnen.</p></div><ArrowRight /></button>
        <button onClick={onWords}><span><WholeWord /></span><div><small>{allPackageWords.length} woordkaarten</small><strong>Bekijk alle woorden</strong><p>Bekijk de woorden per bouwgroep en bewaar woorden voor later.</p></div><ArrowRight /></button>
        <button onClick={onReview}><span><BookmarkCheck /></span><div><small>{savedCount} bewaard</small><strong>Herhalen</strong><p>Alleen de woorden die je zelf hebt gekozen.</p></div><ArrowRight /></button>
      </section>

      <section className="cp-home-honesty">
        <Volume2 />
        <div><strong>Stap voor stap oefenen</strong><p>Open een bouwgroep, kies een leesstap en tik op Start les. Met Luister hoor je de gekoppelde opname.</p></div>
      </section>
    </div>
  );
}

function WordLibrary({ savedWordIds, onToggleWord, onBack, onToast }: { savedWordIds: string[]; onToggleWord: (wordId: string) => void; onBack: () => void; onToast: (message: string) => void }) {
  const [filter, setFilter] = useState<WordFilter>('all');
  const visibleWords = allPackageWords.filter((word) => filter === 'all' || filter === word.packageId || (filter === 'saved' && savedWordIds.includes(word.id)));
  return (
    <div className="learner-page word-library-page">
      <button className="text-back" onClick={onBack}><ArrowLeft />Terug naar home</button>
      <header className="content-page-heading"><div><span className="eyebrow">Woorden</span><h1>De woorden van Klink</h1><p>Elk woord staat bij zijn eerste leesmoment. Verschillende betekenissen hebben een eigen woordkaart.</p></div><div className="content-count"><strong>{allPackageWords.length}</strong><span>woordkaarten</span><small>volgens de Taalroute-indeling</small></div></header>
      <div className="word-filters" aria-label="Filter woorden">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Alles</button>
        {contentPackages.map((pack) => <button key={pack.id} className={filter === pack.id ? 'active' : ''} onClick={() => setFilter(pack.id)}>{pack.title}</button>)}
        <button className={filter === 'saved' ? 'active' : ''} onClick={() => setFilter('saved')}><Bookmark />Bewaard ({savedWordIds.length})</button>
      </div>
      {filter === 'saved' && visibleWords.length === 0 ? <section className="honest-empty"><Bookmark /><h2>Nog geen woorden bewaard</h2><p>Tik bij een woord op het vlaggetje. Dan verschijnt het hier en bij Herhalen.</p><button className="primary-button" onClick={() => setFilter('all')}>Bekijk alle woorden</button></section> : <section className="cp-global-word-grid">{visibleWords.map((word) => { const key = word.id; const saved = savedWordIds.includes(key); const audioLabel = word.audioStatus === 'rejected' ? `De opname van ${word.word} wordt vervangen` : word.audio ? `Luister naar ${word.word}` : `Audio van ${word.word} is nog niet gekoppeld`; return <article key={key}>{word.image ? <Image src={word.image} alt={word.meaning ?? word.word} width={760} height={760} /> : <span className="word-initial">{word.word.slice(0, 1)}</span>}<div><small>{getPackage(word.packageId).title}</small><strong>{word.word}</strong><span>{word.audioStatus === 'rejected' ? 'opname wordt vervangen' : word.meaning ?? word.segmentation.replaceAll('|', ' · ')}</span></div><button disabled={!word.audio} onClick={() => word.audio && playMedia(word.audio).catch(() => onToast('Het geluid kon niet worden afgespeeld.'))} aria-label={audioLabel} title={audioLabel}><Volume2 /></button><button className={saved ? 'saved' : ''} onClick={() => onToggleWord(key)} aria-label={`${word.word} ${saved ? 'niet meer bewaren' : 'bewaren'}`}>{saved ? <BookmarkCheck /> : <Bookmark />}</button></article>; })}</section>}
    </div>
  );
}

function ReviewQueue({ savedWordIds, onWords, onBack, onToast }: { savedWordIds: string[]; onWords: () => void; onBack: () => void; onToast: (message: string) => void }) {
  const items = allPackageWords.filter((word) => savedWordIds.includes(word.id));
  return (
    <div className="learner-page review-page">
      <button className="text-back" onClick={onBack}><ArrowLeft />Terug naar home</button>
      <header className="content-page-heading"><div><span className="eyebrow">Herhalen</span><h1>Jouw bewaarde woorden</h1><p>Geen verzonnen planning of deadline: alleen jouw eigen selectie.</p></div><div className="content-count"><strong>{items.length}</strong><span>bewaard</span><small>door jou gekozen</small></div></header>
      {items.length === 0 ? <section className="honest-empty"><RefreshCw /><h2>Nog niets om te herhalen</h2><p>Bewaar eerst één of meer woorden. Ze verschijnen daarna direct op deze plek.</p><button className="primary-button" onClick={onWords}>Kies woorden<ArrowRight /></button></section> : <section className="review-word-list"><header><div><span className="eyebrow">Jouw selectie</span><h2>Bekijk en beluister elk woord opnieuw</h2></div><small>Tik op een kaart om te luisteren</small></header><div>{items.map((word) => <button key={word.id} disabled={!word.audio} onClick={() => word.audio && playMedia(word.audio).catch(() => onToast('Het geluid kon niet worden afgespeeld.'))}>{word.image ? <Image src={word.image} alt="" width={760} height={760} /> : <span className="word-initial">{word.word.slice(0, 1)}</span>}<span><small>{getPackage(word.packageId).title}</small><strong>{word.word}</strong></span><Volume2 /></button>)}</div></section>}
    </div>
  );
}
