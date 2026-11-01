'use client';
import { useExerciseViewTarget } from './exercise-view';
import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { contentTaskIssues, gradeContentResponse, type ContentTask } from '@/lib/imported-practice-contract';
import type { PackageExercise } from '@/lib/package-content';
import { LearnerExerciseInfo } from './learner-exercise-info';
import {ImportedTeacherWorkflow,TeacherPreparation} from './imported-teacher-workflow';
type Props = { exercise: PackageExercise; onFinish: (answer: string, correct: boolean, feedback?: string) => void; onReset: () => void; onHelp: () => void; canAnswer: boolean; answeredCorrectly?: boolean; infoTarget?: HTMLElement | null };
export function ImportedPracticeSurface({ exercise, onFinish, onReset, onHelp, canAnswer, answeredCorrectly, infoTarget }: Props) {
  const task = exercise.contentTask as ContentTask;
  const textView = useExerciseViewTarget('text', Boolean(task.stimulus));
  const [answer, setAnswer] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [prepared, setPrepared] = useState(exercise.access === 'self-practice');
  const questions = task.initialQuestions?.length ? task.initialQuestions : [{id: exercise.exerciseId.replace(/^content:/,''), prompt: task.prompt}];
  const sourceVersion = JSON.stringify([task.stimulus, questions]);
  const initialKey = `klink.taalroute.content-initial.v1:${typeof exercise.contentSessionId === 'string' ? exercise.contentSessionId : exercise.exerciseId}:${questions[0].id}`;
  const [initialAnswers, setInitialAnswers] = useState<Record<string,{answer:string}>>(() => { try { const stored=JSON.parse(localStorage.getItem(initialKey)??'null');return stored?.sourceVersion===sourceVersion && stored.answers && typeof stored.answers==='object' ? stored.answers : {}; } catch { return {}; } });
  const pendingQuestion = questions.find(question => !initialAnswers[question.id]);
  const ownId = exercise.exerciseId.replace(/^content:/,'');
  useEffect(() => {try {localStorage.setItem(initialKey,JSON.stringify({sourceVersion,answers:initialAnswers}));} catch {/* Optional local storage. */}}, [initialKey,sourceVersion,initialAnswers]);
  const firstResponse = !pendingQuestion ? initialAnswers[ownId] ?? null : null;
  if (contentTaskIssues(task).length) return <section className="cp-task-card"><p>Deze opdracht is nog niet beschikbaar. Kies samen een andere opdracht.</p></section>;
  const locked = !canAnswer || answeredCorrectly;
  if(task.teacherWorkflow)return <ImportedTeacherWorkflow key={exercise.exerciseId} id={exercise.exerciseId} task={task} locked={Boolean(locked)} onFinish={onFinish} onHelp={onHelp}/>;
  const staged = Boolean(task.teacherReference);
  const responseLocked = locked || !prepared;
  function submit() {
    if (responseLocked || (staged && !firstResponse)) return;
    const response = task.mode === 'choice' ? selected : answer;
    const result = gradeContentResponse(task, response);
    if (result.assessment === 'unavailable') return;
    // The existing completion contract uses true for finished participation, not a teacher's correctness judgment.
    onFinish(JSON.stringify(staged ? { firstResponse, selected, finalNote: answer, preparedTogether: prepared, ...(questions.length>1?{sourceInitialResponses:initialAnswers}:{}) } : response), result.assessment === 'participation' || result.correct === true, result.assessment === 'participation' ? 'Je hebt de opdracht geoefend. Bespreek je antwoord met je docent.' : result.correct ? task.feedback.correct : task.feedback.retry);
  }
  if(!prepared)return <TeacherPreparation task={task} locked={Boolean(locked)} onBegin={()=>setPrepared(true)}/>;
  return <section className="cp-task-card cp-content-task" data-content-player={task.mode}>
    <p {...textView} className="cp-content-stimulus">{task.stimulus}</p>
    <LearnerExerciseInfo exercise={exercise} onHelp={onHelp} showTrigger={Boolean(!staged || firstResponse)} target={infoTarget} /><h4>{staged&&pendingQuestion?pendingQuestion.prompt:task.prompt}</h4>
    {task.mode === 'choice' && <><p>{task.correctOptionIds.length > 1 ? 'Kies alle passende antwoorden.' : 'Kies één antwoord.'}</p><div className="cp-choice-grid">{task.options.map(option => <button key={option.id} className={`secondary-button${selected.includes(option.id) ? ' selected' : ''}`} aria-pressed={selected.includes(option.id)} disabled={locked} onClick={() => { setSelected(previous => task.correctOptionIds.length > 1 ? previous.includes(option.id) ? previous.filter(id => id !== option.id) : [...previous,option.id] : [option.id]); onReset(); }}>{option.text}</button>)}</div></>}
    {staged && !firstResponse && <p>Geef eerst zelf antwoord en wijs aan waar je dat in de tekst ziet. Je mag je antwoord zeggen. {questions.length>1?`Vraag ${questions.findIndex(question=>question.id===pendingQuestion?.id)+1} van ${questions.length}. Eerst alle eigen antwoorden; daarna bespreken we de mogelijkheden.`:''}</p>}
    {staged && firstResponse && <><p>Je hebt eerst zelf geantwoord. Bekijk nu de mogelijkheden en bespreek waarom je antwoord bij de tekst past.</p><div className="cp-choice-grid">{task.options.map(option => <button key={option.id} className={`secondary-button${selected.includes(option.id) ? ' selected' : ''}`} aria-pressed={selected.includes(option.id)} disabled={responseLocked} onClick={() => {setSelected([option.id]);onReset();}}>{option.text}</button>)}</div></>}
    {task.mode !== 'choice' && <label className="cp-text-entry"><span>{task.mode === 'teacher' ? 'Je antwoord of een korte notitie (mag leeg blijven)' : 'Je antwoord'}</span><textarea value={answer} disabled={responseLocked} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} rows={3} onChange={event => {setAnswer(event.target.value);onReset();}} /></label>}
    {task.mode === 'text' && <p>Hoofdletters, leestekens en spaties tellen mee. Volg de opdracht precies.</p>}
    {staged && !firstResponse ? <button data-practice-check className="primary-button" disabled={responseLocked} onClick={() => {setInitialAnswers(current=>({...current,[pendingQuestion!.id]:{answer}}));setAnswer('');}}>Ik heb eerst zelf geantwoord<Check /></button> : <button data-practice-check className="primary-button" disabled={responseLocked || (task.mode === 'choice' ? !selected.length : task.mode === 'text' ? !answer.trim() : false)} onClick={submit}>{task.mode === 'teacher' ? 'Gedaan en besproken' : 'Controleer'}<Check /></button>}
    {task.mode === 'teacher' && <p>Deze opdracht bespreek je samen. Er is geen automatische beoordeling van je antwoord.</p>}
  </section>;
}
