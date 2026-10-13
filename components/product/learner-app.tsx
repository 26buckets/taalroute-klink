'use client';

import { Brand, playAudio } from '@/components/product/shared';
import { ExerciseAtlas } from '@/components/product/exercise-atlas';
import { ExerciseSampler, type ExerciseDemoId } from '@/components/product/exercise-sampler';
import { lessonSteps, MasteryRow, totalActivities, type LessonItem, type LessonStep } from '@/lib/product-data';
import {
  ArrowLeft, ArrowRight, AudioLines, BookOpen, Check, Clock3, Gauge,
  Grid2X2, Headphones, Home, ListOrdered, LogOut, MessageCircle, Mic, Pause, Play, RefreshCw, RotateCcw, Route, ScanText, ShieldCheck,
  Volume2, WholeWord, X,
} from 'lucide-react';
import { type CSSProperties, useEffect, useRef, useState } from 'react';
import Image from 'next/image';

type LearnerView = 'home' | 'lesson' | 'practice' | 'result' | 'atlas' | 'sampler';
type Feedback = 'idle' | 'right' | 'wrong';

export function LearnerApp({ onExit, onToast }: { onExit: () => void; onToast: (message: string) => void }) {
  const [view, setView] = useState<LearnerView>('home');
  const [demoId, setDemoId] = useState<ExerciseDemoId>('picture');
  const [stepIndex, setStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>(['model']);
  const [mastery, setMastery] = useState<MasteryRow[]>([]);

  useEffect(() => {
    fetch('/api/attempts').then(async (response) => {
      if (!response.ok) throw new Error('Voortgang niet beschikbaar');
      return await response.json() as { mastery?: MasteryRow[] };
    }).then((data) => setMastery(data.mastery ?? [])).catch(() => undefined);
  }, [view]);

  function startPractice(index = 0) { setStepIndex(index); setView('practice'); }

  return (
    <div className="learner-app">
      <aside className="learner-nav">
        <button className="brand-button" onClick={() => setView('home')} aria-label="Naar de leerhome"><Brand /></button>
        <nav aria-label="Cursistnavigatie">
          <button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}><Home /><span>Verder</span></button>
          <button className={view === 'lesson' ? 'active' : ''} onClick={() => setView('lesson')}><Route /><span>Mijn les</span></button>
          <button className={view === 'atlas' || view === 'sampler' ? 'active' : ''} onClick={() => setView('atlas')}><Grid2X2 /><span>Oefeningen</span></button>
          <button onClick={() => onToast('Je herhaalset is morgen om 09.00 uur klaar.')}><RefreshCw /><span>Herhalen</span></button>
          <button onClick={() => onToast('Je hebt 18 woorden bewaard.')}><BookOpen /><span>Woorden</span></button>
        </nav>
        <button className="learner-profile" onClick={onExit}><span>FA</span><small>Fatima</small><LogOut /></button>
      </aside>
      <main className="learner-main">
        {view === 'home' && <LearnerHome onContinue={() => setView('lesson')} onExplore={() => setView('atlas')} mastery={mastery} />}
        {view === 'lesson' && <LessonOverview completedSteps={completedSteps} onStart={startPractice} onBack={() => setView('home')} />}
        {view === 'atlas' && <ExerciseAtlas onBack={() => setView('home')} onAction={(title, selectedDemoId) => { if (selectedDemoId) { setDemoId(selectedDemoId); setView('sampler'); } else onToast(`${title} staat op de uitbouwkaart.`); }} />}
        {view === 'sampler' && <ExerciseSampler initialId={demoId} onBack={() => setView('atlas')} />}
        {view === 'practice' && <PracticePlayer initialStep={stepIndex} onClose={() => setView('lesson')} onComplete={(steps) => { setCompletedSteps(Array.from(new Set([...completedSteps, ...steps]))); setView('result'); }} />}
        {view === 'result' && <LessonResult onHome={() => setView('home')} onRepeat={() => startPractice(1)} />}
      </main>
    </div>
  );
}

function LearnerHome({ onContinue, onExplore, mastery }: { onContinue: () => void; onExplore: () => void; mastery: MasteryRow[] }) {
  const score = mastery.length ? Math.round(mastery.reduce((sum, item) => sum + item.score, 0) / mastery.length) : 64;
  return (
    <div className="learner-page">
      <header className="learner-page-head">
        <div><button className="listen-greeting" onClick={() => playAudio('instructie-welkom')} aria-label="Luister naar de begroeting"><Volume2 /></button><span>Goedemorgen, Fatima</span><h1>Ga verder met jouw les</h1></div>
        <div className="day-streak" aria-label="Vier oefendagen"><span><Check /></span><span><Check /></span><span><Check /></span><span><Check /></span><small>4 dagen</small></div>
      </header>
      <section className="next-lesson-card">
        <div className="next-lesson-copy"><span className="eyebrow light">Jouw volgende stap</span><div className="sound-title"><b>p</b><i>en</i><b>b</b></div><h2>Horen, bouwen en gebruiken</h2><p>{totalActivities} korte activiteiten · ongeveer 12 minuten</p><button className="accent-button" onClick={onContinue}><Play />Bekijk de les<ArrowRight /></button></div>
        <div className="next-lesson-path" aria-label="Opbouw van de les">{lessonSteps.slice(0, 6).map((step, index) => <div key={step.id} className={index < 2 ? 'done' : index === 2 ? 'current' : ''}><span>{index < 2 ? <Check /> : index + 1}</span><small>{step.short}</small></div>)}</div>
      </section>
      <div className="learner-dashboard-grid">
        <section className="plain-panel today-panel"><div className="panel-heading"><div><span className="eyebrow">Vandaag</span><h2>Je oefent rustig door</h2></div><div className="mastery-ring" style={{ '--progress': `${score * 3.6}deg` } as CSSProperties}><strong>{score}%</strong></div></div><div className="today-stats"><span><Clock3 /><b>7 min</b><small>geoefend</small></span><span><WholeWord /><b>18</b><small>woorden</small></span><span><Gauge /><b>2</b><small>stappen klaar</small></span></div></section>
        <section className="plain-panel teacher-note"><span className="note-avatar">NS</span><div><span className="eyebrow">Van je docent</span><h2>Let op de lucht bij de p</h2><p>Houd je hand voor je mond. Bij <strong>p</strong> voel je meer lucht.</p><button className="secondary-button" onClick={() => playAudio('instructie-docent')}><Volume2 />Luister</button></div></section>
      </div>
      <section className="practice-discovery">
        <div className="practice-discovery-head"><div><span className="eyebrow">Meer oefenen</span><h2>Probeer een andere manier</h2></div><button onClick={onExplore}>Bekijk 24 oefenvormen<ArrowRight /></button></div>
        <div className="practice-discovery-grid">
          <button onClick={onExplore}><span><Image src="/word-boek.png" alt="boek" width={1254} height={1254} /></span><div><small>Woord en beeld</small><strong>Kijk en kies</strong><em>Luister en vind het plaatje.</em></div><ArrowRight /></button>
          <button onClick={onExplore}><span className="discovery-icon"><ListOrdered /></span><div><small>Lezen</small><strong>Maak de zin</strong><em>Zet losse woorden op volgorde.</em></div><ArrowRight /></button>
          <button onClick={onExplore}><span className="discovery-icon"><ScanText /></span><div><small>Praktijk</small><strong>Lees de afspraak</strong><em>Zoek de dag en tijd.</em></div><ArrowRight /></button>
          <button onClick={onExplore}><span className="discovery-icon"><MessageCircle /></span><div><small>Spreken</small><strong>Wat zeg je?</strong><em>Kies een passende reactie.</em></div><ArrowRight /></button>
        </div>
      </section>
      <section className="review-strip"><div><span className="eyebrow">Later herhalen</span><h2>Dit blijft voor je klaarstaan</h2></div><article><span className="review-symbol">ui</span><div><strong>ui en uu</strong><small>morgen · 5 woorden</small></div></article><article><span className="review-symbol">m</span><div><strong>m en n</strong><small>vrijdag · 6 woorden</small></div></article></section>
    </div>
  );
}

function LessonOverview({ completedSteps, onStart, onBack }: { completedSteps: string[]; onStart: (index?: number) => void; onBack: () => void }) {
  const firstOpen = Math.max(0, lessonSteps.findIndex((step) => !completedSteps.includes(step.id)));
  return (
    <div className="learner-page lesson-page">
      <button className="text-back" onClick={onBack}><ArrowLeft />Terug naar home</button>
      <header className="lesson-heading"><div><span className="eyebrow">Klankles 1</span><h1>p en b</h1><p>Je hoort het verschil en gebruikt de woorden in een zin.</p></div><div className="lesson-summary"><span><b>{totalActivities}</b><small>activiteiten</small></span><span><b>9</b><small>stappen</small></span><span><b>± 12</b><small>minuten</small></span></div></header>
      <div className="lesson-layout">
        <section className="lesson-route">{lessonSteps.map((step, index) => { const done = completedSteps.includes(step.id); const current = index === firstOpen; return <button key={step.id} className={`${done ? 'done' : ''} ${current ? 'current' : ''}`} onClick={() => onStart(index)}><span className="route-index">{done ? <Check /> : index + 1}</span><span className="route-copy"><small>{step.short}</small><strong>{step.title}</strong><em>{step.items.length} activiteiten</em></span><ArrowRight /></button>; })}</section>
        <aside className="lesson-side"><div className="lesson-pair"><span>p</span><i>≠</i><span>b</span></div><h2>Doel van deze les</h2><ul><li><Check />p en b vooraan horen</li><li><Check />woorden met p en b bouwen</li><li><Check />de woorden lezen en spreken</li></ul><button className="primary-button wide" onClick={() => onStart(firstOpen)}><Play />Begin bij {lessonSteps[firstOpen]?.short ?? 'Uitleg'}</button></aside>
      </div>
    </div>
  );
}

function PracticePlayer({ initialStep, onClose, onComplete }: { initialStep: number; onClose: () => void; onComplete: (steps: string[]) => void }) {
  const [stepIndex, setStepIndex] = useState(initialStep);
  const [itemIndex, setItemIndex] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [typed, setTyped] = useState('');
  const [build, setBuild] = useState<number[]>([]);
  const [helpCount, setHelpCount] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [finishedSteps, setFinishedSteps] = useState<string[]>([]);
  const startedAt = useRef(0);
  const step = lessonSteps[stepIndex];
  const item = step.items[itemIndex];
  const isLast = stepIndex === lessonSteps.length - 1 && itemIndex === step.items.length - 1;
  const progress = ((lessonSteps.slice(0, stepIndex).reduce((sum, entry) => sum + entry.items.length, 0) + itemIndex + 1) / totalActivities) * 100;
  const buildWord = build.map((index) => item.tiles?.[index] ?? '').join('');

  useEffect(() => { startedAt.current = Date.now(); }, [stepIndex, itemIndex]);

  function resetActivity() {
    setFeedback('idle');
    setTyped('');
    setBuild([]);
    setHelpCount(0);
  }

  function saveAttempt(answer: string, isCorrect: boolean) {
    void fetch('/api/attempts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ exerciseId: `${step.id}.${item.id}`, skillKey: step.skill, answer, isCorrect, helpCount, responseMs: Date.now() - startedAt.current }) }).catch(() => undefined);
  }
  function checkAnswer(answer: string) {
    if (feedback === 'right') return;
    const isCorrect = answer.trim().toLocaleLowerCase('nl-NL') === (item.answer ?? item.word).trim().toLocaleLowerCase('nl-NL');
    saveAttempt(answer, isCorrect); setAnswered((value) => value + 1);
    if (isCorrect) { setCorrect((value) => value + 1); setFeedback('right'); }
    else { setFeedback('wrong'); setHelpCount((value) => value + 1); playAudio(item.word, 0.72); }
  }
  function nextItem() {
    resetActivity();
    if (itemIndex < step.items.length - 1) { setItemIndex((value) => value + 1); return; }
    const updated = Array.from(new Set([...finishedSteps, step.id])); setFinishedSteps(updated);
    if (stepIndex < lessonSteps.length - 1) { setStepIndex((value) => value + 1); setItemIndex(0); return; }
    onComplete(updated);
  }

  return (
    <div className="practice-app">
      <header className="practice-header"><button onClick={onClose} aria-label="Sluit de oefening"><X /></button><Brand dark /><div className="practice-title"><strong>{step.short}</strong><span>{stepIndex + 1} van {lessonSteps.length}</span></div><button onClick={() => playAudio(step.instructionAudio)}><Volume2 /><span>Uitleg</span></button></header>
      <div className="practice-progress"><span style={{ width: `${progress}%` }} /></div>
      <main className="practice-stage"><div className="instruction-block"><button onClick={() => playAudio(step.instructionAudio)} aria-label="Luister naar de opdracht"><Volume2 /></button><div><span>Opdracht</span><h1>{step.instruction}</h1><p>{itemIndex + 1} van {step.items.length}</p></div></div><section className="exercise-canvas"><ExerciseContent step={step} item={item} feedback={feedback} typed={typed} setTyped={setTyped} build={build} setBuild={setBuild} buildWord={buildWord} onCheck={checkAnswer} onContinue={() => { if (step.kind === 'model' || step.kind === 'speak') { saveAttempt(item.word, true); setCorrect((value) => value + 1); setAnswered((value) => value + 1); } nextItem(); }} /></section></main>
      <footer className={`feedback-footer ${feedback}`}>
        {feedback === 'idle' && <div><span className="feedback-icon neutral"><Headphones /></span><span><strong>Neem de tijd</strong><small>Je kunt het geluid zo vaak afspelen als je wilt.</small></span></div>}
        {feedback === 'right' && <div><span className="feedback-icon"><Check /></span><span><strong>Goed gehoord</strong><small>Je koos {item.answer ?? item.word}.</small></span></div>}
        {feedback === 'wrong' && <div><span className="feedback-icon"><RefreshCw /></span><span><strong>Luister nog een keer</strong><small>Let op de eerste klank. Probeer daarna opnieuw.</small></span></div>}
        {feedback === 'right' && <button className="success-button" onClick={nextItem}>{isLast ? 'Bekijk resultaat' : 'Volgende'}<ArrowRight /></button>}
        <span className="practice-score">{correct} goed · {answered} pogingen</span>
      </footer>
    </div>
  );
}

function ExerciseContent({ step, item, feedback, typed, setTyped, build, setBuild, buildWord, onCheck, onContinue }: { step: LessonStep; item: LessonItem; feedback: Feedback; typed: string; setTyped: (value: string) => void; build: number[]; setBuild: (value: number[]) => void; buildWord: string; onCheck: (answer: string) => void; onContinue: () => void }) {
  if (step.kind === 'model') return <div className="model-exercise"><div className="letter-focus"><span className={item.word.startsWith('p') ? 'active' : ''}>p</span><i>of</i><span className={item.word.startsWith('b') ? 'active' : ''}>b</span></div><button className="word-audio" onClick={() => playAudio(item.word)}><Volume2 /><strong>{item.word}</strong><small>luister</small></button><div className="segmented-word">{item.word.split('').map((letter, index) => <span key={`${letter}-${index}`} className={index === 0 ? 'target' : ''}>{letter}</span>)}</div><button className="primary-button" onClick={onContinue}>Volgende woord<ArrowRight /></button></div>;
  if (step.kind === 'build') return <div className="build-exercise-v3"><button className="large-audio" onClick={() => playAudio(item.word)}><Volume2 /><span>Luister</span></button><div className="build-slots" aria-label={`Gebouwd woord: ${buildWord || 'leeg'}`}>{Array.from({ length: item.answer?.length ?? 0 }).map((_, index) => <span key={index} className={build[index] !== undefined ? 'filled' : ''}>{build[index] !== undefined ? item.tiles?.[build[index]] : ''}</span>)}</div><div className="tile-bank">{item.tiles?.map((letter, index) => <button key={`${letter}-${index}`} disabled={build.includes(index) || feedback === 'right'} onClick={() => setBuild([...build, index])}>{letter}</button>)}</div><div className="exercise-actions"><button className="secondary-button" onClick={() => setBuild(build.slice(0, -1))}><RotateCcw />Eén terug</button><button className="primary-button" disabled={!buildWord || feedback === 'right'} onClick={() => onCheck(buildWord)}>Controleer<Check /></button></div></div>;
  if (step.kind === 'type') return <form className="type-exercise-v3" onSubmit={(event) => { event.preventDefault(); onCheck(typed); }}><button type="button" className="large-audio" onClick={() => playAudio(item.word)}><Volume2 /><span>Luister</span></button><label><span>Typ het woord</span><input value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" disabled={feedback === 'right'} /></label><button className="primary-button" type="submit" disabled={!typed || feedback === 'right'}>Controleer<Check /></button></form>;
  if (step.kind === 'read' || step.kind === 'transfer') return <div className="sentence-exercise">{step.kind === 'transfer' && <button className="large-audio small" onClick={() => playAudio(item.word)}><Volume2 /><span>Luister</span></button>}<p>{item.sentence}</p><div className="word-options">{item.options?.map((option) => <button key={option} disabled={feedback === 'right'} onClick={() => onCheck(option)}>{option}</button>)}</div></div>;
  if (step.kind === 'speak') return <SpeakExercise word={item.word} onContinue={onContinue} />;
  return <div className={`choice-exercise-v3 ${step.kind === 'sort' ? 'sort' : ''}`}><button className="large-audio" onClick={() => playAudio(item.word)}><Volume2 /><span>Luister</span></button>{step.kind === 'pair' && <p className="listen-placeholder">Welk woord hoor je?</p>}<div className="word-options">{item.options?.map((option) => <button key={option} className={option.length === 1 ? 'sound-option' : ''} disabled={feedback === 'right'} onClick={() => onCheck(option)}>{option}</button>)}</div>{feedback === 'wrong' && <button className="slow-audio" onClick={() => playAudio(item.word, 0.72)}><AudioLines />Langzaam luisteren</button>}</div>;
}

function SpeakExercise({ word, onContinue }: { word: string; onContinue: () => void }) {
  const [recording, setRecording] = useState(false); const [audioUrl, setAudioUrl] = useState(''); const [message, setMessage] = useState('Luister eerst naar het voorbeeld.');
  const recorderRef = useRef<MediaRecorder | null>(null); const chunksRef = useRef<Blob[]>([]);
  async function toggleRecording() {
    if (recording) { recorderRef.current?.stop(); setRecording(false); return; }
    try { const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); const recorder = new MediaRecorder(stream); chunksRef.current = []; recorder.ondataavailable = (event) => chunksRef.current.push(event.data); recorder.onstop = () => { setAudioUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: recorder.mimeType }))); setMessage('Luister terug. Klinkt jouw eerste klank hetzelfde?'); stream.getTracks().forEach((track) => track.stop()); }; recorderRef.current = recorder; recorder.start(); setRecording(true); setMessage('Spreek nu het woord.'); }
    catch { setMessage('De microfoon is niet beschikbaar. Zeg het woord hardop na.'); }
  }
  return <div className="speak-exercise-v3"><button className="word-model" onClick={() => playAudio(word)}><Volume2 /><strong>{word}</strong><small>voorbeeld</small></button><p>{message}</p><button className={`record-control ${recording ? 'recording' : ''}`} onClick={toggleRecording}>{recording ? <Pause /> : <Mic />}<span>{recording ? 'Stop' : 'Neem op'}</span></button>{audioUrl && <audio controls src={audioUrl} aria-label="Jouw opname"><track kind="captions" src="/audio/recording.vtt" srcLang="nl" label="Eigen opname zonder transcript" /></audio>}<button className="primary-button" onClick={onContinue} disabled={!audioUrl && message.startsWith('Luister')}>Ik heb vergeleken<Check /></button><small className="privacy-note"><ShieldCheck />De opname blijft in deze oefening en wordt niet opgeslagen.</small></div>;
}

function LessonResult({ onHome, onRepeat }: { onHome: () => void; onRepeat: () => void }) {
  return <div className="result-page"><div className="result-mark"><Check /></div><span className="eyebrow">Les afgerond</span><h1>Je hoort p en b steeds beter.</h1><p>Je herkende de meeste woorden aan het begin. Typen komt morgen nog een keer terug.</p><div className="result-grid"><span><strong>9</strong><small>stappen gedaan</small></span><span><strong>{totalActivities}</strong><small>activiteiten</small></span><span><strong>p–b</strong><small>morgen herhalen</small></span></div><div className="result-actions"><button className="secondary-button" onClick={onRepeat}><RefreshCw />Nog een keer</button><button className="primary-button" onClick={onHome}>Naar mijn home<ArrowRight /></button></div></div>;
}
