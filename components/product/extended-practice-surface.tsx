'use client';
import { WordAudioText } from './word-audio-text';
import './word-use.css';
import { useExerciseViewTarget } from './exercise-view';
import { ExerciseListen } from './exercise-listen';
import { StandardPracticeSurface } from './standard-practice-surface';
import { useEffect, useRef, useState } from 'react';
import Image from './compact-image';
import { emptyGrammarChoice, grammarChoiceKey, parseGrammarChoice, submitGrammarChoice } from '@/lib/grammar-choice-answer';
import { Check, Volume2, RotateCcw } from 'lucide-react';
import type { AudioPlayer, PackageExercise, ExerciseAudio, ExerciseImage } from '@/lib/package-content';

type Props = { exercise: PackageExercise; onAudio: AudioPlayer; onFinish: (answer: string, correct: boolean, feedback?: string) => void; onReset: () => void; onHelp: () => void; canAnswer: boolean; answeredCorrectly?: boolean };
type Block = { id: string; text: string; speaker?: string; audio?: ExerciseAudio };
type Task = { id: string; prompt: string; criteria: string[]; example: string; speakers: string[] };

export function ExtendedPracticeSurface({ exercise, onAudio, onFinish, onReset, onHelp, canAnswer, answeredCorrectly }: Props) {
  const [selected, setSelected] = useState('');
  const [help, setHelp] = useState(false);
  const options = (exercise.options ?? []) as { id: string; label: string; audio?: ExerciseAudio; image?: ExerciseImage }[];
  const answer = (exercise.answer ?? {}) as { correctOptionIds?: string[] };
  const grammarSourceId = typeof exercise.grammarSourceId === 'string' ? exercise.grammarSourceId : undefined;
  const photoView = useExerciseViewTarget('photo', Boolean(grammarSourceId && exercise.prompt?.image?.src));
  const optionSignature = JSON.stringify(options.map(option => option.id).sort());
  const grammarAnswer = useRef(emptyGrammarChoice(options.map(option => option.id)));
  const [grammarReady, setGrammarReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  useEffect(() => {
    if (!grammarSourceId) return;
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const ids: string[] = JSON.parse(optionSignature);
      setGrammarReady(false); setStorageError(false); setSelected('');
      grammarAnswer.current = emptyGrammarChoice(ids);
      try {
        const raw = localStorage.getItem(grammarChoiceKey(grammarSourceId));
        const saved = parseGrammarChoice(raw, ids);
        if (raw && !saved) throw new Error('Invalid saved choice');
        grammarAnswer.current = saved ?? emptyGrammarChoice(ids);
        setSelected(saved?.last ?? ''); setGrammarReady(true);
      } catch { setStorageError(true); }
    });
    return () => { active = false; };
  }, [grammarSourceId, optionSignature]);
  if (exercise.standardTask) return <StandardPracticeSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} onHelp={onHelp} canAnswer={canAnswer} answeredCorrectly={answeredCorrectly} />;
  if (exercise.mode === 'functional-message' || exercise.mode === 'functional-form') return <FunctionalWriting exercise={exercise} onFinish={onFinish} onReset={onReset} onHelp={onHelp} onAudio={onAudio} canAnswer={canAnswer} />;
  const correct = answer.correctOptionIds?.includes(selected);
  const synonyms = exercise.mode === 'synonyms';
  const wordUse = typeof exercise.wordUseId === 'string';
  return <section className={`cp-task-card cp-extended-task${synonyms || wordUse ? ' cp-synonyms-task' : ''}${wordUse && exercise.mode === 'suitable-reply' ? ' cp-word-use-reply' : ''}`}>
    {grammarSourceId && <>{exercise.prompt?.audio?.src && <ExerciseListen label="Luister naar de opdracht" onClick={() => onAudio(exercise.prompt?.audio?.src)} />}{exercise.prompt?.image?.src && <Image {...photoView} src={exercise.prompt.image.src} alt="Foto bij de opdracht" width={760} height={760} />}{storageError && <p role="alert">Je keuze kon niet worden bewaard. Probeer opnieuw voordat je verdergaat.</p>}</>}
    {wordUse && <p className="cp-synonym-context">{String(exercise.wordUseContext)}</p>}
    {synonyms && exercise.prompt?.audio?.src && typeof exercise.synonymContext === 'string' && <p className="cp-synonym-context">{exercise.synonymContext}</p>}
    {exercise.mode === 'sound-compare' ? <ExerciseListen label="Luister naar beide woorden" onClick={() => onAudio(exercise.prompt?.audio?.src)} /> :
      synonyms ? exercise.prompt?.audio?.src ? <ExerciseListen label="Luister naar het woord" onClick={() => onAudio(exercise.prompt?.audio?.src)} /> : typeof exercise.synonymContext === 'string' && exercise.prompt?.text ? <p className="cp-synonym-word cp-synonym-context-card">{exercise.synonymContext.split(exercise.prompt.text)[0]}<strong>{exercise.prompt.text}</strong>{exercise.synonymContext.split(exercise.prompt.text)[1]}</p> : <p className="cp-synonym-word">{exercise.prompt?.text}</p> : wordUse ? <>
        {exercise.prompt?.audio?.src && <ExerciseListen label={exercise.mode === 'word-combinations' ? 'Luister naar de combinatie en de antwoorden' : 'Luister naar de ander en de antwoorden'} onClick={() => onAudio(exercise.prompt?.audio?.src)} />}
        <p className="cp-synonym-word cp-synonym-context-card"><strong>{exercise.prompt?.text}</strong></p>
      </> : <SourceText exercise={exercise} onAudio={onAudio} onHelp={onHelp} initiallyHidden={exercise.transcriptAfterAnswer === true && !selected} />}
    {typeof exercise.question === 'string' && <h4><WordAudioText text={exercise.question} /></h4>}
    {(exercise.questionAudio as ExerciseAudio)?.src && <button className="secondary-button" onClick={() => onAudio((exercise.questionAudio as ExerciseAudio).src)}><Volume2 />De vraag</button>}
    <div className={exercise.mode === 'text-evidence' ? 'cp-evidence-options' : 'cp-choice-grid'}>{options.map(option => <div className="cp-extended-option" key={option.id}><button aria-label={grammarSourceId && option.image ? option.label : undefined} disabled={!canAnswer || (grammarSourceId ? !grammarReady || answeredCorrectly : correct)} aria-pressed={selected === option.id} className={selected === option.id ? 'selected' : ''} onClick={() => {
      setSelected(option.id);
      if (grammarSourceId) {
        try {
          const next = submitGrammarChoice(grammarAnswer.current, option.id);
          localStorage.setItem(grammarChoiceKey(grammarSourceId), JSON.stringify(next));
          grammarAnswer.current = next; setStorageError(false);
        } catch { setStorageError(true); return; }
      }
      const isCorrect = answer.correctOptionIds?.includes(option.id) === true;
      const optionFeedback = (exercise.optionFeedback as Record<string, unknown> | undefined)?.[option.id];
      const feedback = typeof optionFeedback === 'string' ? optionFeedback : synonyms || wordUse || exercise.readingRoundId ? String(isCorrect ? exercise.correctFeedback : exercise.feedback)
        : isCorrect ? typeof exercise.evidence === 'string' ? `In de tekst: ${exercise.evidence}` : 'Goed. Kijk ook naar het voorbeeld.'
        : exercise.mode === 'verb-choice' ? 'Kijk naar ik. Welke vorm hoort daarbij?' : 'Kijk of luister nog eens. Je keuzes blijven staan.';
      onFinish(option.id, isCorrect, feedback);
    }}>{grammarSourceId && option.image?.src && <Image src={option.image.src} alt={option.image.altText ?? option.label} width={760} height={760} />}{option.label}</button>{option.audio?.src && !wordUse && <button className="secondary-button" aria-label={`Luister: ${option.label}`} onClick={() => onAudio(option.audio?.src)}><Volume2 /></button>}</div>)}</div>
    {exercise.mode === 'verb-choice' && !grammarSourceId && <><button className="secondary-button" onClick={() => { setHelp(!help); onHelp(); }}>Help</button>{help && <div className="cp-source-text"><p>{String(exercise.rule)}</p><p>{String(exercise.sourceModel)}</p>{(exercise.modelAudio as ExerciseAudio)?.src && <button className="secondary-button" onClick={() => onAudio((exercise.modelAudio as ExerciseAudio).src)}><Volume2 />Luister</button>}</div>}</>}
    {typeof exercise.evidence === 'string' && <p className="cp-source-proof" aria-hidden={!correct} style={{ visibility: correct ? 'visible' : 'hidden' }}>{exercise.evidence}</p>}
  </section>;
}

export function SourceText({ exercise, onAudio, onHelp, corner = true, initiallyHidden = false }: { exercise: PackageExercise; onAudio: AudioPlayer; onHelp: () => void; corner?: boolean; initiallyHidden?: boolean }) {
  const blocks = (exercise.sourceBlocks ?? []) as Block[];
  const textView = useExerciseViewTarget('text', blocks.length > 0, initiallyHidden ? onHelp : undefined, initiallyHidden);
  if (!blocks.length) return null;
  return <div className="cp-source-text">{blocks.map((block, index) => <div key={block.id}>
    {block.speaker && <small>{block.speaker}</small>}<p {...textView}>{block.text}</p>
    {block.audio?.src && (corner && index === blocks.findIndex(item => item.audio?.src) ? <ExerciseListen label={block.speaker ? `Luister naar ${block.speaker}` : 'Luister naar de tekst'} onClick={() => { onHelp(); void onAudio(block.audio?.src); }} /> : <button className="secondary-button cp-block-listen" aria-label={block.speaker ? `Luister naar ${block.speaker}` : 'Luister naar de tekst'} onClick={() => { onHelp(); void onAudio(block.audio?.src); }}><Volume2 /></button>)}
  </div>)}</div>;
}

function FunctionalWriting({ exercise, onFinish, onReset, onHelp, onAudio }: Props) {
  const task = exercise.writingTask as Task;
  const key = `klink.writing.v1:${exercise.exerciseId}`;
  const [draft, setDraft] = useState<{ message: string; from: string }>(() => {
    try { const value = JSON.parse(sessionStorage.getItem(key) ?? 'null'); if (typeof value?.message === 'string' && typeof value?.from === 'string') return value; } catch { /* Shared devices may block storage. */ }
    return { message: '', from: '' };
  });
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState<number[]>([]);
  const [example, setExample] = useState(false);
  const [storageFailed, setStorageFailed] = useState(false);
  function update(next: typeof draft) {
    setDraft(next); setChecking(false); setChecked([]); onReset();
    try { sessionStorage.setItem(key, JSON.stringify(next)); setStorageFailed(false); } catch { setStorageFailed(true); }
  }
  return <section className="cp-task-card cp-extended-task">
    <h4>{task.prompt}</h4>
    {(exercise.questionAudio as ExerciseAudio)?.src && <ExerciseListen label="Luister naar de opdracht" onClick={() => onAudio((exercise.questionAudio as ExerciseAudio).src)} />}
    <details><summary>Het gesprek</summary><SourceText corner={false} exercise={exercise} onAudio={onAudio} onHelp={onHelp} /></details>
    {exercise.mode === 'functional-form' && <fieldset className="cp-sender-choice"><legend>Van</legend>{task.speakers.map(name => <button key={name} className="secondary-button" aria-pressed={draft.from === name} onClick={() => update({ ...draft, from: name })}>{name}</button>)}</fieldset>}
    <label className="cp-text-entry"><span>Jouw bericht</span><textarea value={draft.message} maxLength={1000} rows={5} onChange={event => update({ ...draft, message: event.target.value })} /></label>
    <small>{storageFailed ? 'Bewaren lukt niet. Kopieer je tekst voordat je weggaat.' : 'Alleen in dit tabblad bewaard. Niet naar iemand verstuurd.'}</small>
    <div className="cp-task-actions"><button data-practice-check={checking ? undefined : true} className="primary-button" disabled={!draft.message.trim() || (exercise.mode === 'functional-form' && !draft.from)} onClick={() => setChecking(true)}>Kijk na<Check /></button>
      <button className="secondary-button" onClick={() => { setExample(!example); onHelp(); }}>Voorbeeld</button>
      <button className="secondary-button" disabled={!draft.message && !draft.from} onClick={() => update({ message: '', from: '' })}><RotateCcw />Wis</button></div>
    {example && <p className="cp-source-text">{task.example}</p>}
    {checking && <div className="cp-writing-check"><h4>Staat dit in jouw bericht?</h4>{task.criteria.map((criterion, index) => <label key={criterion}><input type="checkbox" checked={checked.includes(index)} onChange={event => setChecked(value => event.target.checked ? [...value, index] : value.filter(at => at !== index))} /><span>{criterion}</span></label>)}
      <button data-practice-check className="primary-button" disabled={checked.length !== task.criteria.length} onClick={() => onFinish('bericht geschreven en zelf nagekeken', true, 'Je hebt je bericht nagekeken. Je docent kan meelezen.')}>Klaar<Check /></button>
      <button className="secondary-button" onClick={() => onFinish('bericht geschreven; docentcontrole gevraagd', true, 'Bespreek je bericht met je docent.')}>Samen nakijken</button>
    </div>}
  </section>;
}
