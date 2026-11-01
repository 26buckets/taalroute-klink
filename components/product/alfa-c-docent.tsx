'use client';
import { useExerciseViewTarget } from './exercise-view';
import { ExerciseAudioProvider, ExerciseAudioSlot, ExerciseListen } from './exercise-listen';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Download,
  Eye,
  Volume2,
  Users,
  Undo2,
} from 'lucide-react';
import { playMedia, stopMedia } from './shared';
import {
  teacherTasks,
  teacherGroups,
  teacherChapter,
  teacherStorageKey,
  emptyTeacherStore,
  readTeacherStore,
  startProblem,
  startSession,
  sessionFor,
  firstResponse,
  paperSource,
  reviewed,
  appendEvent,
  assistance,
  normalizeWord,
  type TeacherTask,
  type Preparation,
  type TeacherStore,
  type TeacherEvent,
  type Observation,
} from '@/lib/alfa-c-docent';
import { learnerCollectionLabel } from '@/lib/learner-copy';
import './alfa-c-docent.css';
export function TeacherBlockCards({ groups = teacherGroups, level = 'alfa-c' }: { groups?: typeof teacherGroups; level?: string }) {
  return (
    <>
      {groups.map((g) => {
        const count = teacherTasks.filter((t) => t.group === g.id).length;
        return (
        <a
          className="cp-activity-button"
          key={g.id}
          data-teacher-group={g.id}
          href={`#learner/alfa-c/docent-${g.id}?level=${level}&help=guided`}
        >
          <Users aria-hidden="true" />
          <span>
            <strong>{g.title}</strong>
            <small>{count} {count === 1 ? 'opdracht' : 'opdrachten'}</small>
          </span>
          <ArrowRight aria-hidden="true" />
        </a>
      );})}
    </>
  );
}
const freshPreparation = (): Preparation => ({
  learner: '',
  meeting: '',
  lesson: '',
  preparedMeeting: '',
  preparedAt: '',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  evidence: '',
  checks: [],
  exposure: '',
  interveningActivity: '',
  paperPresent: false,
});
function download(text: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Klink-docentregistratie.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function AlfaCTeacherPractice(props: Parameters<typeof AlfaCTeacherContent>[0]) {
  return <ExerciseAudioProvider><AlfaCTeacherContent {...props} /></ExerciseAudioProvider>;
}

function AlfaCTeacherContent({ group }: { group: string }) {
  const returnLevel = typeof window !== 'undefined' && new URLSearchParams(window.location.hash.split('?')[1]).get('level') === 'all' ? 'all' : 'alfa-c';
  const tasks = teacherTasks.filter((t) => t.group === group),
    [taskId, setTaskId] = useState(''),
    [store, setStore] = useState<TeacherStore>(emptyTeacherStore),
    [loaded, setLoaded] = useState(false),
    [error, setError] = useState(''),
    [broken, setBroken] = useState(false),
    [preparation, setPreparation] = useState<Preparation>(freshPreparation),
    [sessionId, setSessionId] = useState('');
  const savedRaw = useRef<string | null>(null),
    current = useRef(store),
    task = tasks.find((t) => t.id === taskId);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(teacherStorageKey);
      savedRaw.current = raw;
      current.current = readTeacherStore(raw);
      setStore(current.current);
    } catch (e) {
      setError(String(e));
      setBroken(true);
    }
    setLoaded(true);
    return () => stopMedia();
  }, []);
  function save(next: TeacherStore) {
    try {
      if (broken)
        throw Error('Bewaar eerst een kopie van de onleesbare registratie.');
      if (localStorage.getItem(teacherStorageKey) !== savedRaw.current)
        throw Error(
          'De registratie is in een ander tabblad veranderd. Herlaad deze pagina om de nieuwste versie te gebruiken.',
        );
      const raw = JSON.stringify(next);
      localStorage.setItem(teacherStorageKey, raw);
      savedRaw.current = raw;
      current.current = next;
      setStore(next);
      setError('');
      return true;
    } catch (e) {
      setError(String(e));
      return false;
    }
  }
  function event(e: Omit<TeacherEvent, 'at'>) {
    try {
      return save(
        appendEvent(current.current, sessionId, {
          ...e,
          at: new Date().toISOString(),
        }),
      );
    } catch (e) {
      setError(String(e));
      return false;
    }
  }
  function start() {
    if (!task) return;
    try {
      const next = startSession(current.current, task, preparation);
      if (save(next)) setSessionId(sessionFor(next, task, preparation)!.id);
    } catch (e) {
      setError(String(e));
    }
  }
  const session = store.sessions.find((s) => s.id === sessionId);
  const taskLabel = task ? learnerCollectionLabel(task.title.replace(/ (\d+)$/, ' · Ronde $1')) : undefined;
  return (
    <div className="learner-page cp-chapters ac-docent">
      <header className="cp-context-header">
        <a
          className="text-back"
          href={`#learner/chapters/${teacherChapter[group] ?? 'words'}?level=${returnLevel}&help=guided`}
          aria-label="Andere oefening"
        >
          <ArrowLeft />
        </a>
        <h1>
          {taskLabel?.title ?? teacherGroups.find((g) => g.id === group)?.title}
        </h1>
        <small>{taskLabel?.round && `Ronde ${taskLabel.round} · `}Met je docent</small>
      </header>
      {error && <p role="alert">{error}</p>}
      {!loaded ? (
        <p>Even laden…</p>
      ) : session && task ? (
        <TeacherPlayer
          key={session.id}
          task={task}
          session={session}
          original={store.sessions.find(s => s.id === session.linkedSessionId)}
          event={event}
          leave={() => {
            stopMedia();
            setSessionId('');
            setTaskId('');
          }}
        />
      ) : (
        <section className="cp-panel ac-docent-setup">
          <h2>Voor de docent</h2>
          <p>
            Vul dit in zonder het scherm aan de cursist te tonen. De docent
            geeft de instructie mondeling. Registraties blijven op dit apparaat;
            gebruik codes, geen namen. Bewaar regelmatig een kopie.
          </p>
          <button
            className="secondary-button"
            onClick={() => {
              try {
                download(
                  localStorage.getItem(teacherStorageKey) ??
                    JSON.stringify(emptyTeacherStore()),
                );
              } catch {
                setError('De registratie kan niet worden gelezen.');
              }
            }}
          >
            <Download />
            Bewaar registraties
          </button>
          <div className="ac-docent-fields">
            <label>
              Cursistcode
              <input
                value={preparation.learner}
                onChange={(e) =>
                  setPreparation({ ...preparation, learner: e.target.value })
                }
              />
            </label>
            <label>
              Echte bijeenkomst / lescode
              <input
                value={preparation.meeting}
                onChange={(e) =>
                  setPreparation({ ...preparation, meeting: e.target.value })
                }
              />
            </label>
            <label>
              Boekdoel en lesplan
              <input
                value={preparation.lesson}
                onChange={(e) =>
                  setPreparation({ ...preparation, lesson: e.target.value })
                }
              />
            </label>
          </div>
          <div className="cp-chapter-grid">
            {tasks.map((t) => {
              const numbered = t.title.match(/^(.*) (\d+)$/);
              const title = learnerCollectionLabel(numbered?.[1] ?? t.title).title;
              return <button
                className="cp-activity-button"
                aria-label={t.title}
                aria-pressed={taskId === t.id}
                key={t.id}
                onClick={() => {
                  setTaskId(t.id);
                  setPreparation((p) => ({
                    ...p,
                    checks: t.preparation.map(() => false),
                    paperPresent: false,
                  }));
                  setError('');
                }}
              >
                <span>
                  <strong>{title}</strong>
                  <small className="cp-card-meta">{numbered && `Ronde ${numbered[2]} · `}Alfa C · {t.stages.length} {t.stages.length === 1 ? 'stap' : 'stappen'}</small>
                  <small>
                    {store.sessions.some(
                      (s) =>
                        s.taskId === t.id &&
                        s.preparation.learner === preparation.learner.trim() &&
                        s.preparation.meeting === preparation.meeting.trim(),
                    )
                      ? 'Registratie aanwezig'
                      : ''}
                  </small>
                </span>
                <ArrowRight />
              </button>;
            })}
          </div>
          {task && (
            <>
              <h3>Voorbereiding</h3>
              <p>{task.materials}</p>
              <p>{task.teacherNote}</p>
              {sessionFor(store, task, preparation) ? (
                <p>
                  Een bestaande registratie wordt hervat. De eerste reactie
                  blijft bewaard.
                </p>
              ) : (
                <>
                  {task.preparation.map((label, i) => (
                    <label className="ac-docent-check" key={label}>
                      <input
                        type="checkbox"
                        checked={preparation.checks[i] ?? false}
                        onChange={(e) =>
                          setPreparation({
                            ...preparation,
                            checks: task.preparation.map((_, j) =>
                              j === i
                                ? e.target.checked
                                : (preparation.checks[j] ?? false),
                            ),
                          })
                        }
                      />
                      {label}
                    </label>
                  ))}
                  <div className="ac-docent-fields">
                    <label>
                      Voorbereidende bijeenkomst
                      <input
                        value={preparation.preparedMeeting}
                        onChange={(e) =>
                          setPreparation({
                            ...preparation,
                            preparedMeeting: e.target.value,
                          })
                        }
                      />
                    </label>
                    <label>
                      Voorbereid op
                      <input
                        type="datetime-local"
                        onChange={(e) =>
                          setPreparation({
                            ...preparation,
                            preparedAt: e.target.value
                              ? new Date(e.target.value).toISOString()
                              : '',
                          })
                        }
                      />
                      <small>Tijdzone: {preparation.timezone}</small>
                    </label>
                  </div>
                  <label>
                    Bewijs van voorbereiding en betekeniscontext
                    <textarea
                      value={preparation.evidence}
                      onChange={(e) =>
                        setPreparation({
                          ...preparation,
                          evidence: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    Eerdere modellen, hulp en tijdstippen (ook eigen uitspraak)
                    <textarea
                      value={preparation.exposure}
                      onChange={(e) =>
                        setPreparation({
                          ...preparation,
                          exposure: e.target.value,
                        })
                      }
                    />
                  </label>
                  {task.kind === 'combine' && (
                    <label>
                      Laatste helewoordmodel en tussenactiviteit
                      <textarea
                        value={preparation.interveningActivity}
                        onChange={(e) =>
                          setPreparation({
                            ...preparation,
                            interveningActivity: e.target.value,
                          })
                        }
                      />
                    </label>
                  )}
                  {task.kind === 'check' && paperSource(store, preparation)?.events.find(e => e.stage === 0 && e.type === 'first')?.responseMedium !== 'digital' && (
                    <label className="ac-docent-check">
                      <input
                        type="checkbox"
                        checked={preparation.paperPresent}
                        onChange={(e) =>
                          setPreparation({
                            ...preparation,
                            paperPresent: e.target.checked,
                          })
                        }
                      />
                      Het oorspronkelijke, ongewijzigde dicteepapier van deze
                      cursist en dezelfde afnamesessie ligt klaar.
                    </label>
                  )}
                </>
              )}
              <p>{startProblem(store, task, preparation)}</p>
              <button
                className="primary-button"
                disabled={broken || !!startProblem(store, task, preparation)}
                onClick={start}
              >
                Open cursistscherm
                <ArrowRight />
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
type Session = TeacherStore['sessions'][number];
function TeacherPlayer({
  task,
  session,
  original,
  event,
  leave,
}: {
  task: TeacherTask;
  session: Session;
  original?: Session;
  event: (e: Omit<TeacherEvent, 'at'>) => boolean;
  leave: () => void;
}) {
  const [at, setAt] = useState(() => {
      const n = task.stages.findIndex((_, i) => !reviewed(session, i));
      return n < 0 ? task.stages.length - 1 : n;
    }),
    [teacher, setTeacher] = useState(false),
    [busy, setBusy] = useState(false),
    [audioError, setAudioError] = useState(''),
    [text, setText] = useState(''),
    [paperRef, setPaperRef] = useState(''),
    [paperSaved, setPaperSaved] = useState(false),
    [usePaper, setUsePaper] = useState(false),
    [draftError, setDraftError] = useState(false),
    [help, setHelp] = useState(''),
    [observations, setObservations] = useState<Record<string, Observation>>({}),
    [nextMeeting, setNextMeeting] = useState(''),
    [order, setOrder] = useState<number[]>([]),
    [retrying, setRetrying] = useState(false),
    [model, setModel] = useState(false);
  const stage = task.stages[at],
    first = firstResponse(session, at),
    isPaper = ['correct', 'word', 'dictation', 'check'].includes(task.kind),
    events = session.events.filter((e) => e.stage === at),
    completed = task.stages.every((_, i) => reviewed(session, i));
  const audioDone = stage.audio.every((src) =>
    events.some((e) => e.type === 'audio' && e.src === src),
  );
  const textView = useExerciseViewTarget('text', Boolean(stage.display || stage.model) && !teacher);
  const draftKey = `klink.alfa-c.docent.draft:${session.id}:${at}`;
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
    try { setText(localStorage.getItem(draftKey) ?? (task.kind === 'check' && original ? firstResponse(original, 0)?.text ?? '' : '')); }
    catch { setDraftError(true); }
    });
    return () => cancelAnimationFrame(frame);
  }, [draftKey, task.kind, original]);
  function changeText(value: string) {
    setText(value);
    try { localStorage.setItem(draftKey, value); setDraftError(false); }
    catch { setDraftError(true); }
  }
  const alive = useRef(true),
    heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      stopMedia();
    };
  }, []);
  useEffect(() => {
    heading.current?.focus();
  }, [at, teacher]);
  function record(type: 'first' | 'retry') {
    if (
      event({ type, stage: at, text, ...(isPaper ? { responseMedium: usePaper ? 'paper' : 'digital', paperRef: usePaper ? paperRef : undefined } : {}) })
    ) {
      changeText('');
      setTeacher(false);
    }
  }
  async function listen(src: string, isModel = false) {
    if (busy) return;
    if (
      isModel &&
      !event({ type: 'model', stage: at, text: 'Gesproken model' })
    )
      return;
    setBusy(true);
    setAudioError('');
    try {
      const ended = await playMedia(src, {
        waitUntilEnd: true,
        playbackRate: 1,
      });
      if (alive.current && ended) event({ type: 'audio', stage: at, src });
    } catch {
      if (alive.current) {
        event({ type: 'audio-error', stage: at, src });
        setAudioError('Het geluid werkt niet. Probeer opnieuw.');
      }
    } finally {
      if (alive.current) setBusy(false);
    }
  }
  function next() {
    stopMedia();
    setAt(at + 1);
    setText('');
    setPaperRef('');
    setPaperSaved(false);
    setObservations({});
    setNextMeeting('');
    setOrder([]);
    setRetrying(false);
    setModel(false);
    setTeacher(false);
    setAudioError('');
  }
  const latestTokens = [...events]
    .reverse()
    .find(
      (e) => (e.type === 'first' || e.type === 'retry') && e.tokens,
    )?.tokens;
  const tokens = retrying ? order : (latestTokens ?? order);
  return (
    <section
      className="cp-panel ac-docent-player"
      data-teacher-task={task.id}
      data-stage={at}
    >
      <div className="ac-docent-toolbar">
        <button
          className="secondary-button"
          disabled={busy}
          onClick={() => setTeacher(!teacher)}
        >
          <Users />
          {teacher ? 'Cursistscherm' : 'Docentregistratie'}
        </button>
        <span>
          {at + 1} / {task.stages.length}
        </span>
        <button className="secondary-button" disabled={busy} onClick={leave}>
          Andere opdracht
        </button>
      </div>
      {teacher ? (
        <div className="ac-docent-private">
          <h2 ref={heading} tabIndex={-1}>
            Docentregistratie
          </h2>
          <p>
            Scherm uit het zicht van de cursist. Spreek de opdracht uit:{' '}
            {stage.prompt}
          </p>
          {stage.teacherCue && <p>{stage.teacherCue}</p>}
          <p>
            Eerste reactie en concrete hulp worden afzonderlijk bewaard. Noteer
            onbekend als iets niet is waargenomen.
          </p>
          <label>
            Werkelijk gegeven hulp / model, ook vóór de eerste poging
            <textarea value={help} onChange={(e) => setHelp(e.target.value)} />
          </label>
          <button
            className="secondary-button"
            disabled={!help.trim() || busy}
            onClick={() => {
              if (event({ type: 'help', stage: at, text: help })) setHelp('');
            }}
          >
            Bewaar hulp
          </button>
          {first ? (
            <>
              <h3>Eerste reactie — bewaard</h3>
              <p className="ac-docent-response">{first.text}</p>
              <p>{first.paperRef && `Papier: ${first.paperRef}`}</p>
            </>
          ) : (
            <p>
              Leg alleen de echte eerste reactie vast. Een docentmodel is geen
              leerlingantwoord.
            </p>
          )}
          {task.kind !== 'recall' && (
            <>
              <label>
                {first
                  ? 'Latere reactie / correctie'
                  : 'Eerste reactie (letterlijke docenttranscriptie of geobserveerde handeling)'}
                <textarea
                  value={text}
                  onChange={(e) => changeText(e.target.value)}
                />
              </label>
              {isPaper && <label className="ac-docent-check"><input type="checkbox" checked={usePaper} onChange={e => setUsePaper(e.target.checked)} />Op papier gewerkt (extra)</label>}
              {isPaper && usePaper && (
                <>
                  <label>
                    Verwijzing naar het bewaarde papier
                    <input
                      value={paperRef}
                      onChange={(e) => setPaperRef(e.target.value)}
                    />
                  </label>
                  <label className="ac-docent-check">
                    <input
                      type="checkbox"
                      checked={paperSaved}
                      onChange={(e) => setPaperSaved(e.target.checked)}
                    />
                    Het echte papier is bewaard; de eerste versie blijft
                    ongewijzigd.
                  </label>
                </>
              )}
              <button
                className="primary-button"
                disabled={
                  busy ||
                  !text.trim() ||
                  (isPaper && usePaper && (!paperSaved || !paperRef.trim())) ||
                  (!first && stage.audioRequired && !audioDone)
                }
                onClick={() => record(first ? 'retry' : 'first')}
              >
                {first ? 'Bewaar latere reactie' : 'Bewaar eerste reactie'}
              </button>
            </>
          )}
          {first && (
            <>
              <h3>Waarnemingen apart beoordelen</h3>
              {task.kind === 'word' && (
                <p>
                  Tekstvergelijking:{' '}
                  {normalizeWord(first.text ?? '') ===
                  normalizeWord(stage.model)
                    ? 'de ingevoerde letters komen overeen'
                    : 'de ingevoerde letters verschillen'}
                  . {first.responseMedium === 'digital' ? 'Getypt op het scherm; handschrift en schrijfmotoriek zijn niet beoordeelbaar.' : 'Beoordeel leesbaarheid en het echte papier zelf.'}
                </p>
              )}
              {task.kind === 'recall' && (
                <p>
                  Bronvolgorde:{' '}
                  {first.tokens?.every((n, i) => n === i)
                    ? 'komt overeen'
                    : 'wijkt af'}
                  . Dit zegt niet dat een andere zin ongrammaticaal is.
                </p>
              )}
              {stage.criteria.map((c) => (
                <div className="ac-docent-observation" key={c}>
                  <label>
                    {c}
                    <select
                      aria-label={c}
                      value={observations[c]?.value ?? ''}
                      onChange={(e) =>
                        setObservations({
                          ...observations,
                          [c]: {
                            value: e.target.value,
                            evidence: observations[c]?.evidence ?? '',
                          },
                        })
                      }
                    >
                      <option value="">Kies wat is waargenomen</option>
                      {[
                        'zichtbaar',
                        'deels',
                        'nog niet',
                        'niet beoordeelbaar',
                      ].map((v) => (
                        <option key={v}>{v}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Concrete waarneming / reden
                    <textarea
                      aria-label="Concrete waarneming / reden"
                      value={observations[c]?.evidence ?? ''}
                      onChange={(e) =>
                        setObservations({
                          ...observations,
                          [c]: {
                            value: observations[c]?.value ?? '',
                            evidence: e.target.value,
                          },
                        })
                      }
                    />
                  </label>
                </div>
              ))}
              <label>
                Vervolg en volgende echte bijeenkomst
                <textarea
                  value={nextMeeting}
                  onChange={(e) => setNextMeeting(e.target.value)}
                />
              </label>
              <button
                className="primary-button"
                disabled={
                  busy ||
                  !nextMeeting.trim() ||
                  stage.criteria.some(
                    (c) =>
                      !observations[c]?.value ||
                      !observations[c]?.evidence.trim(),
                  )
                }
                onClick={() => {
                  if (
                    event({
                      type: 'review',
                      stage: at,
                      observations,
                      nextMeeting,
                    })
                  )
                    setTeacher(false);
                }}
              >
                Bewaar beoordeling
              </button>
              {reviewed(session, at) && (
                <p>
                  Een eerdere beoordeling is bewaard. Een nieuwe beoordeling
                  wordt toegevoegd; de eerdere blijft behouden.
                </p>
              )}
            </>
          )}
          <p>
            {assistance(session, at).replayCount} herhalingen · hulp:{' '}
            {assistance(session, at).helpEverUsed
              ? 'geregistreerd'
              : 'geen app-hulp geregistreerd; zie voorbereiding en docentnotities'}
          </p>
        </div>
      ) : (
        <div className="ac-docent-learner">
          <h2
            ref={heading}
            tabIndex={-1}
            className={task.kind === 'grammar' ? 'sr-only' : undefined}
          >
            {task.kind === 'grammar' ? 'Zinkaart' : stage.prompt}
          </h2>
          <ExerciseAudioSlot />
          {stage.display && !model && (
            <div {...textView} className="ac-docent-card">
              {stage.display.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
          <div className="ac-docent-listen">
            {stage.audio
              .filter(
                (_, i) =>
                  stage.audioRequired &&
                  (i === 0 ||
                    events.some(
                      (e) => e.type === 'audio' && e.src === stage.audio[i - 1],
                    )),
              )
              .map((src, i) => (
                <ExerciseListen key={src} inline={i > 0} disabled={busy}
                  label={stage.audio.length > 1 ? `Luister ${i + 1}` : 'Luister'} onClick={() => listen(src)} />
              ))}
          </div>
          {audioError && <p role="alert">{audioError}</p>}
          {isPaper && !model && (!first || retrying) && <div className="ac-docent-digital">
            {original && <div><h3>Jouw oorspronkelijke zin</h3><p className="ac-docent-response">{firstResponse(original, 0)?.text}</p></div>}
            {first && <div><h3>Jouw eerste antwoord</h3><p className="ac-docent-response">{first.text}</p></div>}
            <label>{first ? 'Jouw verbeterde antwoord' : 'Jouw antwoord'}<textarea autoComplete="off" spellCheck={false} value={text} onChange={e => changeText(e.target.value)} /></label>
            {draftError && <p role="alert">Bewaren van je klad lukt niet op dit apparaat. Houd dit scherm open.</p>}
            <button className="primary-button" disabled={busy || !text.trim() || (!first && stage.audioRequired && !audioDone)} onClick={() => {
              if (event({ type: first ? 'retry' : 'first', stage: at, text, responseMedium: 'digital' })) { changeText(''); setRetrying(false); }
            }}>{first ? 'Bewaar verbeterd antwoord' : 'Bewaar antwoord'}</button>
          </div>}

          {task.kind === 'recall' && audioDone && !model && (
            <>
              <div className="ac-docent-answer" aria-label="Jouw zin">
                {tokens.map((id, i) => (
                  <button
                    key={id}
                    className="secondary-button"
                    disabled={!!first && !retrying}
                    aria-label={`${task.tokens[id]}, plaats ${i + 1}, weghalen`}
                    onClick={() => setOrder(order.filter((n) => n !== id))}
                  >
                    {task.tokens[id]}
                    <Undo2 size={16} />
                  </button>
                ))}
              </div>
              <div className="ac-docent-tiles" aria-label="Woorden">
                {task.order
                  .filter((id) => !tokens.includes(id))
                  .map((id) => (
                    <button
                      className="secondary-button"
                      key={id}
                      disabled={busy || (!!first && !retrying)}
                      onClick={() => setOrder([...order, id])}
                    >
                      {task.tokens[id]}
                    </button>
                  ))}
              </div>
              {(!first || retrying) && (
                <button
                  className="primary-button"
                  disabled={order.length !== task.tokens.length || busy}
                  onClick={() => {
                    if (
                      event({
                        type: first ? 'retry' : 'first',
                        stage: at,
                        text: order.map((id) => task.tokens[id]).join(' '),
                        tokens: order,
                      })
                    )
                      setRetrying(false);
                  }}
                >
                  Bewaar mijn zin
                </button>
              )}
              {first && !retrying && (
                <button
                  className="secondary-button"
                  onClick={() => {
                    setOrder([]);
                    setRetrying(true);
                  }}
                >
                  Nog eens oefenen
                </button>
              )}
            </>
          )}
          {isPaper && first && !model && !retrying && <details className="ac-docent-digital"><summary>Jouw antwoord bekijken of verbeteren</summary><p className="ac-docent-response">{[...events].reverse().find(e => e.type === 'first' || e.type === 'retry')?.text}</p><button className="secondary-button" onClick={() => { changeText([...events].reverse().find(e => e.type === 'first' || e.type === 'retry')?.text ?? ''); setRetrying(true); }}>Verbeter mijn antwoord</button></details>}
          {first && (
            <output className="ac-docent-saved">Je antwoord is bewaard.</output>
          )}
          {first && (
            <div className="ac-docent-model">
              <button
                className="secondary-button"
                disabled={
                  busy || (task.kind === 'correct' && !reviewed(session, at))
                }
                onClick={() => {
                  if (model) setModel(false);
                  else if (
                    event({
                      type: 'model',
                      stage: at,
                      text: 'Geschreven voorbeeld na eerste reactie',
                    })
                  )
                    setModel(true);
                }}
              >
                <Eye />
                {model ? 'Terug naar opdracht' : 'Voorbeeld'}
              </button>
              {(
                task.modelAudio ?? (!stage.audioRequired ? stage.audio : [])
              ).map((src, i) => (
                <button
                  key={src}
                  className="secondary-button"
                  disabled={busy}
                  onClick={() => listen(src, true)}
                >
                  <Volume2 />
                  Voorbeeld horen
                  {(task.modelAudio?.length ?? 0) > 1 ? ` ${i + 1}` : ''}
                </button>
              ))}
              {model && (
                <div {...textView} className="ac-docent-card" aria-label="Voorbeeld">
                  <p>{stage.model}</p>
                </div>
              )}
            </div>
          )}
          {reviewed(session, at) &&
            (at < task.stages.length - 1 ? (
              <button className="primary-button" onClick={next}>
                Verder
                <ArrowRight />
              </button>
            ) : (
              <output>
                {completed
                  ? 'Deze oefenbeurt is besproken met je docent.'
                  : 'Bespreek de overige stappen met je docent.'}
              </output>
            ))}
        </div>
      )}
    </section>
  );
}
