'use client';
import { useExerciseViewTarget } from './exercise-view';

import { useState } from 'react';
import { ExerciseListen } from './exercise-listen';
import { Volume2 } from 'lucide-react';
import type { AudioPlayer, ExerciseAudio, PackageExercise } from '@/lib/package-content';

export function LearningPathSurface({ exercise, onAudio, onFinish, onHelp, canAnswer }: {
  exercise: PackageExercise; onAudio: AudioPlayer; onFinish: (answer: string, correct: boolean, feedback?: string) => void; onHelp: () => void; canAnswer: boolean;
}) {
  const [help, setHelp] = useState(false);
  const [selected, setSelected] = useState('');
  const model = exercise.mode === 'learning-example';
  const textView = useExerciseViewTarget('text', model);
  const source = exercise.prompt?.audio?.src;
  const options = (exercise.options ?? []) as { id: string; label: string }[];
  const answers = (exercise.answer as { correctOptionIds?: string[] })?.correctOptionIds ?? [];
  const modelUnits = exercise.modelUnits as string[] | undefined;
  return <section className="cp-task-card cp-learning-task">
    {model ? <>
      <p {...textView} className="cp-learning-example">{modelUnits ? modelUnits.map((unit, index) => <span key={index}>{index > 0 && ' · '}{index === exercise.modelFocus ? <mark data-model-unit>{unit}</mark> : unit}</span>) : String(exercise.displayWord)}</p>
      {source && <ExerciseListen label="Luister" onClick={() => onAudio(source)} />}
      <p>{String(exercise.explanation)}</p>
    </> : <>
      {source && <ExerciseListen label="Luister" onClick={() => onAudio(source)} />}
      {typeof exercise.question === 'string' && <h4>{exercise.question}</h4>}
      {typeof exercise.maskedWord === 'string' && <p className="cp-missing-word">{exercise.maskedWord}</p>}
      <div className="cp-choice-grid">{options.map(option => <button key={option.id} disabled={!canAnswer || answers.includes(selected)} aria-pressed={selected === option.id} className={selected === option.id ? 'selected' : ''} onClick={() => {
        setSelected(option.id); onFinish(option.id, answers.includes(option.id), answers.includes(option.id) ? 'Goed. Ga verder als je klaar bent.' : String(exercise.feedback));
      }}><strong>{option.label}</strong></button>)}</div>
      <button className="secondary-button" aria-expanded={help} onClick={() => { setHelp(!help); onHelp(); }}>Voorbeeld</button>
      {help && <div className="cp-source-text"><p>{String(exercise.explanation)}</p><p>{String(exercise.helpWord)}</p>{(exercise.modelAudio as ExerciseAudio)?.src && <button className="secondary-button" onClick={() => onAudio((exercise.modelAudio as ExerciseAudio).src)}><Volume2 />Luister</button>}</div>}
    </>}
  </section>;
}
