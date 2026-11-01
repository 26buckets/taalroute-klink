'use client';
import { useExerciseViewTarget } from './exercise-view';
import { ExerciseListen } from './exercise-listen';
import { StandardPracticeSurface } from './standard-practice-surface';
import { useState } from 'react';
import { Check, Volume2, RotateCcw } from 'lucide-react';
import type { AudioPlayer, PackageExercise, ExerciseAudio } from '@/lib/package-content';

type Props = { exercise: PackageExercise; onAudio: AudioPlayer; onFinish: (answer: string, correct: boolean, feedback?: string) => void; onReset: () => void; onHelp: () => void; canAnswer: boolean; answeredCorrectly?: boolean };
type Block = { id: string; text: string; speaker?: string; audio?: ExerciseAudio };
type Task = { id: string; prompt: string; criteria: string[]; example: string; speakers: string[] };

export function ExtendedPracticeSurface({ exercise, onAudio, onFinish, onReset, onHelp, canAnswer, answeredCorrectly }: Props) {
  const [selected, setSelected] = useState('');
  const [help, setHelp] = useState(false);
  const options = (exercise.options ?? []) as { id: string; label: string; audio?: ExerciseAudio }[];
  const answer = (exercise.answer ?? {}) as { correctOptionIds?: string[] };
  if (exercise.standardTask) return <StandardPracticeSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} onReset={onReset} onHelp={onHelp} canAnswer={canAnswer} answeredCorrectly={answeredCorrectly} />;
  if (exercise.mode === 'functional-message' || exercise.mode === 'functional-form') return <FunctionalWriting exercise={exercise} onFinish={onFinish} onReset={onReset} onHelp={onHelp} onAudio={onAudio} canAnswer={canAnswer} />;
  const correct = answer.correctOptionIds?.includes(selected);
  const synonyms = exercise.mode === 'synonyms';
  return <section className={`cp-task-card cp-extended-task${synonyms ? ' cp-synonyms-task' : ''}`}>
    {synonyms && exercise.prompt?.audio?.src && typeof exercise.synonymContext === 'string' && <p className="cp-synonym-context">{exercise.synonymContext}</p>}
    {exercise.mode === 'sound-compare' ? <ExerciseListen label="Luister naar beide woorden" onClick={() => onAudio(exercise.prompt?.audio?.src)} /> :
      synonyms ? exercise.prompt?.audio?.src ? <ExerciseListen label="Luister naar het woord" onClick={() => onAudio(exercise.prompt?.audio?.src)} /> : typeof exercise.synonymContext === 'string' && exercise.prompt?.text ? <p className="cp-synonym-word cp-synonym-context-card">{exercise.synonymContext.split(exercise.prompt.text)[0]}<strong>{exercise.prompt.text}</strong>{exercise.synonymContext.split(exercise.prompt.text)[1]}</p> : <p className="cp-synonym-word">{exercise.prompt?.text}</p> : <SourceText exercise={exercise} onAudio={onAudio} onHelp={onHelp} />}
    {typeof exercise.question === 'string' && <h4>{exercise.question}</h4>}
    {(exercise.questionAudio as ExerciseAudio)?.src && <button className="secondary-button" onClick={() => onAudio((exercise.questionAudio as ExerciseAudio).src)}><Volume2 />De vraag</button>}
    <div className={exercise.mode === 'text-evidence' ? 'cp-evidence-options' : 'cp-choice-grid'}>{options.map(option => <div className="cp-extended-option" key={option.id}><button disabled={!canAnswer || correct} aria-pressed={selected === option.id} className={selected === option.id ? 'selected' : ''} onClick={() => {
      setSelected(option.id);
      const isCorrect = answer.correctOptionIds?.includes(option.id) === true;
      const feedback = synonyms || exercise.readingRoundId ? String(isCorrect ? exercise.correctFeedback : exercise.feedback)
        : isCorrect ? typeof exercise.evidence === 'string' ? `In de tekst: ${exercise.evidence}` : 'Goed. Kijk ook naar het voorbeeld.'
        : exercise.mode === 'verb-choice' ? 'Kijk naar ik. Welke vorm hoort daarbij?' : 'Kijk of luister nog eens. Je keuzes blijven staan.';
      onFinish(option.id, isCorrect, feedback);
    }}>{option.label}</button>{option.audio?.src && <button className="secondary-button" aria-label={`Luister: ${option.label}`} onClick={() => onAudio(option.audio?.src)}><Volume2 /></button>}</div>)}</div>
    {exercise.mode === 'verb-choice' && <><button className="secondary-button" onClick={() => { setHelp(!help); onHelp(); }}>Help</button>{help && <div className="cp-source-text"><p>{String(exercise.rule)}</p><p>{String(exercise.sourceModel)}</p>{(exercise.modelAudio as ExerciseAudio)?.src && <button className="secondary-button" onClick={() => onAudio((exercise.modelAudio as ExerciseAudio).src)}><Volume2 />Luister</button>}</div>}</>}
    {typeof exercise.evidence === 'string' && <p className="cp-source-proof" aria-hidden={!correct} style={{ visibility: correct ? 'visible' : 'hidden' }}>{exercise.evidence}</p>}
  </section>;
}

export function SourceText({ exercise, onAudio, onHelp, corner = true }: { exercise: PackageExercise; onAudio: AudioPlayer; onHelp: () => void; corner?: boolean }) {
  const blocks = (exercise.sourceBlocks ?? []) as Block[];
  const textView = useExerciseViewTarget('text', blocks.length > 0);
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
