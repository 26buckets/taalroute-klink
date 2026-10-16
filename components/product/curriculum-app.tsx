'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, BookOpen, Check, Home, LogOut, RefreshCw, Volume2, WholeWord } from 'lucide-react';
import { Brand, playMedia, stopMedia } from './shared';
import {
  curriculum, readingSteps, extensionSteps, wordById, wordMedia, wordsFor, groupWords,
  resolveStep, firstStepId, wordStep, activitiesFor, spellingTiles, storageKey, parseState,
  type CurriculumWord, type ReadingStep, type CurriculumState, type Activity,
} from '@/lib/klink-curriculum';

const subscribeRoute = (listener: () => void) => { window.addEventListener('hashchange', listener); return () => window.removeEventListener('hashchange', listener); };
const currentRoute = () => window.location.hash;
const serverRoute = () => '';

export function CurriculumApp({ teacher = false, onExit, onToast }: { teacher?: boolean; onExit: () => void; onToast: (text: string) => void }) {
  const prefix = teacher ? 'teacher' : 'learner';
  const route = useSyncExternalStore(subscribeRoute, currentRoute, serverRoute).split('/').slice(1);
  const [state, setState] = useState<CurriculumState>(() => { try { return parseState(localStorage.getItem(storageKey)); } catch { return parseState(null); } });
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const restore = () => { setPlaying(false); stopMedia(); };
    window.addEventListener('hashchange', restore);
    return () => { window.removeEventListener('hashchange', restore); stopMedia(); };
  }, []);
  function go(path: string) { setPlaying(false); window.location.assign(`#${prefix}/${path}`); }
  function save(next: CurriculumState) {
    setState(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { onToast('Oefenen kan doorgaan. Je plek bewaren lukt niet op dit apparaat.'); }
  }
  function complete(step: ReadingStep, introduced: string[]) {
    save({ introduced: [...new Set([...state.introduced, ...introduced])], completed: [...new Set([...state.completed, step.id])], lastStep: step.id });
  }
  const section = route[0] || 'home';
  const step = section === 'stap' ? resolveStep(route[1]) : undefined;
  const word = section === 'woord' ? wordById.get(route[1]) : undefined;
  const group = curriculum.groups.find(item => item.group === Number(route[1]));
  const selectedRoute = curriculum.readingRoutes.routes.find(item => item.id === route[1]);
  const first = readingSteps.find(item => !state.completed.includes(item.id)) ?? readingSteps[0];
  const filtered = curriculum.words.filter(item => !query || `${item.word} ${item.meaning}`.toLocaleLowerCase('nl').includes(query.toLocaleLowerCase('nl')));
  const pageWords = filtered.slice(page * 18, page * 18 + 18);
  const openStep = (item: ReadingStep) => go(`stap/${item.id}`);
  const wordButtons = (ids: string[]) => <div className="tr-word-links">{wordsFor(ids).map(item => <button key={item.id} onClick={() => go(`woord/${item.id}`)}>{item.word}{item.id === 'klink-woord-pak-verpakking' && <small>verpakking</small>}</button>)}</div>;
  function steps(items: ReadingStep[]) {
    return <div className="tr-step-list">{items.map(item => <button key={item.id} onClick={() => openStep(item)}>
      <span className="tr-step-mark">{state.completed.includes(item.id) ? <Check aria-label="Geoefend" /> : <BookOpen />}</span>
      <span><strong>{item.kind === 'herhaalronde' ? 'Herhaal' : item.title}</strong><small>{wordsFor([...item.newWords, ...item.returning]).map(item => item.word).join(' · ')}</small></span><ArrowRight />
    </button>)}</div>;
  }
  return <div className={`learner-app tr-app ${teacher ? 'tr-teacher' : ''}`}>
    <aside className="learner-nav">
      <button className="brand-button" onClick={() => go('home')} aria-label="Naar start"><Brand /></button>
      <nav aria-label={teacher ? 'Docentnavigatie' : 'Cursistnavigatie'}>
        <button className={section === 'home' ? 'active' : ''} onClick={() => go('home')}><Home /><span>Start</span></button>
        <button className={['groepen', 'groep', 'stap', 'leesroutes'].includes(section) ? 'active' : ''} onClick={() => go('groepen')}><BookOpen /><span>Leesstappen</span></button>
        <button className={['woorden', 'woord'].includes(section) ? 'active' : ''} onClick={() => go('woorden')}><WholeWord /><span>Woorden</span></button>
        <button className={section === 'herhalen' ? 'active' : ''} onClick={() => go('herhalen')}><RefreshCw /><span>Herhalen</span></button>
      </nav>
      <button className="learner-profile" onClick={onExit}><LogOut /><small>Afsluiten</small></button>
    </aside>
    <main className={`learner-main tr-main ${playing ? 'tr-practising' : ''}`}>
      {playing && step ? <ReadingPlayer key={step.id} step={step} introduced={state.introduced} onExit={() => setPlaying(false)} onComplete={ids => complete(step, ids)} onNext={() => {
        const next = readingSteps[readingSteps.findIndex(item => item.id === step.id) + 1];
        if (readingSteps.includes(step) && next) openStep(next); else go('groepen');
      }} /> : <div className="learner-page tr-page">
        {section !== 'home' && <button className="text-back" onClick={() => go(section === 'stap' && step?.group ? `groep/${step.group}` : section === 'woord' ? 'woorden' : 'home')}><ArrowLeft />Terug</button>}
        {section === 'home' && <>
          <header><span className="eyebrow">Klink · alfabeta+{teacher ? ' · Docent' : ''}</span><h1>Stap voor stap lezen</h1><p>Bekende woorden. Een nieuwe stap. Later weer herhalen.</p></header>
          <section className="tr-start"><small>{state.completed.length ? 'Jouw volgende leesstap' : 'Begin hier'}</small><h2>{first.title}</h2><p>{wordsFor(first.newWords.length ? first.newWords : first.returning).map(item => item.word).join(' · ')}</p><button className="primary-button" onClick={() => openStep(first)}>Bekijk de stap<ArrowRight /></button></section>
          <div className="tr-home-links"><button onClick={() => go('groepen')}><BookOpen /><span>Alle leesstappen</span><ArrowRight /></button><button onClick={() => go('woorden')}><WholeWord /><span>Alle woorden</span><ArrowRight /></button></div>
          {teacher && <section className="tr-teacher-note"><h2>De Taalroute-indeling</h2><p>{curriculum.groups.length} bouwgroepen · {curriculum.counts.readingSteps} basisleesstappen · {curriculum.counts.recallMoments} herhaalmomenten · {curriculum.counts.wordForms} woordvormen.</p><p>Dezelfde woorden groeien mee van Alfa A naar B en C. Een afgeronde activiteit betekent geoefend, niet bewezen beheersing.</p><p>Woordoefeningen zijn gekoppeld. Losse klankopnamen en nieuwe zins- of verhaaloefeningen zijn niet toegevoegd. De inhoudelijke luister- en beeldcontrole staat nog open.</p></section>}
        </>}
        {section === 'groepen' && <>
          <header><h1>Jouw leesstappen</h1><p>Kies een groep. Daarin staan de kleine stappen.</p></header>
          <div className="tr-groups">{curriculum.groups.map(item => { const count = readingSteps.filter(step => step.group === item.group).length; return <button key={item.group} onClick={() => go(`groep/${item.group}`)}><span className="tr-book"><BookOpen /><span>{item.group}</span></span><span><strong>{item.title}</strong><small>{count} {count === 1 ? 'leesstap' : 'leesstappen'}</small></span></button>; })}</div>
          <h2>Meer lezen</h2><button className="secondary-button" onClick={() => go('leesroutes')}>Langere woorden<ArrowRight /></button>
        </>}
        {section === 'groep' && group && <>
          <header><span className="eyebrow">Groep {group.group}</span><h1>{group.title}</h1><p>{group.application}</p></header>
          {steps(readingSteps.filter(item => item.group === group.group))}
          {extensionSteps.some(item => item.group === group.group) && <details><summary>Meer oefenen met deze klanken</summary>{steps(extensionSteps.filter(item => item.group === group.group))}</details>}
          <details><summary>Alle woorden bij deze groep ({groupWords(group.group).length})</summary>{wordButtons(groupWords(group.group).map(item => item.id))}</details>
          {group.group === 9 && <button className="secondary-button" onClick={() => go('leesroutes')}>Routes voor langere woorden<ArrowRight /></button>}
        </>}
        {section === 'stap' && step && <>
          <header><span className="eyebrow">{step.kind === 'herhaalronde' ? 'Herhalen' : step.group ? `Groep ${step.group}` : 'Leesstap'}</span><h1>{step.title}</h1></header>
          <div className="tr-word-columns">{[['Bekende woorden', step.known], ['Nieuwe woorden', step.newWords], ['Woorden die terugkomen', step.returning]].map(([title, ids]) => <section key={title as string}><h2>{title as string}</h2>{(ids as string[]).length ? wordButtons(ids as string[]) : <p>Geen in deze stap.</p>}</section>)}</div>
          {step.guidance && <p className="tr-guidance">{step.guidance}</p>}
          {activitiesFor(step, state.introduced).length ? <button className="primary-button" onClick={() => setPlaying(true)}>Oefenen<ArrowRight /></button> : <section><p>Oefen deze woorden eerst. Daarna kun je ze hier herhalen.</p>{wordsFor(step.returning).map(item => <button className="secondary-button" key={item.id} onClick={() => go(`stap/${firstStepId(item)}`)}>Begin met {item.word}<ArrowRight /></button>)}</section>}
          <details><summary>Voorbereiding en groei</summary>{wordsFor([...new Set([...step.known, ...step.newWords, ...step.returning])]).map(item => <WordPreparation key={item.id} word={item} />)}</details>
        </>}
        {section === 'woorden' && <>
          <header><h1>Alle woorden</h1><p>{curriculum.counts.wordForms} woordvormen. Kies een woord om het te bekijken en ermee te oefenen.</p></header>
          <label className="tr-search">Zoek een woord<input type="search" value={query} onChange={event => { setQuery(event.target.value); setPage(0); }} /></label>
          <div className="tr-wordbank">{pageWords.map(item => <button key={item.id} onClick={() => go(`woord/${item.id}`)}>{wordMedia[item.id]?.image && <Image src={wordMedia[item.id].image!} alt="" width={760} height={760} unoptimized />}<strong>{item.word}</strong><small>{item.meaning}</small></button>)}</div>
          {!filtered.length && <output>Geen woorden gevonden. Probeer een ander woord.</output>}
          <nav className="tr-pagination" aria-label="Woordpagina’s"><button className="secondary-button" disabled={!page} onClick={() => setPage(page - 1)}><ArrowLeft />Vorige</button><span>{filtered.length ? page + 1 : 0} / {Math.ceil(filtered.length / 18)}</span><button className="secondary-button" disabled={(page + 1) * 18 >= filtered.length} onClick={() => setPage(page + 1)}>Volgende<ArrowRight /></button></nav>
        </>}
        {section === 'woord' && word && <>
          <header><h1>{word.word}</h1><p>{word.meaning}</p></header>
          <WordModel word={word} onError={onToast} />
          <button className="primary-button" onClick={() => openStep(wordStep(word))}>Oefen dit woord<ArrowRight /></button>
          <details><summary>Leesdoel en herhaling</summary><WordPreparation word={word} /></details>
        </>}
        {section === 'leesroutes' && <>
          <header><h1>{selectedRoute?.title ?? 'Langere woorden'}</h1><p>{selectedRoute?.entry ?? 'Kies de opbouw die je wilt oefenen. Dit zijn geen verplichte vervolgniveaus.'}</p></header>
          {selectedRoute?.id === 'verbinden' ? curriculum.readingRoutes.subroutes.map(item => <section key={item.id}><h2>{item.title}</h2><p>{item.entry}</p>{wordButtons(item.words)}</section>) : selectedRoute ? wordButtons(curriculum.words.filter(item => item.firstReading.routeId === selectedRoute.id).map(item => item.id)) : <div className="tr-step-list">{curriculum.readingRoutes.routes.map(item => <button key={item.id} onClick={() => go(`leesroutes/${item.id}`)}><BookOpen /><span><strong>{item.title}</strong><small>{curriculum.words.filter(word => word.firstReading.routeId === item.id).length} woorden</small></span><ArrowRight /></button>)}</div>}
        </>}
        {section === 'herhalen' && <>
          <header><h1>Nog een keer</h1><p>Hier komen alleen woorden terug die je al hebt geoefend.</p></header>
          {steps(readingSteps.filter(item => item.kind === 'herhaalronde'))}
          {state.introduced.length ? wordButtons(state.introduced) : <p>Begin met een leesstap. Daarna verschijnen jouw woorden hier.</p>}
        </>}
        {(!['home', 'groepen', 'groep', 'stap', 'woorden', 'woord', 'leesroutes', 'herhalen'].includes(section) || (section === 'stap' && !step) || (section === 'woord' && !word) || (section === 'groep' && !group)) && <><h1>Kies een leesstap</h1><button className="primary-button" onClick={() => go('groepen')}>Alle leesstappen<ArrowRight /></button></>}
      </div>}
    </main>
  </div>;
}

function WordPreparation({ word }: { word: CurriculumWord }) {
  return <section className="tr-preparation"><h3>{word.word}</h3><p>{word.meaning}</p><p>{word.reading.firstMoment}</p><ul>{word.preparation.conditions.map(text => <li key={text}>{text}</li>)}</ul>
    {word.preparation.wordIds.length > 0 && <p>Eerst voorbereiden: {wordsFor(word.preparation.wordIds).map(item => item.word).join(', ')}.</p>}
    <dl>{(['a', 'b', 'c'] as const).map(level => <div key={level}><dt>Alfa {level.toUpperCase()}</dt><dd>{word.recurrence?.[level] ?? 'Opnieuw gebruiken wanneer deze betekenis nodig is, met passende leessteun.'}</dd></div>)}</dl>
  </section>;
}

function WordModel({ word, onError }: { word: CurriculumWord; onError: (message: string) => void }) {
  const media = wordMedia[word.id];
  const content = <>{media?.image && <Image src={media.image} alt={word.meaning} width={760} height={760} unoptimized />}<strong>{word.word}</strong>{media?.audio && <span><Volume2 />Luister</span>}</>;
  return media?.audio ? <button className="tr-word-model" aria-label={`Luister naar ${word.word}`} onClick={() => void playMedia(media.audio!).catch(() => onError('Het geluid lukt niet. Probeer opnieuw.'))}>{content}</button> : <div className="tr-word-model">{content}<small>Lees samen. Er is nog geen woordopname gekoppeld.</small></div>;
}

function ReadingPlayer({ step, introduced, onExit, onComplete, onNext }: { step: ReadingStep; introduced: string[]; onExit: () => void; onComplete: (ids: string[]) => void; onNext: () => void }) {
  const [activities] = useState(() => activitiesFor(step, introduced));
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [correct, setCorrect] = useState(false);
  const [done, setDone] = useState(false);
  const [automatic, setAutomatic] = useState(true);
  const [tiles, setTiles] = useState<number[]>([]);
  const [audioError, setAudioError] = useState('');
  const [heard, setHeard] = useState(false);
  const audioTicket = useRef(0);
  const activity = activities[index];
  const word = wordById.get(activity.wordId)!;
  const media = wordMedia[word.id];
  const targetTiles = spellingTiles(word);
  const bank = targetTiles.map((token, id) => ({ token, id })).reverse();
  const heading = useRef<HTMLHeadingElement>(null);
  const error = (message: string) => setAudioError(message);
  const next = useCallback(() => {
    audioTicket.current += 1;
    stopMedia();
    if (index === activities.length - 1) { setDone(true); onComplete([...new Set(activities.map(item => item.wordId))]); }
    else { setIndex(index + 1); setFeedback(''); setCorrect(false); setTiles([]); setAudioError(''); setHeard(false); }
  }, [index, activities, onComplete]);
  useEffect(() => { heading.current?.focus(); return () => { audioTicket.current += 1; stopMedia(); }; }, [index]);
  useEffect(() => {
    if (!correct || !automatic || done) return;
    const timer = setTimeout(next, 1500);
    return () => clearTimeout(timer);
  }, [correct, automatic, done, index, next]);
  async function listen() {
    if (!media?.audio) return;
    if (correct) setAutomatic(false);
    const ticket = ++audioTicket.current;
    try { await playMedia(media.audio); if (ticket === audioTicket.current) { setAudioError(''); setHeard(true); } } catch { if (ticket === audioTicket.current) setAudioError('Het geluid lukt niet. Tik opnieuw op Luister.'); }
  }
  function answer(id: string) {
    if (correct) return;
    const right = id === word.id;
    setCorrect(right);
    setFeedback(right ? 'Goed.' : activity.kind === 'listen' ? 'Luister nog eens en kies opnieuw.' : 'Kijk naar het voorbeeld. Probeer nog eens.');
  }
  function addTile(id: number) {
    if (correct || tiles.includes(id)) return;
    const nextTiles = [...tiles, id]; setTiles(nextTiles); setFeedback('');
    if (nextTiles.length === targetTiles.length) {
      const right = nextTiles.map(index => targetTiles[index]).join('') === word.word;
      setCorrect(right); setFeedback(right ? 'Goed.' : 'Kijk naar het voorbeeld. Haal de laatste letter weg of begin opnieuw.');
    }
  }
  const hasNextStep = readingSteps.some((item, position) => item.id === step.id && position < readingSteps.length - 1);
  if (done) return <section className="tr-finished"><Check /><h1>Goed geoefend</h1><p>{step.title}</p><button className="primary-button" onClick={onNext}>{hasNextStep ? 'Volgende leesstap' : 'Alle leesstappen'}<ArrowRight /></button><button className="secondary-button" onClick={onExit}>Terug naar deze stap</button></section>;
  const title: Record<Activity['kind'], string> = { model: media?.audio ? 'Kijk en luister' : 'Lees samen', match: 'Kies hetzelfde woord', listen: 'Welk woord hoor je?', build: 'Leg het woord' };
  return <section className="tr-player" data-activity={activity.kind} data-word-id={word.id}>
    <header className="tr-player-bar"><button className="secondary-button" onClick={onExit}><ArrowLeft />Terug</button><span>{step.title} · {index + 1} / {activities.length}</span><label><input type="checkbox" checked={automatic} onChange={event => setAutomatic(event.target.checked)} />Automatisch verder</label></header>
    <div className="tr-player-body">
      <h1 ref={heading} tabIndex={-1}>{title[activity.kind]}</h1>
      {activity.kind === 'model' && <><WordModel word={word} onError={error} /><p className="tr-meaning">{word.meaning}</p></>}
      {activity.kind === 'listen' && <button className="primary-button tr-listen" onClick={listen}><Volume2 />Luister</button>}
      {['match', 'build'].includes(activity.kind) && <div className="tr-example"><span>Voorbeeld</span><strong>{word.word}</strong>{media?.audio && <button className="secondary-button" aria-label={`Luister naar ${word.word}`} onClick={listen}><Volume2 />Luister</button>}</div>}
      {['match', 'listen'].includes(activity.kind) && <div className="tr-answers">{wordsFor(activity.options).map(option => <button className="secondary-button" key={option.id} disabled={correct || (activity.kind === 'listen' && !heard)} onClick={() => answer(option.id)}>{option.word}</button>)}</div>}
      {activity.kind === 'build' && <>
        <output className="tr-built" aria-label="Jouw woord" aria-live="polite">{tiles.length ? tiles.map(id => targetTiles[id]).join('') : '…'}</output>
        <div className="tr-tiles">{bank.map(tile => <button key={tile.id} className="secondary-button" disabled={correct || tiles.includes(tile.id)} onClick={() => addTile(tile.id)}>{tile.token}</button>)}</div>
        <div className="tr-repair"><button className="secondary-button" disabled={!tiles.length || correct} onClick={() => { setTiles(tiles.slice(0, -1)); setFeedback(''); }}><ArrowLeft />Eén terug</button><button className="secondary-button" disabled={!tiles.length || correct} onClick={() => { setTiles([]); setFeedback(''); }}><RefreshCw />Opnieuw</button></div>
      </>}
      {audioError && <p role="alert">{audioError}</p>}
    </div>
    <footer className="tr-player-footer"><output aria-live="polite">{correct && <Check />}{feedback || (activity.kind === 'listen' && !heard ? 'Luister eerst.' : 'Neem de tijd.')}</output><button className="primary-button" disabled={activity.kind !== 'model' && !correct} onClick={next}>{index === activities.length - 1 ? 'Afronden' : 'Verder'}<ArrowRight /></button></footer>
  </section>;
}
