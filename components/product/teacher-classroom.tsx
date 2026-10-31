"use client";

import {
  useEffect,
  useEffectEvent,
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Pause,
  Play,
  Printer,
  RotateCcw,
  Undo2,
  Volume2,
  X,
  Camera,
  ChevronDown,
  Wrench,
  List,
  PencilLine,
  FileText,
  Presentation,
  Download,
} from "lucide-react";
import Image from "./compact-image";
import { soundById } from "@/lib/sounds";
import { TeacherWorkspaceFrame } from "./teacher-workspace-frame";
import { worksheets, worksheetHash, worksheetSelection } from "@/lib/teacher-worksheets";
import { PackageExerciseBrowser } from "./package-exercise-browser";
import { playMedia, stopMedia } from "@/lib/media-player";
import { isWithdrawnAudio } from "@/lib/audio-policy";
import {
  routeIds,
  roundLabels,
  phasesForRoute,
  classroomSoundId,
  type ClassroomRoute,
  classroomHash,
  freshClassroom,
  classroomLessons,
  getClassroomLesson,
  readLessonClassroom,
  parseSoundRegistry,
  placeTile,
  readClassroom,
  saveClassroom,
  tools,
  type BoardTool,
  type ClassroomState,
} from "@/lib/teacher-classroom";
import {
  ClassroomBrand,
  TeacherRouteStage,
  RouteCards,
} from "./teacher-route-stage";
import "./teacher-classroom.css";

type ClipStatus = "loading" | "ready" | "missing";
type Point = [number, number];
type Stroke = Point[];

function useClassroomAudio(lessonId = "mat") {
  const lesson = getClassroomLesson(lessonId);
  const [registry, setRegistry] = useState<Record<string, string>>({});
  const [clips, setClips] = useState<Record<string, { source: string; status: ClipStatus }>>({});
  const [revision, setRevision] = useState(0);
  const [playing, setPlaying] = useState("");
  const run = useRef(0);
  const sources = useMemo<Record<string, string>>(() => ({ word: lesson.word.audio ?? "", ...Object.fromEntries(lesson.units.map((id, index) => {
    const sound = classroomSoundId(lesson.units, index);
    return [id, ["m", "a", "t"].includes(sound) ? registry[sound] ?? "" : soundById.get(sound)?.audio ?? ""];
  })) }), [lesson, registry]);
  const status = Object.fromEntries(Object.entries(sources).map(([id, source]) => [id, !source || isWithdrawnAudio(source) ? "missing" : clips[id]?.source === source ? clips[id].status : "loading"])) as Record<string, ClipStatus>;
  useEffect(() => {
    const controller = new AbortController();
    fetch("/content/klink-docent-audio.json", { cache: "no-store", signal: controller.signal })
      .then(r => { if (!r.ok) throw Error(); return r.json(); })
      .then(value => { if (!controller.signal.aborted) setRegistry(parseSoundRegistry(value)); })
      .catch(() => { if (!controller.signal.aborted) setRegistry({}); });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    const disposers = Object.entries(sources).map(([id, source]) => {
      if (!source || isWithdrawnAudio(source)) return () => {};
      const audio = new Audio();
      const finish = (status: ClipStatus) => {
        clearTimeout(timer);
        setClips(clips => ({ ...clips, [id]: { source, status } }));
      };
      const timer = setTimeout(() => finish("missing"), 5000);
      audio.onloadedmetadata = () => finish("ready");
      audio.onerror = () => finish("missing");
      audio.preload = "metadata";
      audio.src = source;
      audio.load();
      return () => {
        clearTimeout(timer);
        audio.onloadedmetadata = null;
        audio.onerror = null;
        audio.removeAttribute("src");
        audio.load();
      };
    });
    return () => disposers.forEach(dispose => dispose());
  }, [sources, revision]);
  useEffect(
    () => () => {
      run.current++;
      stopMedia();
    },
    [],
  );
  function stop() {
    run.current++;
    stopMedia();
    setPlaying("");
  }
  async function listen(id: string) {
    if (status[id] !== "ready") return;
    const current = ++run.current;
    setPlaying(id);
    try {
      await playMedia(sources[id], {
        waitUntilEnd: true,
        playbackRate: id === "word" ? undefined : 1,
      });
    } catch {
      if (current === run.current)
        setClips(clips => ({ ...clips, [id]: { source: sources[id], status: "missing" } }));
    } finally {
      if (current === run.current) setPlaying("");
    }
  }
  return {
    status,
    playing,
    listen,
    stop,
    retry: () => setRevision((n) => n + 1),
  };
}

function SoundButtons({
  audio,
  lessonId = "mat",
}: {
  lessonId?: string;
  audio: ReturnType<typeof useClassroomAudio>;
}) {
  const { units: matUnits } = getClassroomLesson(lessonId);
  const prefix = useId();
  const [pointed, setPointed] = useState("");
  return (
    <div className="kpd-sounds">
      {matUnits.map((id, index) => {
        const name = id === "d" && index === matUnits.length - 1 ? "t aan het eind; je schrijft d" : ["a", "e", "i", "o", "u"].includes(id) ? `korte ${id}` : id;
        const status = audio.status[id] ?? "loading";
        return (
          <div key={`${id}-${index}`} className="kpd-sound">
            <button
              className="secondary-button kpd-sound-select"
              aria-label={`Wijs ${id} aan`}
              aria-pressed={pointed === id}
              onClick={() => setPointed(pointed === id ? "" : id)}
            >
              {id}
            </button>
            <button
              className="secondary-button kpd-sound-audio"
              type="button"
              disabled={status !== "ready"}
              aria-label={`Luister naar de klank ${name}`}
              aria-describedby={`${prefix}-${index}`}
              aria-pressed={audio.playing === id}
              onClick={() => void audio.listen(id)}
            >
              <Volume2 aria-hidden="true" />
              {status === "missing" && (
                <X className="kpd-missing" aria-hidden="true" />
              )}
            </button>
            <output id={`${prefix}-${index}`} className="sr-only">
              {status === "missing"
                ? `Opname van ${name} ontbreekt of kan niet afspelen.`
                : status === "loading"
                  ? "Geluid wordt gecontroleerd."
                  : "Geluid beschikbaar."}
            </output>
          </div>
        );
      })}
    </div>
  );
}

function LetterCards({ lessonId = "mat" }: { lessonId?: string }) {
  const { units: matUnits, display } = getClassroomLesson(lessonId);
  return (
    <article
      className="kpd-worksheet kpd-print-page"
      aria-label="Letterkaarten"
    >
      <header>
        <Image src="/klink-wordmark.svg" alt="Klink" width={125} height={41} />
        <h2>{display.toUpperCase()}</h2>
      </header>
      <div className="kpd-large-cards">
        {matUnits.map((unit, index) => (
          <div key={`${unit}-${index}`}>{unit}</div>
        ))}
      </div>
      <div className="kpd-large-cards">
        {matUnits.map((unit, index) => (
          <div key={`${unit}-${index}`}>&nbsp;</div>
        ))}
      </div>
      <ArrowRight aria-label="Van links naar rechts" />
    </article>
  );
}

function ObservationSheet({ route, lessonId = "mat" }: { route: ClassroomRoute; lessonId?: string }) {
  const { word: matWord, units: matUnits, routes: classroomRoutes } = getClassroomLesson(lessonId);
  const rows =
    route !== "a"
      ? phasesForRoute(route, lessonId)
          .filter((_, i) => [0, 3, 4, 5, 6, 7].includes(i))
          .map((p) => [
            p.title + " — " + p.observe,
            "Zelfstandig / met aanwijzing / met model / nog niet waargenomen",
          ])
      : [
          [
            `Betekenis ${matWord.word}`,
            "Zonder directe hulp / met hulp of model / nog niet waargenomen",
          ],
          [
            "Woord nazeggen",
            "Na mondelinge vraag / alleen na voorbeeld / nog niet waargenomen",
          ],
          [
            "Klanken m, korte a, t aanwijzen",
            "Zelfstandig / met hulp / nog niet waargenomen",
          ],
          [
            `Letters ${matUnits.join("-")} leggen`,
            "Zelfstandig / met hulp / nog niet waargenomen",
          ],
          [
            "Mat lezen zonder directe foto of audio",
            "Zelfstandig / met klankhulp / nog niet waargenomen",
          ],
          [
            "Mondeling gebruiken",
            "Eigen voorbeeld / reactie op vraag / nog niet waargenomen",
          ],
          ["Volgende Klink-oefening getoond", "Ja / later tonen"],
        ];
  return (
    <article
      className="kpd-worksheet kpd-print-page kpd-observation"
      aria-label="Docentobservatie"
    >
      <h2>
        <ClassroomBrand />
      </h2>
      <h3>Observatie {matWord.word} · {classroomRoutes[route].label}</h3>
      <p>Datum: _________________ Groep: _________________</p>
      <p>Cursistcode (alleen op papier): _____________________</p>
      <dl>
        {rows.map(([title, response]) => (
          <div key={title}>
            <dt>{title}</dt>
            <dd>{response}</dd>
          </div>
        ))}
      </dl>
      <p>Opmerking:</p>
      <div className="kpd-write-line" />
      <p>Volgende leerhandeling:</p>
      <div className="kpd-write-line" />
      <p>
        Nog niet waargenomen betekent niet: kan het niet. Dit is geen toets of
        niveau-oordeel. Bewaar dit blad buiten de projectie.
      </p>
    </article>
  );
}

function WritingBoard({
  strokes,
  onChange,
  text,
  onText,
}: {
  strokes: Stroke[];
  onChange: (strokes: Stroke[]) => void;
  text: string;
  onText: (text: string) => void;
}) {
  const drawing = useRef(false);
  function point(event: ReactPointerEvent<SVGSVGElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return [
      Math.max(
        0,
        Math.min(1000, ((event.clientX - rect.left) / rect.width) * 1000),
      ),
      Math.max(
        0,
        Math.min(450, ((event.clientY - rect.top) / rect.height) * 450),
      ),
    ];
  }
  return (
    <>
      {/* oxlint-disable-next-line jsx-a11y/prefer-tag-over-role -- Drawing surface is an SVG, with a keyboard text alternative below. */}
      <svg
        className="kpd-writing"
        viewBox="0 0 1000 450"
        aria-label="Schrijfvlak voor vinger of pen; gebruik het tekstveld als alternatief"
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          drawing.current = true;
          event.currentTarget.setPointerCapture(event.pointerId);
          onChange([...strokes, [point(event)]]);
        }}
        onPointerMove={(event) => {
          if (!drawing.current) return;
          onChange([
            ...strokes.slice(0, -1),
            [...(strokes.at(-1) ?? []), point(event)],
          ]);
        }}
        onPointerUp={() => {
          drawing.current = false;
        }}
        onPointerCancel={() => {
          drawing.current = false;
        }}
      >
        {strokes.map((stroke, i) => (
          <polyline
            key={i}
            points={stroke.map((p) => p.join(",")).join(" ")}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <div className="kpd-actions">
        <button
          className="secondary-button"
          onClick={() => onChange(strokes.slice(0, -1))}
          disabled={!strokes.length}
        >
          <Undo2 />
          Laatste lijn weg
        </button>
        <button
          className="secondary-button"
          onClick={() => {
            onChange([]);
            onText("");
          }}
        >
          <RotateCcw />
          Wis bord
        </button>
      </div>
      <label className="kpd-type">
        Of typ op het bord
        <input
          value={text}
          onChange={(e) => onText(e.target.value)}
          maxLength={80}
        />
      </label>
    </>
  );
}

function MirrorBoard() {
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const request = useRef(0);
  const [enabled, setEnabled] = useState(false),
    [message, setMessage] = useState("");
  function stop() {
    request.current++;
    stream.current?.getTracks().forEach((track) => track.stop());
    stream.current = null;
    setEnabled(false);
  }
  useEffect(
    () => () => {
      request.current++;
      stream.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );
  async function start() {
    const current = ++request.current;
    try {
      const result = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      if (request.current !== current) {
        result.getTracks().forEach((track) => track.stop());
        return;
      }
      stream.current = result;
      if (video.current) {
        video.current.srcObject = result;
        await video.current.play();
      }
      setEnabled(true);
      setMessage("");
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop());
      stream.current = null;
      setMessage(
        "Camera niet beschikbaar. Kijk naar het voorbeeld van de docent.",
      );
    }
  }
  return (
    <>
      <p>Kijk hoe je mond beweegt. Doe de klank na.</p>
      <video
        ref={video}
        className="kpd-mirror"
        muted
        playsInline
        hidden={!enabled}
        aria-label="Spiegelbeeld van de camera"
      />
      <p>
        Lees en schrijf van links naar rechts. <ArrowRight aria-hidden="true" />
      </p>
      <button
        className="secondary-button"
        onClick={() => (enabled ? stop() : void start())}
      >
        <Camera />
        {enabled ? "Camera uit" : "Camera aan"}
      </button>
      {message && <output>{message}</output>}
    </>
  );
}

export function TeacherClassroom({
  onActiveChange,
}: {
  onActiveChange?: (active: boolean) => void;
}) {
  const [state, setState] = useState<ClassroomState>(() => readClassroom());
  const [screen, setScreen] = useState<"entry" | "lesson">(() =>
    readClassroom().active ? "lesson" : "entry",
  );
  const roundStates = useRef<Partial<Record<ClassroomRoute, ClassroomState>>>(
    {},
  );
  const [pause, setPause] = useState(false),
    [feedback, setFeedback] = useState("");
  const [panel, setPanel] = useState<"phases" | "tools" | null>(null);
  const [tool, setTool] = useState<BoardTool | null>(null);
  useEffect(() => {
    if (!panel || tool) return;
    function closePanel(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setPanel(null);
      document
        .querySelector<HTMLButtonElement>(
          `[aria-controls="kpd-${panel === "phases" ? "phase" : "tool"}-choices"]`,
        )
        ?.focus();
    }
    document.addEventListener("keydown", closePanel);
    return () => document.removeEventListener("keydown", closePanel);
  }, [panel, tool]);

  const [strokes, setStrokes] = useState<Stroke[]>([]),
    [boardText, setBoardText] = useState("");
  const [toolWord, setToolWord] = useState(false),
    [toolImage, setToolImage] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [saySelf, setSaySelf] = useState(false);
  const [readCheck, setReadCheck] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [finished, setFinished] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const dragged = useRef(false);
  const { word: matWord, units: matUnits, pack: matPack, exercises: matExercises, display, presentation } = getClassroomLesson(state.lessonId);
  const audio = useClassroomAudio(state.lessonId);
  const phases = phasesForRoute(state.route, state.lessonId);
  const phase = phases[state.phase];
  const shown = state.shown[state.phase];
  function commit(next: ClassroomState) {
    setStorageError(!saveClassroom(next));
    setState(next);
  }
  useEffect(() => {
    const element = dialog.current;
    if (tool && element) element.showModal();
    return () => {
      element?.close();
    };
  }, [tool]);
  function update(change: Partial<ClassroomState>) {
    commit({ ...state, ...change });
  }
  function reveal() {
    update({
      shown: state.shown.map((value, i) =>
        i === state.phase ? !value : value,
      ),
    });
  }
  function go(index: number) {
    setPanel(null);
    const round = routeIds.indexOf(state.route);
    if (index >= phases.length && round < routeIds.length - 1) {
      switchRound(routeIds[round + 1], 0);
      return;
    }
    if (index < 0 && round > 0) {
      switchRound(routeIds[round - 1], phases.length - 1);
      return;
    }
    audio.stop();
    setFeedback("");
    update({ phase: index });
  }
  function switchRound(route: ClassroomRoute, phase?: number) {
    setPanel(null);
    audio.stop();
    roundStates.current[state.route] = state;
    const next =
      roundStates.current[route] ?? freshClassroom(state.variant, route, state.lessonId);
    commit({ ...next, ownSentence: state.ownSentence, active: true, phase: phase ?? next.phase });
    setFeedback("");
    setSaySelf(false);
    setReadCheck(false);
    setFinished(false);
  }
  function closeTool() {
    audio.stop();
    dialog.current?.close();
    setTool(null);
    opener.current?.focus();
  }
  function start(lessonId: string) {
    audio.stop();
    setPanel(null);
    setPhotoError(false);
    roundStates.current = {};
    setFeedback("");
    setFinished(false);
    setReadCheck(false);
    setSaySelf(false);
    const next = { ...readLessonClassroom(lessonId), active: true };
    setStrokes([]);
    setBoardText("");
    setToolWord(false);
    setToolImage(false);
    commit(next);
    setScreen("lesson");
    onActiveChange?.(true);
    window.scrollTo({ top: 0 });
    window.history.replaceState(null, "", classroomHash);
  }
  function leave(complete = false) {
    audio.stop();
    const next = { ...(complete ? freshClassroom("basic", "a", state.lessonId) : state), active: false };
    commit(next);
    setPause(false);
    setScreen("entry");
    onActiveChange?.(false);
  }
  const followLessonLink = useEffectEvent((event?: Event) => {
      const [path, query] = window.location.hash.split('?');
      if (path !== classroomHash) return;
      const lessonId = new URLSearchParams(query).get('lesson');
      if (classroomLessons.some(lesson => lesson.id === lessonId)) start(lessonId!);
      else if (event && !readClassroom().active) leave();
  });
  useEffect(() => {
    const opening = window.setTimeout(() => followLessonLink(), 0);
    window.addEventListener('hashchange', followLessonLink);
    return () => { window.clearTimeout(opening); window.removeEventListener('hashchange', followLessonLink); };
  }, []);
  function reset() {
    audio.stop();
    update({
      tiles: freshClassroom(state.variant, state.route, state.lessonId).tiles,
      shown: state.shown.map((value, i) => (i === state.phase ? false : value)),
    });
    setFeedback("");
  }
  const photo = photoError ? (
    <output>De foto kan niet laden. Gebruik het echte voorwerp of doe de betekenis voor.</output>
  ) : (
    <Image
      width={800}
      height={800}
      className="kpd-photo"
      onError={() => setPhotoError(true)}
      src={getClassroomLesson(state.lessonId).boardImage!}
      alt={matWord.word}
    />
  );
  const wordAudio = (
    <button
      className="primary-button"
      disabled={audio.status.word !== "ready"}
      onClick={() => void audio.listen("word")}
      aria-pressed={audio.playing === "word"}
    >
      <Volume2 />
      Luister
      {audio.status.word === "missing" && (
        <X className="kpd-missing" aria-label="Woordopname niet beschikbaar" />
      )}
    </button>
  );

  if (screen === "entry")
    return (
      <TeacherWorkspaceFrame view="plus">
        <div className="kpd-lesson-list">
          {classroomLessons.map(lesson => <button key={lesson.id} className="kpd-lesson-choice" aria-label={`Les openen: ${lesson.word.word}`} onClick={() => start(lesson.id)}>
            <Image src={lesson.boardImage!} alt="" width={120} height={120} />
            <span>{lesson.word.word}</span><ArrowRight aria-hidden="true" />
          </button>)}
        </div>
      </TeacherWorkspaceFrame>
    );

  return (
    <main className="kpd kpd-live" data-classroom="active">
      <header className="kpd-top">
        <h1>
          <ClassroomBrand />
        </h1>
        <div className="kpd-actions">
          <button className="secondary-button" onClick={() => {
            audio.stop();
            setPanel(null);
            window.location.hash = worksheetHash(state.lessonId, state.route, true);
          }}><FileText />Werkblad</button>
          <button
            className="secondary-button"
            onClick={() => {
              audio.stop();
              setPause(!pause);
            }}
          >
            <Pause />
            {pause ? "Hervatten" : "Pauze"}
          </button>
          <button className="secondary-button" onClick={() => leave()}>
            <ArrowLeft />
            Lesoverzicht
          </button>
        </div>
      </header>
      <div className="kpd-session">
        <div className="kpd-board" hidden={pause}>
          <div className="kpd-lesson-bar">
            {" "}
            <nav className="kpd-rounds" aria-label="Stappen">
              {routeIds.map((route) => (
                <button
                  key={route}
                  className="secondary-button"
                  aria-current={state.route === route ? "step" : undefined}
                  onClick={() => switchRound(route)}
                >
                  {roundLabels[route]}
                </button>
              ))}
            </nav>
            <div className="kpd-lesson-options">
              <button
                className="secondary-button"
                aria-expanded={panel === "phases"}
                aria-controls="kpd-phase-choices"
                onClick={() => setPanel(panel === "phases" ? null : "phases")}
              >
                <List />
                Kies onderdeel
                <ChevronDown />
              </button>
              <button
                className="secondary-button"
                aria-expanded={panel === "tools"}
                aria-controls="kpd-tool-choices"
                onClick={() => setPanel(panel === "tools" ? null : "tools")}
              >
                <Wrench />
                Hulpmiddelen
                <ChevronDown />
              </button>
            </div>
          </div>
          <div className="kpd-drawers">
            <nav
              id="kpd-phase-choices"
              className="kpd-phases"
              aria-label="Lesfasen"
              hidden={panel !== "phases"}
            >
              {phases.map((p, i) => (
                <button
                  className="secondary-button"
                  key={p.title}
                  aria-current={state.phase === i ? "step" : undefined}
                  onClick={() => go(i)}
                >
                  <span>{i + 1}</span>
                  {p.title}
                </button>
              ))}
            </nav>
            <nav
              id="kpd-tool-choices"
              className="kpd-tools"
              hidden={panel !== "tools"}
              aria-label="Hulpmiddelen"
            >
              {tools.map((name) => (
                <button
                  className="secondary-button"
                  key={name}
                  onClick={(e) => {
                    audio.stop();
                    opener.current = e.currentTarget;
                    setTool(name);
                  }}
                >
                  {name === "Schrijfbord" && <PencilLine />}
                  {name}
                </button>
              ))}
            </nav>
          </div>
          <section className="kpd-stage" aria-label={phase.title}>
            <h2>
              {state.route === "a" && state.phase === 1 && saySelf
                ? "Wat is dit?"
                : phase.prompt}
            </h2>
            {state.route !== "a" && (
              <TeacherRouteStage
                key={`${state.lessonId}-${state.route}`}
                state={state}
                update={update}
                reveal={reveal}
                onPractice={() => update({ regular: !state.regular })}
              />
            )}
            {state.route === "a" && [0, 1].includes(state.phase) && (
              <div className="kpd-picture-lesson">
                <div className="kpd-picture-column">
                  <div className="kpd-picture-space" style={{ visibility: state.image ? "visible" : "hidden" }} aria-hidden={!state.image}>
                    {photo}
                  </div>
                  <div className="kpd-actions kpd-visibility-controls">
                    <button
                      className="secondary-button"
                      onClick={() => update({ image: !state.image })}
                    >
                      {state.image ? <EyeOff /> : <Eye />}
                      {state.image ? "Beeld verbergen" : "Beeld tonen"}
                    </button>
                    <button className="secondary-button" onClick={reveal}>
                      {shown ? "Woord verbergen" : "Woord tonen"}
                    </button>
                  </div>
                </div>
                <div className="kpd-word-column">
                  <div className="kpd-word-space" style={{ visibility: shown ? "visible" : "hidden" }} aria-hidden={!shown}>
                    <p>{display}</p>
                    <p className="kpd-big-word" data-word={matWord.word}>{matWord.word}</p>
                  </div>
                  <div className="kpd-actions">
                    {state.phase === 1 && wordAudio}
                    {state.phase === 1 && (
                      <button
                        className="secondary-button"
                        onClick={() => {
                          audio.stop();
                          setSaySelf(!saySelf);
                        }}
                      >
                        {saySelf ? "Luister en zeg na" : "Zeg zelf"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {state.route === "a" && state.phase === 2 && (
              <>
                <SoundButtons audio={audio} lessonId={state.lessonId} />
                <div className="kpd-actions">
                  <button className="secondary-button" onClick={reveal}>
                    <Eye />
                    {shown ? "Woord verbergen" : "Voeg samen"}
                  </button>
                  {wordAudio}
                  <button className="secondary-button" onClick={audio.retry}>
                    Geluid opnieuw controleren
                  </button>
                </div>
                {shown && <p className="kpd-big-word" data-word={matWord.word}>{matWord.word}</p>}
              </>
            )}
            {state.route === "a" && state.phase === 3 && (
              <>
                {shown && <p className="kpd-big-word" data-word={matWord.word}>{matWord.word}</p>}
                <div className="kpd-slots" aria-label="Het gelegde woord">
                  {matUnits.map((unit, i) => (
                    <button
                      key={`${unit}-${i}`}
                      data-tile-slot={i}
                      className="kpd-letter secondary-button"
                      disabled={shown}
                      aria-label={
                        shown
                          ? `Voorbeeld ${i + 1}: ${unit}`
                          : `Plaats ${i + 1}${state.tiles[i] ? `: ${state.tiles[i]}, weghalen` : ": leeg"}`
                      }
                      onClick={() => {
                        update({
                          tiles: state.tiles.map((value, index) =>
                            index === i ? "" : value,
                          ),
                        });
                        setFeedback("");
                      }}
                    >
                      {shown ? unit : state.tiles[i] || "\u00a0"}
                    </button>
                  ))}
                </div>
                <div className="kpd-tiles" aria-label="Losse letters">
                  {[...matUnits].reverse().map((unit, index) => (
                    <button
                      type="button"
                      className="kpd-letter secondary-button"
                      key={`${unit}-${index}`}
                      aria-label={`Leg ${unit}`}
                      disabled={state.tiles.filter(letter => letter === unit).length > [...matUnits].reverse().slice(0, index).filter(letter => letter === unit).length}
                      onPointerDown={(e) => {
                        dragged.current = false;
                        e.currentTarget.setPointerCapture(e.pointerId);
                      }}
                      onPointerUp={(e) => {
                        const slot = document
                          .elementFromPoint(e.clientX, e.clientY)
                          ?.closest<HTMLElement>("[data-tile-slot]");
                        if (slot) {
                          dragged.current = true;
                          update({
                            tiles: placeTile(
                              state.tiles,
                              unit,
                              Number(slot.dataset.tileSlot),
                              state.lessonId,
                            ),
                          });
                          setFeedback("");
                        }
                      }}
                      onClick={(event) => {
                        const dropped = dragged.current;
                        dragged.current = false;
                        if (dropped && event.detail !== 0) return;
                        update({ tiles: placeTile(state.tiles, unit, undefined, state.lessonId) });
                        setFeedback("");
                      }}
                    >
                      {unit}
                    </button>
                  ))}
                </div>
                <div className="kpd-actions">
                  <button
                    className="secondary-button"
                    onClick={() =>
                      update({
                        tiles: state.tiles.map((value, index) =>
                          index === state.tiles.findLastIndex(Boolean)
                            ? ""
                            : value,
                        ),
                      })
                    }
                  >
                    <Undo2 />
                    Eén terug
                  </button>
                  <button className="secondary-button" onClick={reveal}>
                    <Eye />
                    {shown ? "Oplossing verbergen" : "Toon oplossing"}
                  </button>
                  <button
                    className="primary-button"
                    onClick={() =>
                      setFeedback(
                        state.tiles.join("") === matWord.word
                          ? `Ja, dit is ${matWord.word}.`
                          : "Kijk naar de eerste klank. Probeer de letters opnieuw.",
                      )
                    }
                  >
                    <Check />
                    Kijk na
                  </button>
                  <button className="secondary-button" onClick={reset}>
                    <RotateCcw />
                    Opnieuw
                  </button>
                </div>
                <output aria-live="polite">{feedback}</output>
              </>
            )}
            {state.route === "a" && state.phase === 4 && (
              <div
                className={
                  readCheck && shown ? "kpd-picture-lesson" : "kpd-read-lesson"
                }
              >
                {readCheck && shown && (
                  <div className="kpd-picture-column">
                    <div className="kpd-picture-space">{photo}</div>
                    <div className="kpd-actions">{wordAudio}</div>
                  </div>
                )}
                <div className="kpd-word-column">
                  <div className="kpd-reading-card">
                    {shown ? (
                      <p className="kpd-big-word" data-word={matWord.word}>{matWord.word}</p>
                    ) : (
                      <span aria-label="Woord afgedekt">—</span>
                    )}
                  </div>
                  <div className="kpd-actions">
                    <button
                      className="secondary-button"
                      onClick={() => {
                        reveal();
                        setReadCheck(false);
                      }}
                    >
                      <Eye />
                      {shown ? "Woord verbergen" : "Woord tonen"}
                    </button>
                    {shown && (
                      <button
                        className="secondary-button"
                        onClick={() => setReadCheck(!readCheck)}
                      >
                        {readCheck
                          ? "Foto verbergen"
                          : "Controleer met de foto"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            {state.route === "a" && state.phase === 5 && (
              <>
                {photo}
                <p>
                  {phase.studentAction || (state.variant === "extend"
                    ? presentation.wordUse
                    : state.variant === "support"
                      ? `Wijs ${display} aan. Zeg het woord.`
                      : "Zeg het woord. De ander wijst aan. Wissel.")}
                </p>
              </>
            )}
            {state.route === "a" && state.phase === 6 && (
              <>
                {!phase.studentAction && <PencilLine className="kpd-paper-icon" aria-hidden="true" />}
                <p>{phase.studentAction || "Nu zelfstandig op papier."}</p>
                {!phase.studentAction && <p>Klaar? Kijk nog eens naar jouw woord.</p>}
                <button className="secondary-button" onClick={reveal}>
                  {shown ? "Voorbeeld verbergen" : "Voorbeeld tonen"}
                </button>
                {shown && <p className="kpd-big-word" data-word={matWord.word}>{matWord.word}</p>}
              </>
            )}
            {state.route === "a" && state.phase === 7 && (
              <>
                <p>
                  {finished ? "Woord geoefend" : "Lees het woord nog een keer."}
                </p>
                <button
                  className="primary-button"
                  onClick={() => update({ regular: !state.regular })}
                >
                  {state.regular ? "Oefening verbergen" : "Open Klink-oefening"}
                  <ArrowRight />
                </button>
                <button
                  className="secondary-button"
                  onClick={() => setFinished(!finished)}
                >
                  {finished ? "Opnieuw oefenen" : "Woord geoefend"}
                </button>
              </>
            )}
          </section>
          <div
            hidden={state.phase !== 7 || !state.regular}
            className="kpd-regular"
          >
            {state.regular && (
              <PackageExerciseBrowser
                pack={matPack}
                exercises={matExercises}
                guided
                initialExerciseId={state.exerciseId}
                onPosition={(exerciseId) => {
                  if (state.exerciseId !== exerciseId) update({ exerciseId });
                }}
                onAudio={async (source, options) => {
                  try {
                    return source ? await playMedia(source, options) : false;
                  } catch {
                    return false;
                  }
                }}
                onComplete={() => update({ regular: false })}
                completeLabel="Terug naar de les"
                title={`Oefen met ${matWord.word}`}
                description="Kijk, luister en leg het woord."
              />
            )}
          </div>

          <footer className="kpd-footer">
            <button
              className="secondary-button"
              disabled={state.phase === 0 && state.route === "a"}
              onClick={() => go(state.phase - 1)}
            >
              <ArrowLeft />
              Vorige
            </button>
            <span className="kpd-position" aria-live="polite">
              {phase.title}
              <small>
                {state.phase + 1} van {phases.length}
              </small>
            </span>
            <button
              className="primary-button"
              onClick={() =>
                state.phase === phases.length - 1 && state.route === "c"
                  ? leave(true)
                  : go(state.phase + 1)
              }
            >
              {state.phase < phases.length - 1
                ? "Volgende"
                : state.route === "a"
                  ? "Verder met zin"
                  : state.route === "b"
                    ? "Verder met tekst"
                    : "Les afronden"}
              <ArrowRight />
            </button>
          </footer>
        </div>
        {pause && (
          <section className="kpd-curtain">
            <h2>Pauze</h2>
            <button className="primary-button" onClick={() => setPause(false)}>
              <Play />
              Verder met de les
            </button>
          </section>
        )}
      </div>
      {storageError && (
        <output>Bewaren lukt niet. Houd deze pagina open.</output>
      )}
      <dialog
        ref={dialog}
        className="kpd-tool-dialog"
        onCancel={(e) => {
          e.preventDefault();
          closeTool();
        }}
      >
        <header>
          <h2>{tool}</h2>
          <button className="secondary-button" onClick={closeTool}>
            <X />
            Terug naar de les
          </button>
        </header>
        {tool === "Klankbord" && (
          <>
            <SoundButtons audio={audio} lessonId={state.lessonId} />
            <button className="secondary-button" onClick={audio.retry}>
              Geluid opnieuw controleren
            </button>
          </>
        )}
        {(tool === "Woordbord" || tool === "Leesplank") && (
          <>
            {toolImage && tool === "Woordbord" && photo}
            <div className="kpd-reading-card">
              {toolWord ? (
                <p className="kpd-big-word" data-word={matWord.word}>{matWord.word}</p>
              ) : (
                <span aria-label="Woord afgedekt">—</span>
              )}
            </div>
            <div className="kpd-actions">
              <button
                className="secondary-button"
                onClick={() => setToolWord(!toolWord)}
              >
                {toolWord ? "Woord verbergen" : "Woord tonen"}
              </button>
              {tool === "Woordbord" && (
                <button
                  className="secondary-button"
                  onClick={() => setToolImage(!toolImage)}
                >
                  {toolImage ? "Beeld verbergen" : "Beeld tonen"}
                </button>
              )}
            </div>
            {tool === "Leesplank" && <SoundButtons audio={audio} lessonId={state.lessonId} />}
          </>
        )}
        {tool === "Spiegelbord" && <MirrorBoard />}
        {tool === "Schrijfbord" && (
          <WritingBoard
            strokes={strokes}
            onChange={setStrokes}
            text={boardText}
            onText={setBoardText}
          />
        )}
      </dialog>
    </main>
  );
}

export function TeacherMaterials() {
  const [hash, setHash] = useState(() => typeof window === "undefined" ? "" : window.location.hash);
  const [extra, setExtra] = useState("letters");
  const [printKind, setPrintKind] = useState("extra");
  const { lesson, round, fromLesson } = worksheetSelection(hash);
  const sheet = lesson?.rounds[round];
  const returning = fromLesson && readClassroom().active;
  useEffect(() => {
    const sync = () => { setHash(window.location.hash); setExtra("letters"); };
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  function navigate(target: string) {
    if (target === "teacher/materials") {
      window.location.hash = `#teacher/materials${returning ? "?from=lesson" : ""}`;
    } else {
      if (returning) saveClassroom({ ...readClassroom(), active: false });
      window.location.hash = target;
    }
  }
  function printExtra(kind: string) {
    setPrintKind(kind);
    requestAnimationFrame(() => window.print());
  }
  return <TeacherWorkspaceFrame view="materials" onNavigate={navigate}>
    <section className="kpd-worksheets" aria-label="Werkbladen per les">
      {!lesson || !sheet ? <>
        <p>Kies een les. Het digibord en de werkbladen horen bij elkaar.</p>
        <div className="kpd-worksheet-grid">
          {worksheets.map(item => <article className="kpd-worksheet-lesson" key={item.id}>
            <h3>{item.title}</h3>
            <div className="kpd-worksheet-options">
              <a className="secondary-button" href={`${classroomHash}?lesson=${item.id}`}><Presentation /><span>{item.title} · Digibordles</span><ArrowRight /></a>
              <a className="secondary-button" href={worksheetHash(item.id, "a", returning)}><FileText /><span>{item.title} · Werkblad</span><ArrowRight /></a>
            </div>
          </article>)}
        </div>
      </> : <>
        <div className="kpd-worksheet-heading">
          <a className="secondary-button" href={`#teacher/materials${returning ? "?from=lesson" : ""}`}><ArrowLeft />Alle werkbladen</a>
          <h3>{lesson.title} · Werkblad</h3>
          <a className="secondary-button" href={returning ? classroomHash : `${classroomHash}?lesson=${lesson.id}`}><Presentation />{returning ? "Terug naar de les" : `${lesson.title} · Digibordles`}</a>
        </div>
        <nav className="kpd-worksheet-rounds" aria-label="Kies een werkblad">
          {routeIds.map(id => <a key={id} className="secondary-button" aria-current={round === id ? "page" : undefined} href={worksheetHash(lesson.id, id, returning)}>
            {lesson.rounds[id].title} · {lesson.rounds[id].level}
          </a>)}
        </nav>
        <div className="kpd-worksheet-actions">
          <p>{sheet.title} · 2 pagina’s · 10 opdrachten</p>
          <a className="primary-button" href={sheet.pdf} target="_blank" rel="noopener"><Printer />Openen en printen<span className="sr-only"> (PDF in nieuw tabblad)</span></a>
          <a className="secondary-button" href={sheet.pdf} download><Download />Downloaden</a>
        </div>
        <p className="kpd-print-tip">Dubbelzijdig printen: omslaan over de lange zijde.</p>
        <div className="kpd-worksheet-previews" aria-label={`${lesson.title} · ${sheet.title} · beide zijden`}>
          {sheet.previews.map((src, i) => <figure key={src}>
            <figcaption>{i === 0 ? "Voorkant" : "Achterkant"}</figcaption>
            <a href={`${sheet.pdf}#page=${i + 1}`} target="_blank" rel="noopener" aria-label={`${i === 0 ? "Voorkant" : "Achterkant"} groter bekijken (PDF in nieuw tabblad)`}>
              <Image src={src} alt={`${lesson.title} · ${sheet.title}, ${i === 0 ? "voorkant" : "achterkant"}`} width="595" height="842" loading="eager" />
            </a>
          </figure>)}
        </div>
        <div className="kpd kpd-worksheet-extras" data-print-kind={printKind}>
          <details key={`${lesson.id}-${round}-answers`} className="kpd-worksheet-answers">
            <summary>Antwoorden voor de docent</summary>
            <article className="kpd-answers-print kpd-print-page" aria-label="Antwoordblad">
              <ClassroomBrand />
              <h3>{lesson.title} · {sheet.title} · Antwoorden</h3>
              <ol>{sheet.answers.map(item => <li key={item.id}>
                <h4>{item.title}</h4>
                {item.oral && <p><strong>Voorlezen:</strong> {item.oral}</p>}
                <p><strong>Antwoord:</strong> {item.answer}</p>
                <p>{item.action}</p>
              </li>)}</ol>
            </article>
            <button className="secondary-button" onClick={() => printExtra("answers")}><Printer />Print antwoorden</button>
            <a className="secondary-button" href={"answerPdf" in sheet && typeof sheet.answerPdf === "string" ? sheet.answerPdf : "/docent-werkbladen/kpd08/docentantwoorden.pdf"} download><Download />{"answerPdf" in sheet ? "Antwoordblad (PDF)" : "Alle docentantwoorden (PDF)"}</a>
            {"planPdf" in lesson && typeof lesson.planPdf === "string" && <a className="secondary-button" href={lesson.planPdf} download><Download />Docentlesplan (PDF)</a>}
          </details>
          <details className="kpd-extra-materials">
            <summary>Extra materiaal</summary>
            <label>Materiaal<select aria-label="Extra materiaal" value={extra} onChange={event => setExtra(event.target.value)}>
              <option value="letters">{round === "a" ? "Letterkaarten" : "Woordkaartjes"}</option>
              <option value="observation">Docentobservatie</option>
            </select></label>
            <div className="kpd-extra-print">
              {extra === "observation" ? <ObservationSheet route={round} lessonId={lesson.id} /> : round === "a" ? <LetterCards lessonId={lesson.id} /> : <RouteCards route={round} lessonId={lesson.id} />}
            </div>
            <button className="secondary-button" onClick={() => printExtra("extra")}><Printer />Print extra materiaal</button>
          </details>
        </div>
      </>}
    </section>
  </TeacherWorkspaceFrame>;
}
