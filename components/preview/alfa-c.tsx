'use client';
import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Eye,
  HelpCircle,
  RefreshCw,
  Volume2,
} from 'lucide-react';
import { LearnerApp } from '@/components/product/learner-app';
import { RouteSettingsProvider } from '@/components/product/route-settings';
import { ExerciseSurface } from '@/components/product/package-exercise-browser';
import { isWithdrawnAudio } from '@/lib/audio-policy';
import { playMedia, stopMedia } from '@/components/product/shared';
import {
  pilotBlocks,
  pilotPack,
  pilotStorageKey,
  readPilotProgress,
  practiceAgain,
  type PilotProgress,
  type PilotRecord,
  type PilotStep,
} from '@/lib/preview/alfa-c';
import './alfa-c.css';

export function AlfaCPreview() {
  return (
    <RouteSettingsProvider>
      <div className="product-root" data-theme="taalroute">
        <LearnerApp
          onExit={() => {
            window.location.href = '/';
          }}
          onToast={() => {}}
          practicePreview={<Pilot />}
        />
      </div>
    </RouteSettingsProvider>
  );
}
function Pilot() {
  const [selected, setSelected] = useState<string>();
  const [progress, setProgress] = useState<PilotProgress>({
    version: 1,
    positions: {},
    records: {},
  });
  const [loaded, setLoaded] = useState(false),
    [storageError, setStorageError] = useState(false);
  const [review, setReview] = useState<PilotStep[]>(),
    [reviewAt, setReviewAt] = useState(0);
  const [visit, setVisit] = useState(0);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setProgress(readPilotProgress(localStorage.getItem(pilotStorageKey)));
      } catch {
        setStorageError(true);
      }
      setLoaded(true);
    });
    return () => {
      cancelAnimationFrame(frame);
      stopMedia();
    };
  }, []);
  function save(next: PilotProgress) {
    setProgress(next);
    try {
      localStorage.setItem(pilotStorageKey, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }
  function choose(id?: string) {
    stopMedia();
    setSelected(id);
    setReview(undefined);
    setReviewAt(0);
    setVisit((v) => v + 1);
    document.querySelector('.learner-main')?.scrollTo({ top: 0 });
  }
  const block = pilotBlocks.find((b) => b.id === selected),
    steps = review ?? block?.steps ?? [],
    at = review ? reviewAt : (progress.positions[selected ?? ''] ?? 0),
    step = steps[at];
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, [selected]);
  if (!loaded)
    return (
      <div className="learner-page">
        <p>Even laden…</p>
      </div>
    );
  return (
    <div className="learner-page cp-chapters cp-chapter-playing pilot-page">
      <header className="cp-context-header">
        <button
          className="text-back"
          aria-label="Andere oefening"
          onClick={() => choose()}
        >
          <ArrowLeft />
        </button>
        <h1 ref={heading} tabIndex={-1}>
          {block?.title ?? 'Zelf oefenen'}
        </h1>
        <small className="cp-context-meta">Alfa C · lokale proef</small>
      </header>
      {storageError && (
        <output>
          Bewaren lukt niet op dit apparaat. Je kunt wel verder oefenen.
        </output>
      )}
      {!block ? (
        <section className="cp-panel pilot-library">
          <p>Kies een blok. Je kunt tussendoor stoppen en later verdergaan.</p>
          <div className="cp-chapter-grid">
            {pilotBlocks.map((b) => (
              <button
                key={b.id}
                className="cp-activity-button"
                data-pilot-block={b.id}
                onClick={() => choose(b.id)}
              >
                <Eye />
                <span>
                  {b.title}
                  <small>
                    {b.words.join(' · ')} ·{' '}
                    {Math.min(progress.positions[b.id] ?? 0, b.steps.length)} /{' '}
                    {b.steps.length}
                  </small>
                </span>
                <ArrowRight />
              </button>
            ))}
          </div>
          <details className="pilot-editor">
            <summary>Toelichting bij deze proef</summary>
            <p>
              Drie lokale proefblokken met bestaande beelden, woordaudio en
              zinsaudio. De niveau-indeling is een voorstel. De nieuwste online
              lessen en hun voortgang worden niet aangepast.
            </p>
            <p>
              De opdrachten lopen van voordoen naar kiezen, woorddelen leggen,
              zinnen begrijpen, zinnen maken en herhalen. Een goede keuze met
              hulp telt niet als zelfstandig beheersen. De gebruikstaak is nog
              beperkt tot een gehoorde situatie herkennen.
            </p>
            <p>
              Gesproken instructies blijven uitgeschakeld volgens de bestaande
              afspraak. Woord- en zinsaudio zijn beschikbaar. De inhoudelijke
              docentcontrole, menselijke luistercontrole en proef met echte
              cursisten staan nog open.
            </p>
          </details>
        </section>
      ) : !step ? (
        <section className="honest-empty pilot-complete">
          <Check />
          <h2>Goed geoefend</h2>
          <p>Dit blok is klaar.</p>
          {practiceAgain(block, progress.records).length > 0 && (
            <button
              className="primary-button"
              onClick={() => {
                setReview(practiceAgain(block, progress.records));
                setReviewAt(0);
                setVisit((v) => v + 1);
              }}
            >
              <RefreshCw />
              Oefen de lastige opdrachten
            </button>
          )}
          <button
            className="secondary-button"
            onClick={() => {
              save({
                ...progress,
                positions: { ...progress.positions, [block.id]: 0 },
              });
              setReview(undefined);
              setVisit((v) => v + 1);
            }}
          >
            <RefreshCw />
            Het hele blok opnieuw
          </button>
          <button className="secondary-button" onClick={() => choose()}>
            Kies een ander blok
            <ArrowRight />
          </button>
          <p className="pilot-note">Geoefend is geen niveaubeoordeling.</p>
        </section>
      ) : (
        <PilotPlayer
          key={`${step.id}:${visit}:${review ? 'review' : 'main'}`}
          step={step}
          index={at}
          total={steps.length}
          firstExample={
            !review &&
            at > 0 &&
            !steps
              .slice(0, at)
              .some((s) => s.exercise.mode === step.exercise.mode) &&
            step.exercise.assessment !== 'participation'
          }
          previous={
            at > 0
              ? () => {
                  stopMedia();
                  if (review) setReviewAt(at - 1);
                  else
                    save({
                      ...progress,
                      positions: { ...progress.positions, [block.id]: at - 1 },
                    });
                }
              : undefined
          }
          onRecord={(record) =>
            save({
              ...progress,
              records: { ...progress.records, [step.id]: record },
            })
          }
          onNext={() => {
            stopMedia();
            if (review) setReviewAt(at + 1);
            else
              save({
                ...progress,
                positions: { ...progress.positions, [block.id]: at + 1 },
              });
          }}
        />
      )}
    </div>
  );
}
function PilotPlayer({
  step,
  index,
  total,
  firstExample,
  previous,
  onRecord,
  onNext,
}: {
  step: PilotStep;
  index: number;
  total: number;
  firstExample: boolean;
  previous?: () => void;
  onRecord: (r: PilotRecord) => void;
  onNext: () => void;
}) {
  const [model, setModel] = useState(firstExample),
    [help, setHelp] = useState(false),
    [heard, setHeard] = useState(false),
    [busy, setBusy] = useState(false),
    [audioError, setAudioError] = useState(false);
  const [result, setResult] = useState<'idle' | 'wrong' | 'right'>('idle');
  const metrics = useRef({ tries: 0, helpUsed: firstExample }),
    playback = useRef<AbortController | null>(null),
    title = useRef<HTMLHeadingElement>(null);
  const participation = step.exercise.assessment === 'participation';
  useEffect(() => {
    title.current?.focus({ preventScroll: true });
    document.querySelector('.learner-main')?.scrollTo({ top: 0 });
    return () => {
      playback.current?.abort();
      stopMedia();
    };
  }, []);
  async function play(source?: string, explain = false) {
    playback.current?.abort();
    stopMedia();
    const controller = new AbortController();
    playback.current = controller;
    setBusy(true);
    setAudioError(false);
    try {
      const sources = [
        ...(explain ? [step.instructionAudio] : []),
        source,
        ...(explain && typeof step.exercise.questionAudio === 'string'
          ? [step.exercise.questionAudio]
          : []),
      ].filter((s): s is string => Boolean(s) && !isWithdrawnAudio(s));
      for (const src of sources) {
        const ok = await playMedia(src, {
          signal: controller.signal,
          waitUntilEnd: true,
        });
        if (controller.signal.aborted) return false;
        if (ok === false) throw Error('audio');
      }
      if (source === step.exercise.prompt?.audio?.src) setHeard(true);
      return true;
    } catch {
      if (!controller.signal.aborted) setAudioError(true);
      return false;
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }
  function finish(_answer: string, correct: boolean) {
    if (!heard || model || busy || result === 'right') return;
    metrics.current.tries++;
    setResult(correct ? 'right' : 'wrong');
    onRecord({
      correct,
      helpUsed: metrics.current.helpUsed,
      tries: metrics.current.tries,
      assessment: 'answer',
    });
  }
  function markHelp() {
    metrics.current.helpUsed = true;
  }
  return (
    <section
      className="cp-exercise-browser is-mixed-round pilot-player"
      data-pilot-step={step.id}
    >
      <div className="cp-exercise-workspace">
        <div className="cp-exercise-main">
          <header className="cp-exercise-record-head pilot-head">
            <h2 ref={title} tabIndex={-1}>
              {step.instruction}
            </h2>
            <div>
              <button
                className="secondary-button"
                onClick={previous}
                disabled={!previous}
                aria-label="Vorige opdracht"
              >
                <ArrowLeft />
              </button>
              <span>
                {index + 1} / {total}
              </span>
            </div>
          </header>
          <div className="cp-exercise-stage">
            <div className="pilot-tools">
              <button
                className="secondary-button"
                onClick={() =>
                  void play(step.exercise.prompt?.audio?.src, true)
                }
                disabled={busy}
              >
                <Volume2 />
                {busy ? 'Luisteren…' : 'Luister'}
              </button>
              {!participation && (
                <>
                  <button
                    className="secondary-button"
                    aria-expanded={model}
                    disabled={result === 'right'}
                    onClick={() => {
                      markHelp();
                      setModel(!model);
                    }}
                  >
                    <Eye />
                    Voorbeeld
                  </button>
                  <button
                    className="secondary-button"
                    aria-expanded={help}
                    onClick={() => {
                      markHelp();
                      setHelp(!help);
                    }}
                  >
                    <HelpCircle />
                    Help
                  </button>
                </>
              )}
            </div>
            {audioError && (
              <p role="alert">
                Het geluid werkt niet. Tik nog eens op Luister.
              </p>
            )}
            {help && (
              <div className="pilot-help">
                <p>{step.help}</p>
                <button
                  className="secondary-button"
                  onClick={() => void play(step.exercise.prompt?.audio?.src)}
                  disabled={busy}
                >
                  <Volume2 />
                  Luister nog eens
                </button>
              </div>
            )}
            {model ? (
              <section className="cp-task-card pilot-model">
                <p>Kijk eerst.</p>
                <strong>{step.model}</strong>
                <button
                  className="secondary-button"
                  onClick={() =>
                    void play(step.exercise.prompt?.audio?.src, true)
                  }
                  disabled={busy}
                >
                  <Volume2 />
                  Luister
                </button>
                <button
                  className="primary-button"
                  onClick={() => setModel(false)}
                >
                  Nu jij
                  <ArrowRight />
                </button>
              </section>
            ) : (
              <ExerciseSurface
                exercise={step.exercise}
                pack={pilotPack}
                onAudio={(source) => play(source)}
                onFinish={finish}
                onOpenExercise={() => {}}
                guided={false}
                onReset={() => {
                  if (result !== 'right') setResult('idle');
                }}
                canAnswer={heard && !busy && result !== 'right'}
                onHelp={markHelp}
                speakingOptionId=""
                answeredCorrectly={result === 'right'}
              />
            )}
          </div>
          <footer className="pilot-footer">
            <output>
              {result === 'right' ? (
                <>
                  <Check />
                  Goed. Ga verder.
                </>
              ) : result === 'wrong' ? (
                <>
                  <RefreshCw />
                  {step.help}
                </>
              ) : (
                <>
                  <span>{step.stage}</span>
                  <small>
                    {heard ? 'Neem rustig de tijd.' : 'Luister eerst.'}
                  </small>
                </>
              )}
            </output>
            <button
              className="primary-button"
              disabled={
                model || busy || !(participation ? heard : result === 'right')
              }
              onClick={() => {
                if (participation)
                  onRecord({
                    correct: true,
                    helpUsed: metrics.current.helpUsed,
                    tries: 0,
                    assessment: 'participation',
                  });
                onNext();
              }}
            >
              Verder
              <ArrowRight />
            </button>
          </footer>
        </div>
      </div>
    </section>
  );
}
