'use client';
import { recordFunctionalRounds } from '@/lib/alfa-c-round-progress';
import { FunctionalResponseFields } from './alfa-c-response';
import { emptyFunctionalResponse, functionalActions, functionalResponseReady, functionalResponseText, type FunctionalResponse } from '@/lib/alfa-c-response';
import { AlfaCExplanation, useAlfaCReadAlong } from './alfa-c-readalong';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Check, Eye, FileText, HelpCircle, RefreshCw, Volume2 } from 'lucide-react';
import { functionalAudio, functionalOptions, functionalStorageKey, readFunctionalProgress, type FunctionalBlock, type FunctionalProgress, type FunctionalRecord, type FunctionalStep } from '@/lib/alfa-c-functioneel';
import { playMedia, stopMedia } from './shared';
import Image from 'next/image';
import { AlfaCWorkspace, DocumentSet, PracticeDocument } from './alfa-c-workspace';

export function AlfaCFunctionalPractice({ block, backHref, header }: { backHref: string; header: ReactNode; block: FunctionalBlock }) {
  const [progress, setProgress] = useState<FunctionalProgress>();
  const [storageError, setStorageError] = useState(false);
  const [round, setRound] = useState(0);
  const [completionBusy, setCompletionBusy] = useState(false);
  const [completionError, setCompletionError] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try { setProgress(readFunctionalProgress(localStorage.getItem(functionalStorageKey))); }
      catch { setProgress(readFunctionalProgress(null)); setStorageError(true); }
    });
    return () => { cancelAnimationFrame(frame); stopMedia(); };
  }, []);
  function save(next: FunctionalProgress) {
    recordFunctionalRounds(next);
    setProgress(next);
    try { localStorage.setItem(functionalStorageKey, JSON.stringify(next)); setStorageError(false); }
    catch { setStorageError(true); }
  }
  const at = progress?.positions[block.id] ?? 0;
  const step = block.steps[at];
  function position(index: number) {
    if (progress) save({ ...progress, positions: { ...progress.positions, [block.id]: index } });
  }
  return <div className="learner-page cp-chapters cp-chapter-playing pilot-page functional-page ac-document-page">
    {header}
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
      <a className="secondary-button" href={backHref}>Kies een ander blok<ArrowRight /></a>
    </section> : <FunctionalPlayer key={`${step.id}:${round}`} block={block} step={step} index={at} record={progress.records[step.id]} records={progress.records} onOpenTask={position}
      onPrevious={at ? () => position(at - 1) : undefined}
      onRecord={record => save({ ...progress, records: { ...progress.records, [step.id]: record } })}
      onNext={() => position(at + 1)} />}
  </div>;
}

function FunctionalPlayer({ block, step, index, record, records, onOpenTask, onPrevious, onRecord, onNext }: {
  block: FunctionalBlock; step: FunctionalStep; index: number; record?: FunctionalRecord; records: Record<string, FunctionalRecord>; onOpenTask: (index: number) => void;
  onPrevious?: () => void; onRecord: (record: FunctionalRecord) => void; onNext: () => void;
}) {
  const [response, setResponse] = useState<FunctionalResponse>(() => record?.response ?? emptyFunctionalResponse());
  const currentRecord = useRef(record);
  const hasResponse = Boolean(step.responseSetup) || functionalActions(step).length > 0;
  const [model, setModel] = useState(false);
  const [help, setHelp] = useState(false);
  const readAlong = useAlfaCReadAlong();
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
  async function play(texts: { role: 'guide' | 'target'; text: string | null }[], item?: number, explanation = false) {
    playback.current?.abort(); stopMedia();
    const controller = new AbortController(); playback.current = controller;
    setBusy(true); setAudioError(false);
    try {
      for (const part of texts) {
        if (!part.text) continue;
        const src = functionalAudio(part.role, part.text);
        if (!src) throw Error('Audio unavailable');
        const ok = await readAlong.play(src, { signal: controller.signal, waitUntilEnd: true, playbackRate: src.startsWith('/package-audio/alfa-c-') ? 1 : undefined }, explanation);
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
  function changeResponse(value: FunctionalResponse) {
    setResponse(value); setResult('idle');
    const next: FunctionalRecord = { ...currentRecord.current, ...metrics.current, assessment: 'participation', response: value, completed: false };
    currentRecord.current = next; onRecord(next);
  }
  function complete() {
    const next: FunctionalRecord = { ...currentRecord.current, ...metrics.current, assessment: 'participation', ...(hasResponse ? { response, firstResponse: currentRecord.current?.firstResponse ?? structuredClone(response), completed: true } : {}) };
    currentRecord.current = next; onRecord(next); setResult('done');
    void guide(step.automaticAcknowledgement ?? step.successFeedback);
  }
  function markHelp() {
    metrics.current.helpUsed = true;
    if (currentRecord.current) { currentRecord.current = { ...currentRecord.current, helpUsed: true }; onRecord(currentRecord.current); }
  }
  const documents = step.presentation.filter(view => view.kind !== 'previousResponse' && view.kind !== 'audioOnly').map((view, n) => ({ id: `${step.id}:${n}`, title: view.title, text: view.text }));
  const action = step.instruction.replace(step.screen, '').replace(/  +/g, ' ').trim();
  const source = <div className="ac-functional-source">
    {step.presentation.filter(view => view.kind === 'previousResponse').map((view, n) => {
      const previous = block.steps.find(s => s.id === ('fromTask' in view ? view.fromTask : ''));
      const text = previous ? functionalResponseText(previous, records[previous.id]) : '';
      return text ? <PracticeDocument key={n} document={{ title: view.title, text }} /> : <div key={n}><p>Je hebt hier nog geen digitaal antwoord bewaard.</p>{previous && <button className="secondary-button" onClick={() => onOpenTask(block.steps.findIndex(s => s.id === previous.id))}>Ga naar opdracht {previous.number}</button>}</div>;
    })}
    {step.responseSetup?.responseGroup && <PracticeDocument document={{ title: 'Jouw formulier', text: block.steps.filter(s => s.responseSetup?.responseGroup === step.responseSetup?.responseGroup).map(s => functionalResponseText(s, records[s.id])).filter(Boolean).join('\n') || 'Vul de gegevens hieronder in.' }} />}

    {step.handwriting ? <figure className="ac-handwriting"><Image unoptimized width={1254} height={1254} className="functional-handwriting" src={step.handwriting} alt={documents[0]?.text ?? ''} /></figure> : documents.length > 0 && <DocumentSet documents={documents} />}
    {step.presentation.filter(view => view.kind === 'audioOnly').map((view, n) => <p className="ac-task-context" key={n}>{view.text}</p>)}
    {step.dictationTexts.length > 0 && <div className="ac-dictation-controls">{step.dictationTexts.map((text, n) => <button key={n} className="secondary-button" disabled={busy} onClick={() => void play([{ role: 'target', text }], n)}><Volume2 />Luister{step.dictationTexts.length > 1 ? ` ${n + 1}` : step.id.endsWith('formulier-08') ? ' naar het nummer' : ' naar de zin'}</button>)}</div>}
  </div>;
  return <section className="cp-exercise-browser is-mixed-round pilot-player functional-player ac-document-player" data-functional-step={step.id}>
    <div className="cp-exercise-workspace"><div className="cp-exercise-main">
      <header className="cp-exercise-record-head pilot-head">
        <h2 ref={title} tabIndex={-1}>{step.screen}</h2>
        <div><button className="secondary-button" aria-label="Vorige opdracht" onClick={onPrevious} disabled={!onPrevious}><ArrowLeft /></button><span>{index + 1} / 12</span></div>
      </header>
      <div className="pilot-tools ac-support-tools" aria-label="Hulp bij de opdracht">
        <button className="secondary-button" disabled={busy} onClick={() => void play(model ? [{ role: 'guide', text: step.exampleInstruction }] : [...(index === 0 ? [{ role: 'guide' as const, text: block.start }] : []), { role: 'guide', text: step.instruction }], undefined, true)}><Volume2 />Uitleg</button>
        {(model ? step.exampleTargetTexts.length : documents.length) > 0 && <button className="secondary-button" disabled={busy} onClick={() => { markHelp(); void play((model ? step.exampleTargetTexts : documents.map(d => d.text)).map(text => ({ role: 'target', text }))); }}><Volume2 />{model ? 'Voorbeeld horen' : 'Tekst horen'}</button>}
        {step.exampleVisible && <button className="secondary-button" aria-expanded={model} onClick={() => { markHelp(); setModel(!model); setHelp(false); setResult('idle'); setSelected(''); if (!model) void guide(step.exampleInstruction); else stopPlayback(); }}><Eye />Voorbeeld</button>}
        <button className="secondary-button" aria-expanded={help} onClick={() => { markHelp(); setHelp(!help); setModel(false); setRetry(false); if (!help) void guide(step.helpVisible); else stopPlayback(); }}><HelpCircle />Help</button>
        {audioError && <p role="alert">Het geluid werkt niet. Probeer het opnieuw.</p>}
      </div>
      <div className="cp-exercise-stage">
        <AlfaCWorkspace key={model ? 'example' : 'task'} source={model ? (step.exampleHandwriting ? <Image unoptimized width={1884} height={835} className="functional-handwriting" src={step.exampleHandwriting} alt="Ik kom maandag om 9 uur." /> : <DocumentSet documents={(step.exampleVisible ?? '').split('\n\n').map((text, n) => ({ id: `${step.id}:example:${n}`, title: text.split('\n')[0], text }))} />) : source} supportOpen={help || Boolean(readAlong.reading)}>
          {readAlong.reading ? <AlfaCExplanation reading={readAlong.reading} onClose={() => { stopPlayback(); readAlong.clear(); }} /> : model ? <section className="pilot-model"><h3>Voorbeeld</h3><p>{step.exampleInstruction}</p><button className="primary-button" onClick={() => { stopPlayback(); setModel(false); setHelp(false); setResult('idle'); setSelected(''); }}>Nu jij<ArrowRight /></button></section>
            : help ? <aside className="pilot-help"><h3>Help</h3><p>{retry ? step.retryVisible : step.helpVisible}</p><button className="secondary-button" disabled={busy} onClick={() => void guide(retry ? step.retryVisible : step.helpVisible)}><Volume2 />Luister naar de tip</button><button className="secondary-button" onClick={() => { stopPlayback(); setHelp(false); }}>Terug naar de opdracht<ArrowRight /></button></aside>
              : <>
                {action && <p className="ac-task-context">{action}</p>}
                {index === 0 && <details className="ac-materials"><summary>Dit heb je nodig</summary><p>{block.materialRequirements.map(text => text.includes('nog niet geproduceerd') ? 'Het handgeschreven briefje op het scherm.' : text).join(' ')}</p></details>}
                {(step.responseSetup || index === 0) && <a className="secondary-button" href={`/alfa-c/antwoordbladen.html#${block.id}`} target="_blank" rel="noreferrer"><FileText />Antwoordblad (extra)</a>}
                {choice ? <fieldset className="functional-choice"><legend className="sr-only">{step.instruction}</legend><p>Kies één antwoord.</p><div className="functional-choice-grid">{functionalOptions(step).map(option => <button className="cp-option" key={option.id} aria-pressed={selected === option.id} disabled={busy || result === 'right'} onClick={() => answer(option.id)}>{option.text}</button>)}</div></fieldset>
                  : <>{hasResponse && <FunctionalResponseFields step={step} response={response} onChange={changeResponse} disabled={busy} />}<button className="secondary-button" disabled={busy || result === 'done' || heardItems.length < step.dictationTexts.length || !functionalResponseReady(step, response)} onClick={complete}><Check />{hasResponse ? 'Bewaar antwoord' : 'Ik ben klaar'}</button>{hasResponse && result === 'done' && <p>Je antwoord is bewaard. {step.retryVisible}</p>}</>}
              </>}
        </AlfaCWorkspace>
      </div>
      <footer className="pilot-footer">
        <output aria-live="polite">{result === 'wrong' ? step.retryVisible : result === 'right' ? step.successFeedback : result === 'done' ? (step.automaticAcknowledgement ?? step.successFeedback) : ''}</output>
        {result === 'done' && <button className="secondary-button" onClick={() => { setResult('idle'); setHelp(true); setRetry(true); markHelp(); void guide(step.retryVisible); }}><RefreshCw />Nog eens</button>}
        <button className="primary-button" disabled={busy || model || Boolean(readAlong.reading) || !['right', 'done'].includes(result)} onClick={onNext}>Verder<ArrowRight /></button>
      </footer>
    </div></div>
  </section>;
}
