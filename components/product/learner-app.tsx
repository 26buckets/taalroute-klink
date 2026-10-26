'use client';

import { wordWithArticle } from '@/lib/word-articles';
import { libraryWords, wordLengths, type WordLibrarySource } from '@/lib/word-library';

import { setSlowAudio } from '@/lib/media-player';
import { playMedia, stopMedia } from '@/components/product/shared';
import { PackageGrid, PackageLibrary, PackagePlayer } from '@/components/product/package-experience';
import { PackageMixedPractice } from '@/components/product/package-mixed-practice';
import { PracticeChapters, PracticeChapterCards } from '@/components/product/practice-chapters';
import type { ContentLevel } from '@/lib/content-levels';
import { chapterCollections, chapterHash, chapterForLevel } from '@/lib/practice-chapters';
import { learningReviewKey, parseLearningReview, updateLearningReview } from '@/lib/learning-review';
import { mixedReviewPack } from '@/lib/mixed-practice';
import {
  allPackageWords,
  contentPackages,
  lessonPackages,
  getPackage,
  wordLabel,
  type PackageId,
  type LessonPosition,
  type PracticeAttempt,
} from '@/lib/package-content';
import { homeLessonPosition, nextLessonPosition, parseProgress, progressKey, type RouteProgress } from '@/lib/learner-progress';
import { lessonPreviewWords } from '@/lib/taalroute-packages';
import { learnerListName } from '@/lib/learner-copy';
import { MyRoute, useRouteSettings } from './route-settings';
import { PracticeLine } from './practice-line';
import { SoundReference } from './sound-reference';
import { chapterRouteAxis } from '@/lib/learner-route';
import { levelLabel } from '@/lib/content-levels';
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
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Volume2,
  WholeWord,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

type LearnerView = 'home' | 'packages' | 'package' | 'words' | 'review' | 'chapters' | 'sounds';

export function LearnerApp({ onExit, onToast }: { onExit: () => void; onToast: (message: string) => void }) {
  const { settings } = useRouteSettings();
  const [view, setView] = useState<LearnerView>('home');
  const [navCollapsed, setNavCollapsed] = useState(() => {
    try { return typeof window !== 'undefined' && sessionStorage.getItem('klink.nav-collapsed.v1') === 'true'; } catch { return false; }
  });
  function toggleNavigation() {
    const next = !navCollapsed;
    setNavCollapsed(next);
    try { sessionStorage.setItem('klink.nav-collapsed.v1', String(next)); } catch { /* Navigation remains usable without storage. */ }
  }
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
      const [, route, packageId] = window.location.hash.split('?')[0].split('/');
      if (route === 'package') {
        const pack = contentPackages.find(item => item.id === packageId);
        if (pack) {
          setSelectedPackage(pack.id);
          setResumePosition(undefined);
          setPlayerVisit(value => value + 1);
          setView('package');
        } else setView('packages');
      } else if (route === 'chapters') setView('chapters');
      else if (route === 'sounds') setView('sounds');
      else if (route === 'packages' || route === 'words' || route === 'review') setView(route);
      else setView('home');
    };
    restore(); window.addEventListener('hashchange', restore); window.addEventListener('popstate', restore);
    return () => { window.removeEventListener('hashchange', restore); window.removeEventListener('popstate', restore); };
  }, []);

  function openView(next: LearnerView, packageId = selectedPackage) {
    stopMedia();
    document.querySelector('.learner-main')?.scrollTo({ top: 0 });
    setView(next);
    const hash = next === 'package' ? `#learner/package/${packageId}` : `#learner/${next}`;
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  }
  function openChapter(chapter?: string, level: ContentLevel = settings[chapterRouteAxis(chapter)]) { setView('chapters'); window.location.hash = chapterHash({ chapter, level }); }

  function saveProgress(next: RouteProgress) {
    setProgress(next);
    try { window.localStorage.setItem(progressKey, JSON.stringify(next)); }
    catch { onToast('Verdergaan wordt niet bewaard op dit apparaat. Oefenen kan doorgaan.'); }
  }

  function openLesson(position: LessonPosition) {
    setSelectedPackage(position.packageId);
    setResumePosition(position);
    setPlayerVisit(value => value + 1);
    openView('package', position.packageId);
  }

  function recordAttempt(attempt: PracticeAttempt) {
    if (attempt.reviewEligible) {
      try { localStorage.setItem(learningReviewKey, JSON.stringify(updateLearningReview(parseLearningReview(localStorage.getItem(learningReviewKey)), attempt))); } catch { /* Optional on-device scheduling never prevents practice. */ }
    }
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
    openView('package', packageId);
  }

  function toggleSavedWord(wordId: string) {
    setSavedWordIds((current) => {
      const next = current.includes(wordId) ? current.filter((item) => item !== wordId) : [...current, wordId];
      try { window.localStorage.setItem('klink.taalroute.savedWords.v1', JSON.stringify(next)); } catch { onToast('Bewaren lukt niet op dit apparaat. Oefenen kan doorgaan.'); }
      return next;
    });
  }

  return (
    <div className={`learner-app consistent-layout${navCollapsed ? ' is-collapsed' : ''}`}>
      <aside className="learner-nav">
        <nav id="klink-learner-navigation" aria-label="Cursistnavigatie">
          <button title="Start" aria-current={view === 'home' ? 'page' : undefined} className={view === 'home' ? 'active' : ''} onClick={() => openView('home')}><Home /><span>Start</span></button>
          <button title="Lessen" aria-current={view === 'packages' || view === 'package' ? 'page' : undefined} className={view === 'packages' || view === 'package' ? 'active' : ''} onClick={() => openView('packages')}><PackageOpen /><span>Lessen</span></button>
          <button title="Oefenen" aria-current={view === 'chapters' || view === 'sounds' ? 'page' : undefined} className={view === 'chapters' || view === 'sounds' ? 'active' : ''} onClick={() => openChapter()}><Grid2X2 /><span>Oefenen</span></button>
          <button title="Woorden" aria-current={view === 'words' ? 'page' : undefined} className={view === 'words' ? 'active' : ''} onClick={() => openView('words')}><WholeWord /><span>Woorden</span></button>
          <button title="Herhalen" aria-current={view === 'review' ? 'page' : undefined} className={view === 'review' ? 'active' : ''} onClick={() => openView('review')}><RefreshCw /><span>Herhalen</span></button>
        </nav>
        <button className="secondary-button cp-nav-toggle" type="button" onClick={toggleNavigation} aria-expanded={!navCollapsed} aria-controls="klink-learner-navigation" aria-label={navCollapsed ? 'Menu uitklappen' : 'Menu inklappen'} title={navCollapsed ? 'Menu uitklappen' : 'Menu inklappen'}>{navCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</button>
        <button className="learner-profile" onClick={() => { try { sessionStorage.removeItem('klink.instructies.v1'); } catch { /* Ending a session never requires storage. */ } setSlowAudio(false); onExit(); }}><small>Afsluiten</small><LogOut /></button>
      </aside>
      <main className="learner-main">
        {view === 'home' && <LearnerHome onPackage={openPackage} onPackages={() => openView('packages')} onWords={() => openView('words')} onReview={() => openView('review')} onChapter={openChapter} savedCount={savedWordIds.length} progress={progress} onLesson={openLesson} />}
        {view === 'packages' && <PackageLibrary onBack={() => openView('home')} onOpen={openPackage} />}
        {view === 'package' && <PackagePlayer key={playerVisit} packageId={selectedPackage} onClose={() => openView('packages')} savedWordIds={savedWordIds} onToggleWord={toggleSavedWord} onToast={onToast} initialPosition={resumePosition} onPosition={position => saveProgress({ ...progress, position })} onLessonDone={lessonId => saveProgress({ completed: [...new Set([...progress.completed, lessonId])], position: nextLessonPosition(contentPackages, selectedPackage, lessonId) })} onOpenLesson={openLesson} onAttempt={recordAttempt} />}
        {view === 'words' && <WordLibrary savedWordIds={savedWordIds} onToggleWord={toggleSavedWord} onBack={() => openView('home')} onToast={onToast} />}
        {view === 'review' && <ReviewQueue savedWordIds={savedWordIds} completed={progress.completed} onAttempt={recordAttempt} onWords={() => openView('words')} onBack={() => openView('home')} onToast={onToast} />}
        {view === 'chapters' && <PracticeChapters onBack={() => openView('home')} onAttempt={recordAttempt} />}
        {view === 'sounds' && <SoundReference onBack={() => openChapter('sounds')} onLesson={openLesson} />}
      </main>
    </div>
  );
}

function LearnerHome({ onPackage, onPackages, onWords, onReview, onChapter, savedCount, progress, onLesson }: { onPackage: (packageId: PackageId) => void; onPackages: () => void; onWords: () => void; onReview: () => void; onChapter: (chapter: string, level?: ContentLevel) => void; savedCount: number; progress: RouteProgress; onLesson: (position: LessonPosition) => void }) {
  const { settings } = useRouteSettings();
  const position = homeLessonPosition(lessonPackages, progress, settings.literacy);
  const first = lessonPackages.find(pack => pack.id === position?.packageId) ?? contentPackages[0];
  const activeLesson = first.lessons.find(lesson => lesson.id === position?.lessonId);
  const selectedLevel = settings.literacy !== 'all' ? settings.literacy : settings.language;
  const browseChapter = chapterForLevel(selectedLevel, selectedLevel.startsWith('alfa-') ? 'words' : 'texts');
  const languageRoute = settings.literacy === 'all' && settings.language !== 'all';
  const canResume = Boolean(position && position === progress.position && !languageRoute);
  const preview = activeLesson ? lessonPreviewWords(first, activeLesson).find(word => word.image) : undefined;
  const previewImage = preview?.image ?? first.cover?.image;
  return (
    <div className="learner-page cp-home">
      <header className="learner-page-head cp-context-header">
        <span className="cp-context-icon"><Layers3 /></span><h1>{languageRoute || !position ? 'Jouw route' : canResume ? 'Ga verder' : 'Begin hier'}</h1>
      </header>

      <details className="cp-level-picker cp-home-route">
        <summary>Samen met je docent</summary>
        <MyRoute onBrowse={() => onChapter(browseChapter, selectedLevel)} />
      </details>

      {languageRoute || !position ? <section className="cp-home-hero"><div><h2>{languageRoute ? `Nederlands gebruiken · ${levelLabel(settings.language)}` : levelLabel(settings.literacy)}</h2><p>{languageRoute ? 'Bekijk het aanbod bij jouw route. Een niveaukeuze is geen behaald niveau.' : 'Voor deze keuze is nog geen leesroute ingedeeld.'}</p><button className="accent-button" onClick={() => onChapter(browseChapter, selectedLevel)}>Bekijk aanbod<ArrowRight /></button></div></section> : <section className="cp-home-hero">
        <div>
          <span className="eyebrow light">{canResume && activeLesson ? `Les ${first.lessons.indexOf(activeLesson) + 1}` : 'Kijk en luister'}</span>
          <h2>{activeLesson ? lessonPreviewWords(first, activeLesson).map(wordLabel).join(' · ') : learnerListName(first)}</h2>
          <button className="accent-button" onClick={() => onLesson(position)}>{canResume ? 'Ga verder' : 'Begin hier'}<ArrowRight /></button>
        </div>
        <div className="cp-home-preview">
          {previewImage && <Image src={previewImage} alt={preview ? wordLabel(preview) : first.cover?.label ?? ''} width={240} height={240} />}
          <div className="cp-home-facts"><span><strong>{first.counts.lessons}</strong><small>lessen</small></span><span><strong>{first.counts.coreWords}</strong><small>woorden</small></span></div>
        </div>
      </section>}

      <PracticeLine />

      <div className="cp-home-shortcuts">
        <button className="secondary-button" onClick={onWords}><WholeWord />Alle woorden</button>
        <button className="secondary-button" onClick={onReview}><BookmarkCheck />Nog een keer{savedCount > 0 && ` (${savedCount})`}</button>
      </div>
      <header className="cp-all-lists-heading"><h2>Oefenen met woorden</h2><button className="text-back" onClick={onPackages}>Alle lessen<ArrowRight /></button></header>
      <PackageGrid onOpen={onPackage} />
      <section className="cp-home-chapters"><h2>Oefenen met vaardigheden</h2><PracticeChapterCards onOpen={onChapter} /></section>
    </div>
  );
}

function WordLibrary({ savedWordIds, onToggleWord, onBack, onToast }: { savedWordIds: string[]; onToggleWord: (wordId: string) => void; onBack: () => void; onToast: (message: string) => void }) {
  const [source, setSource] = useState<WordLibrarySource>('lessons');
  const [lessonFilter, setLessonFilter] = useState('all');
  const [extraFilter, setExtraFilter] = useState('2-4');
  const visibleWords = useMemo(() => libraryWords(source, source === 'lessons' ? lessonFilter : extraFilter, savedWordIds), [source, lessonFilter, extraFilter, savedWordIds]);
  return (
    <div className="learner-page word-library-page">
      <header className="cp-context-header"><button className="text-back" onClick={onBack} aria-label="Terug" title="Terug"><ArrowLeft /></button><h1>Alle woorden</h1><small className="cp-context-meta">{visibleWords.length} woorden</small></header>
      <div className="cp-page-workspace">
      <p>Tik en luister.</p>
      <div className="word-filters" aria-label="Filter woorden">
        <label>Welke woorden?<select aria-label="Welke woorden?" value={source} onChange={event => setSource(event.target.value as WordLibrarySource)}><option value="lessons">Woorden uit de lessen</option><option value="extra">Meer woorden</option><option value="saved">Bewaard ({savedWordIds.length})</option></select></label>
        {source === 'lessons' && <label>Kies een lespakket<select aria-label="Kies een lespakket" value={lessonFilter} onChange={event => setLessonFilter(event.target.value)}><option value="all">Alle lespakketten</option>{lessonPackages.map((pack, index) => <option key={pack.id} value={pack.id}>{index + 1}. {learnerListName(pack)}</option>)}</select></label>}
        {source === 'extra' && <label>Kies woorden<select aria-label="Kies woorden" value={extraFilter} onChange={event => setExtraFilter(event.target.value)}><option value="all">Alle extra woorden</option><optgroup label="Aantal letters">{wordLengths.map(item => <option key={item.id} value={item.id}>{item.label}</option>)}</optgroup><optgroup label="Met een teken"><option value="signs">Met &apos; of -</option></optgroup></select></label>}
      </div>
      {source === 'extra' && extraFilter === 'signs' && <p>Bijvoorbeeld: zo&apos;n en e-mail.</p>}
      {source === 'saved' && visibleWords.length === 0 ? <section className="honest-empty"><Bookmark /><h2>Nog geen woorden bewaard</h2><p>Tik bij een woord op Bewaar. Je vindt het daarna bij Herhalen.</p><button className="primary-button" onClick={() => setSource('lessons')}>Bekijk woorden uit de lessen</button></section> : <section className="cp-global-word-grid">{visibleWords.map((word) => { const saved = savedWordIds.includes(word.id); return <article key={word.id}><button className="cp-word-listen" disabled={!word.audio} onClick={() => word.audio && playMedia(word.audio).catch(() => onToast('Luisteren lukt niet. Probeer het nog eens.'))} aria-describedby={wordWithArticle(word) ? `article-global-${word.id}` : undefined} aria-label={word.audio ? `Luister naar ${wordLabel(word)}` : `${wordLabel(word)}. Lees samen met je docent.`}>{word.image ? <Image src={word.image} alt="" width={760} height={760} /> : <span className="word-initial" aria-hidden="true">{word.word.slice(0, 1)}</span>}<div><strong>{wordLabel(word)}</strong>{wordWithArticle(word) && <small id={`article-global-${word.id}`} className="cp-word-article">{wordWithArticle(word)}</small>}<span>{word.audio ? <><Volume2 /> Luister</> : 'Lees samen'}</span></div></button><button className={saved ? 'saved' : ''} onClick={() => onToggleWord(word.id)} aria-pressed={saved} aria-label={`${wordLabel(word)} ${saved ? 'niet meer bewaren' : 'bewaren'}`}>{saved ? <BookmarkCheck /> : <Bookmark />}<span>{saved ? 'Bewaard' : 'Bewaar'}</span></button></article>; })}</section>}
      </div>
    </div>
  );
}

function ReviewQueue({ savedWordIds, completed, onAttempt, onWords, onBack, onToast }: { savedWordIds: string[]; completed: string[]; onAttempt: (attempt: PracticeAttempt) => void; onWords: () => void; onBack: () => void; onToast: (message: string) => void }) {
  const [mixed, setMixed] = useState(false);
  const pack = useMemo(() => mixedReviewPack(contentPackages, completed, savedWordIds), [completed, savedWordIds]);
  const [hasScheduled] = useState(() => {
    try {
      const review = parseLearningReview(localStorage.getItem(learningReviewKey));
      return chapterCollections('learning-review').some(collection => collection.exercises.some(exercise => review[exercise.exerciseId]?.due <= Date.now()));
    } catch { return false; }
  });
  const items = allPackageWords.filter((word) => savedWordIds.includes(word.id));
  if (mixed) return <div className="learner-page"><PackageMixedPractice pack={pack} onAudio={(source, options) => source ? playMedia(source, options) : false} onBack={() => setMixed(false)} onAttempt={onAttempt} /></div>;
  return (
    <div className="learner-page review-page">
      <header className="cp-context-header"><button className="text-back" onClick={onBack} aria-label="Terug" title="Terug"><ArrowLeft /></button><h1>Nog een keer</h1><small className="cp-context-meta">{items.length} bewaard</small></header>
      <div className="cp-page-workspace">
      <p>Tik en luister.</p>
      {hasScheduled && <div className="cp-review-mixed"><a className="primary-button" href={chapterHash({ chapter: 'repeat', activity: 'learning-review', level: 'all' })} onClick={stopMedia}><RefreshCw aria-hidden="true" />Oefen opnieuw<ArrowRight aria-hidden="true" /></a></div>}
      {pack.words.length >= 2 && <div className="cp-review-mixed"><button className="primary-button" onClick={() => { stopMedia(); setMixed(true); }}><RefreshCw aria-hidden="true" />Woordenmix<ArrowRight aria-hidden="true" /></button></div>}
      {items.length === 0 ? (pack.words.length >= 2 || hasScheduled ? null : <section className="honest-empty"><RefreshCw /><h2>Kies eerst een woord</h2><p>Tik bij een woord op Bewaar.</p><button className="primary-button" onClick={onWords}>Kies woorden<ArrowRight /></button></section>) : <section className="review-word-list"><header><div><span className="eyebrow"></span><h2>Jouw woorden</h2></div><small>Tik op een kaart om te luisteren</small></header><div>{items.map((word) => <button key={word.id} disabled={!word.audio} onClick={() => word.audio && playMedia(word.audio).catch(() => onToast('Het geluid kon niet worden afgespeeld.'))}>{word.image ? <Image src={word.image} alt="" width={760} height={760} /> : <span className="word-initial">{word.word.slice(0, 1)}</span>}<span><small>{learnerListName(getPackage(word.packageId))}</small><strong>{wordLabel(word)}</strong>{wordWithArticle(word) && <small id={`article-global-${word.id}`} className="cp-word-article">{wordWithArticle(word)}</small>}<small>{word.audio ? 'Luister' : 'Lees samen met je docent'}</small></span>{word.audio && <Volume2 />}</button>)}</div></section>}
      </div>
    </div>
  );
}
