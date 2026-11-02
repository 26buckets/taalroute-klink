'use client';
import { RoundProgressNotice, useRoundProgress } from './round-progress';
import { collectionProgressId, roundProgressCount, sequenceProgressId } from '@/lib/round-progress';
import { importExistingSequenceProgress } from '@/lib/alfa-c-round-progress';
import { TeacherBlockCards } from './alfa-c-docent';
import { PracticeHeader } from './practice-header';
import { AlfaCPractice } from './alfa-c-practice';
import { alfaCChapters } from '@/lib/alfa-c-navigation';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, BookOpen, Check, Ear, Eye, Grid2X2, Image as ImageIcon, Keyboard, Link2, MessageCircle, Mic, PencilLine, Puzzle, Search, UserRound, UsersRound } from 'lucide-react';
import Image from './compact-image';
import { ProductionRound } from './production-round';
import { SourceRepeatRound } from './source-repeat-round';
import { GroupRound } from './package-group-practice';
import { playMedia, stopMedia } from './shared';
import { groupActivities } from '@/lib/group-practice';
import { availableChapterActivities, availableChapterCollections, selectedChapterCollection, displayedChapterCollections, availableChapterSequences, availableChapterTeacherGroups, chapterExerciseCount, chapterLevels, chapterExerciseChoices, chapterHash, practiceChapters, type ChapterLocation } from '@/lib/practice-chapters';
import { exerciseSetHelp, levelLabel, type ContentHelp } from '@/lib/content-levels';
import { MyRoute, AdditionalContent, useRouteSettings } from './route-settings';
import { practiceLocation } from '@/lib/practice-navigation';
import type { PracticeAttempt } from '@/lib/package-content';
import { learningReviewKey, parseLearningReview } from '@/lib/learning-review';
import { learnerCollectionLabel } from '@/lib/learner-copy';

const icons = { eye: Eye, ear: Ear, image: ImageIcon, link: Link2, puzzle: Puzzle, grid: Grid2X2, keyboard: Keyboard, pen: PencilLine, mic: Mic, book: BookOpen, search: Search, chat: MessageCircle };
const pageSize = 12;
// Temporary orientation during beta; remove all counters with this switch.
const showBetaCounts = true;
function ExerciseCount({ count, words = false }: { count: number; words?: boolean }) {
  return showBetaCounts ? <small className="cp-beta-count">{count} {words ? count === 1 ? 'woord' : 'woorden' : count === 1 ? 'oefening' : 'oefeningen'}</small> : null;
}
const collectionCount = (items: ReturnType<typeof availableChapterCollections>) => items.reduce((total, item) => total + (item.exerciseCount ?? item.exercises.length), 0);
const readReview = () => { try { return parseLearningReview(localStorage.getItem(learningReviewKey)); } catch { return {}; } };
function revealCollection(limits: Record<string, number>, location: ChapterLocation) {
  if (!location.activity || !location.collection) return limits;
  const key = `${location.chapter}/${location.activity}/${location.level}/${location.help ?? 'all'}`;
  const items = displayedChapterCollections(location.activity, location);
  const needed = Math.ceil((items.findIndex(item => item.id === location.collection || (item.wordRound ?? item.readingSelection)?.sourceId === location.collection) + 1) / pageSize) * pageSize;
  return (limits[key] ?? pageSize) >= needed ? limits : { ...limits, [key]: needed };
}

export function PracticeChapterCards({ onOpen, isAvailable, count }: { onOpen: (chapter: string) => void; isAvailable?: (chapter: string) => boolean; count?: (chapter: string) => number; children?: import('react').ReactNode }) {
  return <div className="cp-chapter-grid" aria-label="Oefenhoofdstukken">{practiceChapters.map(chapter => {
    const Icon = icons[chapter.icon], available = isAvailable?.(chapter.id) ?? true;
    return <button key={chapter.id} className="cp-activity-button" data-chapter={chapter.id} disabled={!available} onClick={() => onOpen(chapter.id)}><Icon aria-hidden="true" /><span>{chapter.title}{count && <ExerciseCount count={count(chapter.id)} />}{!available && <small>Niet beschikbaar</small>}</span>{available && <ArrowRight aria-hidden="true" />}</button>;
  })}</div>;
}

export function PracticeChapters({ onBack, onAttempt, startTitle, startActions, startFooter }: { onBack: () => void; onAttempt: (attempt: PracticeAttempt) => void; startTitle?: ReactNode; startActions?: ReactNode; startFooter?: ReactNode }) {
  const { practice, changePractice } = useRouteSettings();
  const progressReady = useRoundProgress();
  useEffect(importExistingSequenceProgress, []);
  const [location, setLocation] = useState<ChapterLocation>(() => typeof window === 'undefined' ? practice : practiceLocation(window.location.hash, practice));
  const [limits, setLimits] = useState<Record<string, number>>(() => revealCollection({}, location));
  const [round, setRound] = useState(0);
  const [review, setReview] = useState(readReview);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousLocation = useRef(location);
  const listKey = `${location.chapter}/${location.activity}/${location.level}/${location.help ?? 'all'}`;
  const limit = limits[listKey] ?? pageSize;
  useEffect(() => {
    const restore = () => { const next = practiceLocation(window.location.hash, practice); setLocation(current => chapterHash(current) === chapterHash(next) ? current : next); setLimits(current => revealCollection(current, next)); setReview(readReview()); };
    restore();
    window.addEventListener('hashchange', restore);
    return () => { window.removeEventListener('hashchange', restore); stopMedia(); };
  }, [practice]);
  useEffect(() => {
    const previous = previousLocation.current;
    previousLocation.current = location;
    stopMedia();
    if (previous.chapter === location.chapter && previous.activity === location.activity && previous.sequence === location.sequence && previous.help === location.help && !previous.collection && !location.collection) return;
    if (!location.collection && previous.collection && previous.chapter === location.chapter && previous.activity === location.activity && previous.level === location.level) {
      const card = document.querySelector<HTMLButtonElement>(`[data-collection="${CSS.escape(previous.collection)}"]`) ?? document.querySelector<HTMLButtonElement>(`[data-source-collection="${CSS.escape(previous.collection)}"]`);
      if (card) {
        const frame = requestAnimationFrame(() => { card.focus({ preventScroll: true }); card.scrollIntoView({ block: 'center', behavior: 'instant' }); });
        return () => cancelAnimationFrame(frame);
      }
    }
    heading.current?.focus({ preventScroll: true });
    document.querySelector('.learner-main')?.scrollTo({ top: 0 });
  }, [location]);
  function open(next: ChapterLocation) { stopMedia(); setLocation(next); setLimits(current => revealCollection(current, next)); setReview(readReview()); changePractice({ level: next.level === 'all' ? practice.level : next.level, help: next.help === 'guided' ? 'guided' : 'practice' }); window.location.assign(chapterHash(next)); }
  const sequenceChapter = alfaCChapters.find(item => item.id === location.chapter);
  const chapter = practiceChapters.find(item => item.id === (sequenceChapter?.parent ?? location.chapter));
  const activities = chapter?.activities.map(id => groupActivities.find(item => item.id === id)!) ?? [];
  const activity = activities.find(item => item.id === location.activity);
  const reviewMode = activity?.id === 'learning-review';
  const visible = location.activity ? displayedChapterCollections(location.activity, location, review) : [];
  const availableActivities = chapter ? availableChapterActivities(chapter.id, location, review) : [];
  const availableLevels = new Set(chapterLevels.filter(({ id: level }) =>
    (location.activity ? [location.activity] : chapter?.activities ?? groupActivities.map(item => item.id))
      .some(id => availableChapterCollections(id, { level, help: location.help }, review).length)
  ).map(item => item.id));
  if (sequenceChapter || (chapter && (availableChapterSequences(chapter.id, { ...location, level: 'alfa-c' }).length || availableChapterTeacherGroups(chapter.id, { ...location, level: 'alfa-c' }).length))) availableLevels.add('alfa-c');
  if (!chapter) availableLevels.add('alfa-c');
  const chapterSelection = (_id: string) => ({ level: location.level, help: location.help });
  const countChapter = (id: string, help = location.help) => chapterExerciseCount(id, { ...chapterSelection(id), help }, review);
  const countMode = (help: ContentHelp) => chapter ? countChapter(chapter.id, help) : practiceChapters.reduce((total, item) => total + countChapter(item.id, help), 0);
  const openChapter = (id: string) => open({ chapter: id, ...chapterSelection(id) });
  const modeAvailable = (help: ContentHelp) => countMode(help) > 0;
  const openMode = (help: ContentHelp) => open({ ...location, help, collection: undefined, words: undefined });
  const collection = reviewMode ? visible.find(item => item.id === location.collection) : selectedChapterCollection(location);
  const Round = collection?.sourceRepeat ? SourceRepeatRound : collection?.contentUrl ? ProductionRound : GroupRound;
  const exerciseChoices = collection ? chapterExerciseChoices(location) : [];
  const sequenceBlock = sequenceChapter && location.sequence && ['all', 'alfa-c'].includes(location.level) ? sequenceChapter.blocks.find(block => block.id === location.collection) : undefined;
  const activitySelected = Boolean(activity || location.sequence);
  const items = sequenceChapter && location.sequence && ['all', 'alfa-c'].includes(location.level) ? sequenceChapter.blocks.map(block => ({ id: block.id, title: block.title, progressId: sequenceProgressId(sequenceChapter.kind, block.id), total: block.steps.length, progressTotal: block.steps.length, exerciseIds: undefined as string[] | undefined, words: false, wordCount: undefined as number | undefined, sourceId: undefined as string | undefined, image: undefined as string | undefined, level: 'Alfa C', summary: location.help === 'guided' ? 'Met de docent' : 'Zelf oefenen' })) : visible.map(item => ({ id: item.id, title: item.title, progressId: collectionProgressId(location.activity!, (item.wordRound ?? item.readingSelection)?.sourceId ?? item.id, item.contentUrl), total: (item.wordRound ?? item.readingSelection)?.exerciseIds.length ?? item.exerciseCount ?? item.exercises.length, progressTotal: (item.wordRound ?? item.readingSelection)?.allExerciseIds.length ?? item.exerciseCount ?? item.exercises.length, exerciseIds: (item.wordRound ?? item.readingSelection)?.exerciseIds, words: Boolean(item.wordRound), wordCount: item.wordRound?.wordIds.length, sourceId: (item.wordRound ?? item.readingSelection)?.sourceId, image: item.image, level: item.levels ? `Woordenschat: ${item.levels.map(levelLabel).join(' / ')}` : levelLabel(item.level), summary: `${(item.help ?? exerciseSetHelp(item.exercises)) === 'guided' ? 'Met de docent' : 'Zelf oefenen'}${item.placeholderCount ? ` · ${item.placeholderCount} afbeeldingen volgen` : ''}` }));
  // Example words identify a collection, but must not reveal a listening/spelling answer during play.
  const title = (collection?.exercises[0]?.writingSourceId || collection?.exercises[0]?.learningPathId || collection?.exercises[0]?.componentId === 'KLINK-CONTENT' || collection?.exercises[0]?.synonymPairId || collection?.exercises[0]?.wordUseId ? activity?.label : collection ? learnerCollectionLabel(collection.title, collection.id).title : undefined) ?? activity?.label ?? (location.sequence ? sequenceChapter?.title : undefined) ?? chapter?.title ?? 'Start';
  const toCollections = () => open({ ...location, collection: undefined, words: undefined });
  const selection = { level: location.level, help: location.help };
  const back = collection ? toCollections : activitySelected ? () => open({ chapter: chapter!.id, ...selection }) : chapter ? () => open(selection) : location.help ? () => open({ level: location.level }) : onBack;
  if (sequenceBlock) return <AlfaCPractice key={sequenceBlock.id} selected={sequenceBlock.id} backHref={chapterHash({ ...location, collection: undefined })} header={<PracticeHeader title={learnerCollectionLabel(sequenceBlock.title).title} backLabel="Andere opdracht" onBack={toCollections} headingRef={heading} meta={`Oefenen · ${chapter!.title}`} />} />;
  return <div className={`learner-page cp-chapters cp-direct-practice ${!chapter ? 'cp-home' : ''} ${collection ? 'cp-chapter-playing' : ''}`} data-chapter-page={chapter?.id ?? 'all'}>
    <PracticeHeader title={!chapter && startTitle ? startTitle : title} headingRef={heading} onBack={chapter ? back : undefined} backLabel={collection ? 'Andere opdracht' : activitySelected ? chapter!.title : chapter ? 'Start' : 'Terug'} metaLabel={!collection && chapter ? 'Je bent hier' : undefined} meta={collection ? exerciseSetHelp(collection.exercises) === 'guided' ? 'Samen met je docent.' : '' : chapter ? `Oefenen${activitySelected ? ` · ${chapter.title}` : ''}` : ''} actions={!collection && <nav className="cp-practice-modes" aria-label="Manier van oefenen">{([['practice', 'Zelf oefenen', UserRound], ['guided', 'Met je docent', UsersRound]] as const).map(([id, label, Icon]) => <button key={id} className="secondary-button" aria-pressed={location.help === id} onClick={() => openMode(id)}><Icon aria-hidden="true" />{label}</button>)}</nav>} />
    {collection && chapter && <p className="sr-only" aria-label="Je bent hier">Oefenen · {chapter.title}</p>}
    {!collection && <div className="cp-page-workspace">
    <MyRoute direct showPracticeChoice={false} availableLevels={availableLevels} selection={location} onSelectionChange={next => open({ ...location, ...next, collection: undefined })} />
    {!chapter && <>{startActions}<PracticeChapterCards isAvailable={id => countChapter(id) > 0} onOpen={openChapter} />{startFooter}</>}
    {chapter && !activitySelected && <div className="cp-chapter-grid" aria-label={chapter.title}>{availableChapterSequences(chapter.id, location).map(item => { const Icon = icons[item.icon]; return <button key={item.id} className="cp-activity-button" data-alfa-c-category={item.legacy} data-chapter-activity={item.id} onClick={() => open({ chapter: item.id, sequence: true, ...selection })}><Icon aria-hidden="true" /><span>{item.title}<small>Stap voor stap oefenen</small><ExerciseCount count={item.blocks.reduce((n, block) => n + block.steps.length, 0)} /></span><ArrowRight aria-hidden="true" /></button>; })}<TeacherBlockCards level={location.level} groups={availableChapterTeacherGroups(chapter.id, location)} />{chapter.id === 'sounds' && <a className="cp-activity-button" href="#learner/sounds"><Ear aria-hidden="true" /><span>Klankenkaart</span><ArrowRight aria-hidden="true" /></a>}{activities.map(item => {
      const Icon = icons[item.icon], available = availableActivities.includes(item.id);
      return <button className="cp-activity-button" key={item.id} data-chapter-activity={item.id} disabled={!available} onClick={() => open({ chapter: chapter.id, activity: item.id, ...selection })}><Icon aria-hidden="true" /><span>{item.label}<ExerciseCount count={collectionCount(availableChapterCollections(item.id, location, review))} />{!available && <small>Niet beschikbaar</small>}</span>{available && <ArrowRight aria-hidden="true" />}</button>;
    })}</div>}
    {activitySelected && !collection && <>
      <RoundProgressNotice />
      <div className="cp-chapter-collections">{items.slice(0, limit).map(item => {
        const done = progressReady ? roundProgressCount(item.progressId, item.progressTotal, item.exerciseIds) : 0;
        const complete = item.total > 0 && done === item.total;
        const label = learnerCollectionLabel(item.title, item.sourceId ?? item.id);
        const roundNumber = label.round ?? item.id.match(/~words-(\d+)$/)?.[1];
        return <button key={item.id} className={`cp-chapter-collection${complete ? ' is-complete' : ''}`} data-collection={item.id} data-source-collection={item.sourceId} {...(sequenceChapter ? { [`data-${sequenceChapter.kind}-block`]: item.id } : {})} onClick={() => open({ ...location, collection: item.id, words: undefined })}>
        {item.image ? <Image src={item.image} width={96} height={96} alt="" /> : <BookOpen aria-hidden="true" />}
        <span className="cp-collection-copy"><strong>{label.title}</strong>
          <span className="cp-collection-meta"><small>{roundNumber && `Ronde ${roundNumber} · `}{item.level} · </small><ExerciseCount count={item.wordCount ?? item.total} words={item.words} /></span>
          <small>{[label.support, item.summary].filter(Boolean).join(' · ')}</small>
          {done > 0 && <small className="cp-round-status">{complete && <Check aria-hidden="true" />}{complete ? `Afgerond · ${done} van ${item.total}` : `${done} van ${item.total} gedaan`}</small>}
        </span><ArrowRight aria-hidden="true" />
      </button>; })}</div>
      {!items.length && <div className="cp-unavailable">
        <output>{reviewMode ? 'Je hebt nu niets om te herhalen.' : `Deze oefening is niet beschikbaar voor ${levelLabel(location.level)}.`}</output>
        {practiceChapters.some(item => availableChapterActivities(item.id, location, review).length) ? <>
          <p>Kies een andere oefening:</p>
          <PracticeChapterCards count={countChapter} isAvailable={id => chapterExerciseCount(id, location, review) > 0} onOpen={openChapter} />
        </> : modeAvailable('guided') ? <button className="secondary-button" onClick={() => openMode('guided')}><UsersRound aria-hidden="true" />Oefen met je docent<ArrowRight aria-hidden="true" /></button> : <button className="secondary-button" onClick={() => open({ level: location.level })}>Andere oefeningen<ArrowRight aria-hidden="true" /></button>}
      </div>}

      {items.length > limit && <button className="secondary-button cp-chapter-more" onClick={() => setLimits(current => ({ ...current, [listKey]: limit + pageSize }))}>Meer opdrachten<ArrowRight /></button>}
    </>}
    <AdditionalContent showPracticeChoice={false} selection={location} availableLevels={availableLevels} onSelectionChange={next => open({ ...location, ...next, collection: undefined })} />
    </div>}
    {collection && activity && <Round progressId={collectionProgressId(activity.id, (collection.wordRound ?? collection.readingSelection)?.sourceId ?? collection.id, collection.contentUrl)} progressExerciseIds={(collection.wordRound ?? collection.readingSelection)?.allExerciseIds} legacySessionId={(collection.wordRound ?? collection.readingSelection) && ((collection.wordRound ?? collection.readingSelection)!.sourceId !== collection.id || location.words) ? `chapter:${activity.id}:${(collection.wordRound ?? collection.readingSelection)!.sourceId}` : undefined} exerciseIds={(collection.wordRound ?? collection.readingSelection)?.exerciseIds} sourceRepeat={collection.sourceRepeat} contentUrl={collection.contentUrl!} count={collection.exerciseCount!} exerciseMenu={{ scopeLabel: collection.wordRound ? 'Met dezelfde woorden' : undefined, value: activity.id, options: exerciseChoices.map(item => ({ id: item.id, label: item.label, icon: icons[item.icon] })), onSelect: id => {
      const next = exerciseChoices.find(item => item.id === id);
      if (next) open({ ...location, chapter: next.chapter, activity: next.id, collection: next.collection, words: next.words });
    } }} key={`${activity.id}:${collection.id}:${location.words?.join(',') ?? ''}:${round}`} pack={collection.pack} activity={activity.id} exerciseSet={collection.exercises} sessionId={`chapter:${activity.id}:${collection.id}${location.words ? `:words:${location.words.join(',')}` : ''}${reviewMode && !collection.sourceRepeat ? ':' + Math.max(...collection.exercises.map(exercise => review[exercise.exerciseId]?.last ?? 0)) : ''}`} onAudio={(source, options) => source ? playMedia(source, options) : false} onAttempt={onAttempt} onBack={toCollections} onAgain={() => setRound(value => value + 1)} backLabel="Andere opdracht" />}
  </div>;
}
