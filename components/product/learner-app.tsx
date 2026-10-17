'use client';

import { Brand, playMedia, stopMedia } from '@/components/product/shared';
import { PackageGrid, PackageLibrary, PackagePlayer } from '@/components/product/package-experience';
import { PackageMixedPractice } from '@/components/product/package-mixed-practice';
import { PracticeChapters, PracticeChapterCards } from '@/components/product/practice-chapters';
import { chapterHash } from '@/lib/practice-chapters';
import { mixedReviewPack } from '@/lib/mixed-practice';
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
import { lessonPreviewWords } from '@/lib/taalroute-packages';
import { learnerListName } from '@/lib/learner-copy';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Home,
  Grid2X2,
  Layers3,
  LogOut,
  PackageOpen,
  RefreshCw,
  Volume2,
  WholeWord,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

type LearnerView = 'home' | 'packages' | 'package' | 'words' | 'review' | 'chapters';
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
  useEffect(() => {
    const restore = () => {
      const route = window.location.hash.split('/')[1]?.split('?')[0];
      if (route === 'chapters') setView('chapters');
      else if (route === 'packages' || route === 'words' || route === 'review' || route === 'home') setView(route);
    };
    restore(); window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, []);

  function openView(next: LearnerView) {
    setView(next);
    // Existing screens still reload at the resumable home; only chapters add deep links.
    if (window.location.hash !== '#learner/home') window.history.pushState(null, '', '#learner/home');
  }
  function openChapter(chapter?: string) { setView('chapters'); window.location.hash = chapterHash({ chapter, level: 'all' }); }

  function saveProgress(next: RouteProgress) {
    setProgress(next);
    try { window.localStorage.setItem(progressKey, JSON.stringify(next)); }
    catch { onToast('Verdergaan wordt niet bewaard op dit apparaat. Oefenen kan doorgaan.'); }
  }

  function continueLearning() {
    if (!progress.position) { openView('home'); return; }
    setSelectedPackage(progress.position.packageId);
    setResumePosition(progress.position);
    setPlayerVisit(value => value + 1);
    openView('package');
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
    openView('package');
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
        <button className="brand-button" onClick={() => openView('home')} aria-label="Naar het begin"><Brand /></button>
        <nav aria-label="Cursistnavigatie">
          <button aria-current={view === 'home' ? 'page' : undefined} className={view === 'home' ? 'active' : ''} onClick={continueLearning}><Home /><span>Verder</span></button>
          <button aria-current={view === 'packages' || view === 'package' ? 'page' : undefined} className={view === 'packages' || view === 'package' ? 'active' : ''} onClick={() => openView('packages')}><PackageOpen /><span>Lessen</span></button>
          <button aria-current={view === 'chapters' ? 'page' : undefined} className={view === 'chapters' ? 'active' : ''} onClick={() => openChapter()}><Grid2X2 /><span>Oefenen</span></button>
          <button aria-current={view === 'words' ? 'page' : undefined} className={view === 'words' ? 'active' : ''} onClick={() => openView('words')}><WholeWord /><span>Woorden</span></button>
          <button aria-current={view === 'review' ? 'page' : undefined} className={view === 'review' ? 'active' : ''} onClick={() => openView('review')}><RefreshCw /><span>Herhalen</span></button>
        </nav>
        <button className="learner-profile" onClick={() => { try { sessionStorage.removeItem('klink.instructies.v1'); } catch { /* Ending a session never requires storage. */ } onExit(); }}><small>Afsluiten</small><LogOut /></button>
      </aside>
      <main className="learner-main">
        {view === 'home' && <LearnerHome onPackage={openPackage} onPackages={() => openView('packages')} onWords={() => openView('words')} onReview={() => openView('review')} onChapter={openChapter} savedCount={savedWordIds.length} progress={progress} onContinue={continueLearning} />}
        {view === 'packages' && <PackageLibrary onBack={() => openView('home')} onOpen={openPackage} />}
        {view === 'package' && <PackagePlayer key={playerVisit} packageId={selectedPackage} onClose={() => openView('packages')} savedWordIds={savedWordIds} onToggleWord={toggleSavedWord} onToast={onToast} initialPosition={resumePosition} onPosition={position => saveProgress({ ...progress, position })} onLessonDone={lessonId => saveProgress({ completed: [...new Set([...progress.completed, lessonId])], position: nextLessonPosition(contentPackages, selectedPackage, lessonId) })} onAttempt={recordAttempt} />}
        {view === 'words' && <WordLibrary savedWordIds={savedWordIds} onToggleWord={toggleSavedWord} onBack={() => openView('home')} onToast={onToast} />}
        {view === 'review' && <ReviewQueue savedWordIds={savedWordIds} completed={progress.completed} onAttempt={recordAttempt} onWords={() => openView('words')} onBack={() => openView('home')} onToast={onToast} />}
        {view === 'chapters' && <PracticeChapters onBack={() => openView('home')} onAttempt={recordAttempt} />}
      </main>
    </div>
  );
}

function LearnerHome({ onPackage, onPackages, onWords, onReview, onChapter, savedCount, progress, onContinue }: { onPackage: (packageId: PackageId) => void; onPackages: () => void; onWords: () => void; onReview: () => void; onChapter: (chapter: string) => void; savedCount: number; progress: RouteProgress; onContinue: () => void }) {
  const first = contentPackages.find(pack => pack.id === progress.position?.packageId) ?? contentPackages.find(pack => pack.lessons.some(lesson => !progress.completed.includes(lesson.id))) ?? contentPackages[0];
  const activeLesson = first.lessons.find(lesson => lesson.id === progress.position?.lessonId);
  const preview = activeLesson ? lessonPreviewWords(first, activeLesson).find(word => word.image) : undefined;
  const previewImage = preview?.image ?? first.cover?.image;
  return (
    <div className="learner-page cp-home">
      <header className="learner-page-head">
        <div><span className="cp-home-mark"><Layers3 /></span><h1>{progress.position ? 'Ga verder' : 'Oefenen'}</h1></div>
      </header>

      <section className="cp-home-hero">
        <div>
          <span className="eyebrow light">{activeLesson ? `Les ${first.lessons.indexOf(activeLesson) + 1}` : 'Kijk en luister'}</span>
          <h2>{activeLesson ? lessonPreviewWords(first, activeLesson).map(wordLabel).join(' · ') : learnerListName(first)}</h2>
          <button className="accent-button" onClick={() => progress.position ? onContinue() : onPackage(first.id)}>{progress.position ? 'Ga verder' : 'Begin hier'}<ArrowRight /></button>
        </div>
        <div className="cp-home-preview">
          {previewImage && <Image src={previewImage} alt={preview ? wordLabel(preview) : first.cover?.label ?? ''} width={240} height={240} />}
          <div className="cp-home-facts"><span><strong>{first.counts.lessons}</strong><small>lessen</small></span><span><strong>{first.counts.coreWords}</strong><small>woorden</small></span></div>
        </div>
      </section>

      <div className="cp-home-shortcuts">
        <button className="secondary-button" onClick={onWords}><WholeWord />Alle woorden</button>
        <button className="secondary-button" onClick={onReview}><BookmarkCheck />Nog een keer{savedCount > 0 && ` (${savedCount})`}</button>
      </div>
      <header className="cp-all-lists-heading"><h2>Alle onderdelen</h2><button className="text-back" onClick={onPackages}>Alle lessen<ArrowRight /></button></header>
      <PackageGrid onOpen={onPackage} />
      <section className="cp-home-chapters"><h2>Oefenen</h2><PracticeChapterCards onOpen={onChapter} /></section>
    </div>
  );
}

function WordLibrary({ savedWordIds, onToggleWord, onBack, onToast }: { savedWordIds: string[]; onToggleWord: (wordId: string) => void; onBack: () => void; onToast: (message: string) => void }) {
  const [filter, setFilter] = useState<WordFilter>('all');
  const visibleWords = allPackageWords.filter((word) => filter === 'all' || filter === word.packageId || (filter === 'saved' && savedWordIds.includes(word.id)));
  return (
    <div className="learner-page word-library-page">
      <button className="text-back" onClick={onBack}><ArrowLeft />Terug</button>
      <header className="content-page-heading"><div><h1>Alle woorden</h1><p>Tik en luister.</p></div><div className="content-count"><strong>{allPackageWords.length}</strong><span>woorden</span></div></header>
      <div className="word-filters" aria-label="Filter woorden">
        <label>Kies een onderdeel<select value={filter} onChange={event => setFilter(event.target.value)}><option value="all">Alle woorden</option>{contentPackages.map((pack, index) => <option key={pack.id} value={pack.id}>{index + 1}. {learnerListName(pack)}</option>)}<option value="saved">Bewaard ({savedWordIds.length})</option></select></label>
      </div>
      {filter === 'saved' && visibleWords.length === 0 ? <section className="honest-empty"><Bookmark /><h2>Nog geen woorden bewaard</h2><p>Tik bij een woord op Bewaar. Je vindt het daarna bij Herhalen.</p><button className="primary-button" onClick={() => setFilter('all')}>Bekijk alle woorden</button></section> : <section className="cp-global-word-grid">{visibleWords.map((word) => { const saved = savedWordIds.includes(word.id); return <article key={word.id}><button className="cp-word-listen" disabled={!word.audio} onClick={() => word.audio && playMedia(word.audio).catch(() => onToast('Luisteren lukt niet. Probeer het nog eens.'))} aria-label={word.audio ? `Luister naar ${wordLabel(word)}` : `${wordLabel(word)}. Lees samen met je docent.`}>{word.image ? <Image src={word.image} alt="" width={760} height={760} /> : <span className="word-initial" aria-hidden="true">{word.word.slice(0, 1)}</span>}<div><strong>{wordLabel(word)}</strong><span>{word.audio ? <><Volume2 /> Luister</> : 'Lees samen'}</span></div></button><button className={saved ? 'saved' : ''} onClick={() => onToggleWord(word.id)} aria-pressed={saved} aria-label={`${wordLabel(word)} ${saved ? 'niet meer bewaren' : 'bewaren'}`}>{saved ? <BookmarkCheck /> : <Bookmark />}<span>{saved ? 'Bewaard' : 'Bewaar'}</span></button></article>; })}</section>}
    </div>
  );
}

function ReviewQueue({ savedWordIds, completed, onAttempt, onWords, onBack, onToast }: { savedWordIds: string[]; completed: string[]; onAttempt: (attempt: PracticeAttempt) => void; onWords: () => void; onBack: () => void; onToast: (message: string) => void }) {
  const [mixed, setMixed] = useState(false);
  const pack = useMemo(() => mixedReviewPack(contentPackages, completed, savedWordIds), [completed, savedWordIds]);
  const items = allPackageWords.filter((word) => savedWordIds.includes(word.id));
  if (mixed) return <div className="learner-page"><PackageMixedPractice pack={pack} onAudio={(source, options) => source ? playMedia(source, options) : false} onBack={() => setMixed(false)} onAttempt={onAttempt} /></div>;
  return (
    <div className="learner-page review-page">
      <button className="text-back" onClick={onBack}><ArrowLeft />Terug</button>
      <header className="content-page-heading"><div><span className="eyebrow">Herhalen</span><h1>Nog een keer</h1><p>Tik en luister.</p></div><div className="content-count"><strong>{items.length}</strong><span>bewaard</span></div></header>
      {pack.words.length >= 2 && <div className="cp-review-mixed"><button className="primary-button" onClick={() => { stopMedia(); setMixed(true); }}><RefreshCw aria-hidden="true" />Alles oefenen<ArrowRight aria-hidden="true" /></button></div>}
      {items.length === 0 ? (pack.words.length >= 2 ? null : <section className="honest-empty"><RefreshCw /><h2>Kies eerst een woord</h2><p>Tik bij een woord op Bewaar.</p><button className="primary-button" onClick={onWords}>Kies woorden<ArrowRight /></button></section>) : <section className="review-word-list"><header><div><span className="eyebrow"></span><h2>Jouw woorden</h2></div><small>Tik op een kaart om te luisteren</small></header><div>{items.map((word) => <button key={word.id} disabled={!word.audio} onClick={() => word.audio && playMedia(word.audio).catch(() => onToast('Het geluid kon niet worden afgespeeld.'))}>{word.image ? <Image src={word.image} alt="" width={760} height={760} /> : <span className="word-initial">{word.word.slice(0, 1)}</span>}<span><small>{learnerListName(getPackage(word.packageId))}</small><strong>{wordLabel(word)}</strong><small>{word.audio ? 'Luister' : 'Lees samen met je docent'}</small></span>{word.audio && <Volume2 />}</button>)}</div></section>}
    </div>
  );
}
