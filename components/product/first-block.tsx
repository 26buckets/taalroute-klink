'use client';

/* oxlint-disable react/react-compiler -- Timestamps run only in event handlers; initial browser-storage hydration is intentional. */

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, Home, Pause, Play, RotateCcw, Volume2 } from 'lucide-react';
import { Brand } from './shared';
import { advance, checkpointKey, firstBlock, freshCheckpoint, parseCheckpoint, freshWordMatch, parseWordMatch, wordMatch, type Checkpoint, type WordId } from '@/lib/first-block';
import { BlockAudio } from '@/lib/first-block-audio';

const clip = (id: string) => `/start-tas/${id}.wav`;
type Feedback = 'none' | 'wrong' | 'correct';

export default function FirstBlock({ wordMatching = false }: { wordMatching?: boolean }) {
  const storageKey = wordMatching ? wordMatch.id : checkpointKey;
  const fresh = wordMatching ? freshWordMatch : freshCheckpoint;
  const trials = wordMatching ? wordMatch.trials : firstBlock.trials;
  const [checkpoint, setCheckpoint] = useState<Checkpoint>(fresh);
  const [active, setActive] = useState(false);
  const [ready, setReady] = useState(false);
  const [stored, setStored] = useState(false);
  const [storageOk, setStorageOk] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [heard, setHeard] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>('none');
  const [audioError, setAudioError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [paused, setPaused] = useState(false);
  const player = useRef<BlockAudio | null>(null);
  const epoch = useRef(0);
  const locked = useRef(false);
  const canRespond = useRef(false);
  const state = useRef(checkpoint);
  const began = useRef(0);
  const heading = useRef<HTMLHeadingElement>(null);
  const afterFeedback = useRef<Checkpoint | null>(null);

  useEffect(() => {
    const audio = new BlockAudio();
    player.current = audio;
    try {
      const saved = (wordMatching ? parseWordMatch : parseCheckpoint)(localStorage.getItem(storageKey));
      if (saved) { state.current = saved; setCheckpoint(saved); setStored(true); }
      localStorage.setItem(`${storageKey}-check`, '1');
      localStorage.removeItem(`${storageKey}-check`);
    } catch { setStorageOk(false); }
    setReady(true);
    const hide = () => {
      if (document.hidden) {
        epoch.current++; player.current?.stop(); locked.current = false;
        setPlaying(false); setPaused(true);
      }
    };
    document.addEventListener('visibilitychange', hide);
    // This is an operation counter, not a rendered DOM ref; cancel outstanding continuations.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    return () => { epoch.current++; audio.stop(); document.removeEventListener('visibilitychange', hide); };
  }, [storageKey, wordMatching]);

  useEffect(() => {
    if (active) heading.current?.focus();
  }, [active, checkpoint.step, checkpoint.trial, paused]);

  function save(next: Checkpoint) {
    state.current = next;
    setCheckpoint(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); setStored(true); }
    catch { setStorageOk(false); }
  }

  async function play(ids: string[]) {
    const ticket = ++epoch.current;
    canRespond.current = false;
    setPlaying(true); setAudioError(false);
    try {
      const ended = await player.current?.play(ids.map(clip));
      if (ticket !== epoch.current) return false;
      setPlaying(false);
      if (ended) { setHeard(true); canRespond.current = true; }
      return !!ended;
    } catch {
      if (ticket === epoch.current) { setPlaying(false); setAudioError(true); }
      return false;
    }
  }

  function sequence(p: Checkpoint): string[] {
    if (wordMatching && p.step !== 'done') return ['kijk', p.step === 'model' ? 'tas' : trials[p.trial].target, 'zelfde-woord'];
    // The isolated t recording was rejected by the teacher; word practice stays available.
    if (p.step === 'tas') return ['kijk', 'tas'];
    if (p.step === 'mat') return ['kijk', 'mat'];
    if (p.step === 'model') return ['voorbeeld', 'tas'];
    if (p.step === 'done') return ['klaar'];
    return ['kies', trials[p.trial].target];
  }

  function enter(next: Checkpoint) {
    afterFeedback.current = null;
    locked.current = false;
    setFeedback('none'); setHeard(false); setImageError(false);
    began.current = Date.now(); save(next);
    void play(sequence(next));
  }

  function next() {
    if (!canRespond.current || locked.current) return;
    canRespond.current = false;
    enter(advance(state.current));
  }

  function start(restart = false) {
    setActive(true); setPaused(false);
    enter(restart || state.current.step === 'done' ? fresh() : state.current);
  }

  function record(kind: 'answer' | 'replay', word?: WordId, correct?: boolean) {
    const p = state.current;
    save({ ...p, events: [...p.events, { step: p.step, trial: p.trial, kind, word, correct, elapsedMs: Math.max(0, Date.now() - began.current), at: new Date().toISOString() }].slice(-120) });
  }

  async function finishAnswer(next: Checkpoint) {
    afterFeedback.current = next;
    const ticket = epoch.current + 1;
    if (await play(['goed', state.current.step === 'model' ? 'tas' : trials[state.current.trial].target])) {
      await new Promise(resolve => setTimeout(resolve, 700));
      if (ticket === epoch.current) enter(next);
    }
    locked.current = false;
  }

  async function answer(word: WordId) {
    if (locked.current || !canRespond.current || !heard || playing || audioError || imageError || paused || feedback === 'correct') return;
    locked.current = true;
    const target = state.current.step === 'model' ? 'tas' : trials[state.current.trial].target;
    record('answer', word, word === target);
    if (word === target) {
      setFeedback('correct');
      await finishAnswer(advance(state.current));
    } else {
      setFeedback('wrong');
      await play([wordMatching ? 'vergelijk-woord' : 'opnieuw', target]);
      locked.current = false;
    }
  }

  function replay(wordOnly = false) {
    if (feedback === 'correct' && afterFeedback.current) { void finishAnswer(afterFeedback.current); return; }
    if (locked.current) return;
    record('replay');
    const p = state.current;
    const ids = wordMatching && wordOnly ? [p.step === 'model' ? 'tas' : trials[p.trial].target] : sequence(p);
    void play(ids);
  }

  function pause() {
    epoch.current++; player.current?.stop(); locked.current = false;
    setPlaying(false); setPaused(true);
  }

  function resume() { setPaused(false); replay(); }
  const p = checkpoint;
  const learning = p.step === 'tas' || p.step === 'mat';
  const choosing = p.step === 'choose' || p.step === 'model';
  const word = p.step === 'mat' ? 'mat' : 'tas';
  const target = p.step === 'choose' ? trials[p.trial].target : 'tas';
  const options: WordId[] = p.step === 'choose' ? trials[p.trial].options : ['tas', 'mat'];
  const title = !active ? wordMatching ? 'Zoek hetzelfde woord' : 'Tas en mat' : paused ? 'Even pauze' : p.step === 'done' ? 'Klaar voor nu' : wordMatching ? 'Zoek hetzelfde woord' : learning ? 'Kijk en luister' : 'Luister en kies';

  return <main className={`first-block${wordMatching ? ' fb-word-match' : ''}`} data-step={p.step} data-trial={p.trial} data-playing={playing}>
    <header className="fb-header">
      <Link href="/" aria-label="Naar Klink" onClick={() => player.current?.stop()}><Brand /></Link>
      {active && p.step !== 'done' && !paused && <button className="fb-quiet" onClick={pause}><Pause aria-hidden="true" />Pauze</button>}
    </header>
    <div className="fb-location" aria-label="Voortgang">
      <span className={!active || learning || (wordMatching && p.step === 'model') ? 'current' : 'passed'}>1 · {wordMatching ? 'Samen' : 'Luisteren'}</span>
      <span className={active && choosing && (!wordMatching || p.step !== 'model') ? 'current' : p.step === 'done' ? 'passed' : ''}>2 · {wordMatching ? 'Zelf proberen' : 'Kiezen'}</span>
      <span className={active && p.step === 'done' ? 'current' : ''}>3 · Klaar</span>
    </div>
    <section className="fb-content" aria-labelledby="fb-title">
      <h1 id="fb-title" ref={heading} tabIndex={-1}>{title}</h1>
      {!active ? <>
        <div className="fb-welcome-images" aria-hidden="true"><Image src={firstBlock.words.tas.image} alt="" width={800} height={800} unoptimized /><Image src={firstBlock.words.mat.image} alt="" width={800} height={800} unoptimized /></div>
        <p>{wordMatching ? 'Kijk naar het voorbeeld. Kies hetzelfde woord.' : 'Twee woorden. Kijken, luisteren en kiezen.'}</p>
        <button className="fb-primary" disabled={!ready} onClick={() => start()}><Play aria-hidden="true" />{stored && p.step !== 'done' ? 'Verder oefenen' : 'Start'}</button>
        {stored && p.step !== 'done' && <button className="fb-quiet" onClick={() => start(true)}><RotateCcw aria-hidden="true" />Opnieuw beginnen</button>}
        <small>{storageOk ? 'Je plek wordt op dit apparaat bewaard.' : 'Je plek kan hier niet worden bewaard. Je kunt wel oefenen.'}</small>
      </> : paused ? <>
        <p>{storageOk ? 'Je kunt straks verder op dit apparaat.' : 'Laat dit scherm open om straks verder te gaan.'}</p>
        <button className="fb-primary" onClick={resume}><Play aria-hidden="true" />Verder oefenen</button>
        <Link className="fb-quiet" href="/"><Home aria-hidden="true" />Naar Klink</Link>
      </> : p.step === 'done' ? <>
        <div className="fb-complete-mark"><Check aria-hidden="true" /></div>
        <p>Je hebt geoefend met <strong>tas</strong> en <strong>mat</strong>.</p>
        {!wordMatching && <Link className="fb-primary" href="/start/woorden"><ArrowRight aria-hidden="true" />Verder met woorden</Link>}
        <button className={wordMatching ? 'fb-primary' : 'fb-quiet'} onClick={() => start(true)}><RotateCcw aria-hidden="true" />Nog een keer</button>
        <Link className="fb-quiet" href="/"><Home aria-hidden="true" />Naar Klink</Link>
      </> : learning ? <>
        <button className="fb-word" aria-label={`Luister naar ${word}`} onClick={() => replay()} aria-busy={playing}>
          <Image src={firstBlock.words[word].image} alt="" width={800} height={800} unoptimized onError={() => setImageError(true)} />
          <span className="fb-word-text">{word}</span>
          <span className="fb-listen-label"><Volume2 aria-hidden="true" />{playing ? 'Je hoort het woord' : 'Tik om te luisteren'}</span>
        </button>
        <button className="fb-primary" disabled={!heard || playing || audioError || imageError} onClick={next}>Verder<ArrowRight aria-hidden="true" /></button>
      </> : wordMatching ? <>
        <button className={`fb-word fb-word-example ${feedback === 'wrong' ? 'fb-example-help' : ''}`} aria-label={`Luister naar ${target}`} onClick={() => replay(true)} disabled={feedback === 'correct' && !audioError} aria-busy={playing}>
          <Image src={firstBlock.words[target].image} alt="" width={800} height={800} unoptimized onError={() => setImageError(true)} />
          <span className="fb-word-text">{target}</span>
          <span className="fb-listen-label"><Volume2 aria-hidden="true" />{playing ? 'Luister…' : 'Tik om te luisteren'}</span>
        </button>
        <fieldset className="fb-choices fb-word-choices" aria-label="Kies hetzelfde woord als het voorbeeld">
          {options.map(id => <button key={id} className={`fb-choice fb-written-word ${p.step === 'model' && id === 'tas' ? 'fb-model-target' : ''}`} aria-label={`Kies ${id}`} disabled={!heard || playing || feedback === 'correct' || audioError || imageError} onClick={() => void answer(id)}>
            <span>{id}</span>
            {p.step === 'model' && id === 'tas' && <span className="fb-model-label"><ArrowRight aria-hidden="true" />Tik hier</span>}
          </button>)}
        </fieldset>
        <output className={`fb-feedback ${feedback}`} aria-live="polite">{feedback === 'correct' ? <><Check aria-hidden="true" />Goed. {target}.</> : feedback === 'wrong' ? `Kijk bovenaan naar ${target}. Zoek hetzelfde woord.` : p.step === 'model' ? 'We doen het eerst samen.' : 'Kies hetzelfde woord.'}</output>
      </> : <>
        <button className="fb-listen" onClick={() => replay()} disabled={feedback === 'correct' && !audioError} aria-busy={playing}><Volume2 aria-hidden="true" />{playing ? 'Luister…' : 'Nog een keer luisteren'}</button>
        <div className="fb-choices">
          {options.map(id => <button key={id} className={`fb-choice ${p.step === 'model' && id === 'tas' ? 'fb-model-target' : ''}`} aria-label={`Kies ${id}`} disabled={!heard || playing || feedback === 'correct' || audioError || imageError} onClick={() => void answer(id)}>
            <Image src={firstBlock.words[id].image} alt="" width={800} height={800} unoptimized onError={() => setImageError(true)} />
            {p.step === 'model' && id === 'tas' && <span className="fb-model-label"><ArrowRight aria-hidden="true" />Tik op de tas</span>}
          </button>)}
        </div>
        <output className={`fb-feedback ${feedback}`} aria-live="polite">{feedback === 'correct' ? <><Check aria-hidden="true" />Goed. {firstBlock.words[p.step === 'model' ? 'tas' : firstBlock.trials[p.trial].target].text}.</> : feedback === 'wrong' ? 'Luister nog eens. Probeer opnieuw.' : p.step === 'model' ? 'We doen het eerst samen.' : 'Kies het plaatje.'}</output>
      </>}
      {active && !paused && audioError && <div className="fb-error" role="alert"><p>Het geluid lukt niet. Zet je geluid aan en probeer opnieuw.</p><button className="fb-primary" onClick={() => replay()}><Volume2 aria-hidden="true" />Probeer geluid opnieuw</button></div>}
      {active && imageError && <p className="fb-error" role="alert">Het plaatje is niet geladen. Vernieuw de pagina om verder te gaan.</p>}
      {active && !storageOk && <output className="fb-storage">Je plek wordt niet bewaard als je dit scherm sluit.</output>}
    </section>
  </main>;
}
