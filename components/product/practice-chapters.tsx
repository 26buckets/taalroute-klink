'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Ear, Eye, Grid2X2, Image as ImageIcon, Keyboard, Link2, MessageCircle, Mic, PencilLine, Puzzle, Search } from 'lucide-react';
import Image from 'next/image';
import { GroupRound } from './package-group-practice';
import { playMedia, stopMedia } from './shared';
import { groupActivities } from '@/lib/group-practice';
import { chapterCollections, chapterHash, chapterLevels, parseChapterHash, practiceChapters, type ChapterLocation } from '@/lib/practice-chapters';
import type { PracticeAttempt } from '@/lib/package-content';
import { learningReviewKey, parseLearningReview } from '@/lib/learning-review';

const icons = { eye: Eye, ear: Ear, image: ImageIcon, link: Link2, puzzle: Puzzle, grid: Grid2X2, keyboard: Keyboard, pen: PencilLine, mic: Mic, book: BookOpen, search: Search, chat: MessageCircle };
const pageSize = 12;
const readReview = () => { try { return parseLearningReview(localStorage.getItem(learningReviewKey)); } catch { return {}; } };
function revealCollection(limits: Record<string, number>, location: ChapterLocation) {
  if (!location.activity || !location.collection) return limits;
  const key = `${location.chapter}/${location.activity}/${location.level}`;
  const items = chapterCollections(location.activity).filter(item => location.level === 'all' || item.level === location.level);
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
  const [location, setLocation] = useState<ChapterLocation>(() => typeof window === 'undefined' ? { level: 'all' } : parseChapterHash(window.location.hash));
  const [limits, setLimits] = useState<Record<string, number>>(() => revealCollection({}, location));
  const [round, setRound] = useState(0);
  const [review, setReview] = useState(readReview);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousLocation = useRef(location);
  const listKey = `${location.chapter}/${location.activity}/${location.level}`;
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
  const visible = useMemo(() => collections.filter(item => location.level === 'all' || item.level === location.level)
    .map(item => reviewMode ? { ...item, exercises: item.exercises.filter(exercise => review[exercise.exerciseId]?.due <= Date.now()) } : item)
    .filter(item => item.exercises.length), [collections, location.level, reviewMode, review]);
  const collection = visible.find(item => item.id === location.collection);
  // Example words identify a collection, but must not reveal a listening/spelling answer during play.
  const title = (collection?.exercises[0]?.learningPathId ? activity?.label : collection?.title) ?? activity?.label ?? chapter?.title ?? 'Oefenen';
  const toCollections = () => open({ ...location, collection: undefined });
  const back = collection ? toCollections : activity ? () => open({ chapter: chapter!.id, level: 'all' }) : chapter ? () => open({ level: 'all' }) : onBack;
  return <div className={`learner-page cp-chapters ${collection ? 'cp-chapter-playing' : ''}`} data-chapter-page={chapter?.id ?? 'all'}>
    <button className="text-back" onClick={back}><ArrowLeft />{collection ? 'Andere opdracht' : activity ? chapter!.title : chapter ? 'Oefenen' : 'Terug'}</button>
    <header className="content-page-heading"><div>{chapter && <p className="cp-menu-location" aria-label="Je bent hier">Oefenen{activity ? ` · ${chapter.title}` : ''}</p>}<h1 ref={heading} tabIndex={-1}>{title}</h1>{(collection?.level === 'support' || collection?.level === 'a1' || collection?.level === 'a2') && <p>Samen met je docent.</p>}</div></header>
    {!chapter && <PracticeChapterCards onOpen={id => open({ chapter: id, level: 'all' })} />}
    {chapter && !activity && <div className="cp-chapter-grid" aria-label={chapter.title}>{activities.map(item => {
      const Icon = icons[item.icon];
      return <button className="cp-activity-button" key={item.id} data-chapter-activity={item.id} onClick={() => open({ chapter: chapter.id, activity: item.id, level: 'all' })}><Icon aria-hidden="true" /><span>{item.label}</span><ArrowRight aria-hidden="true" /></button>;
    })}</div>}
    {activity && !collection && <>
      <fieldset className="cp-chapter-levels"><legend className="sr-only">Niveau en hulp</legend>{chapterLevels.filter(level => level.id === 'all' || collections.some(item => item.level === level.id)).map(level => <button key={level.id} className="secondary-button" aria-pressed={location.level === level.id} onClick={() => open({ ...location, level: level.id, collection: undefined })}>{level.label}</button>)}</fieldset>
      <div className="cp-chapter-collections">{visible.slice(0, limit).map(item => <button key={item.id} className="cp-chapter-collection" data-collection={item.id} onClick={() => open({ ...location, collection: item.id })}>
        {item.image ? <Image src={item.image} width={96} height={96} alt="" /> : <BookOpen aria-hidden="true" />}
        <span><strong>{item.title}</strong><small>{chapterLevels.find(level => level.id === item.level)?.label}</small></span><ArrowRight aria-hidden="true" />
      </button>)}</div>
      {!visible.length && <p>{reviewMode ? 'Je hebt nu niets om te herhalen. Oefen eerst bij Klanken, Spelling, Grammatica, Teksten of In de praktijk.' : 'Er zijn hier nog geen opdrachten. Kies een ander niveau.'}</p>}
      {visible.length > limit && <button className="secondary-button cp-chapter-more" onClick={() => setLimits(current => ({ ...current, [listKey]: limit + pageSize }))}>Meer opdrachten<ArrowRight /></button>}
    </>}
    {collection && activity && <GroupRound key={`${activity.id}:${collection.id}:${round}`} pack={collection.pack} activity={activity.id} exerciseSet={collection.exercises} sessionId={`chapter:${activity.id}:${collection.id}${reviewMode ? ':' + Math.max(...collection.exercises.map(exercise => review[exercise.exerciseId]?.last ?? 0)) : ''}`} onAudio={(source, options) => source ? playMedia(source, options) : false} onAttempt={onAttempt} onBack={toCollections} onAgain={() => setRound(value => value + 1)} backLabel="Andere opdracht" />}
  </div>;
}
