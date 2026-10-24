'use client';

import { exercises, type Exercise } from '@/lib/course-data';
import { Brand, playAudio } from '@/components/product/shared';
import { applyDefaultAudioRate } from '@/lib/media-player';
import { instructionAudioEnabled } from '@/lib/audio-policy';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  Headphones,
  ImageIcon,
  Keyboard,
  LogOut,
  Mic,
  Pause,
  PencilLine,
  Play,
  RefreshCw,
  RotateCcw,
  Route,
  Volume2,
  WholeWord,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type Feedback = 'idle' | 'right' | 'wrong';

const audioByExercise: Record<string, string> = {
  'pb-01': 'bus',
  'pb-02': 'bus',
  'pb-03': 'peer',
  'pb-04': 'bak',
  'pb-05': 'bus',
  'pb-06': 'bus',
  'pb-07': 'pak',
  'pb-08': 'bus',
  'pb-09': 'bus',
  'pb-10': 'boek',
  'pb-11': 'pak',
  'pb-12': 'boek',
  'pb-13': 'peer',
  'pb-14': 'bus',
  'pb-15': 'pak',
  'pb-16': 'boek',
};

const instructionAudioByExercise: Record<string, string> = {
  'pb-01': 'instructie-welkom',
  'pb-02': 'instructie-luister-kijk',
  'pb-03': 'instructie-kies-woord',
  'pb-04': 'instructie-eerste-letter',
  'pb-05': 'instructie-sorteer',
  'pb-06': 'instructie-bouw',
  'pb-07': 'instructie-typ',
  'pb-08': 'instructie-docent',
  'pb-09': 'instructie-zin',
  'pb-10': 'instructie-luister-kijk',
  'pb-11': 'instructie-lees',
  'pb-12': 'instructie-lees',
  'pb-13': 'instructie-bouw',
  'pb-14': 'instructie-kies-woord',
  'pb-15': 'instructie-zin',
  'pb-16': 'instructie-spreek',
};

const skillIcon: Record<Exercise['skill'], ReactNode> = {
  kijken: <ImageIcon />,
  luisteren: <Headphones />,
  bouwen: <WholeWord />,
  schrijven: <Keyboard />,
  lezen: <BookOpen />,
  spreken: <Mic />,
};

function normalize(value: string) {
  return value.trim().toLocaleLowerCase('nl-NL');
}

export function CompactLearnerApp({ onExit }: { onExit: () => void }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState('');
  const [typed, setTyped] = useState('');
  const [tileIndexes, setTileIndexes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<Feedback>('idle');
  const [completed, setCompleted] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [recordingReady, setRecordingReady] = useState(false);
  const startedAt = useRef(0);
  const exercise = exercises[currentIndex];
  const built = tileIndexes.map((index) => exercise.letters?.[index] ?? '').join('');
  const progress = Math.round(((currentIndex + (feedback === 'right' ? 1 : 0)) / exercises.length) * 100);

  useEffect(() => {
    startedAt.current = Date.now();
  }, [currentIndex]);

  function listen() {
    playAudio(audioByExercise[exercise.id] ?? exercise.word.toLocaleLowerCase('nl-NL'));
  }

  function saveAttempt(answer: string, isCorrect: boolean, now: number) {
    void fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: exercise.id,
        skillKey: exercise.skill,
        answer,
        isCorrect,
        helpCount: isCorrect ? 0 : 1,
        responseMs: now - startedAt.current,
      }),
    }).catch(() => undefined);
  }

  function mark(answer: string, isCorrect: boolean, now: number) {
    saveAttempt(answer, isCorrect, now);
    setFeedback(isCorrect ? 'right' : 'wrong');
    if (isCorrect) setCompleted((items) => Array.from(new Set([...items, exercise.id])));
    else listen();
  }

  function answerValue() {
    if (exercise.kind === 'build' || exercise.kind === 'sound-slots') return built;
    if (exercise.kind === 'type') return typed;
    return selected;
  }

  function isSelfChecked() {
    return ['intro', 'paper', 'read', 'speak'].includes(exercise.kind);
  }

  function primaryAction(now: number) {
    if (feedback === 'right') {
      if (currentIndex === exercises.length - 1) setFinished(true);
      else openExercise(currentIndex + 1);
      return;
    }
    if (isSelfChecked()) {
      const value = exercise.kind === 'speak' ? 'opgenomen' : exercise.answer ?? exercise.word;
      mark(value, true, now);
      return;
    }
    const value = answerValue();
    mark(value, normalize(value) === normalize(exercise.answer ?? exercise.word), now);
  }

  function openExercise(index: number) {
    setFinished(false);
    if (index !== currentIndex) {
      setSelected('');
      setTyped('');
      setTileIndexes([]);
      setFeedback('idle');
      setRecordingReady(false);
    }
    setCurrentIndex(index);
  }

  const canSubmit = isSelfChecked()
    ? exercise.kind !== 'speak' || recordingReady
    : Boolean(answerValue());

  if (finished) {
    return (
      <div className="compact-player compact-result">
        <header className="compact-titlebar"><Brand /><button onClick={onExit} aria-label="Andere cursist"><LogOut />Andere cursist</button></header>
        <main>
          <span className="compact-result-mark"><Check /></span>
          <small>p en b · afgerond</small>
          <h1>Goed geoefend.</h1>
          <p>Je hebt alle zestien oefeningen gedaan.</p>
          <div><strong>{completed.length}</strong><span>van 16 klaar</span></div>
          <button onClick={() => openExercise(0)}><RefreshCw />Nog een keer</button>
        </main>
      </div>
    );
  }

  return (
    <div className="compact-player">
      <header className="compact-titlebar">
        <button className="compact-brand-button" onClick={() => openExercise(0)} aria-label="Naar het begin"><Brand /></button>
        <div className="compact-title-center"><span>ALFA A</span><strong>p en b</strong><small>Oefening {currentIndex + 1} van {exercises.length}</small></div>
        <button className="compact-user" onClick={onExit}><span>FA</span><strong>Fatima</strong><LogOut /></button>
      </header>

      <div className="compact-workspace">
        <nav className="compact-main-nav" aria-label="Cursistnavigatie">
          <button className="active" onClick={() => openExercise(currentIndex)}><Play /><span>Verder</span></button>
          <button onClick={() => openExercise(0)}><Route /><span>Les</span></button>
          <button onClick={() => openExercise(Math.max(0, currentIndex - 1))}><RefreshCw /><span>Herhaal</span></button>
          <button className="compact-nav-exit" onClick={onExit}><LogOut /><span>Wissel</span></button>
        </nav>

        <main className="compact-exercise-area">
          <div className="compact-progress" aria-label={`${progress} procent afgerond`}><span style={{ width: `${progress}%` }} /></div>
          <header className="compact-instruction">
            {instructionAudioEnabled && <button onClick={() => playAudio(instructionAudioByExercise[exercise.id] ?? 'instructie-lees')} aria-label="Luister naar de opdracht"><Volume2 /></button>}
            <div><small>{exercise.short}</small><h1>{exercise.instruction}</h1></div>
          </header>
          <section className="compact-canvas" aria-label={exercise.title}>
            <ExerciseSurface
              exercise={exercise}
              selected={selected}
              setSelected={setSelected}
              typed={typed}
              setTyped={setTyped}
              tileIndexes={tileIndexes}
              setTileIndexes={setTileIndexes}
              built={built}
              listen={listen}
              feedback={feedback}
              onRecordingReady={() => setRecordingReady(true)}
            />
          </section>
        </main>

        <aside className="compact-route" aria-label="Oefeningen in deze les">
          <header><div><small>MIJN LES</small><strong>p – b</strong></div><span>{completed.length}/{exercises.length}</span></header>
          <div className="compact-route-list">
            {exercises.map((item, index) => (
              <button key={item.id} className={`${index === currentIndex ? 'active' : ''} ${completed.includes(item.id) ? 'done' : ''}`} onClick={() => openExercise(index)}>
                <span>{completed.includes(item.id) ? <Check /> : index + 1}</span>
                <i>{skillIcon[item.skill]}</i>
                <span><strong>{item.short}</strong><small>{item.skill}</small></span>
              </button>
            ))}
          </div>
        </aside>
      </div>

      <footer className={`compact-actionbar ${feedback}`}>
        <button className="compact-back" onClick={() => openExercise(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}><ArrowLeft /><span>Vorige</span></button>
        <button className="compact-listen" onClick={listen}><Volume2 /><span>Luister</span></button>
        <div className="compact-feedback">
          {feedback === 'idle' && <><Circle /><span><strong>Neem de tijd</strong><small>Luister zo vaak als je wilt.</small></span></>}
          {feedback === 'wrong' && <><RotateCcw /><span><strong>Probeer opnieuw</strong><small>Let op de eerste klank.</small></span></>}
          {feedback === 'right' && <><CheckCircle2 /><span><strong>Goed</strong><small>De volgende oefening staat klaar.</small></span></>}
        </div>
        <button className="compact-primary" onClick={() => primaryAction(Date.now())} disabled={!canSubmit && feedback !== 'right'}>
          <span>{feedback === 'right' ? currentIndex === exercises.length - 1 ? 'Afronden' : 'Verder' : isSelfChecked() ? 'Klaar' : 'Controleer'}</span>
          {feedback === 'right' ? <ArrowRight /> : <Check />}
        </button>
      </footer>
    </div>
  );
}

function ExerciseSurface({
  exercise,
  selected,
  setSelected,
  typed,
  setTyped,
  tileIndexes,
  setTileIndexes,
  built,
  listen,
  feedback,
  onRecordingReady,
}: {
  exercise: Exercise;
  selected: string;
  setSelected: (value: string) => void;
  typed: string;
  setTyped: (value: string) => void;
  tileIndexes: number[];
  setTileIndexes: (value: number[]) => void;
  built: string;
  listen: () => void;
  feedback: Feedback;
  onRecordingReady: () => void;
}) {
  const disabled = feedback === 'right';
  const showImage = exercise.image && !['sound-choice', 'sort', 'missing-letter'].includes(exercise.kind);

  if (exercise.kind === 'intro') {
    return <div className="compact-model"><CompactPicture src={exercise.image} alt={exercise.word} /><button className="compact-word-model" onClick={listen}><Volume2 /><strong>{exercise.word}</strong><small>luister</small></button></div>;
  }

  if (exercise.kind === 'build' || exercise.kind === 'sound-slots') {
    const slotCount = exercise.answer?.length ?? exercise.letters?.length ?? 0;
    return <div className="compact-build"><button className="compact-audio-square" onClick={listen}><Volume2 /><span>Luister</span></button><div className="compact-slots" aria-label={`Gebouwd woord ${built || 'leeg'}`}>{Array.from({ length: slotCount }).map((_, index) => <span key={index}>{tileIndexes[index] !== undefined ? exercise.letters?.[tileIndexes[index]] : ''}</span>)}</div><div className="compact-tiles">{exercise.letters?.map((letter, index) => <button key={`${letter}-${index}`} onClick={() => setTileIndexes([...tileIndexes, index])} disabled={disabled || tileIndexes.includes(index)}>{letter}</button>)}</div><button className="compact-undo" onClick={() => setTileIndexes(tileIndexes.slice(0, -1))} disabled={!tileIndexes.length}><RotateCcw />Eén terug</button></div>;
  }

  if (exercise.kind === 'type') {
    return <div className="compact-type"><button className="compact-audio-square" onClick={listen}><Volume2 /><span>Luister</span></button><label><span>Typ het woord</span><input value={typed} onChange={(event) => setTyped(event.target.value)} autoComplete="off" disabled={disabled} /></label></div>;
  }

  if (exercise.kind === 'paper') {
    return <div className="compact-selfcheck"><CompactPicture src={exercise.image} alt={exercise.word} /><PencilLine /><strong>{exercise.word}</strong><span>Schrijf op papier.</span></div>;
  }

  if (exercise.kind === 'read') {
    return <div className="compact-reading"><button onClick={listen}><Volume2 /></button>{exercise.word.split(' · ').map((word) => <span key={word}>{word}</span>)}</div>;
  }

  if (exercise.kind === 'speak') {
    return <CompactSpeak sentence={exercise.word} listen={listen} onReady={onRecordingReady} />;
  }

  return (
    <div className={`compact-choice ${exercise.kind === 'bingo' ? 'bingo' : ''} ${exercise.kind === 'sentence' ? 'sentences' : ''}`}>
      {showImage && <CompactPicture src={exercise.image} alt={exercise.word} />}
      {!showImage && <button className="compact-audio-square" onClick={listen}><Volume2 /><span>Luister</span></button>}
      {exercise.kind === 'missing-letter' && <div className="compact-missing"><span>_</span>{exercise.word.slice(1)}</div>}
      <div className="compact-options">
        {exercise.options?.map((option) => <button key={option} className={selected === option ? 'selected' : ''} onClick={() => setSelected(option)} disabled={disabled}>{option}</button>)}
      </div>
    </div>
  );
}

function CompactPicture({ src, alt }: { src?: Exercise['image']; alt: string }) {
  if (!src) return null;
  return <span className="compact-picture"><Image src={src} alt={alt} width={1254} height={1254} priority /></span>;
}

function CompactSpeak({ sentence, listen, onReady }: { sentence: string; listen: () => void; onReady: () => void }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [message, setMessage] = useState('Luister. Neem daarna je stem op.');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop();
      setRecording(false);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => chunksRef.current.push(event.data);
      recorder.onstop = () => {
        setAudioUrl(URL.createObjectURL(new Blob(chunksRef.current, { type: recorder.mimeType })));
        setMessage('Luister terug. Klinkt het hetzelfde?');
        stream.getTracks().forEach((track) => track.stop());
        onReady();
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setMessage('Spreek nu.');
    } catch {
      setMessage('Zeg de zin hardop. Tik daarna op Klaar.');
      onReady();
    }
  }

  return <div className="compact-speak"><button className="compact-sentence-model" onClick={listen}><Volume2 /><strong>{sentence}</strong></button><p>{message}</p><button className={`compact-record ${recording ? 'recording' : ''}`} onClick={toggleRecording}>{recording ? <Pause /> : <Mic />}<span>{recording ? 'Stop' : 'Neem op'}</span></button>{audioUrl && <audio ref={applyDefaultAudioRate} controls src={audioUrl} aria-label="Jouw opname"><track kind="captions" src="/audio/recording.vtt" srcLang="nl" label="Eigen opname zonder transcript" /></audio>}</div>;
}
