'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Eye, FileText, HelpCircle, Volume2 } from 'lucide-react';
import { dailyAudio, dailyBlocks, dailyStorageKey, emptyDailyRecord, readDailyProgress, recordDailyAnswer, type DailyBlock, type DailyProgress, type DailyRecord, type DailyStep, type Support } from '@/lib/alfa-c-dagelijks';
import { playMedia, stopMedia } from './shared';

export function DailyBlockCards() {
  return <>{dailyBlocks.map(b => <a key={b.id} className="cp-activity-button" data-daily-block={b.id} href={`#learner/alfa-c/${b.id}`}><FileText aria-hidden="true" /><span>{b.title}<small>12 opdrachten · berichten en documenten</small></span><ArrowRight aria-hidden="true" /></a>)}</>;
}

export function AlfaCDailyPractice({ block }: { block: DailyBlock }) {
  const [progress, setProgress] = useState<DailyProgress>();
  const [storageError, setStorageError] = useState(false);
  const [completionError, setCompletionError] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setProgress(readDailyProgress(localStorage.getItem(dailyStorageKey))); }
      catch { setProgress(readDailyProgress(null)); setStorageError(true); }
    });
    return () => { cancelAnimationFrame(frame); stopMedia(); };
  }, []);
  function save(next: DailyProgress) {
    setProgress(next);
    try { localStorage.setItem(dailyStorageKey, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  const at = progress?.positions[block.id] ?? 0;
  const step = block.steps[at];
  const position = (index: number) => progress && save({ ...progress, positions: { ...progress.positions, [block.id]: index } });
  return <div className="learner-page cp-chapters cp-chapter-playing pilot-page functional-page">
    <header className="cp-context-header"><a className="text-back" href="#learner/alfa-c" aria-label="Andere oefening"><ArrowLeft /></a><h1>{block.title}</h1><small className="cp-context-meta">Alfa C</small></header>
    {storageError && <p role="alert">Bewaren lukt niet op dit apparaat. Je kunt wel verder oefenen.</p>}
    {!progress ? <p>Even laden…</p> : !step ? <section className="honest-empty pilot-complete"><h2>Goed geoefend</h2><p>{block.end}</p><button className="secondary-button" onClick={async () => { setCompletionError(false); try { await playMedia(dailyAudio(block.endAudio), { waitUntilEnd: true, playbackRate: 1 }); } catch { setCompletionError(true); } }}><Volume2 />Luister</button>{completionError && <p role="alert">Het geluid werkt niet. Probeer het opnieuw.</p>}<a className="secondary-button" href="#learner/alfa-c">Kies een ander blok<ArrowRight /></a></section>
      : <DailyPlayer key={step.id} block={block} step={step} index={at} record={progress.records[step.id] ?? emptyDailyRecord()} onRecord={record => save({ ...progress, records: { ...progress.records, [step.id]: record } })} onPrevious={at ? () => position(at - 1) : undefined} onNext={() => position(at + 1)} />}
  </div>;
}

function DailyPlayer({ block, step, index, record, onRecord, onPrevious, onNext }: { block: DailyBlock; step: DailyStep; index: number; record: DailyRecord; onRecord: (r: DailyRecord) => void; onPrevious?: () => void; onNext: () => void }) {
  const [model, setModel] = useState(false), [help, setHelp] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]), [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const [busy, setBusy] = useState(false), [audioError, setAudioError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null), current = useRef(record), playback = useRef(new AbortController());
  useEffect(() => { heading.current?.focus({ preventScroll: true }); return () => { playback.current.abort(); stopMedia(); }; }, []);
  function support(kind: keyof Support) {
    current.current = { ...current.current, support: { ...current.current.support, [kind]: current.current.support[kind] + 1 } };
    onRecord(current.current);
  }
  async function play(ids: string[]) {
    playback.current.abort(); stopMedia(); const controller = new AbortController(); playback.current = controller;
    setBusy(true); setAudioError(false);
    try { for (const id of ids) { if (controller.signal.aborted) return; await playMedia(dailyAudio(id), { waitUntilEnd: true, playbackRate: 1 }); } }
    catch { if (!controller.signal.aborted) setAudioError(true); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  function stop() { playback.current.abort(); stopMedia(); setBusy(false); }
  function answer(response: string[]) {
    current.current = recordDailyAnswer(step, current.current, response); onRecord(current.current);
    setChosen(response); setResult(current.current.last!.correct ? 'right' : 'wrong');
    support('feedback'); void play([current.current.last!.correct ? step.audio.G : step.audio.F]);
  }
  return <section className="cp-exercise-browser is-mixed-round pilot-player functional-player" data-daily-step={step.id}>
    <div className="cp-exercise-workspace"><div className="cp-exercise-main">
      <header className="cp-exercise-record-head pilot-head"><h2 ref={heading} tabIndex={-1}>{step.instruction}</h2><div><button className="secondary-button" aria-label="Vorige opdracht" disabled={!onPrevious} onClick={onPrevious}><ArrowLeft /></button><span>{index + 1} / 12</span></div></header>
      <div className="cp-exercise-stage">
        <div className="pilot-instruction">{index === 0 && <p>{block.start}</p>}<p>{step.speech.I}</p></div>
        <div className="pilot-tools">
          <button className="secondary-button" disabled={busy} onClick={() => { support('instruction'); void play([...(index === 0 ? [block.startAudio] : []), step.audio.I]); }}><Volume2 />{busy ? 'Luisteren…' : 'Luister'}</button>
          {step.audio.O && <button className="secondary-button" disabled={busy} onClick={() => { support('content'); void play([step.audio.O!]); }}><Volume2 />Luister naar de tekst</button>}
          <button className="secondary-button" aria-expanded={model} onClick={() => { if (!model) { support('example'); void play([step.audio.V]); } else stop(); setModel(!model); }}><Eye />{model ? 'Nu jij' : 'Voorbeeld'}</button>
          <button className="secondary-button" aria-expanded={help} onClick={() => { if (!help) { support('help'); void play([step.audio.H]); } else stop(); setHelp(!help); }}><HelpCircle />Help</button>
        </div>
        {audioError && <p role="alert">Het geluid werkt niet. Probeer opnieuw of vraag iemand om hulp. Je kunt de tekst op het scherm lezen.</p>}
        {help && <aside className="pilot-help"><p>{step.speech.H}</p></aside>}
        {model ? <section className="cp-task-card pilot-model functional-source"><h3>Voorbeeld</h3><p>{step.example}</p><button className="primary-button" onClick={() => { stop(); setModel(false); setChosen([]); setResult('idle'); }}>Nu jij<ArrowRight /></button></section> : <>
          {step.documents.map(d => <section className="cp-task-card functional-source" key={d.id}>{d.title && <h3>{d.title}</h3>}<p>{d.text}</p></section>)}
          {step.context.map(text => <p key={text}>{text}</p>)}
          {step.interaction === 'keuze' ? <fieldset className="functional-choice"><legend>{step.instruction}</legend><p>Kies één antwoord.</p><div className="functional-choice-grid">{step.options.map(o => <button key={o.code} className="cp-option" aria-pressed={chosen[0] === o.code} disabled={busy || result === 'right'} onClick={() => answer([o.code])}>{o.text}</button>)}</div></fieldset>
            : <fieldset className="functional-choice"><legend>{step.instruction}</legend><output aria-live="polite" aria-label="Jouw zin">{chosen.join(' ') || 'Tik op het eerste kaartje.'}</output><div className="functional-choice-grid">{step.cards.map(card => <button key={card} className="cp-option" disabled={busy || chosen.includes(card) || result === 'right'} onClick={() => { const next = [...chosen, card]; setChosen(next); if (next.length === step.cards.length) answer(next); }}>{card}</button>)}</div><button className="secondary-button" disabled={busy || !chosen.length} onClick={() => { setChosen(chosen.slice(0, -1)); setResult('idle'); }}><ArrowLeft />Eén terug</button></fieldset>}
        </>}
      </div>
      <footer className="pilot-footer"><output aria-live="polite">{result === 'right' ? step.speech.G : result === 'wrong' ? step.speech.F : ''}</output><button className="primary-button" disabled={busy || model || result !== 'right'} onClick={onNext}>Verder<ArrowRight /></button></footer>
    </div></div>
  </section>;
}
