'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Ear, Eye, Grid2X2, Image as ImageIcon, Keyboard, Link2, MessageCircle, Mic, PencilLine, Puzzle, Search } from 'lucide-react';
import Image from 'next/image';
import { GroupRound } from './package-group-practice';
import { playMedia, stopMedia } from './shared';
import { groupActivities } from '@/lib/group-practice';
import { chapterCollections, chapterHash, chapterLevels, parseChapterHash, practiceChapters, type ChapterLocation } from '@/lib/practice-chapters';
import type { PracticeAttempt } from '@/lib/package-content';

const icons = { eye: Eye, ear: Ear, image: ImageIcon, link: Link2, puzzle: Puzzle, grid: Grid2X2, keyboard: Keyboard, pen: PencilLine, mic: Mic, book: BookOpen, search: Search, chat: MessageCircle };
const pageSize = 12;

export function PracticeChapterCards({ onOpen }: { onOpen: (chapter: string) => void }) {
  return <div className="cp-chapter-grid" aria-label="Oefenhoofdstukken">{practiceChapters.map(chapter => {
    const Icon = icons[chapter.icon];
    return <button key={chapter.id} className="cp-activity-button" data-chapter={chapter.id} onClick={() => onOpen(chapter.id)}><Icon aria-hidden="true" /><span>{chapter.title}</span><ArrowRight aria-hidden="true" /></button>;
  })}</div>;
}

export function PracticeChapters({ onBack, onAttempt }: { onBack: () => void; onAttempt: (attempt: PracticeAttempt) => void }) {
  const [location, setLocation] = useState<ChapterLocation>(() => typeof window === 'undefined' ? { level: 'all' } : parseChapterHash(window.location.hash));
  const [limit, setLimit] = useState(pageSize);
  const [round, setRound] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const restore = () => { setLocation(parseChapterHash(window.location.hash)); setLimit(pageSize); };
    window.addEventListener('hashchange', restore);
    return () => { window.removeEventListener('hashchange', restore); stopMedia(); };
  }, []);
  useEffect(() => {
    stopMedia();
    heading.current?.focus();
    document.querySelector('.learner-main')?.scrollTo({ top: 0 });
  }, [location.chapter, location.activity, location.collection, location.level]);
  function open(next: ChapterLocation) { stopMedia(); setLocation(next); setLimit(pageSize); window.location.hash = chapterHash(next); }
  const chapter = practiceChapters.find(item => item.id === location.chapter);
  const activities = useMemo(() => chapter?.activities.flatMap(id => chapterCollections(id).length ? [groupActivities.find(item => item.id === id)!] : []) ?? [], [chapter]);
  const activity = activities.find(item => item.id === location.activity);
  const collections = useMemo(() => activity ? chapterCollections(activity.id) : [], [activity]);
  const visible = collections.filter(item => location.level === 'all' || item.level === location.level);
  const collection = visible.find(item => item.id === location.collection);
  const title = collection?.title ?? activity?.label ?? chapter?.title ?? 'Oefenen';
  const toCollections = () => open({ ...location, collection: undefined });
  const back = collection ? toCollections : activity ? () => open({ chapter: chapter!.id, level: 'all' }) : chapter ? () => open({ level: 'all' }) : onBack;
  return <div className={`learner-page cp-chapters ${collection ? 'cp-chapter-playing' : ''}`} data-chapter-page={chapter?.id ?? 'all'}>
    <button className="text-back" onClick={back}><ArrowLeft />{collection ? 'Andere opdracht' : activity ? chapter!.title : chapter ? 'Oefenen' : 'Terug'}</button>
    <header className="content-page-heading"><div><h1 ref={heading} tabIndex={-1}>{title}</h1>{(collection?.level === 'support' || collection?.level === 'a1' || collection?.level === 'a2') && <p>Samen met je docent.</p>}</div></header>
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
      {!visible.length && <p>Er zijn hier nog geen opdrachten. Kies een ander niveau.</p>}
      {visible.length > limit && <button className="secondary-button cp-chapter-more" onClick={() => setLimit(value => value + pageSize)}>Meer opdrachten<ArrowRight /></button>}
    </>}
    {collection && activity && <GroupRound key={`${activity.id}:${collection.id}:${round}`} pack={collection.pack} activity={activity.id} exerciseSet={collection.exercises} sessionId={`chapter:${activity.id}:${collection.id}`} onAudio={(source, options) => source ? playMedia(source, options) : false} onAttempt={onAttempt} onBack={toCollections} onAgain={() => setRound(value => value + 1)} backLabel="Andere opdracht" />}
  </div>;
}
