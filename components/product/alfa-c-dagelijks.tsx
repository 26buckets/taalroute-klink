'use client';
import { dailyAudio } from '@/lib/alfa-c-audio';
import { useWordListeningHelp } from '@/hooks/use-word-listening-help';
import { useExerciseViewTarget } from './exercise-view';
import { ExerciseAudioSlot, ExerciseHelp, ExerciseListen } from './exercise-listen';
import { recordDailyRounds } from '@/lib/alfa-c-round-progress';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Eye, Volume2 } from 'lucide-react';
import { dailyStorageKey, emptyDailyRecord, readDailyProgress, recordDailyAnswer, type DailyBlock, type DailyProgress, type DailyRecord, type DailyStep, type Support } from '@/lib/alfa-c-dagelijks';
import { playMedia, stopMedia } from './shared';
import { AlfaCWorkspace, DocumentSet } from './alfa-c-workspace';
import { AlfaCExplanation, useAlfaCReadAlong } from './alfa-c-readalong';

export function AlfaCDailyPractice({ block, backHref, header }: { backHref: string; header: ReactNode; block: DailyBlock }) {
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
    recordDailyRounds(next);
    setProgress(next);
    try { localStorage.setItem(dailyStorageKey, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  const at = progress?.positions[block.id] ?? 0;
  const step = block.steps[at];
  const position = (index: number) => progress && save({ ...progress, positions: { ...progress.positions, [block.id]: index } });
  return <div className="learner-page cp-chapters cp-chapter-playing pilot-page functional-page ac-document-page">
    {header}
    {storageError && <p role="alert">Bewaren lukt niet op dit apparaat. Je kunt wel verder oefenen.</p>}
    {!progress ? <p>Even laden…</p> : !step ? <section className="honest-empty pilot-complete"><h2>Goed geoefend</h2><p>{block.end}</p><button className="secondary-button" onClick={async () => { setCompletionError(false); try { await playMedia(dailyAudio(block.endAudio), { waitUntilEnd: true, playbackRate: 1 }); } catch { setCompletionError(true); } }}><Volume2 />Luister</button>{completionError && <p role="alert">Het geluid werkt niet. Probeer het opnieuw.</p>}<a className="secondary-button" href={backHref}>Kies een ander blok<ArrowRight /></a></section>
      : <DailyPlayer key={step.id} block={block} step={step} index={at} record={progress.records[step.id] ?? emptyDailyRecord()} onRecord={record => save({ ...progress, records: { ...progress.records, [step.id]: record } })} onPrevious={at ? () => position(at - 1) : undefined} onNext={() => position(at + 1)} />}
  </div>;
}

function DailyPlayer({ block, step, index, record, onRecord, onPrevious, onNext }: { block: DailyBlock; step: DailyStep; index: number; record: DailyRecord; onRecord: (r: DailyRecord) => void; onPrevious?: () => void; onNext: () => void }) {
  const textView = useExerciseViewTarget('text', step.context.length > 0);
  const readAlong = useAlfaCReadAlong();
  const [model, setModel] = useState(false), [help, setHelp] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]), [result, setResult] = useState<'idle' | 'right' | 'wrong'>('idle');
  const [busy, setBusy] = useState(false), [audioError, setAudioError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null), current = useRef(record), playback = useRef(new AbortController());
  const root = useRef<HTMLElement>(null);
  useWordListeningHelp(root, phase => {
    if (phase === 'end' || phase === 'browse') return;
    if (phase === 'request') { current.current = { ...current.current, support: { ...current.current.support, content: current.current.support.content + 1 } }; onRecord(current.current); }
    playback.current.abort(); stopMedia(); setBusy(false);
  });
  useEffect(() => { heading.current?.focus({ preventScroll: true }); return () => { playback.current.abort(); stopMedia(); }; }, []);
  function support(kind: keyof Support) {
    current.current = { ...current.current, support: { ...current.current.support, [kind]: current.current.support[kind] + 1 } };
    onRecord(current.current);
  }
  async function play(ids: string[], explanation = false) {
    playback.current.abort(); stopMedia(); const controller = new AbortController(); playback.current = controller;
    setBusy(true); setAudioError(false);
    try { for (const id of ids) { if (controller.signal.aborted) return; const ok = await readAlong.play(dailyAudio(id), { signal: controller.signal, waitUntilEnd: true, playbackRate: 1 }, explanation); if (!ok) return; } }
    catch { if (!controller.signal.aborted) setAudioError(true); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  function stop() { playback.current.abort(); stopMedia(); setBusy(false); }
  function answer(response: string[]) {
    current.current = recordDailyAnswer(step, current.current, response); onRecord(current.current);
    setChosen(response); setResult(current.current.last!.correct ? 'right' : 'wrong');
    support('feedback'); void play([current.current.last!.correct ? step.audio.G : step.audio.F]);
  }
  return <section ref={root} className="cp-exercise-browser is-mixed-round pilot-player functional-player ac-document-player" data-daily-step={step.id}>
    <div className="cp-exercise-workspace"><div className="cp-exercise-main">
      <header className="cp-exercise-record-head pilot-head"><h2 ref={heading} tabIndex={-1}>{step.instruction}</h2><div><button className="secondary-button" aria-label="Vorige opdracht" disabled={!onPrevious} onClick={onPrevious}><ArrowLeft /></button><span>{index + 1} / 12</span></div></header>
      <div className="pilot-tools ac-support-tools" aria-label="Hulp bij de opdracht">
        <ExerciseAudioSlot />
        <ExerciseListen showLabel inline={Boolean(step.audio.O)} label="Uitleg horen" disabled={busy} onClick={() => { support('instruction'); void play([...(index === 0 ? [block.startAudio] : []), step.audio.I], true); }} />
        {step.audio.O && <ExerciseListen showLabel label="Tekst horen" disabled={busy} onClick={() => { support('content'); void play([step.audio.O!]); }} />}
        <button className="secondary-button" aria-expanded={model} onClick={() => { if (!model) { support('example'); void play([step.audio.V]); } else stop(); setHelp(false); setModel(!model); }}><Eye />Voorbeeld</button>
        <ExerciseHelp open={help} closeLabel="Verberg hulp" onClick={() => { if (!help) { support('help'); void play([step.audio.H]); } else stop(); setModel(false); setHelp(!help); }} />
        {audioError && <p role="alert">Het geluid werkt niet. Probeer het opnieuw.</p>}
      </div>
      <div className="cp-exercise-stage">
        <AlfaCWorkspace source={<DocumentSet documents={step.documents} />} supportOpen={model || help || Boolean(readAlong.reading)} feedback={<output className="ac-task-feedback" data-motion-feedback={result} aria-live="polite">{result === 'right' ? step.speech.G : result === 'wrong' ? step.speech.F : ''}</output>}>
          {readAlong.reading ? <AlfaCExplanation reading={readAlong.reading} onClose={() => { stop(); readAlong.clear(); }} /> : model ? <section className="pilot-model"><h3>Voorbeeld</h3><p>{step.example}</p><button className="primary-button" onClick={() => { stop(); setModel(false); setChosen([]); setResult('idle'); }}>Nu jij<ArrowRight /></button></section>
            : help ? <aside className="pilot-help"><h3>Help</h3><p>{step.speech.H}</p><button className="secondary-button" onClick={() => { stop(); setHelp(false); }}>Terug naar de opdracht<ArrowRight /></button></aside>
              : <>
                {step.context.map(text => <p {...textView} className="ac-task-context" key={text}>{text}</p>)}
                {step.interaction === 'keuze' ? <fieldset className="functional-choice"><legend className="sr-only">{step.instruction}</legend><p>Kies één antwoord.</p><div className="functional-choice-grid">{step.options.map(o => <button key={o.code} className="cp-option" aria-pressed={chosen[0] === o.code} disabled={busy || result === 'right'} onClick={() => answer([o.code])}>{o.text}</button>)}</div></fieldset>
                  : <fieldset className="functional-choice"><legend className="sr-only">{step.instruction}</legend><output className="ac-built-answer" aria-live="polite" aria-label="Jouw zin">{chosen.join(' ') || 'Tik op het eerste kaartje.'}</output><div className="functional-choice-grid">{step.cards.map(card => <button key={card} className="cp-option" disabled={busy || chosen.includes(card) || result === 'right'} onClick={() => { const next = [...chosen, card]; setChosen(next); if (next.length === step.cards.length) answer(next); }}>{card}</button>)}</div><button className="secondary-button" disabled={busy || !chosen.length} onClick={() => { setChosen(chosen.slice(0, -1)); setResult('idle'); }}><ArrowLeft />Eén terug</button></fieldset>}
              </>}
        </AlfaCWorkspace>
      </div>
      <footer className="pilot-footer"><button className="primary-button" data-mobile-continue disabled={busy || model || Boolean(readAlong.reading) || result !== 'right'} onClick={onNext}>Verder<ArrowRight /></button></footer>
    </div></div>
  </section>;
}
