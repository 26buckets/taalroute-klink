'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Ear, Eye, Grid2X2, Image as ImageIcon, Keyboard, Link2, MessageCircle, Mic, PencilLine, Puzzle, Search } from 'lucide-react';
import Image from 'next/image';
import { GroupRound } from './package-group-practice';
import { playMedia, stopMedia } from './shared';
import { groupActivities } from '@/lib/group-practice';
import { chapterCollections, chapterHasBothAxes, chapterHash, matchesChapterSelection, parseChapterHash, practiceChapters, type ChapterLocation } from '@/lib/practice-chapters';
import { exerciseSetHelp, levelLabel } from '@/lib/content-levels';
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

export function PracticeChapterCards({ onOpen }: { onOpen: (chapter: string) => void }) {
  return <div className="cp-chapter-grid" aria-label="Oefenhoofdstukken">{practiceChapters.map(chapter => {
    const Icon = icons[chapter.icon];
    return <button key={chapter.id} className="cp-activity-button" data-chapter={chapter.id} onClick={() => onOpen(chapter.id)}><Icon aria-hidden="true" /><span>{chapter.title}</span><ArrowRight aria-hidden="true" /></button>;
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
    if (previous.chapter === location.chapter && previous.activity === location.activity && !previous.collection && !location.collection) return;
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
  function open(next: ChapterLocation) { stopMedia(); setLocation(next); setLimits(current => revealCollection(current, next)); setReview(readReview()); window.location.hash = chapterHash(next); }
  const chapter = practiceChapters.find(item => item.id === location.chapter);
  const activities = useMemo(() => chapter?.activities.flatMap(id => chapterCollections(id).length ? [groupActivities.find(item => item.id === id)!] : []) ?? [], [chapter]);
  const activity = activities.find(item => item.id === location.activity);
  const collections = useMemo(() => activity ? chapterCollections(activity.id) : [], [activity]);
  const reviewMode = activity?.id === 'learning-review';
  const visible = useMemo(() => collections.filter(item => matchesChapterSelection(item, location))
    .map(item => reviewMode ? { ...item, exercises: item.exercises.filter(exercise => review[exercise.exerciseId]?.due <= Date.now()) } : item)
    .filter(item => item.exercises.length), [collections, location, reviewMode, review]);
  const collection = visible.find(item => item.id === location.collection);
  // Example words identify a collection, but must not reveal a listening/spelling answer during play.
  const title = (collection?.exercises[0]?.learningPathId || collection?.exercises[0]?.componentId === 'KLINK-CONTENT' ? activity?.label : collection?.title) ?? activity?.label ?? chapter?.title ?? 'Oefenen met vaardigheden';
  const toCollections = () => open({ ...location, collection: undefined });
  const selection = { level: location.level, help: location.help };
  const back = collection ? toCollections : activity ? () => open({ chapter: chapter!.id, ...selection }) : chapter ? () => open(selection) : onBack;
  return <div className={`learner-page cp-chapters ${collection ? 'cp-chapter-playing' : ''}`} data-chapter-page={chapter?.id ?? 'all'}>
    <button className="text-back" onClick={back}><ArrowLeft />{collection ? 'Andere opdracht' : activity ? chapter!.title : chapter ? 'Oefenen' : 'Terug'}</button>
    <header className="content-page-heading"><div>{chapter && <p className={`cp-menu-location${collection ? ' sr-only' : ''}`} aria-label="Je bent hier">Oefenen{activity ? ` · ${chapter.title}` : ''}</p>}<h1 ref={heading} tabIndex={-1}>{title}</h1>{collection && exerciseSetHelp(collection.exercises) === 'guided' && <p>Samen met je docent.</p>}</div></header>
    {!collection && <MyRoute axis={chapter && !chapterHasBothAxes(chapter.id) ? chapterRouteAxis(chapter.id) : undefined} selection={chapter ? location : undefined} onChange={next => { if (!chapter) open({ ...location, level: next.literacy, collection: undefined }); }} onSelectionChange={chapter ? next => open({ ...location, ...next, collection: undefined }) : undefined} />}
    {!chapter && <PracticeChapterCards onOpen={id => open({ chapter: id, level: settings[chapterRouteAxis(id)] })} />}
    {chapter && !activity && <div className="cp-chapter-grid" aria-label={chapter.title}>{activities.map(item => {
      const Icon = icons[item.icon];
      return <button className="cp-activity-button" key={item.id} data-chapter-activity={item.id} onClick={() => open({ chapter: chapter.id, activity: item.id, ...selection })}><Icon aria-hidden="true" /><span>{item.label}</span><ArrowRight aria-hidden="true" /></button>;
    })}</div>}
    {activity && !collection && <>
      <div className="cp-chapter-collections">{visible.slice(0, limit).map(item => <button key={item.id} className="cp-chapter-collection" data-collection={item.id} onClick={() => open({ ...location, collection: item.id })}>
        {item.image ? <Image src={item.image} width={96} height={96} alt="" /> : <BookOpen aria-hidden="true" />}
        <span><strong>{item.title}</strong><small>{item.levels ? `Woordenschat: ${item.levels.map(levelLabel).join(' / ')}` : levelLabel(item.level)} · {exerciseSetHelp(item.exercises) === 'guided' ? 'Met de docent' : 'Zelf oefenen'}</small></span><ArrowRight aria-hidden="true" />
      </button>)}</div>
      {!visible.length && <output>{reviewMode ? 'Je hebt nu niets om te herhalen. Oefen eerst bij Klanken, Spelling, Grammatica, Teksten of In de praktijk.' : `Voor deze keuze (${levelLabel(location.level)}) zijn hier nog geen opdrachten ingedeeld. Kies samen met je docent ander aanbod.`}</output>}
      {visible.length > limit && <button className="secondary-button cp-chapter-more" onClick={() => setLimits(current => ({ ...current, [listKey]: limit + pageSize }))}>Meer opdrachten<ArrowRight /></button>}
    </>}
    {collection && activity && <GroupRound key={`${activity.id}:${collection.id}:${round}`} pack={collection.pack} activity={activity.id} exerciseSet={collection.exercises} sessionId={`chapter:${activity.id}:${collection.id}${reviewMode ? ':' + Math.max(...collection.exercises.map(exercise => review[exercise.exerciseId]?.last ?? 0)) : ''}`} onAudio={(source, options) => source ? playMedia(source, options) : false} onAttempt={onAttempt} onBack={toCollections} onAgain={() => setRound(value => value + 1)} backLabel="Andere opdracht" />}
  </div>;
}
