'use client';

import { Brand, playMedia, stopMedia } from '@/components/product/shared';
import { PackageLibrary, PackagePlayer } from '@/components/product/package-experience';
import {
  allPackageWords,
  contentPackages,
  getPackage,
  wordLabel,
  type PackageId,
  type LessonPosition,
  type PracticeAttempt,
} from '@/lib/package-content';
import { nextLessonPosition, parseProgress, progressKey, type RouteProgress } from '@/lib/learner-progress';
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
import { useEffect, useState } from 'react';

type LearnerView = 'home' | 'packages' | 'package' | 'words' | 'review';
type WordFilter = string;

export function LearnerApp({ onExit, onToast }: { onExit: () => void; onToast: (message: string) => void }) {
  const [view, setView] = useState<LearnerView>('home');
  const [selectedPackage, setSelectedPackage] = useState<PackageId>(contentPackages[0].id);
  const [progress, setProgress] = useState<RouteProgress>(() => {
    if (typeof window === 'undefined') return { completed: [] };
    try { return parseProgress(window.localStorage.getItem(progressKey), contentPackages); } catch { return { completed: [] }; }
  });
  const [resumePosition, setResumePosition] = useState<LessonPosition>();
  const [playerVisit, setPlayerVisit] = useState(0);
  const [savedWordIds, setSavedWordIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = JSON.parse(window.localStorage.getItem('klink.taalroute.savedWords.v1') ?? '[]') as unknown;
      return Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string') : [];
    } catch {
      return [];
    }
  });

  useEffect(() => { stopMedia(); return stopMedia; }, [view]);

  function saveProgress(next: RouteProgress) {
    setProgress(next);
    try { window.localStorage.setItem(progressKey, JSON.stringify(next)); }
    catch { onToast('Verdergaan wordt niet bewaard op dit apparaat. Oefenen kan doorgaan.'); }
  }

  function continueLearning() {
    if (!progress.position) { setView('home'); return; }
    setSelectedPackage(progress.position.packageId);
    setResumePosition(progress.position);
    setPlayerVisit(value => value + 1);
    setView('package');
  }

  function recordAttempt(attempt: PracticeAttempt) {
    try {
      const raw: unknown = JSON.parse(window.localStorage.getItem('klink.taalroute.attempts.v1') ?? '[]');
      const previous = Array.isArray(raw) ? raw.slice(-199) : [];
      window.localStorage.setItem('klink.taalroute.attempts.v1', JSON.stringify([...previous, attempt]));
    } catch { /* Results never prevent practice; no recording or identity is stored. */ }
  }

  function openPackage(packageId: PackageId) {
    setSelectedPackage(packageId);
    setResumePosition(undefined);
    setPlayerVisit(value => value + 1);
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
          <button aria-current={view === 'home' ? 'page' : undefined} className={view === 'home' ? 'active' : ''} onClick={continueLearning}><Home /><span>Verder</span></button>
          <button aria-current={view === 'packages' || view === 'package' ? 'page' : undefined} className={view === 'packages' || view === 'package' ? 'active' : ''} onClick={() => setView('packages')}><PackageOpen /><span>Lessen</span></button>
          <button aria-current={view === 'words' ? 'page' : undefined} className={view === 'words' ? 'active' : ''} onClick={() => setView('words')}><WholeWord /><span>Woorden</span></button>
          <button aria-current={view === 'review' ? 'page' : undefined} className={view === 'review' ? 'active' : ''} onClick={() => setView('review')}><RefreshCw /><span>Herhalen</span></button>
        </nav>
        <button className="learner-profile" onClick={() => { try { sessionStorage.removeItem('klink.instructies.v1'); } catch { /* Ending a session never requires storage. */ } onExit(); }}><small>Afsluiten</small><LogOut /></button>
      </aside>
      <main className="learner-main">
        {view === 'home' && <LearnerHome onPackage={openPackage} onPackages={() => setView('packages')} onWords={() => setView('words')} onReview={() => setView('review')} savedCount={savedWordIds.length} progress={progress} onContinue={continueLearning} />}
        {view === 'packages' && <PackageLibrary onBack={() => setView('home')} onOpen={openPackage} />}
        {view === 'package' && <PackagePlayer key={playerVisit} packageId={selectedPackage} onClose={() => setView('packages')} savedWordIds={savedWordIds} onToggleWord={toggleSavedWord} onToast={onToast} initialPosition={resumePosition} onPosition={position => saveProgress({ ...progress, position })} onLessonDone={lessonId => saveProgress({ completed: [...new Set([...progress.completed, lessonId])], position: nextLessonPosition(contentPackages, selectedPackage, lessonId) })} onAttempt={recordAttempt} />}
        {view === 'words' && <WordLibrary savedWordIds={savedWordIds} onToggleWord={toggleSavedWord} onBack={() => setView('home')} onToast={onToast} />}
        {view === 'review' && <ReviewQueue savedWordIds={savedWordIds} onWords={() => setView('words')} onBack={() => setView('home')} onToast={onToast} />}
      </main>
    </div>
  );
}

function LearnerHome({ onPackage, onPackages, onWords, onReview, savedCount, progress, onContinue }: { onPackage: (packageId: PackageId) => void; onPackages: () => void; onWords: () => void; onReview: () => void; savedCount: number; progress: RouteProgress; onContinue: () => void }) {
  const first = contentPackages.find(pack => pack.id === progress.position?.packageId) ?? contentPackages.find(pack => pack.lessons.some(lesson => !progress.completed.includes(lesson.id))) ?? contentPackages[0];
  const second = contentPackages[(contentPackages.indexOf(first) + 1) % contentPackages.length];
  const activeLesson = first.lessons.find(lesson => lesson.id === progress.position?.lessonId);
  return (
    <div className="learner-page cp-home">
      <header className="learner-page-head">
        <div><span className="cp-home-mark"><Layers3 /></span><span>Welkom bij Klink</span><h1>{progress.position ? 'Ga verder' : 'Begin met oefenen'}</h1></div>
      </header>

      <section className="cp-home-hero">
        <div>
          <span className="eyebrow light">{activeLesson ? `Les ${first.lessons.indexOf(activeLesson) + 1}` : 'Kijk en luister'}</span>
          <h2>{first.title}</h2>
          <p>{progress.position ? 'Ga door waar je was.' : 'Begin samen met je docent.'}</p>
          <button className="accent-button" onClick={() => progress.position ? onContinue() : onPackage(first.id)}>{progress.position ? 'Ga verder' : 'Begin hier'}<ArrowRight /></button>
        </div>
        <div className="cp-home-facts">
          <span><strong>{first.counts.lessons}</strong><small>lessen</small></span>
          <span><strong>{first.counts.coreWords}</strong><small>kernwoorden</small></span>
        </div>
      </section>

      <section className="cp-home-second">
        <span><PackageOpen /></span>
        <div><small>Daarna</small><strong>{second.title}</strong><p>{second.counts.lessons} lessen · {second.counts.coreWords} woorden</p></div>
        <button className="secondary-button" onClick={() => onPackage(second.id)}>Bekijk de lessen<ArrowRight /></button>
      </section>

      <section className="cp-home-actions">
        <button onClick={onPackages}><span><Route /></span><div><small>Alles bij elkaar</small><strong>Bekijk de lessen</strong><p>Open een lessenreeks en kies waar je wilt beginnen.</p></div><ArrowRight /></button>
        <button onClick={onWords}><span><WholeWord /></span><div><small>Luisteren en bewaren</small><strong>Bekijk alle woorden</strong><p>Tik op een woord om te luisteren.</p></div><ArrowRight /></button>
        <button onClick={onReview}><span><BookmarkCheck /></span><div><small>{savedCount} bewaard</small><strong>Herhalen</strong><p>Alleen de woorden die je zelf hebt gekozen.</p></div><ArrowRight /></button>
      </section>

      <section className="cp-home-honesty">
        <Volume2 />
        <div><strong>Luister nog een keer</strong><p>Tik op het woord, de foto of op Luister.</p></div>
      </section>
    </div>
  );
}

function WordLibrary({ savedWordIds, onToggleWord, onBack, onToast }: { savedWordIds: string[]; onToggleWord: (wordId: string) => void; onBack: () => void; onToast: (message: string) => void }) {
  const [filter, setFilter] = useState<WordFilter>('all');
  const visibleWords = allPackageWords.filter((word) => filter === 'all' || filter === word.packageId || (filter === 'saved' && savedWordIds.includes(word.id)));
  return (
    <div className="learner-page word-library-page">
      <button className="text-back" onClick={onBack}><ArrowLeft />Terug</button>
      <header className="content-page-heading"><div><span className="eyebrow">Woorden</span><h1>De woorden van Klink</h1><p>Tik op een woord om te luisteren. Bewaar een woord om het nog eens te oefenen.</p></div><div className="content-count"><strong>{allPackageWords.length}</strong><span>woorden</span></div></header>
      <div className="word-filters" aria-label="Filter woorden">
        <button className={filter === 'all' ? 'active' : ''} onClick={() => setFilter('all')}>Alles</button>
        {contentPackages.map((pack) => <button key={pack.id} className={filter === pack.id ? 'active' : ''} onClick={() => setFilter(pack.id)}>{pack.title}</button>)}
        <button className={filter === 'saved' ? 'active' : ''} onClick={() => setFilter('saved')}><Bookmark />Bewaard ({savedWordIds.length})</button>
      </div>
      {filter === 'saved' && visibleWords.length === 0 ? <section className="honest-empty"><Bookmark /><h2>Nog geen woorden bewaard</h2><p>Tik bij een woord op Bewaar. Je vindt het daarna bij Herhalen.</p><button className="primary-button" onClick={() => setFilter('all')}>Bekijk alle woorden</button></section> : <section className="cp-global-word-grid">{visibleWords.map((word) => { const saved = savedWordIds.includes(word.id); return <article key={word.id}><button className="cp-word-listen" disabled={!word.audio} onClick={() => word.audio && playMedia(word.audio).catch(() => onToast('Luisteren lukt niet. Probeer het nog eens.'))} aria-label={word.audio ? `Luister naar ${wordLabel(word)}` : `${wordLabel(word)}. Lees samen met je docent.`}>{word.image ? <Image src={word.image} alt="" width={760} height={760} /> : <span className="word-initial" aria-hidden="true">{word.word.slice(0, 1)}</span>}<div><strong>{wordLabel(word)}</strong><span>{word.audio ? <><Volume2 /> Luister</> : 'Lees samen'}</span></div></button><button className={saved ? 'saved' : ''} onClick={() => onToggleWord(word.id)} aria-pressed={saved} aria-label={`${wordLabel(word)} ${saved ? 'niet meer bewaren' : 'bewaren'}`}>{saved ? <BookmarkCheck /> : <Bookmark />}<span>{saved ? 'Bewaard' : 'Bewaar'}</span></button></article>; })}</section>}
    </div>
  );
}

function ReviewQueue({ savedWordIds, onWords, onBack, onToast }: { savedWordIds: string[]; onWords: () => void; onBack: () => void; onToast: (message: string) => void }) {
  const items = allPackageWords.filter((word) => savedWordIds.includes(word.id));
  return (
    <div className="learner-page review-page">
      <button className="text-back" onClick={onBack}><ArrowLeft />Terug</button>
      <header className="content-page-heading"><div><span className="eyebrow">Herhalen</span><h1>Jouw bewaarde woorden</h1><p>Deze woorden zijn bewaard op dit apparaat. Tik op een woord en luister.</p></div><div className="content-count"><strong>{items.length}</strong><span>bewaard</span></div></header>
      {items.length === 0 ? <section className="honest-empty"><RefreshCw /><h2>Nog niets om te herhalen</h2><p>Bewaar eerst één of meer woorden. Ze verschijnen daarna direct op deze plek.</p><button className="primary-button" onClick={onWords}>Kies woorden<ArrowRight /></button></section> : <section className="review-word-list"><header><div><span className="eyebrow">Jouw selectie</span><h2>Bekijk en beluister elk woord opnieuw</h2></div><small>Tik op een kaart om te luisteren</small></header><div>{items.map((word) => <button key={word.id} disabled={!word.audio} onClick={() => word.audio && playMedia(word.audio).catch(() => onToast('Het geluid kon niet worden afgespeeld.'))}>{word.image ? <Image src={word.image} alt="" width={760} height={760} /> : <span className="word-initial">{word.word.slice(0, 1)}</span>}<span><small>{getPackage(word.packageId).title}</small><strong>{wordLabel(word)}</strong><small>{word.audio ? 'Luister' : 'Lees samen met je docent'}</small></span>{word.audio && <Volume2 />}</button>)}</div></section>}
    </div>
  );
}
