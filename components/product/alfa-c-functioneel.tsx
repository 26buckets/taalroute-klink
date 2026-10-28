'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, FileText, HelpCircle, RefreshCw, Volume2 } from 'lucide-react';
import { functionalAudio, functionalBlocks, functionalOptions, functionalStorageKey, readFunctionalProgress, type FunctionalBlock, type FunctionalProgress, type FunctionalRecord, type FunctionalStep } from '@/lib/alfa-c-functioneel';
import { playMedia, stopMedia } from './shared';
import Image from 'next/image';

export function FunctionalBlockCards() {
  return <>{functionalBlocks.map(block => <a key={block.id} className="cp-activity-button" data-functional-block={block.id} href={`#learner/alfa-c/${block.id}`}>
    <FileText aria-hidden="true" /><span>{block.title}<small>12 opdrachten · lezen en schrijven</small></span><ArrowRight aria-hidden="true" />
  </a>)}</>;
}

export function AlfaCFunctionalPractice({ block }: { block: FunctionalBlock }) {
  const [progress, setProgress] = useState<FunctionalProgress>();
  const [storageError, setStorageError] = useState(false);
  const [round, setRound] = useState(0);
  const [completionBusy, setCompletionBusy] = useState(false);
  const [completionError, setCompletionError] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setProgress(readFunctionalProgress(localStorage.getItem(functionalStorageKey))); }
      catch { setProgress(readFunctionalProgress(null)); setStorageError(true); }
      heading.current?.focus({ preventScroll: true });
    });
    return () => { cancelAnimationFrame(frame); stopMedia(); };
  }, []);
  function save(next: FunctionalProgress) {
    setProgress(next);
    try { localStorage.setItem(functionalStorageKey, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  const at = progress?.positions[block.id] ?? 0;
  const step = block.steps[at];
  function position(index: number) {
    if (progress) save({ ...progress, positions: { ...progress.positions, [block.id]: index } });
  }
  return <div className="learner-page cp-chapters cp-chapter-playing pilot-page functional-page">
    <header className="cp-context-header">
      <a className="text-back" href="#learner/alfa-c" aria-label="Andere oefening"><ArrowLeft /></a>
      <h1 ref={heading} tabIndex={-1}>{block.title}</h1><small className="cp-context-meta">Alfa C</small>
    </header>
    {storageError && <p role="alert">Bewaren lukt niet op dit apparaat. Je kunt wel verder oefenen.</p>}
    {!progress ? <p>Even laden…</p> : !step ? <section className="honest-empty pilot-complete">
      <Check aria-hidden="true" /><h2>Goed geoefend</h2><p>{block.end}</p>
      <button className="secondary-button" disabled={completionBusy} onClick={async () => {
        setCompletionBusy(true); setCompletionError(false);
        try { await playMedia(functionalAudio('guide', block.end)!, { waitUntilEnd: true, playbackRate: 1 }); }
        catch { setCompletionError(true); }
        finally { setCompletionBusy(false); }
      }}><Volume2 />{completionBusy ? 'Luisteren…' : 'Luister'}</button>
      {completionError && <p role="alert">Het geluid werkt niet. Tik nog eens op Luister.</p>}
      <button className="secondary-button" onClick={() => { position(0); setRound(n => n + 1); }}><RefreshCw />Het hele blok opnieuw</button>
      <a className="secondary-button" href="#learner/alfa-c">Kies een ander blok<ArrowRight /></a>
    </section> : <FunctionalPlayer key={`${step.id}:${round}`} block={block} step={step} index={at} record={progress.records[step.id]}
      onPrevious={at ? () => position(at - 1) : undefined}
      onRecord={record => save({ ...progress, records: { ...progress.records, [step.id]: record } })}
      onNext={() => position(at + 1)} />}
  </div>;
}

function FunctionalPlayer({ block, step, index, record, onPrevious, onRecord, onNext }: {
  block: FunctionalBlock; step: FunctionalStep; index: number; record?: FunctionalRecord;
  onPrevious?: () => void; onRecord: (record: FunctionalRecord) => void; onNext: () => void;
}) {
  const [model, setModel] = useState(false);
  const [help, setHelp] = useState(false);
  const [result, setResult] = useState<'idle' | 'wrong' | 'right' | 'done'>('idle');
  const [selected, setSelected] = useState('');
  const [retry, setRetry] = useState(false);
  const [busy, setBusy] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [heardItems, setHeardItems] = useState<number[]>([]);
  const playback = useRef<AbortController | null>(null);
  const metrics = useRef({ tries: record?.tries ?? 0, helpUsed: record?.helpUsed ?? false });
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    document.querySelector('.learner-main')?.scrollTo({ top: 0 });
    return () => { playback.current?.abort(); stopMedia(); };
  }, []);
  const choice = step.kind === 'choice';
  async function play(texts: { role: 'guide' | 'target'; text: string | null }[], item?: number) {
    playback.current?.abort(); stopMedia();
    const controller = new AbortController(); playback.current = controller;
    setBusy(true); setAudioError(false);
    try {
      for (const part of texts) {
        if (!part.text) continue;
        const src = functionalAudio(part.role, part.text);
        if (!src) throw Error('Audio unavailable');
        const ok = await playMedia(src, { signal: controller.signal, waitUntilEnd: true, playbackRate: src.startsWith('/package-audio/alfa-c-functioneel-20261028/') ? 1 : undefined });
        if (controller.signal.aborted || ok === false) return;
      }
      if (item !== undefined) setHeardItems(previous => [...new Set([...previous, item])]);
    } catch { if (!controller.signal.aborted) setAudioError(true); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  function guide(text: string) { return play([{ role: 'guide', text }]); }
  function stopPlayback() { playback.current?.abort(); stopMedia(); setBusy(false); }
  function answer(id: string) {
    const correct = id === step.correctOptionId;
    setSelected(id); setResult(correct ? 'right' : 'wrong'); metrics.current.tries++;
    void guide(correct ? step.successFeedback : step.retryVisible);
    onRecord({ ...metrics.current, assessment: 'answer', correct });
  }
  function markHelp() {
    metrics.current.helpUsed = true;
    if (record) onRecord({ ...record, helpUsed: true });
  }
  return <section className="cp-exercise-browser is-mixed-round pilot-player functional-player" data-functional-step={step.id}>
    <div className="cp-exercise-workspace"><div className="cp-exercise-main">
      <header className="cp-exercise-record-head pilot-head">
        <h2 ref={title} tabIndex={-1}>{step.screen}</h2>
        <div><button className="secondary-button" aria-label="Vorige opdracht" onClick={onPrevious} disabled={!onPrevious}><ArrowLeft /></button><span>{index + 1} / 12</span></div>
      </header>
      <div className="cp-exercise-stage">
        <>
          <div className="pilot-instruction">
            {index === 0 && <><p>{block.start}</p><p>{block.materialRequirements.join(' ')}</p><a className="secondary-button" href={`/alfa-c/antwoordbladen.html#${block.id}`} target="_blank" rel="noreferrer"><FileText />Antwoordblad openen</a></>}
            <p>{step.instruction}</p>
          </div>
          <div className="pilot-tools">
            <button className="secondary-button" disabled={busy} onClick={() => void play(model ? [{ role: 'guide', text: step.exampleInstruction }, ...step.exampleTargetTexts.map(text => ({ role: 'target' as const, text }))] : [...(index === 0 ? [{ role: 'guide' as const, text: block.start }] : []), { role: 'guide', text: step.instruction }])}><Volume2 />{busy ? 'Luisteren…' : 'Luister'}</button>
            {step.exampleVisible && <button className="secondary-button" aria-expanded={model} onClick={() => { markHelp(); setModel(!model); setHelp(false); setResult('idle'); setSelected(''); if (!model) void guide(step.exampleInstruction); else stopPlayback(); }}><Eye />{model ? 'Nu jij' : 'Voorbeeld'}</button>}
            <button className="secondary-button" aria-expanded={help} onClick={() => { markHelp(); setHelp(!help); setRetry(false); if (!help) void guide(step.helpVisible); else stopPlayback(); }}><HelpCircle />Help</button>
            {step.responseSetup && index > 0 && <a className="secondary-button" href={`/alfa-c/antwoordbladen.html#${block.id}`} target="_blank" rel="noreferrer"><FileText />Antwoordblad</a>}
          </div>
          {audioError && <p role="alert">Het geluid werkt niet. Tik nog eens op Luister.</p>}
          {help && <aside className="pilot-help"><p>{retry ? step.retryVisible : step.helpVisible}</p><button className="secondary-button" disabled={busy} onClick={() => void guide(retry ? step.retryVisible : step.helpVisible)}><Volume2 />Luister naar de tip</button></aside>}
          {model ? <section className="cp-task-card pilot-model functional-source"><h3>Voorbeeld</h3>{step.exampleHandwriting ? <Image unoptimized width={1884} height={835} className="functional-handwriting" src={step.exampleHandwriting} alt="Ik kom maandag om 9 uur." /> : <p>{step.exampleVisible}</p>}<p>{step.exampleInstruction}</p><button className="primary-button" onClick={() => { stopPlayback(); setModel(false); setHelp(false); setResult('idle'); setSelected(''); }}>Nu jij<ArrowRight /></button></section> : <>
            {step.presentation.map((view, n) => view.kind === 'previousResponse'
              ? <p key={n}>Pak jouw antwoordblad. Kijk naar je antwoord bij opdracht {block.steps.find(s => s.id === ('fromTask' in view ? view.fromTask : ''))?.number}.</p>
              : <section key={n} className="cp-task-card functional-source"><h3>{view.title}</h3>{step.handwriting ? <Image unoptimized width={1254} height={1254} className="functional-handwriting" src={step.handwriting} alt={view.text} /> : <p>{view.text}</p>}{view.kind !== 'audioOnly' && <button className="secondary-button" disabled={busy} onClick={() => { markHelp(); void play([{ role: 'target', text: view.text }]); }}><Volume2 />Luister naar de tekst</button>}</section>)}
            {step.dictationTexts.map((text, n) => <button key={n} className="secondary-button" disabled={busy} onClick={() => void play([{ role: 'target', text }], n)}><Volume2 />Luister{step.dictationTexts.length > 1 ? ` ${n + 1}` : step.id.endsWith('formulier-08') ? ' naar het nummer' : ' naar de zin'}</button>)}
            {choice ? <div className="functional-choice-grid" aria-label="Kies een antwoord">{functionalOptions(step).map(option => <button className="cp-option" key={option.id} aria-pressed={selected === option.id} disabled={busy || result === 'right'} onClick={() => answer(option.id)}>{option.text}</button>)}</div>
              : <button className="secondary-button" disabled={busy || result === 'done' || heardItems.length < step.dictationTexts.length} onClick={() => { setResult('done'); onRecord({ ...metrics.current, assessment: 'participation' }); void guide(step.automaticAcknowledgement ?? step.successFeedback); }}><Check />Ik ben klaar</button>}
          </>}
        </>
      </div>
      <footer className="pilot-footer">
        <output aria-live="polite">{result === 'wrong' ? step.retryVisible : result === 'right' ? 'Dat klopt.' : result === 'done' ? (step.automaticAcknowledgement ?? step.successFeedback) : ''}</output>
        {result === 'done' && <button className="secondary-button" onClick={() => { setResult('idle'); setHelp(true); setRetry(true); markHelp(); void guide(step.retryVisible); }}><RefreshCw />Nog eens</button>}
        <button className="primary-button" disabled={busy || model || !['right', 'done'].includes(result)} onClick={onNext}>Verder<ArrowRight /></button>
      </footer>
    </div></div>
  </section>;
}
