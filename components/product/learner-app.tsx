'use client';
import { WordPlaceholder } from './word-placeholder';
import { AlfaCTeacherPractice } from './alfa-c-docent';
import { legacyAlfaCHash } from '@/lib/alfa-c-navigation';

import { wordWithArticle } from '@/lib/word-articles';
import { libraryWords, libraryCollections, defaultWordLibraryFilter, wordLibraryPageSize, type WordLibraryIndex, type WordLibraryFilter, type WordLibrarySource } from '@/lib/word-library';

import { setSlowAudio } from '@/lib/media-player';
import { playMedia, stopMedia } from '@/components/product/shared';
import { PackageLibrary, PackagePlayer } from '@/components/product/package-experience';
import { PackageMixedPractice } from '@/components/product/package-mixed-practice';
import { PracticeChapters } from '@/components/product/practice-chapters';
import { contentLevels, type ContentLevel } from '@/lib/content-levels';
import { chapterCollections, chapterHash } from '@/lib/practice-chapters';
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
import { learnerListName, learnerCollectionLabel } from '@/lib/learner-copy';
import { useRouteSettings } from './route-settings';
import { PracticeLine } from './practice-line';
import { SoundReference } from './sound-reference';
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  BookmarkCheck,
  Home,
  Ear,
  LogOut,
  PackageOpen,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  Volume2,
  WholeWord,
} from 'lucide-react';
import Image from './compact-image';
import { useEffect, useMemo, useState } from 'react';

type LearnerView = 'home' | 'packages' | 'package' | 'words' | 'review' | 'chapters' | 'sounds' | 'alfa-c-teacher';

export function LearnerApp({ onExit, onToast }: { onExit: () => void; onToast: (message: string) => void }) {
  const { practice } = useRouteSettings();
  const [view, setView] = useState<LearnerView>('home');
  const [teacherGroup, setTeacherGroup] = useState('');
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
      } else if (route === 'alfa-c' && packageId?.startsWith('docent-')) { setTeacherGroup(packageId.slice(7)); setView('alfa-c-teacher'); }
      else if (route === 'alfa-c') { window.location.replace(legacyAlfaCHash(window.location.hash)); setView('chapters'); }
      else if (route === 'chapters') setView('chapters');
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
  function openChapter(chapter?: string, level: ContentLevel = practice.level) { setView('chapters'); window.location.hash = chapterHash({ chapter, level, help: practice.help }); }

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
          <button title="Start" aria-current={!['words', 'review'].includes(view) ? 'page' : undefined} className={!['words', 'review'].includes(view) ? 'active' : ''} onClick={() => openView('home')}><Home /><span>Start</span></button>
          <button title="Woorden bekijken" aria-current={view === 'words' ? 'page' : undefined} className={view === 'words' ? 'active' : ''} onClick={() => openView('words')}><WholeWord /><span>Woorden bekijken</span></button>
          <button title="Nog een keer" aria-current={view === 'review' ? 'page' : undefined} className={view === 'review' ? 'active' : ''} onClick={() => openView('review')}><RefreshCw /><span>Nog een keer</span></button>
        </nav>
        <button className="secondary-button cp-nav-toggle" type="button" onClick={toggleNavigation} aria-expanded={!navCollapsed} aria-controls="klink-learner-navigation" aria-label={navCollapsed ? 'Menu uitklappen' : 'Menu inklappen'} title={navCollapsed ? 'Menu uitklappen' : 'Menu inklappen'}>{navCollapsed ? <PanelLeftOpen /> : <PanelLeftClose />}</button>
        <button className="learner-profile" onClick={() => { try { sessionStorage.removeItem('klink.instructies.v1'); } catch { /* Ending a session never requires storage. */ } setSlowAudio(false); onExit(); }}><small>Afsluiten</small><LogOut /></button>
      </aside>
      <main className="learner-main">
        {(view === 'home' || view === 'chapters') && <LearnerHome key={view} onPackages={() => openView('packages')} onSounds={() => openView('sounds')} onBack={() => openView('home')} progress={progress} onLesson={openLesson} onAttempt={recordAttempt} />}
        {view === 'packages' && <PackageLibrary onBack={() => openView('home')} onOpen={openPackage} />}
        {view === 'package' && <PackagePlayer key={playerVisit} packageId={selectedPackage} onClose={() => openView('packages')} savedWordIds={savedWordIds} onToggleWord={toggleSavedWord} onToast={onToast} initialPosition={resumePosition} onPosition={position => saveProgress({ ...progress, position })} onLessonDone={lessonId => saveProgress({ completed: [...new Set([...progress.completed, lessonId])], position: nextLessonPosition(contentPackages, selectedPackage, lessonId) })} onOpenLesson={openLesson} onAttempt={recordAttempt} />}
        {view === 'words' && <WordLibrary savedWordIds={savedWordIds} onToggleWord={toggleSavedWord} onBack={() => openView('home')} onToast={onToast} />}
        {view === 'review' && <ReviewQueue savedWordIds={savedWordIds} completed={progress.completed} onAttempt={recordAttempt} onWords={() => openView('words')} onBack={() => openView('home')} onToast={onToast} />}
        {view === 'alfa-c-teacher' && <AlfaCTeacherPractice key={teacherGroup} group={teacherGroup} />}
        {view === 'sounds' && <SoundReference onBack={() => openChapter('sounds')} onLesson={openLesson} />}
      </main>
    </div>
  );
}

function LearnerHome({ onPackages, onSounds, onBack, progress, onLesson, onAttempt }: { onPackages: () => void; onSounds: () => void; onBack: () => void; progress: RouteProgress; onLesson: (position: LessonPosition) => void; onAttempt: (attempt: PracticeAttempt) => void }) {
  const { practice } = useRouteSettings();
  const literacy = practice.level === 'alfa-a' || practice.level === 'alfa-b' || practice.level === 'alfa-c' ? practice.level : undefined;
  const position = literacy ? homeLessonPosition(lessonPackages, progress, literacy) : undefined;
  const pack = lessonPackages.find(item => item.id === position?.packageId);
  const lesson = pack?.lessons.find(item => item.id === position?.lessonId);
  const resumeWord = pack && lesson ? lessonPreviewWords(pack, lesson)[0] : undefined;
  return <PracticeChapters onBack={onBack} onAttempt={onAttempt} startTitle={position && position === progress.position && resumeWord ? <button className="secondary-button cp-direct-resume" onClick={() => onLesson(position)}>Verder met {wordLabel(resumeWord)}<ArrowRight aria-hidden="true" /></button> : undefined} startActions={<>
    <div className="cp-direct-actions">
      <button className="secondary-button" onClick={onSounds}><Ear aria-hidden="true" />Klankenkaart<ArrowRight aria-hidden="true" /></button>
      <button className="secondary-button" onClick={onPackages}><PackageOpen aria-hidden="true" />Stap voor stap<ArrowRight aria-hidden="true" /></button>
    </div>
    <h2 className="cp-direct-heading">Kies een oefening</h2>
  </>} startFooter={<div className="cp-direct-footer">
    <details className="cp-direct-explanation"><summary>Zo oefen je</summary><PracticeLine /></details>
  </div>} />;
}

function WordLibrary({ savedWordIds, onToggleWord, onBack, onToast }: { savedWordIds: string[]; onToggleWord: (wordId: string) => void; onBack: () => void; onToast: (message: string) => void }) {
  const [filter, setFilter] = useState(defaultWordLibraryFilter);
  const [index, setIndex] = useState<WordLibraryIndex | null>(null);
  const [indexError, setIndexError] = useState(false);
  const [limit, setLimit] = useState(wordLibraryPageSize);
  useEffect(() => {
    let active = true;
    import('@/data/klink-word-library-index.json').then(module => { if (active) setIndex(module.default as WordLibraryIndex); }).catch(() => { if (active) setIndexError(true); });
    return () => { active = false; };
  }, []);
  const changeFilter = (patch: Partial<WordLibraryFilter>) => { setFilter(current => ({ ...current, ...patch })); setLimit(wordLibraryPageSize); };
  const visibleWords = useMemo(() => libraryWords(filter, savedWordIds, index), [filter, savedWordIds, index]);
  const collections = useMemo(() => index ? libraryCollections(index, filter) : [], [index, filter]);
  const chapters = index?.chapters.filter(chapter => libraryCollections(index, { level: filter.level, chapter: chapter.id }).length) ?? [];
  const noSavedWords = filter.source === 'saved' && !allPackageWords.some(word => savedWordIds.includes(word.id));
  return (
    <div className="learner-page word-library-page">
      <header className="cp-context-header"><button className="text-back" onClick={onBack} aria-label="Terug" title="Terug"><ArrowLeft /></button><h1>Woorden bekijken</h1><small className="cp-context-meta">{visibleWords.length} {visibleWords.length === 1 ? 'woord' : 'woorden'}</small></header>
      <div className="cp-page-workspace">
      <p>Tik en luister.</p>
      <div className="word-filters" aria-label="Filter woorden">
        <label className="word-search">Zoek een woord<input type="search" value={filter.query} onChange={event => changeFilter({ query: event.target.value })} /></label>
        <label>Toon<select aria-label="Toon" value={filter.source} onChange={event => changeFilter({ source: event.target.value as WordLibrarySource })}><option value="all">Alle woorden</option><option value="saved">Bewaarde woorden</option></select></label>
        <label>Niveau<select aria-label="Niveau" disabled={!index} value={filter.level} onChange={event => changeFilter({ level: event.target.value, chapter: 'all', collection: 'all' })}><option value="all">Alle niveaus</option>{contentLevels.filter(level => level.id !== 'all' && index?.collections.some(item => item.levels[level.id]?.length)).map(level => <option key={level.id} value={level.id}>{level.label}</option>)}</select></label>
        <label>Onderdeel<select aria-label="Onderdeel" disabled={!index} value={filter.chapter} onChange={event => changeFilter({ chapter: event.target.value, collection: 'all' })}><option value="all">Alle onderdelen</option>{chapters.map(chapter => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}</select></label>
        {filter.chapter !== 'all' && <label>Oefening<select aria-label="Oefening" value={filter.collection} onChange={event => changeFilter({ collection: event.target.value })}><option value="all">Alle oefeningen</option>{index?.activities.filter(activity => collections.some(item => item.activity === activity.id)).map(activity => <optgroup key={activity.id} label={activity.label}>{collections.filter(item => item.activity === activity.id).map(item => { const label = learnerCollectionLabel(item.title), levels = contentLevels.filter(level => level.id !== 'all' && (filter.level === 'all' ? item.levels[level.id]?.length : level.id === filter.level)), count = new Set(levels.flatMap(level => item.levels[level.id] ?? [])).size; return <option key={item.id} value={item.id}>{[label.title, label.round && `Ronde ${label.round}`, levels.map(level => level.label).join(' / '), `${count} ${count === 1 ? 'woord' : 'woorden'}`, label.support].filter(Boolean).join(' · ')}</option>; })}</optgroup>)}</select></label>}
      </div>
      {!index && <p><output>{indexError ? <>De oefenfilters konden niet laden. <button className="text-back" onClick={() => window.location.reload()}>Probeer opnieuw</button></> : 'Oefenfilters laden…'}</output></p>}
      {noSavedWords ? <section className="honest-empty"><Bookmark /><h2>Nog geen woorden bewaard</h2><p>Tik bij een woord op Bewaar. Je vindt het daarna bij Nog een keer.</p><button className="primary-button" onClick={() => changeFilter(defaultWordLibraryFilter)}>Bekijk alle woorden</button></section> : visibleWords.length === 0 ? <section className="honest-empty"><h2>Geen woorden gevonden</h2><p>Probeer een ander woord of kies andere filters.</p><button className="secondary-button" onClick={() => changeFilter({ ...defaultWordLibraryFilter, source: filter.source })}>Wis zoeken en filters</button></section> : <section className="cp-global-word-grid">{visibleWords.slice(0, limit).map((word) => { const saved = savedWordIds.includes(word.id); return <article key={word.id}><button className="cp-word-listen" disabled={!word.audio} onClick={() => word.audio && playMedia(word.audio).catch(() => onToast('Luisteren lukt niet. Probeer het nog eens.'))} aria-describedby={wordWithArticle(word) ? `article-global-${word.id}` : undefined} aria-label={word.audio ? `Luister naar ${wordLabel(word)}` : `${wordLabel(word)}. Lees samen met je docent.`}>{word.image ? <Image src={word.image} alt="" width={760} height={760} fallbackWord={wordLabel(word)} placeholderClassName="klink-library-placeholder" /> : <WordPlaceholder word={wordLabel(word)} className="klink-library-placeholder" decorative />}<div><strong>{wordLabel(word)}</strong>{wordWithArticle(word) && <small id={`article-global-${word.id}`} className="cp-word-article">{wordWithArticle(word)}</small>}<span>{word.audio ? <><Volume2 /> Luister</> : 'Lees samen'}</span></div></button><button className={saved ? 'saved' : ''} onClick={() => onToggleWord(word.id)} aria-pressed={saved} aria-label={`${wordLabel(word)} ${saved ? 'niet meer bewaren' : 'bewaren'}`}>{saved ? <BookmarkCheck /> : <Bookmark />}<span>{saved ? 'Bewaard' : 'Bewaar'}</span></button></article>; })}</section>}
      {visibleWords.length > 0 && <p className="word-library-more"><output>{Math.min(limit, visibleWords.length)} van {visibleWords.length} {visibleWords.length === 1 ? 'woord' : 'woorden'}</output>{limit < visibleWords.length && <button className="secondary-button" onClick={() => setLimit(value => value + wordLibraryPageSize)}>Meer woorden tonen</button>}</p>}
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
      {(hasScheduled || pack.words.length >= 2) && <section className="cp-review-tools" aria-label="Eerder geoefend">
        <div className="cp-review-copy"><h2>Eerder geoefend</h2><p>Herhaal wat je eerder hebt geoefend.</p></div>
        <div className="cp-review-actions">
          {hasScheduled && <div className="cp-review-mixed"><a className="primary-button" href={chapterHash({ chapter: 'repeat', activity: 'learning-review', level: 'all' })} onClick={stopMedia}><RefreshCw aria-hidden="true" />Oefen opnieuw<ArrowRight aria-hidden="true" /></a></div>}
          {pack.words.length >= 2 && <div className="cp-review-mixed"><button className="primary-button" onClick={() => { stopMedia(); setMixed(true); }}><RefreshCw aria-hidden="true" />Woordenmix<ArrowRight aria-hidden="true" /></button></div>}
        </div>
      </section>}
      {items.length > 0 && <p className="cp-review-instruction">Tik en luister.</p>}
      {items.length === 0 ? <section className="honest-empty"><RefreshCw /><h2>Kies eerst een woord</h2><p>Tik bij een woord op Bewaar.</p><button className="primary-button" onClick={onWords}>Kies woorden<ArrowRight /></button></section> : <section className="review-word-list"><header><div><span className="eyebrow"></span><h2>Jouw woorden</h2></div><small>Tik op een kaart om te luisteren</small></header><div>{items.map((word) => <button key={word.id} disabled={!word.audio} onClick={() => word.audio && playMedia(word.audio).catch(() => onToast('Het geluid kon niet worden afgespeeld.'))}>{word.image ? <Image src={word.image} alt="" width={760} height={760} fallbackWord={wordLabel(word)} placeholderClassName="klink-review-placeholder" /> : <WordPlaceholder word={wordLabel(word)} className="klink-review-placeholder" decorative />}<span><small>{learnerListName(getPackage(word.packageId))}</small><strong>{wordLabel(word)}</strong>{wordWithArticle(word) && <small id={`article-global-${word.id}`} className="cp-word-article">{wordWithArticle(word)}</small>}<small>{word.audio ? 'Luister' : 'Lees samen met je docent'}</small></span>{word.audio && <Volume2 />}</button>)}</div></section>}
      </div>
    </div>
  );
}
