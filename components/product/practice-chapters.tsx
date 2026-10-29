'use client';
import { TeacherBlockCards } from './alfa-c-docent';
import { PracticeHeader } from './practice-header';
import { AlfaCPractice } from './alfa-c-practice';
import { alfaCChapters } from '@/lib/alfa-c-navigation';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, BookOpen, Ear, Eye, Grid2X2, Image as ImageIcon, Keyboard, Link2, MessageCircle, Mic, PencilLine, Puzzle, Search, UserRound, UsersRound } from 'lucide-react';
import Image from 'next/image';
import { GroupRound } from './package-group-practice';
import { playMedia, stopMedia } from './shared';
import { groupActivities } from '@/lib/group-practice';
import { availableChapterActivities, availableChapterCollections, chapterLevels, chapterCollections, chapterExerciseChoices, chapterHash, matchesChapterSelection, parseChapterHash, practiceChapters, type ChapterLocation } from '@/lib/practice-chapters';
import { exerciseSetHelp, levelLabel, type ContentHelp } from '@/lib/content-levels';
import { MyRoute, useRouteSettings } from './route-settings';
import { chapterRouteAxis } from '@/lib/learner-route';
import type { PracticeAttempt } from '@/lib/package-content';
import { learningReviewKey, parseLearningReview } from '@/lib/learning-review';

const icons = { eye: Eye, ear: Ear, image: ImageIcon, link: Link2, puzzle: Puzzle, grid: Grid2X2, keyboard: Keyboard, pen: PencilLine, mic: Mic, book: BookOpen, search: Search, chat: MessageCircle };
const pageSize = 12;
const readReview = () => { try { return parseLearningReview(localStorage.getItem(learningReviewKey)); } catch { return {}; } };
function revealCollection(limits: Record<string, number>, location: ChapterLocation) {
  if (!location.activity || !location.collection) return limits;
  const key = `${location.chapter}/${location.activity}/${location.level}/${location.help ?? 'all'}`;
  const items = chapterCollections(location.activity).filter(item => matchesChapterSelection(item, location));
  const needed = Math.ceil((items.findIndex(item => item.id === location.collection) + 1) / pageSize) * pageSize;
  return (limits[key] ?? pageSize) >= needed ? limits : { ...limits, [key]: needed };
}

export function PracticeChapterCards({ onOpen, isAvailable, hideUnavailable = false, children }: { onOpen: (chapter: string) => void; isAvailable?: (chapter: string) => boolean; hideUnavailable?: boolean; children?: import('react').ReactNode }) {
  return <div className="cp-chapter-grid" aria-label="Oefenhoofdstukken">{children}{practiceChapters.map(chapter => {
    const Icon = icons[chapter.icon], available = isAvailable?.(chapter.id) ?? true;
    if (hideUnavailable && !available) return null;
    return <button key={chapter.id} className="cp-activity-button" data-chapter={chapter.id} disabled={!available} onClick={() => onOpen(chapter.id)}><Icon aria-hidden="true" /><span>{chapter.title}{!available && <small>Niet beschikbaar</small>}</span>{available && <ArrowRight aria-hidden="true" />}</button>;
  })}</div>;
}

export function PracticeChapters({ onBack, onAttempt }: { onBack: () => void; onAttempt: (attempt: PracticeAttempt) => void }) {
  const { settings } = useRouteSettings();
  const [location, setLocation] = useState<ChapterLocation>(() => typeof window === 'undefined' ? { level: 'all' } : parseChapterHash(window.location.hash));
  const [limits, setLimits] = useState<Record<string, number>>(() => revealCollection({}, location));
  const [round, setRound] = useState(0);
  const [review, setReview] = useState(readReview);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousLocation = useRef(location);
  const listKey = `${location.chapter}/${location.activity}/${location.level}/${location.help ?? 'all'}`;
  const limit = limits[listKey] ?? pageSize;
  useEffect(() => {
    const restore = () => { const next = parseChapterHash(window.location.hash); setLocation(current => chapterHash(current) === chapterHash(next) ? current : next); setLimits(current => revealCollection(current, next)); setReview(readReview()); };
    window.addEventListener('hashchange', restore);
    return () => { window.removeEventListener('hashchange', restore); stopMedia(); };
  }, []);
  useEffect(() => {
    const previous = previousLocation.current;
    previousLocation.current = location;
    stopMedia();
    if (previous.chapter === location.chapter && previous.activity === location.activity && previous.sequence === location.sequence && previous.help === location.help && !previous.collection && !location.collection) return;
    if (!location.collection && previous.collection && previous.chapter === location.chapter && previous.activity === location.activity && previous.level === location.level) {
      const card = document.querySelector<HTMLButtonElement>(`[data-collection="${CSS.escape(previous.collection)}"]`);
      if (card) {
        const frame = requestAnimationFrame(() => { card.focus({ preventScroll: true }); card.scrollIntoView({ block: 'center', behavior: 'instant' }); });
        return () => cancelAnimationFrame(frame);
      }
    }
    heading.current?.focus({ preventScroll: true });
    document.querySelector('.learner-main')?.scrollTo({ top: 0 });
  }, [location]);
  function open(next: ChapterLocation) { stopMedia(); setLocation(next); setLimits(current => revealCollection(current, next)); setReview(readReview()); window.location.assign(chapterHash(next)); }
  const sequenceChapter = alfaCChapters.find(item => item.id === location.chapter);
  const chapter = practiceChapters.find(item => item.id === location.chapter) ?? sequenceChapter;
  const activities = chapter?.activities.map(id => groupActivities.find(item => item.id === id)!) ?? [];
  const activity = activities.find(item => item.id === location.activity);
  const reviewMode = activity?.id === 'learning-review';
  const visible = location.activity ? availableChapterCollections(location.activity, location, review) : [];
  const availableActivities = chapter ? availableChapterActivities(chapter.id, location, review) : [];
  const availableLevels = new Set(chapterLevels.filter(({ id: level }) =>
    (location.activity ? [location.activity] : chapter?.activities ?? groupActivities.map(item => item.id))
      .some(id => availableChapterCollections(id, { level, help: location.help }, review).length)
  ).map(item => item.id));
  if (sequenceChapter) availableLevels.add('alfa-c');
  if (!chapter) availableLevels.add('alfa-c');
  const alfaCSelected = !chapter && (location.level === 'alfa-c' || (location.level === 'all' && ['all','alfa-c'].includes(settings.literacy)));
  const chapterSelection = (id: string) => ({ level: location.level === 'all' && !chapter ? settings[chapterRouteAxis(id)] : location.level, help: location.help });
  const openChapter = (id: string) => {
    open({ chapter: id, ...chapterSelection(id) });
  };
  const modeAvailable = (help: ContentHelp) => Boolean(sequenceChapter) || alfaCSelected || (chapter ? [chapter] : practiceChapters).some(item => availableChapterActivities(item.id, { ...chapterSelection(item.id), help }, review).length);
  const openMode = (help: ContentHelp) => open({ ...location, help, collection: undefined });
  const collection = visible.find(item => item.id === location.collection);
  const exerciseChoices = collection ? chapterExerciseChoices(location) : [];
  const sequenceBlock = sequenceChapter && location.sequence && ['all', 'alfa-c'].includes(location.level) ? sequenceChapter.blocks.find(block => block.id === location.collection) : undefined;
  const choosing = !location.help && !collection && !sequenceBlock;
  const activitySelected = Boolean(activity || location.sequence);
  const items = sequenceChapter && location.sequence && ['all', 'alfa-c'].includes(location.level) ? sequenceChapter.blocks.map(block => ({ id: block.id, title: block.title, image: undefined as string | undefined, summary: `Alfa C · ${location.help === 'guided' ? 'Met de docent' : 'Zelf oefenen'}` })) : visible.map(item => ({ id: item.id, title: item.title, image: item.image, summary: `${item.levels ? `Woordenschat: ${item.levels.map(levelLabel).join(' / ')}` : levelLabel(item.level)} · ${exerciseSetHelp(item.exercises) === 'guided' ? 'Met de docent' : 'Zelf oefenen'}` }));
  const modeLabel = location.help === 'guided' ? 'Met je docent' : 'Zelf oefenen';
  // Example words identify a collection, but must not reveal a listening/spelling answer during play.
  const title = (collection?.exercises[0]?.learningPathId || collection?.exercises[0]?.componentId === 'KLINK-CONTENT' ? activity?.label : collection?.title) ?? activity?.label ?? (location.sequence ? 'Stap voor stap oefenen' : undefined) ?? chapter?.title ?? (choosing ? 'Oefenen' : modeLabel);
  const toCollections = () => open({ ...location, collection: undefined });
  const selection = { level: location.level, help: location.help };
  const back = collection ? toCollections : activitySelected ? () => open({ chapter: chapter!.id, ...selection }) : chapter ? () => open(selection) : location.help ? () => open({ level: location.level }) : onBack;
  if (sequenceBlock) return <AlfaCPractice key={sequenceBlock.id} selected={sequenceBlock.id} backHref={chapterHash({ ...location, collection: undefined })} header={<PracticeHeader title={sequenceBlock.title} backLabel="Andere opdracht" onBack={toCollections} headingRef={heading} meta={`Oefenen · ${chapter!.title}`} />} />;
  return <div className={`learner-page cp-chapters ${collection ? 'cp-chapter-playing' : ''}`} data-chapter-page={chapter?.id ?? 'all'}>
    <PracticeHeader title={title} headingRef={heading} onBack={back} backLabel={collection ? 'Andere opdracht' : activitySelected ? chapter!.title : chapter ? 'Oefenen' : 'Terug'} metaLabel={!collection && chapter ? 'Je bent hier' : undefined} meta={collection ? exerciseSetHelp(collection.exercises) === 'guided' ? 'Samen met je docent.' : '' : chapter ? `Oefenen${activitySelected ? ` · ${chapter.title}` : ''}` : ''} />
    {collection && chapter && <p className="sr-only" aria-label="Je bent hier">Oefenen · {chapter.title}</p>}
    {!collection && <div className="cp-page-workspace">
    {choosing ? <div className="cp-practice-entry" aria-label="Hoe wil je oefenen?">
      <button className="cp-activity-button" disabled={!modeAvailable('practice')} onClick={() => openMode('practice')}><UserRound aria-hidden="true" /><span><strong>Zelf oefenen</strong><small>{modeAvailable('practice') ? 'Je oefent op de laptop.' : 'Niet beschikbaar voor deze keuze.'}</small></span><ArrowRight aria-hidden="true" /></button>
      <button className="cp-activity-button" disabled={!modeAvailable('guided')} onClick={() => openMode('guided')}><UsersRound aria-hidden="true" /><span><strong>Met je docent</strong><small>{modeAvailable('guided') ? 'Je docent zit bij je.' : 'Niet beschikbaar voor deze keuze.'}</small></span><ArrowRight aria-hidden="true" /></button>
      {!modeAvailable('practice') && !modeAvailable('guided') && <button className="secondary-button" onClick={() => open({ level: location.level })}>Andere oefeningen<ArrowRight aria-hidden="true" /></button>}
    </div> : <>
    <nav className="cp-practice-modes" aria-label="Manier van oefenen">{([['practice', 'Zelf oefenen', UserRound], ['guided', 'Met je docent', UsersRound]] as const).map(([id, label, Icon]) => <button key={id} className="secondary-button" disabled={!modeAvailable(id)} aria-pressed={location.help === id} onClick={() => openMode(id)}><Icon aria-hidden="true" />{label}</button>)}</nav>
    <MyRoute showPracticeChoice={false} availableLevels={availableLevels} selection={chapter || location.level !== 'all' ? location : undefined} onSelectionChange={next => open({ ...location, ...next, collection: undefined })} />
    {!chapter && <PracticeChapterCards hideUnavailable={location.level === 'alfa-c' || (location.level === 'all' && settings.literacy === 'alfa-c')} isAvailable={id => availableChapterActivities(id, chapterSelection(id), review).length > 0} onOpen={openChapter}>{alfaCSelected && alfaCChapters.map(item => { const Icon = icons[item.icon]; return <button key={item.id} className="cp-activity-button" data-alfa-c-category={item.legacy} onClick={() => open({ chapter: item.id, level: 'alfa-c', help: location.help })}><Icon aria-hidden="true" /><span>{item.title}</span><ArrowRight aria-hidden="true" /></button>; })}</PracticeChapterCards>}
    {!chapter && alfaCSelected && location.help === 'guided' && <section aria-label="Alfa C docentopdrachten"><div className="cp-chapter-grid"><TeacherBlockCards /></div></section>}
    {chapter && !activitySelected && <div className="cp-chapter-grid" aria-label={chapter.title}>{sequenceChapter && <button className="cp-activity-button" data-chapter-activity="sequence" onClick={() => open({ chapter: chapter.id, sequence: true, ...selection })}><BookOpen aria-hidden="true" /><span>Stap voor stap oefenen</span><ArrowRight aria-hidden="true" /></button>}{chapter.id === 'sounds' && <a className="cp-activity-button" href="#learner/sounds"><Ear aria-hidden="true" /><span>Klankenkaart</span><ArrowRight aria-hidden="true" /></a>}{activities.map(item => {
      const Icon = icons[item.icon], available = availableActivities.includes(item.id);
      return <button className="cp-activity-button" key={item.id} data-chapter-activity={item.id} disabled={!available} onClick={() => open({ chapter: chapter.id, activity: item.id, ...selection })}><Icon aria-hidden="true" /><span>{item.label}{!available && <small>Niet beschikbaar</small>}</span>{available && <ArrowRight aria-hidden="true" />}</button>;
    })}</div>}
    {activitySelected && !collection && <>
      <div className="cp-chapter-collections">{items.slice(0, limit).map(item => <button key={item.id} className="cp-chapter-collection" data-collection={item.id} {...(sequenceChapter ? { [`data-${sequenceChapter.kind}-block`]: item.id } : {})} onClick={() => open({ ...location, collection: item.id })}>
        {item.image ? <Image src={item.image} width={96} height={96} alt="" /> : <BookOpen aria-hidden="true" />}
        <span><strong>{item.title}</strong><small>{item.summary}</small></span><ArrowRight aria-hidden="true" />
      </button>)}</div>
      {!items.length && <div className="cp-unavailable">
        <output>{reviewMode ? 'Je hebt nu niets om te herhalen.' : `Deze oefening is niet beschikbaar voor ${levelLabel(location.level)}.`}</output>
        {practiceChapters.some(item => availableChapterActivities(item.id, location, review).length) ? <>
          <p>Kies een andere oefening:</p>
          <PracticeChapterCards isAvailable={id => availableChapterActivities(id, location, review).length > 0} onOpen={openChapter} />
        </> : modeAvailable('guided') ? <button className="secondary-button" onClick={() => openMode('guided')}><UsersRound aria-hidden="true" />Oefen met je docent<ArrowRight aria-hidden="true" /></button> : <button className="secondary-button" onClick={() => open({ level: location.level })}>Andere oefeningen<ArrowRight aria-hidden="true" /></button>}
      </div>}

      {items.length > limit && <button className="secondary-button cp-chapter-more" onClick={() => setLimits(current => ({ ...current, [listKey]: limit + pageSize }))}>Meer opdrachten<ArrowRight /></button>}
    </>}
    </>}
    </div>}
    {collection && activity && <GroupRound exerciseMenu={{ value: activity.id, options: exerciseChoices.map(item => ({ id: item.id, label: item.label, icon: icons[item.icon] })), onSelect: id => {
      const next = exerciseChoices.find(item => item.id === id);
      if (next) open({ ...location, chapter: next.chapter, activity: next.id, collection: next.collection });
    } }} key={`${activity.id}:${collection.id}:${round}`} pack={collection.pack} activity={activity.id} exerciseSet={collection.exercises} sessionId={`chapter:${activity.id}:${collection.id}${reviewMode ? ':' + Math.max(...collection.exercises.map(exercise => review[exercise.exerciseId]?.last ?? 0)) : ''}`} onAudio={(source, options) => source ? playMedia(source, options) : false} onAttempt={onAttempt} onBack={toCollections} onAgain={() => setRound(value => value + 1)} backLabel="Andere opdracht" />}
  </div>;
}
