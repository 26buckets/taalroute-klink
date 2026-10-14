'use client';

/* oxlint-disable jsx-a11y/media-has-caption -- Eigen oefenopnames hebben geen afzonderlijk ondertitelspoor. */

import type {
  ExerciseImage,
  PackageDefinition,
  PackageExercise,
} from '@/lib/package-content';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  FileText,
  Headphones,
  Images,
  Mic,
  Pause,
  PencilLine,
  RefreshCw,
  RotateCcw,
  Shapes,
  Volume2,
} from 'lucide-react';
import Image from 'next/image';
import { useEffect, useRef, useState, type ReactNode } from 'react';

type ResultState = 'idle' | 'right' | 'wrong';
type ChoiceOption = { id: string; label?: string; grapheme?: string; image?: ExerciseImage };
type Tile = { id: string; token: string };
type TextField = { id: string; acceptedAnswers?: string[] };
type ExerciseItem = { itemId: string; text?: string; content?: CardContent; pairKey?: string };
type CardContent = { text?: string; image?: ExerciseImage };

const normalize = (value: string) => value.trim().toLocaleLowerCase('nl-NL').replace(/[.!?]+$/, '');
const asArray = <T,>(value: unknown) => (Array.isArray(value) ? value as T[] : []);
const asRecord = (value: unknown) => value && typeof value === 'object' ? value as Record<string, unknown> : {};
const asString = (value: unknown) => typeof value === 'string' || typeof value === 'number' ? `${value}` : '';
const readClock = () => Date.now();

function exerciseImage(exercise: PackageExercise) {
  if (exercise.prompt?.image) return exercise.prompt.image;
  const direct = asRecord(exercise.image);
  if (direct.assetId || direct.src) return direct as ExerciseImage;
  const stimulus = asRecord(exercise.stimulus);
  const image = asRecord(stimulus.image);
  return image.assetId || image.src ? image as ExerciseImage : undefined;
}

function containsAudio(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsAudio);
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.audioId === 'string' || Object.values(record).some(containsAudio);
}

function containsPublishedImage(value: unknown): boolean {
  if (Array.isArray(value)) return value.some(containsPublishedImage);
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.src === 'string' || Object.values(record).some(containsPublishedImage);
}

function representativeIndex(pack: PackageDefinition, familyId: string) {
  const records = pack.exercises.filter((exercise) => exercise.componentId === familyId);
  const visualIndex = records.findIndex(containsPublishedImage);
  return visualIndex >= 0 ? visualIndex : 0;
}

export function PackageExerciseBrowser({
  pack,
  onAudio,
}: {
  pack: PackageDefinition;
  onAudio: () => void;
}) {
  const initialFamilyId = pack.exerciseTypes[0]?.id ?? 'ALF-CMP-001';
  const [familyId, setFamilyId] = useState(initialFamilyId);
  const [recordIndex, setRecordIndex] = useState(() => representativeIndex(pack, initialFamilyId));
  const [result, setResult] = useState<ResultState>('idle');
  const [message, setMessage] = useState('Maak de opdracht. Je mag zo vaak proberen als nodig is.');
  const startedAt = useRef(0);
  const records = pack.exercises.filter((exercise) => exercise.componentId === familyId);
  const exercise = records[Math.min(recordIndex, Math.max(0, records.length - 1))] ?? pack.exercises[0];

  useEffect(() => {
    startedAt.current = readClock();
  }, []);

  function chooseFamily(nextFamilyId: string) {
    setFamilyId(nextFamilyId);
    setRecordIndex(representativeIndex(pack, nextFamilyId));
    resetResult();
  }

  function openAt(nextIndex: number) {
    setRecordIndex(Math.max(0, Math.min(records.length - 1, nextIndex)));
    resetResult();
  }

  function openExercise(exerciseId: string) {
    const target = pack.exercises.find((item) => item.exerciseId === exerciseId);
    if (!target) return;
    const familyRecords = pack.exercises.filter((item) => item.componentId === target.componentId);
    setFamilyId(target.componentId);
    setRecordIndex(Math.max(0, familyRecords.findIndex((item) => item.exerciseId === exerciseId)));
    resetResult();
  }

  function resetResult() {
    setResult('idle');
    setMessage('Maak de opdracht. Je mag zo vaak proberen als nodig is.');
    startedAt.current = readClock();
  }

  function finish(answer: string, correct: boolean, feedback?: string) {
    setResult(correct ? 'right' : 'wrong');
    setMessage(feedback ?? (correct
      ? 'Goed. Deze opdracht is afgerond.'
      : 'Nog niet. Kijk naar het verschil en probeer opnieuw.'));
    void fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: exercise.exerciseId,
        skillKey: exercise.componentId,
        answer,
        isCorrect: correct,
        helpCount: correct ? 0 : 1,
        responseMs: Math.max(0, readClock() - startedAt.current),
      }),
    }).catch(() => undefined);
  }

  if (!exercise) return null;

  const family = pack.exerciseTypes.find((item) => item.id === familyId);
  return (
    <section className="cp-exercise-browser">
      <header>
        <div>
          <span className="eyebrow">Werkende bronspeler</span>
          <h2>Probeer de echte oefeningen uit {pack.id}</h2>
          <p>Alle bronrecords zijn geladen. Dezelfde speler verwerkt de achttien componentfamilies; audio blijft op slot tot de luister- en rechtencontrole is afgerond.</p>
        </div>
        <span><strong>{pack.exercises.length}</strong><small>bronrecords</small></span>
      </header>

      <div className="cp-exercise-workspace">
        <aside aria-label="Componentfamilies">
          {pack.exerciseTypes.map((type, index) => (
            <button key={type.id} className={familyId === type.id ? 'active' : ''} onClick={() => chooseFamily(type.id)}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <span><strong>{type.label}</strong><small>{type.count} oefeningen</small></span>
            </button>
          ))}
        </aside>

        <main>
          <header className="cp-exercise-record-head">
            <div>
              <small>{exercise.exerciseId} · {exercise.mode}</small>
              <strong>{exercise.title || family?.label || exercise.componentId}</strong>
              <span>{exercise.prompt?.text || 'Maak de opdracht.'}</span>
            </div>
            <nav aria-label="Bladeren door oefeningen">
              <button onClick={() => openAt(recordIndex - 1)} disabled={recordIndex === 0} aria-label="Vorige oefening"><ArrowLeft /></button>
              <b>{recordIndex + 1} / {records.length}</b>
              <button onClick={() => openAt(recordIndex + 1)} disabled={recordIndex >= records.length - 1} aria-label="Volgende oefening"><ArrowRight /></button>
            </nav>
          </header>

          <div className="cp-exercise-stage">
            <ExerciseSurface
              key={exercise.exerciseId}
              exercise={exercise}
              pack={pack}
              onAudio={onAudio}
              onFinish={finish}
              onOpenExercise={openExercise}
            />
          </div>

          <footer className={`cp-exercise-feedback ${result}`}>
            {result === 'idle' && <Shapes />}
            {result === 'right' && <Check />}
            {result === 'wrong' && <RefreshCw />}
            <span><strong>{result === 'idle' ? 'Aan de slag' : result === 'right' ? 'Goed' : 'Probeer opnieuw'}</strong><small>{message}</small></span>
            <button className="secondary-button" onClick={() => openAt((recordIndex + 1) % records.length)}>Volgende<ArrowRight /></button>
          </footer>
        </main>
      </div>
    </section>
  );
}

function ExerciseSurface({
  exercise,
  pack,
  onAudio,
  onFinish,
  onOpenExercise,
}: {
  exercise: PackageExercise;
  pack: PackageDefinition;
  onAudio: () => void;
  onFinish: (answer: string, correct: boolean, feedback?: string) => void;
  onOpenExercise: (exerciseId: string) => void;
}) {
  switch (exercise.componentId) {
    case 'ALF-CMP-001': return <ModelSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-002': return <ChoiceSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-003': return <ContrastSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-004': return <MatchingSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-005': return <BuildSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-006': return <InputSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-007': return <ReadingSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-008': return <LinkedQuestionSurface exercise={exercise} pack={pack} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-009': return <SpeakSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-010': return <WritingSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-011': return <FormSurface exercise={exercise} onFinish={onFinish} />;
    case 'ALF-CMP-012': return <TraceSurface exercise={exercise} onFinish={onFinish} />;
    case 'ALF-CMP-013': return <SequenceSurface exercise={exercise} onFinish={onFinish} />;
    case 'ALF-CMP-014': return <BoardSurface exercise={exercise} pack={pack} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-015': return <GameSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-016': return <CardsSurface exercise={exercise} pack={pack} onAudio={onAudio} onFinish={onFinish} />;
    case 'ALF-CMP-017':
    case 'ALF-CMP-018': return <RouteSurface exercise={exercise} onOpenExercise={onOpenExercise} onFinish={onFinish} />;
    default: return <FallbackSurface exercise={exercise} onFinish={onFinish} />;
  }
}

function Prompt({ exercise, onAudio, children }: { exercise: PackageExercise; onAudio?: () => void; children?: ReactNode }) {
  return (
    <div className="cp-task-prompt">
      {containsAudio(exercise) && onAudio ? <button onClick={onAudio} aria-label="Luister naar de opdracht"><Volume2 /></button> : <span><FileText /></span>}
      <div><small>{exercise.mode.replaceAll('_', ' ')}</small><h3>{exercise.prompt?.text || exercise.title || 'Maak de opdracht.'}</h3>{children}</div>
    </div>
  );
}

function ExerciseImageView({ image, alt = 'Afbeelding bij de opdracht' }: { image?: ExerciseImage; alt?: string }) {
  if (!image?.src) return <span className="cp-missing-exercise-image"><Images /><small>Beeldbinding nog open</small></span>;
  return <Image src={image.src} alt={image.altText || alt} width={760} height={760} />;
}

function ModelSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  const text = asRecord(exercise.text);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><div className="cp-model-content"><ExerciseImageView image={exerciseImage(exercise)} /><strong>{asString(text.primary)}</strong></div><button className="primary-button" onClick={() => onFinish('bekeken', true)}>Ik heb gekeken<Check /></button></section>;
}

function ChoiceSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  const [selected, setSelected] = useState('');
  const options = asArray<ChoiceOption>(exercise.options);
  const answer = asRecord(exercise.answer);
  const correct = asArray<string>(answer.correctOptionIds);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} />{exercise.prompt?.image && <ExerciseImageView image={exercise.prompt.image} />}<div className="cp-choice-grid">{options.map((option) => <button key={option.id} className={selected === option.id ? 'selected' : ''} onClick={() => setSelected(option.id)}>{option.image ? <ExerciseImageView image={option.image} /> : <strong>{option.label ?? option.grapheme ?? option.id}</strong>}</button>)}</div><button className="primary-button" disabled={!selected} onClick={() => onFinish(selected, correct.includes(selected))}>Controleer<Check /></button></section>;
}

function ContrastSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  const [selected, setSelected] = useState('');
  const choices = asArray<ChoiceOption>(exercise.choices);
  const answer = asRecord(exercise.answer);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><div className="cp-large-options">{choices.map((choice) => <button key={choice.id} className={selected === choice.id ? 'selected' : ''} onClick={() => setSelected(choice.id)}>{choice.grapheme ?? choice.label ?? choice.id}</button>)}</div><button className="primary-button" disabled={!selected} onClick={() => onFinish(selected, selected === answer.correctSoundId)}>Controleer<Check /></button></section>;
}

function MatchingSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  const sources = asArray<ChoiceOption & { audio?: unknown }>(exercise.sources);
  const targets = asArray<ChoiceOption>(exercise.targets);
  const mapping = asRecord(asRecord(exercise.answer).mapping);
  const [activeSource, setActiveSource] = useState('');
  const [pairs, setPairs] = useState<Record<string, string>>({});
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><div className="cp-match-board"><div>{sources.map((source) => <button key={source.id} className={activeSource === source.id ? 'selected' : ''} onClick={() => setActiveSource(source.id)}>{source.audio ? <Headphones /> : source.label ?? source.id}<small>{pairs[source.id] ? 'gekoppeld' : 'kies eerst'}</small></button>)}</div><div>{targets.map((target) => <button key={target.id} onClick={() => { if (!activeSource) return; setPairs({ ...pairs, [activeSource]: target.id }); setActiveSource(''); }}>{target.image ? <ExerciseImageView image={target.image} /> : <strong>{target.label ?? target.id}</strong>}</button>)}</div></div><button className="primary-button" disabled={Object.keys(pairs).length !== sources.length} onClick={() => onFinish(JSON.stringify(pairs), sources.every((source) => mapping[source.id] === pairs[source.id]))}>Controleer<Check /></button></section>;
}

function BuildSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  const tiles = asArray<Tile>(exercise.tiles);
  const target = asArray<string>(asRecord(exercise.answer).targetTileIds);
  const slots = asArray<unknown>(exercise.slots);
  const [chosen, setChosen] = useState<string[]>([]);
  const token = (id: string) => tiles.find((tile) => tile.id === id)?.token ?? '';
  const image = exerciseImage(exercise);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} />{image && <ExerciseImageView image={image} />}<div className="cp-build-slots">{Array.from({ length: slots.length }).map((_, index) => <span key={index}>{chosen[index] ? token(chosen[index]) : ''}</span>)}</div><div className="cp-tile-bank">{tiles.map((tile) => <button key={tile.id} disabled={chosen.includes(tile.id)} onClick={() => setChosen([...chosen, tile.id])}>{tile.token}</button>)}</div><div className="cp-task-actions"><button className="secondary-button" onClick={() => setChosen(chosen.slice(0, -1))} disabled={!chosen.length}><RotateCcw />Eén terug</button><button className="primary-button" disabled={chosen.length !== target.length} onClick={() => onFinish(chosen.map(token).join(' '), chosen.join('|') === target.join('|'))}>Controleer<Check /></button></div></section>;
}

function InputSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  const fields = asArray<TextField>(exercise.fields);
  const [value, setValue] = useState('');
  const accepted = fields.flatMap((field) => field.acceptedAnswers ?? []);
  const image = exerciseImage(exercise);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} />{image && <ExerciseImageView image={image} />}<label className="cp-text-entry"><span>Jouw antwoord</span><input value={value} onChange={(event) => setValue(event.target.value)} autoComplete="off" /></label><button className="primary-button" disabled={!value.trim()} onClick={() => onFinish(value, accepted.some((answer) => normalize(answer) === normalize(value)))}>Controleer<Check /></button></section>;
}

function ReadingSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  const blocks = asArray<{ id: string; text: string; audio?: unknown }>(exercise.textBlocks);
  const image = exerciseImage(exercise);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} />{image && <ExerciseImageView image={image} />}<div className="cp-reading-blocks">{blocks.map((block) => <p key={block.id}>{block.text}</p>)}</div><button className="primary-button" onClick={() => onFinish('gelezen', true)}>Ik heb gelezen<Check /></button></section>;
}

function LinkedQuestionSurface({ exercise, pack, onAudio, onFinish }: SurfaceProps & { pack: PackageDefinition }) {
  const linkedId = asString(asRecord(exercise.responseComponent).exerciseId);
  const linked = pack.exercises.find((item) => item.exerciseId === linkedId);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><p className="cp-audio-lock"><CircleAlert />De luistertekst staat nog op slot. De gekoppelde antwoordvraag is wel testbaar.</p>{linked ? <ChoiceSurface exercise={linked} onAudio={onAudio} onFinish={onFinish} /> : <button className="primary-button" onClick={() => onFinish('bekeken', true)}>Verder<ArrowRight /></button>}</section>;
}

function SpeakSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  const image = exerciseImage(exercise);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} />{image && <ExerciseImageView image={image} />}<Recorder onFinish={onFinish} /></section>;
}

function Recorder({ onFinish }: { onFinish: SurfaceProps['onFinish'] }) {
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState('');
  const [message, setMessage] = useState('Neem je stem op en luister terug.');
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);

  useEffect(() => () => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    stream.current?.getTracks().forEach((track) => track.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  async function toggle() {
    if (recording) { recorder.current?.stop(); setRecording(false); return; }
    try {
      const nextStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const nextRecorder = new MediaRecorder(nextStream);
      stream.current = nextStream;
      chunks.current = [];
      nextRecorder.ondataavailable = (event) => chunks.current.push(event.data);
      nextRecorder.onstop = () => {
        setAudioUrl(URL.createObjectURL(new Blob(chunks.current, { type: nextRecorder.mimeType })));
        setMessage('Luister terug. Neem opnieuw op als je dat wilt.');
        nextStream.getTracks().forEach((track) => track.stop());
        stream.current = null;
      };
      recorder.current = nextRecorder;
      nextRecorder.start();
      setRecording(true);
      setMessage('Spreek nu.');
    } catch {
      setMessage('De microfoon is niet beschikbaar. Zeg de opdracht hardop en rond handmatig af.');
    }
  }

  return <div className="cp-recorder"><p>{message}</p><button className={recording ? 'recording' : ''} onClick={toggle}>{recording ? <Pause /> : <Mic />}<span>{recording ? 'Stop' : 'Neem op'}</span></button>{audioUrl && <audio controls src={audioUrl} aria-label="Jouw opname" />}<button className="primary-button" onClick={() => onFinish(audioUrl ? 'opgenomen' : 'hardop geoefend', true)}>Klaar<Check /></button></div>;
}

function WritingSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  const [value, setValue] = useState('');
  const maxLength = Number(asRecord(exercise.textPolicy).maxLength ?? 1000);
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} /><label className="cp-text-entry"><span>Schrijf hier</span><textarea value={value} onChange={(event) => setValue(event.target.value)} maxLength={maxLength} rows={6} /></label><button className="primary-button" disabled={!value.trim()} onClick={() => onFinish(value, true, 'Opgeslagen voor zelf- of docentcontrole.')}>Bewaar<Check /></button></section>;
}

function FormSurface({ exercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  const fields = asArray<{ fieldId: string; label: string; type: string; required?: boolean; validation?: { pattern?: string; min?: number; max?: number }; options?: { value: string; label: string }[] }>(exercise.fields);
  const [values, setValues] = useState<Record<string, string>>({});
  function valid() {
    return fields.every((field) => {
      const value = values[field.fieldId] ?? '';
      if (field.required && !value) return false;
      if (field.validation?.pattern && !new RegExp(field.validation.pattern).test(value)) return false;
      if (field.validation?.min !== undefined && Number(value) < field.validation.min) return false;
      if (field.validation?.max !== undefined && Number(value) > field.validation.max) return false;
      return true;
    });
  }
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-form-fields">{fields.map((field) => <label key={field.fieldId}><span>{field.label}</span>{field.type === 'select' ? <select value={values[field.fieldId] ?? ''} onChange={(event) => setValues({ ...values, [field.fieldId]: event.target.value })}><option value="">Kies</option>{field.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select> : <input type={field.type === 'number' ? 'number' : 'text'} value={values[field.fieldId] ?? ''} onChange={(event) => setValues({ ...values, [field.fieldId]: event.target.value })} />}</label>)}</div><button className="primary-button" onClick={() => onFinish(JSON.stringify(values), valid())}>Controleer<Check /></button></section>;
}

function TraceSurface({ exercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  const [value, setValue] = useState('');
  const target = asString(exercise.target);
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-trace-model"><PencilLine /><strong>{target}</strong><span>Schrijf dit woord op papier of typ het hieronder.</span></div><label className="cp-text-entry"><span>Typen is ook mogelijk</span><input value={value} onChange={(event) => setValue(event.target.value)} /></label><button className="primary-button" onClick={() => onFinish(value || 'op papier', !value || normalize(value) === normalize(target), 'Vergelijk jouw woord rustig met het model.')}>Ik heb geschreven<Check /></button></section>;
}

function SequenceSurface({ exercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  const items = asArray<ExerciseItem>(exercise.items);
  const target = asArray<string>(exercise.targetOrderIds);
  const [chosen, setChosen] = useState<string[]>([]);
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-sequence-result">{chosen.map((id, index) => <span key={id}><b>{index + 1}</b>{items.find((item) => item.itemId === id)?.text}</span>)}</div><div className="cp-sequence-options">{items.map((item) => <button key={item.itemId} disabled={chosen.includes(item.itemId)} onClick={() => setChosen([...chosen, item.itemId])}>{item.text}</button>)}</div><div className="cp-task-actions"><button className="secondary-button" disabled={!chosen.length} onClick={() => setChosen(chosen.slice(0, -1))}><RotateCcw />Eén terug</button><button className="primary-button" disabled={chosen.length !== items.length} onClick={() => onFinish(chosen.join('|'), chosen.join('|') === target.join('|'))}>Controleer<Check /></button></div></section>;
}

function BoardSurface({ exercise, pack, onAudio, onFinish }: SurfaceProps & { pack: PackageDefinition }) {
  const cells = asArray<{ cellId: string; text?: string; image?: ExerciseImage }>(exercise.cells);
  const stimuli = asArray<{ targetCellIds?: string[]; audio?: unknown }>(exercise.stimuli);
  const [round, setRound] = useState(0);
  const [marked, setMarked] = useState<string[]>([]);
  const current = stimuli[round];
  const targetId = current?.targetCellIds?.[0] ?? '';
  const targetCell = cells.find((cell) => cell.cellId === targetId);
  const targetWord = targetCell?.text ?? wordForImage(pack, targetCell?.image) ?? 'het goede vak';
  const grid = asRecord(exercise.grid);
  const rows = Number(grid.rows ?? 3);
  const columns = Number(grid.columns ?? 3);

  function hasLine(ids: string[]) {
    const selected = new Set(ids);
    const lines = [
      ...Array.from({ length: rows }, (_, row) => cells.slice(row * columns, row * columns + columns).map((cell) => cell.cellId)),
      ...Array.from({ length: columns }, (_, column) => cells.filter((_, index) => index % columns === column).map((cell) => cell.cellId)),
    ];
    if (rows === columns) {
      lines.push(
        cells.filter((_, index) => index % (columns + 1) === 0).map((cell) => cell.cellId),
        cells.filter((_, index) => index > 0 && index % (columns - 1) === 0 && index < cells.length - 1).map((cell) => cell.cellId),
      );
    }
    return lines.some((line) => line.length > 0 && line.every((id) => selected.has(id)));
  }

  function chooseCell(cellId: string) {
    if (cellId !== targetId) {
      onFinish(cellId, false, 'Luister of kijk nog een keer en kies een ander vak.');
      return;
    }
    const nextMarked = marked.includes(cellId) ? marked : [...marked, cellId];
    setMarked(nextMarked);
    if (hasLine(nextMarked) || round >= stimuli.length - 1) {
      onFinish(nextMarked.join('|'), true, 'Bingo. Je hebt een volledige lijn gemaakt.');
      return;
    }
    setRound(round + 1);
  }

  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio}><p className="cp-preview-support">Tekststeun zolang audio nog niet is vrijgegeven: <strong>{targetWord}</strong></p></Prompt><p className="cp-round-progress">Ronde {Math.min(round + 1, stimuli.length)} van {stimuli.length} · {marked.length} vakken gemarkeerd</p><div className="cp-board-grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>{cells.map((cell) => <button key={cell.cellId} className={marked.includes(cell.cellId) ? 'marked' : ''} onClick={() => chooseCell(cell.cellId)}>{cell.image ? <ExerciseImageView image={cell.image} /> : <strong>{cell.text}</strong>}{marked.includes(cell.cellId) && <Check />}</button>)}</div></section>;
}

function GameSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  if (exercise.mode === 'memory') return <MemorySurface exercise={exercise} onFinish={onFinish} />;
  if (exercise.mode === 'sort') return <SortSurface exercise={exercise} onFinish={onFinish} />;
  if (exercise.mode === 'find_word') return <FindWordSurface exercise={exercise} onFinish={onFinish} />;
  if (exercise.mode === 'listen') return <ListenGameSurface exercise={exercise} onAudio={onAudio} onFinish={onFinish} />;
  return <DominoSurface exercise={exercise} onFinish={onFinish} />;
}

type DominoItem = { itemId: string; left?: { matchKey?: string; content?: CardContent }; right?: { matchKey?: string; content?: CardContent } };

function DominoSurface({ exercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  const items = asArray<DominoItem>(exercise.items);
  const rules = asRecord(exercise.rules);
  const startId = asString(rules.startItemId) || items[0]?.itemId || '';
  const [chain, setChain] = useState<string[]>(startId ? [startId] : []);
  const last = items.find((item) => item.itemId === chain.at(-1));
  const remaining = items.filter((item) => !chain.includes(item.itemId));

  function add(item: DominoItem) {
    if (last?.right?.matchKey !== item.left?.matchKey) {
      onFinish(item.itemId, false, 'Deze helften zijn niet hetzelfde. Kies een andere steen.');
      return;
    }
    const next = [...chain, item.itemId];
    setChain(next);
    if (next.length === items.length) onFinish(next.join('|'), true, 'De dominoketen is compleet.');
  }

  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-domino-chain">{chain.map((id) => { const item = items.find((candidate) => candidate.itemId === id); return <article key={id}><ContentView content={item?.left?.content} /><span /><ContentView content={item?.right?.content} /></article>; })}</div>{remaining.length > 0 && <><p className="cp-round-progress">Kies de volgende steen. Dezelfde woorden moeten elkaar raken.</p><div className="cp-domino-options">{remaining.map((item) => <button key={item.itemId} onClick={() => add(item)}><ContentView content={item.left?.content} /><span /><ContentView content={item.right?.content} /></button>)}</div></>}</section>;
}

function MemorySurface({ exercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  const items = asArray<ExerciseItem>(exercise.items);
  const [open, setOpen] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  function choose(item: ExerciseItem) {
    if (open.length >= 2 || open.includes(item.itemId) || matched.includes(item.itemId)) return;
    const next = [...open, item.itemId];
    setOpen(next);
    if (next.length === 2) {
      const first = items.find((candidate) => candidate.itemId === next[0]);
      const correct = first?.pairKey === item.pairKey;
      window.setTimeout(() => {
        if (correct) {
          const nextMatched = [...matched, ...next];
          setMatched(nextMatched);
          if (nextMatched.length === items.length) onFinish('memory afgerond', true);
        }
        setOpen([]);
      }, 550);
    }
  }
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-memory-grid">{items.map((item) => { const visible = open.includes(item.itemId) || matched.includes(item.itemId); return <button key={item.itemId} className={visible ? 'open' : ''} onClick={() => choose(item)}>{visible ? <ContentView content={item.content} /> : <span>?</span>}</button>; })}</div></section>;
}

function SortSurface({ exercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  const items = asArray<ExerciseItem>(exercise.items);
  const categories = asArray<{ categoryId: string; label: string }>(exercise.categories);
  const assignments = asRecord(asRecord(exercise.rules).assignments);
  const [selected, setSelected] = useState('');
  const [placed, setPlaced] = useState<Record<string, string>>({});
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-sort-items">{items.map((item) => <button key={item.itemId} className={selected === item.itemId ? 'selected' : ''} disabled={Boolean(placed[item.itemId])} onClick={() => setSelected(item.itemId)}>{item.content?.text}</button>)}</div><div className="cp-sort-categories">{categories.map((category) => <button key={category.categoryId} onClick={() => { if (!selected) return; setPlaced({ ...placed, [selected]: category.categoryId }); setSelected(''); }}>{category.label}<small>{Object.values(placed).filter((value) => value === category.categoryId).length} woorden</small></button>)}</div><button className="primary-button" disabled={Object.keys(placed).length !== items.length} onClick={() => onFinish(JSON.stringify(placed), items.every((item) => assignments[item.itemId] === placed[item.itemId]))}>Controleer<Check /></button></section>;
}

function FindWordSurface({ exercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  const items = asArray<ExerciseItem>(exercise.items);
  const rounds = asArray<{ targetWord: string; correctItemId: string; candidateItemIds: string[] }>(exercise.rounds);
  const [round, setRound] = useState(0);
  const current = rounds[round] ?? rounds[0];
  function choose(id: string) {
    if (id !== current?.correctItemId) {
      onFinish(id, false, 'Dat is een ander woord. Kijk nog een keer.');
      return;
    }
    if (round >= rounds.length - 1) onFinish(id, true, 'Alle zoekrondes zijn afgerond.');
    else setRound(round + 1);
  }
  return <section className="cp-task-card"><Prompt exercise={exercise} /><p className="cp-round-progress">Ronde {round + 1} van {rounds.length}</p><div className="cp-find-target">Zoek: <strong>{current?.targetWord}</strong></div><div className="cp-large-options">{current?.candidateItemIds.map((id) => <button key={id} onClick={() => choose(id)}>{items.find((item) => item.itemId === id)?.content?.text}</button>)}</div></section>;
}

function ListenGameSurface({ exercise, onAudio, onFinish }: SurfaceProps) {
  const items = asArray<ExerciseItem>(exercise.items);
  const rounds = asArray<{ correctItemId: string; candidateItemIds: string[] }>(exercise.listenRounds);
  const [round, setRound] = useState(0);
  const current = rounds[round] ?? rounds[0];
  const support = items.find((item) => item.itemId === current?.correctItemId)?.content?.text;
  function choose(id: string) {
    if (id !== current?.correctItemId) {
      onFinish(id, false, 'Luister nog een keer en kies een ander woord.');
      return;
    }
    if (round >= rounds.length - 1) onFinish(id, true, 'Alle luisterrondes zijn afgerond.');
    else setRound(round + 1);
  }
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio}><p className="cp-preview-support">Tekststeun zolang audio op slot staat: <strong>{support}</strong></p></Prompt><p className="cp-round-progress">Ronde {round + 1} van {rounds.length}</p><div className="cp-large-options">{current?.candidateItemIds.map((id) => <button key={id} onClick={() => choose(id)}>{items.find((item) => item.itemId === id)?.content?.text}</button>)}</div></section>;
}

function CardsSurface({ exercise, pack, onAudio, onFinish }: SurfaceProps & { pack: PackageDefinition }) {
  const cards = asArray<{ cardId: string; front?: { image?: ExerciseImage }; back?: { text?: string }; audio?: unknown }>(exercise.cards);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];
  const backText = card?.back?.text ?? wordForImage(pack, card?.front?.image) ?? 'Luister naar het woord';
  return <section className="cp-task-card"><Prompt exercise={exercise} onAudio={onAudio} />{card && <button className={`cp-flash-card ${flipped ? 'flipped' : ''}`} onClick={() => setFlipped(!flipped)}>{flipped ? <strong>{backText}</strong> : <ExerciseImageView image={card.front?.image} />}</button>}<div className="cp-task-actions"><button className="secondary-button" disabled={index === 0} onClick={() => { setIndex(index - 1); setFlipped(false); }}><ArrowLeft />Vorige</button><button className="primary-button" onClick={() => { if (index >= cards.length - 1) onFinish('kaartenset afgerond', true); else { setIndex(index + 1); setFlipped(false); } }}>{index >= cards.length - 1 ? 'Afronden' : 'Volgende'}<ArrowRight /></button></div></section>;
}

function RouteSurface({ exercise, onOpenExercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'> & { onOpenExercise: (exerciseId: string) => void }) {
  const tasks = asArray<{ exerciseId: string; componentId: string }>(exercise.tasks);
  return <section className="cp-task-card"><Prompt exercise={exercise} /><div className="cp-route-tasks">{tasks.map((task, index) => <button key={`${task.exerciseId}-${index}`} onClick={() => onOpenExercise(task.exerciseId)}><span>{index + 1}</span><strong>{task.exerciseId}</strong><small>{task.componentId}</small><ArrowRight /></button>)}</div><button className="secondary-button" onClick={() => onFinish('route bekeken', true)}>Route bekeken<Check /></button></section>;
}

function FallbackSurface({ exercise, onFinish }: Pick<SurfaceProps, 'exercise' | 'onFinish'>) {
  return <section className="cp-task-card"><Prompt exercise={exercise} /><pre>{JSON.stringify(exercise, null, 2)}</pre><button className="primary-button" onClick={() => onFinish('bekeken', true)}>Klaar<Check /></button></section>;
}

function ContentView({ content }: { content?: CardContent }) {
  if (!content) return null;
  if (content.image) return <ExerciseImageView image={content.image} />;
  return <strong>{content.text}</strong>;
}

function wordForImage(pack: PackageDefinition, image?: ExerciseImage) {
  if (!image?.src) return undefined;
  return pack.words.find((word) => word.image === image.src)?.word;
}

type SurfaceProps = {
  exercise: PackageExercise;
  onAudio: () => void;
  onFinish: (answer: string, correct: boolean, feedback?: string) => void;
};
