"use client";

import {
  useEffect,
  useId,
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
  PencilLine,
} from "lucide-react";
import Image from "next/image";
import { PackageExerciseBrowser } from "./package-exercise-browser";
import { playMedia, stopMedia } from "@/lib/media-player";
import { isWithdrawnAudio } from "@/lib/audio-policy";
import {
  classroomContent,
  classroomRoutes,
  routeIds,
  roundLabels,
  phasesForRoute,
  prerequisitesForRoute,
  type ClassroomRoute,
  classroomHash,
  freshClassroom,
  matExercises,
  matPack,
  matUnits,
  matWord,
  parseSoundRegistry,
  placeTile,
  readClassroom,
  saveClassroom,
  tools,
  variants,
  type BoardTool,
  type ClassroomState,
  type Variant,
} from "@/lib/teacher-classroom";
import {
  ClassroomBrand,
  TeacherRouteStage,
  RouteWorksheet,
  RouteCards,
} from "./teacher-route-stage";
import "./teacher-classroom.css";

type ClipStatus = "loading" | "ready" | "missing";
type Point = [number, number];
type Stroke = Point[];

function useClassroomAudio() {
  const [sources, setSources] = useState<Record<string, string>>({
    word: matWord.audio ?? "",
  });
  const [status, setStatus] = useState<Record<string, ClipStatus>>({});
  const [revision, setRevision] = useState(0);
  const [playing, setPlaying] = useState("");
  const run = useRef(0);
  useEffect(() => {
    const controller = new AbortController();
    fetch("/content/klink-docent-audio.json", {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((r) => {
        if (!r.ok) throw Error();
        return r.json();
      })
      .then((value) =>
        setSources({ word: matWord.audio ?? "", ...parseSoundRegistry(value) }),
      )
      .catch(() => {
        if (!controller.signal.aborted)
          setSources({ word: matWord.audio ?? "" });
      });
    return () => controller.abort();
  }, [revision]);
  useEffect(() => {
    const disposers = ["word", ...matUnits].map((id) => {
      const source = sources[id];
      if (!source || isWithdrawnAudio(source)) {
        setStatus((s) => ({ ...s, [id]: "missing" }));
        return () => {};
      }
      const audio = new Audio();
      setStatus((s) => ({ ...s, [id]: "loading" }));
      const finish = (value: ClipStatus) => {
        clearTimeout(timer);
        setStatus((s) => ({ ...s, [id]: value }));
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
    return () => disposers.forEach((dispose) => dispose());
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
        setStatus((s) => ({ ...s, [id]: "missing" }));
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
}: {
  audio: ReturnType<typeof useClassroomAudio>;
}) {
  const prefix = useId();
  const [pointed, setPointed] = useState("");
  return (
    <div className="kpd-sounds">
      {matUnits.map((id) => {
        const name = id === "a" ? "korte a" : id;
        const status = audio.status[id] ?? "loading";
        return (
          <div key={id} className="kpd-sound">
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
              aria-describedby={`${prefix}-${id}`}
              aria-pressed={audio.playing === id}
              onClick={() => void audio.listen(id)}
            >
              <Volume2 aria-hidden="true" />
              {status === "missing" && (
                <X className="kpd-missing" aria-hidden="true" />
              )}
            </button>
            <output id={`${prefix}-${id}`} className="sr-only">
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

function Worksheet({ variant }: { variant: Variant }) {
  return (
    <article className="kpd-worksheet kpd-print-page" aria-label="Werkblad">
      <header>
        <Image src="/klink-wordmark.svg" alt="Klink" width={125} height={41} />
        <h2>DE MAT</h2>
      </header>
      <Image
        width={800}
        height={800}
        className="kpd-paper-image"
        src={matWord.image!}
        alt="Een mat bij een deur"
      />
      {variant !== "extend" && (
        <div className="kpd-cut-letters">
          {(variant === "support"
            ? matUnits
            : [matUnits[2], matUnits[0], matUnits[1]]
          ).map((unit) => (
            <span key={unit}>{unit}</span>
          ))}
        </div>
      )}
      {variant === "support" && (
        <div
          className="kpd-trace-letters"
          aria-label="Letters om over te trekken"
        >
          {matUnits.map((unit) => (
            <span key={unit}>{unit}</span>
          ))}
        </div>
      )}
      {variant !== "extend" && (
        <div className="kpd-paper-slots" aria-label="Drie lege lettervakken">
          {matUnits.map((unit) => (
            <span key={unit}>&nbsp;</span>
          ))}
        </div>
      )}
      <div className="kpd-cover-strip">
        <span className="kpd-paper-word">{matWord.word}</span>
      </div>
      <div className="kpd-direction" aria-label="Werk van links naar rechts">
        <ArrowRight aria-hidden="true" />
      </div>
      {variant === "support" ? (
        <div className="kpd-write-line" />
      ) : (
        <>
          <div className="kpd-paper-lines">
            {matUnits.map((unit) => (
              <span key={unit} />
            ))}
          </div>
          <div className="kpd-draw-space" aria-label="Ruimte om te tekenen" />
        </>
      )}
    </article>
  );
}

function LetterCards() {
  return (
    <article
      className="kpd-worksheet kpd-print-page"
      aria-label="Letterkaarten"
    >
      <header>
        <Image src="/klink-wordmark.svg" alt="Klink" width={125} height={41} />
        <h2>DE MAT</h2>
      </header>
      <div className="kpd-large-cards">
        {matUnits.map((unit) => (
          <div key={unit}>{unit}</div>
        ))}
      </div>
      <div className="kpd-large-cards">
        {matUnits.map((unit) => (
          <div key={unit}>&nbsp;</div>
        ))}
      </div>
      <ArrowRight aria-label="Van links naar rechts" />
    </article>
  );
}

function ObservationSheet({ route }: { route: ClassroomRoute }) {
  const rows =
    route !== "a"
      ? phasesForRoute(route)
          .filter((_, i) => [0, 3, 4, 5, 6, 7].includes(i))
          .map((p) => [
            p.title + " — " + p.observe,
            "Zelfstandig / met aanwijzing / met model / nog niet waargenomen",
          ])
      : [
          [
            "Betekenis mat",
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
            "Letters m-a-t leggen",
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
      <h3>Observatie mat · {classroomRoutes[route].label}</h3>
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

export function TeacherClassroom({ onExit }: { onExit: () => void }) {
  const [state, setState] = useState<ClassroomState>(() => readClassroom());
  const [screen, setScreen] = useState<"entry" | "lesson">(() =>
    readClassroom().active ? "lesson" : "entry",
  );
  const roundStates = useRef<Partial<Record<ClassroomRoute, ClassroomState>>>(
    {},
  );
  const [pause, setPause] = useState(false),
    [feedback, setFeedback] = useState("");
  const [tool, setTool] = useState<BoardTool | null>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]),
    [boardText, setBoardText] = useState("");
  const [toolWord, setToolWord] = useState(false),
    [toolImage, setToolImage] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [saySelf, setSaySelf] = useState(false);
  const [readCheck, setReadCheck] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [largePhoto, setLargePhoto] = useState(false);
  const [finished, setFinished] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null),
    opener = useRef<HTMLElement | null>(null);
  const dragged = useRef(false);
  const audio = useClassroomAudio();
  const phases = phasesForRoute(state.route);
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
    audio.stop();
    roundStates.current[state.route] = state;
    const next =
      roundStates.current[route] ?? freshClassroom(state.variant, route);
    commit({ ...next, active: true, phase: phase ?? next.phase });
    setFeedback("");
    setSaySelf(false);
    setReadCheck(false);
    setFinished(false);
  }
  function chooseVariant() {
    const next =
      variants[
        (variants.findIndex((v) => v.id === state.variant) + 1) %
          variants.length
      ].id;
    update({
      variant: next,
      shown: state.shown.map((value, i) =>
        state.route !== "a" && i === state.phase && [1, 3, 5].includes(i)
          ? next === "support"
          : value,
      ),
    });
    setFeedback("");
  }
  function closeTool() {
    audio.stop();
    dialog.current?.close();
    setTool(null);
    opener.current?.focus();
  }
  function start() {
    roundStates.current = {};
    setFeedback("");
    setFinished(false);
    setReadCheck(false);
    setSaySelf(false);
    const next = { ...freshClassroom(), active: true };
    setStrokes([]);
    setBoardText("");
    setToolWord(false);
    setToolImage(false);
    setLargePhoto(false);
    commit(next);
    setScreen("lesson");
    window.scrollTo({ top: 0 });
    window.history.replaceState(null, "", classroomHash);
  }
  function leave() {
    audio.stop();
    const next = { ...state, active: false };
    commit(next);
    setPause(false);
    setScreen("entry");
  }
  function reset() {
    audio.stop();
    update({
      tiles: freshClassroom(state.variant, state.route).tiles,
      shown: state.shown.map((value, i) => (i === state.phase ? false : value)),
    });
    setFeedback("");
  }
  const photo = photoError ? (
    <output>De foto kan niet laden. Gebruik een echte mat.</output>
  ) : (
    <Image
      width={800}
      height={800}
      className={`kpd-photo${largePhoto ? " kpd-photo-large" : ""}`}
      onError={() => setPhotoError(true)}
      src={matWord.image!}
      alt="Een mat bij een deur"
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
      <main className="kpd kpd-gate">
        <h1>
          <ClassroomBrand />
        </h1>
        <h2>mat</h2>
        <button className="primary-button" onClick={start}>
          <Play />
          Les openen
        </button>
        <button className="secondary-button" onClick={onExit}>
          Sluiten
        </button>
      </main>
    );

  return (
    <main className="kpd kpd-live" data-classroom="active">
      <header className="kpd-top">
        <h1>
          <ClassroomBrand />
        </h1>
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
        <div className="kpd-actions">
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
          <button className="secondary-button" onClick={leave}>
            Les sluiten
          </button>
        </div>
      </header>
      <div className="kpd-session">
        <div className="kpd-board" hidden={pause}>
          <nav className="kpd-phases" aria-label="Lesfasen">
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
          <section className="kpd-stage" aria-label={phase.title}>
            <h2>
              {state.route === "a" && state.phase === 1 && saySelf
                ? "Wat is dit?"
                : phase.prompt}
            </h2>
            {state.route !== "a" && (
              <TeacherRouteStage
                key={state.route}
                state={state}
                update={update}
                reveal={reveal}
                onPractice={() => update({ regular: !state.regular })}
              />
            )}
            {state.route === "a" && [0, 1].includes(state.phase) && (
              <div className="kpd-picture-lesson">
                <div className="kpd-picture-column">
                  <div className="kpd-picture-space">
                    {state.image && photo}
                  </div>
                  <div className="kpd-actions">
                    <button
                      className="secondary-button"
                      onClick={() => update({ image: !state.image })}
                    >
                      {state.image ? <EyeOff /> : <Eye />}
                      {state.image ? "Beeld verbergen" : "Beeld tonen"}
                    </button>
                    {state.image && (
                      <button
                        className="secondary-button"
                        onClick={() => setLargePhoto(!largePhoto)}
                      >
                        {largePhoto ? "Foto kleiner" : "Foto groter"}
                      </button>
                    )}
                  </div>
                </div>
                <div className="kpd-word-column">
                  <div className="kpd-word-space">
                    {shown && (
                      <>
                        <p>de mat</p>
                        <p className="kpd-big-word">{matWord.word}</p>
                      </>
                    )}
                  </div>
                  <div className="kpd-actions">
                    {state.phase === 1 && wordAudio}
                    <button className="secondary-button" onClick={reveal}>
                      {shown ? "Woord verbergen" : "Toon woord"}
                    </button>
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
                <SoundButtons audio={audio} />
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
                {shown && <p className="kpd-big-word">{matWord.word}</p>}
              </>
            )}
            {state.route === "a" && state.phase === 3 && (
              <>
                {shown && <p className="kpd-big-word">{matWord.word}</p>}
                <div className="kpd-slots" aria-label="Het gelegde woord">
                  {matUnits.map((unit, i) => (
                    <button
                      key={unit}
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
                  {[...matUnits].reverse().map((unit) => (
                    <button
                      type="button"
                      className="kpd-letter secondary-button"
                      key={unit}
                      aria-label={`Leg ${unit}`}
                      disabled={state.tiles.includes(unit)}
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
                            ),
                          });
                          setFeedback("");
                        }
                      }}
                      onClick={(event) => {
                        const dropped = dragged.current;
                        dragged.current = false;
                        if (dropped && event.detail !== 0) return;
                        update({ tiles: placeTile(state.tiles, unit) });
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
                          ? "Ja, dit is mat."
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
                      <p className="kpd-big-word">{matWord.word}</p>
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
                  {state.variant === "extend"
                    ? "Waar ligt nog een mat? Vertel of laat zien."
                    : state.variant === "support"
                      ? "Wijs de mat aan. Zeg het woord."
                      : "Zeg het woord. De ander wijst aan. Wissel."}
                </p>
              </>
            )}
            {state.route === "a" && state.phase === 6 && (
              <>
                <PencilLine className="kpd-paper-icon" aria-hidden="true" />
                <p>Nu zelfstandig op papier.</p>
                <p>Klaar? Kijk nog eens naar jouw woord.</p>
                <button className="secondary-button" onClick={reveal}>
                  {shown ? "Voorbeeld verbergen" : "Voorbeeld tonen"}
                </button>
                {shown && <p className="kpd-big-word">{matWord.word}</p>}
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
                title="Oefen met mat"
                description="Kijk, luister en leg het woord."
              />
            )}
          </div>
          <nav className="kpd-tools" aria-label="Hulpmiddelen">
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
          <footer className="kpd-footer">
            <button
              className="secondary-button"
              disabled={state.phase === 0 && state.route === "a"}
              onClick={() => go(state.phase - 1)}
            >
              <ArrowLeft />
              Vorige
            </button>
            <button className="secondary-button" onClick={chooseVariant}>
              Andere hulp
            </button>
            <button
              className="primary-button"
              onClick={() =>
                state.phase === phases.length - 1 && state.route === "c"
                  ? leave()
                  : go(state.phase + 1)
              }
            >
              {state.phase < phases.length - 1
                ? "Volgende"
                : state.route === "a"
                  ? "Verder met zin"
                  : state.route === "b"
                    ? "Verder met bericht"
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
            <SoundButtons audio={audio} />
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
                <p className="kpd-big-word">{matWord.word}</p>
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
            {tool === "Leesplank" && <SoundButtons audio={audio} />}
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

export function TeacherMaterials({ onExit }: { onExit: () => void }) {
  const [state, setState] = useState(() => freshClassroom());
  const [preparation, setPreparation] = useState("");
  const [printKind, setPrintKind] = useState("worksheet");
  const audio = useClassroomAudio();
  const route = classroomRoutes[state.route];
  const phases = phasesForRoute(state.route);
  const commit = setState;
  function update(change: Partial<ClassroomState>) {
    setState({ ...state, ...change });
  }
  function printMaterial() {
    const previous = document.title;
    document.title =
      printKind === "observation" ? "Klink docentobservatie" : "DE MAT";
    window.addEventListener(
      "afterprint",
      () => {
        document.title = previous;
      },
      { once: true },
    );
    window.print();
  }
  const wordAudio = (
    <button
      className="primary-button"
      disabled={audio.status.word !== "ready"}
      onClick={() => void audio.listen("word")}
    >
      <Volume2 />
      Luister
    </button>
  );
  return (
    <main className="kpd kpd-prepare">
      <header>
        <h1>
          <ClassroomBrand />
        </h1>
        <button className="secondary-button" onClick={onExit}>
          Sluiten
        </button>
      </header>
      <p>De cursist oefent thuis. De docent brengt het in de klas tot leven.</p>
      <h2>Docentinformatie en werkbladen · {matWord.word}</h2>
      <p>
        Deze informatie staat los van het digibord. Keuzes hier veranderen de
        les niet. Op het bord begint iedereen bij stap 1 en gaat samen verder
        naar stap 2 en 3.
      </p>
      <p>
        <strong>Doel:</strong> {route.goal}
      </p>
      <p>{route.bookGoal}</p>
      <fieldset>
        <legend>Leerroute</legend>
        <div className="kpd-route-options">
          {routeIds.map((id) => (
            <label key={id}>
              <input
                type="radio"
                name="route"
                value={id}
                checked={state.route === id}
                onChange={() => {
                  commit(freshClassroom(state.variant, id));
                  setPrintKind("worksheet");
                }}
              />
              <strong>{classroomRoutes[id].label}</strong>
              <span>{classroomRoutes[id].goal}</span>
              <em>{classroomRoutes[id].example}</em>
            </label>
          ))}
        </div>
      </fieldset>
      <section
        className="kpd-prerequisites"
        aria-label="Voorkennis voor deze route"
      >
        <h3>Voorkennis controleren</h3>
        <ul>
          {route.prerequisites.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        {state.route !== "a" && (
          <>
            <p>
              Introduceer nieuwe woorden samen voordat je verdergaat. De
              aanwezigheid van een woord in Klink bewijst nog geen beheersing
              door de cursist.
            </p>
            <ul>
              {prerequisitesForRoute(state.route).map((item) => (
                <li key={item.token}>
                  <strong>{item.token}</strong> —{" "}
                  {item.wordRef
                    ? `aanwezig in Klink; voorbereide klanken: ${item.units.join(", ")}`
                    : "nieuw contextwoord in deze les; geen eigen Klink-leesstap gevonden. Eerst betekenis en lezen voorbereiden."}
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
      <fieldset>
        <legend>Ondersteuning op het werkblad</legend>
        <div className="kpd-variants">
          {variants.map((variant) => (
            <label key={variant.id}>
              <input
                type="radio"
                name="variant"
                value={variant.id}
                checked={state.variant === variant.id}
                onChange={() => {
                  update({
                    variant: variant.id,
                    tiles: freshClassroom(variant.id, state.route).tiles,
                    shown: freshClassroom(variant.id, state.route).shown,
                  });
                }}
              />
              <strong>{variant.label}</strong>
              <span>{variant.description}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <p>Leg klaar: {route.materials}</p>
      <p>
        De drie bordstappen horen bij Alfa A, Alfa B en Alfa C. Iedereen kan
        meedoen aan de eerdere stappen. Een leesbeurt na een model telt niet als
        zelfstandig leesbewijs.
      </p>
      <details>
        <summary>Lesplan en observatie</summary>
        <p>
          Voorstel: {phases.reduce((sum, p) => sum + p.minutes, 0)} actieve
          minuten, aanpasbaar aan de groep. Pauze en zelfstandige oefentijd
          staan apart. Koppel dit blok aan je werkelijk ingeroosterde
          bijeenkomst en boekdoel.
        </p>
        <label>
          Boekdoel, bijeenkomst, tijd, pauze en vervolg
          <textarea
            value={preparation}
            onChange={(e) => setPreparation(e.target.value)}
            rows={3}
            placeholder="Eigen lesvoorbereiding; alleen bewaard zolang dit scherm open is. Geen namen of leerlingdossier."
          />
        </label>
        <ol>
          {phases.map((p) => (
            <li key={p.title}>
              <strong>
                {p.title} · {p.minutes} min.
              </strong>
              <p>{p.action}</p>
              {p.expected && <p>Verwacht: {p.expected}</p>}
              {p.hint && <p>Hulp: {p.hint}</p>}
              {p.feedback && <p>Feedback: {p.feedback}</p>}
              <p>Observeer: {p.observe}</p>
              <small>Lesbezoekkader: {p.framework}</small>
              {state.route === "a" && (
                <details>
                  <summary>Docentscript, hulp en feedback</summary>
                  {classroomContent.screens
                    .filter((screen) => screen.phase === phases.indexOf(p))
                    .map((screen) => (
                      <p className="kpd-script" key={screen.id}>
                        {screen.text}
                      </p>
                    ))}
                </details>
              )}
            </li>
          ))}
        </ol>
        <p>Vervolg: {route.followUp}</p>
        <p>
          De foto toont de mat bij een deur; niet dat hij nat is. Het bericht is
          een denkbeeldige situatie. Zin- en berichtaudio zijn niet gekoppeld:
          doe een benodigde luisterbeurt zelf voor. Bestaande woordaudio is geen
          zinopname. Menselijke mediareview en klasproef blijven open.
        </p>
      </details>
      <details>
        <summary>Werkbladen printen</summary>
        <p>
          Laat de papierhandeling eerst zien. Gebruik schrijven alleen als
          voorbereid doel; anders legt de cursist de{" "}
          {state.route === "a" ? "losse letters" : "kaartjes"}. Een nabouwtaak
          is geen zelfstandige leestoets.
        </p>
        <label>
          Materiaal
          <select
            value={printKind}
            onChange={(e) => setPrintKind(e.target.value)}
          >
            <option value="worksheet">Cursistenblad</option>
            <option value="letters">
              {state.route === "a"
                ? "Letterkaarten"
                : state.route === "b"
                  ? "Woordkaartjes"
                  : "Berichtkaartjes"}
            </option>
            <option value="observation">Docentobservatie</option>
          </select>
        </label>
        {printKind === "worksheet" ? (
          state.route === "a" ? (
            <Worksheet variant={state.variant} />
          ) : (
            <RouteWorksheet route={state.route} variant={state.variant} />
          )
        ) : printKind === "letters" ? (
          state.route === "a" ? (
            <LetterCards />
          ) : (
            <RouteCards route={state.route} />
          )
        ) : (
          <ObservationSheet route={state.route} />
        )}
        <button className="secondary-button" onClick={printMaterial}>
          <Printer />
          Print materiaal
        </button>
      </details>
      <details>
        <summary>Geluid controleren</summary>
        <p>
          De losse klankopnamen worden later aangeleverd. Een kruisje betekent
          dat deze opname ontbreekt of niet afspeelt. Doe de klank dan zelf
          voor. De bestaande algemene klankopnamen worden niet stilzwijgend als
          vervanging gekoppeld.
        </p>
        <SoundButtons audio={audio} />
        {wordAudio}
        <button className="secondary-button" onClick={audio.retry}>
          Opnamen opnieuw controleren
        </button>
        <p>
          De bestaande woordopname heeft nog een open menselijke
          uitspraakreview.
        </p>
      </details>
    </main>
  );
}
