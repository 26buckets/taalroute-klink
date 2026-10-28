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
import { ExerciseSurface } from '@/components/product/package-exercise-browser';
import { isWithdrawnAudio } from '@/lib/audio-policy';
import { playMedia, stopMedia } from '@/components/product/shared';
import {
  pilotBlocks,
  pilotPack,
  pilotStorageKey,
  readPilotProgress,
  practiceAgain,
  alfaCCommonTexts,
  alfaCGuideAudio,
  type PilotProgress,
  type PilotRecord,
  type PilotStep,
} from '@/lib/alfa-c-practice';
import './alfa-c-practice.css';
import { functionalBlocks } from '@/lib/alfa-c-functioneel';
import { AlfaCFunctionalPractice, FunctionalBlockCards } from './alfa-c-functioneel';

export function AlfaCBlockCards() {
  return (
    <div
      className="cp-chapter-grid pilot-block-cards"
      aria-label="Alfa C oefenblokken"
    >
      {pilotBlocks.map((block) => (
        <a
          key={block.id}
          className="cp-activity-button"
          data-pilot-block={block.id}
          href={`#learner/alfa-c/${block.id}`}
        >
          <Eye aria-hidden="true" />
          <span>
            {block.title}
            <small>{block.words.join(' · ')}</small>
          </span>
          <ArrowRight aria-hidden="true" />
        </a>
      ))}
      <FunctionalBlockCards />
    </div>
  );
}
export function AlfaCPractice({ onBack }: { onBack: () => void }) {
  const [selected, setSelected] = useState<string | undefined>(() =>
    typeof window === 'undefined'
      ? undefined
      : window.location.hash.split('/')[2],
  );
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
  const [completionBusy, setCompletionBusy] = useState(false);
  const [completionAudioError, setCompletionAudioError] = useState(false);
  useEffect(() => {
    const restore = () => {
      stopMedia();
      setSelected(window.location.hash.split('/')[2]);
      setReview(undefined);
      setReviewAt(0);
      setCompletionBusy(false);
      setCompletionAudioError(false);
      setVisit((v) => v + 1);
    };
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, []);
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
    window.location.hash = id ? `#learner/alfa-c/${id}` : '#learner/alfa-c';
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
  const functionalBlock = functionalBlocks.find(b => b.id === selected);
  if (functionalBlock) return <AlfaCFunctionalPractice key={functionalBlock.id} block={functionalBlock} />;
  return (
    <div className="learner-page cp-chapters cp-chapter-playing pilot-page">
      <header className="cp-context-header">
        <button
          className="text-back"
          aria-label="Andere oefening"
          onClick={block ? () => choose() : onBack}
        >
          <ArrowLeft />
        </button>
        <h1 ref={heading} tabIndex={-1}>
          {block?.title ?? 'Zelf oefenen'}
        </h1>
        <small className="cp-context-meta">Alfa C</small>
      </header>
      {storageError && (
        <output>
          Bewaren lukt niet op dit apparaat. Je kunt wel verder oefenen.
        </output>
      )}
      {!block ? (
        <section className="cp-panel pilot-library">
          <p>Kies een blok. {alfaCCommonTexts['Later verdergaan'].text}</p>
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
            <FunctionalBlockCards />
          </div>
        </section>
      ) : !step ? (
        <section className="honest-empty pilot-complete">
          <Check />
          <h2>Goed geoefend</h2>
          <p>{block.endText}</p>
          <button
            className="secondary-button"
            disabled={completionBusy}
            onClick={async () => {
              setCompletionBusy(true);
              setCompletionAudioError(false);
              try {
                await playMedia(alfaCGuideAudio(block.endText)!, { waitUntilEnd: true, playbackRate: 1 });
              } catch {
                setCompletionAudioError(true);
              } finally {
                setCompletionBusy(false);
              }
            }}
          >
            <Volume2 />{completionBusy ? 'Luisteren…' : 'Luister'}
          </button>
          {completionAudioError && <p role="alert">{alfaCCommonTexts['Geluidsbestand werkt niet'].text}</p>}
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
        </section>
      ) : (
        <PilotPlayer
          key={`${step.id}:${visit}:${review ? 'review' : 'main'}`}
          step={step}
          index={at}
          total={steps.length}
          startText={!review && at === 0 ? block.startText : undefined}
          reviewText={review ? alfaCCommonTexts[step.exercise.tiles ? 'Lastige bouwopdracht opnieuw oefenen' : 'Lastige keuze opnieuw oefenen'].text : undefined}
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
          onNext={(participationRecord) => {
            stopMedia();
            const records = participationRecord
              ? { ...progress.records, [step.id]: participationRecord }
              : progress.records;
            if (review) {
              if (participationRecord) save({ ...progress, records });
              setReviewAt(at + 1);
            }
            else
              save({
                ...progress,
                records,
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
  startText,
  reviewText,
  firstExample,
  previous,
  onRecord,
  onNext,
}: {
  step: PilotStep;
  index: number;
  total: number;
  startText?: string;
  reviewText?: string;
  firstExample: boolean;
  previous?: () => void;
  onRecord: (r: PilotRecord) => void;
  onNext: (participationRecord?: PilotRecord) => void;
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
  async function play(source?: string, guide?: 'instruction' | 'example' | 'help' | 'error' | 'good') {
    playback.current?.abort();
    stopMedia();
    const controller = new AbortController();
    playback.current = controller;
    setBusy(true);
    setAudioError(false);
    try {
      const guidance = guide === 'instruction' ? [startText, reviewText, step.spokenInstruction]
        : guide === 'example' ? [step.exampleInstruction]
        : guide === 'help' ? [step.help]
        : guide === 'error' ? [step.errorFeedback]
        : guide === 'good' ? [step.goodFeedback] : [];
      const sources = [
        ...guidance.map(alfaCGuideAudio),
        source,
        ...(source && guide && typeof step.exercise.questionAudio === 'string'
          ? [step.exercise.questionAudio]
          : []),
        ...(source && guide === 'example' ? [alfaCGuideAudio('Tik op Nu jij.')] : []),
        ...(source && guide === 'instruction' && participation ? [alfaCGuideAudio(step.afterListening)] : []),
      ].filter((s): s is string => Boolean(s) && !isWithdrawnAudio(s));
      for (const src of sources) {
        const ok = await playMedia(src, {
          signal: controller.signal,
          waitUntilEnd: true,
          playbackRate: src.startsWith('/package-audio/alfa-c-uitleg-20261027/') ? 1 : undefined,
        });
        if (controller.signal.aborted) return false;
        if (ok === false) return false;
        if (src === step.exercise.prompt?.audio?.src) setHeard(true);
      }
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
    void play(undefined, correct ? 'good' : 'error');
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
  function stopPlayback() {
    playback.current?.abort();
    stopMedia();
    setBusy(false);
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
                  void play(step.exercise.prompt?.audio?.src, model ? 'example' : 'instruction')
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
                      setHelp(false);
                      setResult('idle');
                      setModel(!model);
                      if (!model) void play(undefined, 'example');
                      else stopPlayback();
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
                      if (!help) void play(undefined, 'help');
                      else stopPlayback();
                    }}
                  >
                    <HelpCircle />
                    Help
                  </button>
                </>
              )}
            </div>
            {audioError && (
              <p role="alert">{alfaCCommonTexts['Geluidsbestand werkt niet'].text}</p>
            )}
            {!model && (
              <div className="pilot-instruction">
                {startText && <p>{startText}</p>}
                {reviewText && <p>{reviewText}</p>}
                <p>{step.spokenInstruction}</p>
              </div>
            )}
            {help && (
              <div className="pilot-help">
                <p>{step.help}</p>
                <button
                  className="secondary-button"
                  onClick={() => void play(step.exercise.prompt?.audio?.src, 'help')}
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
                <p>{step.exampleInstruction}</p>
                <button
                  className="secondary-button"
                  onClick={() =>
                    void play(step.exercise.prompt?.audio?.src, 'example')
                  }
                  disabled={busy}
                >
                  <Volume2 />
                  Luister
                </button>
                <button
                  className="primary-button"
                  onClick={() => {
                    setModel(false);
                    setHelp(false);
                    setResult('idle');
                    stopPlayback();
                  }}
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
                  {step.goodFeedback}
                </>
              ) : result === 'wrong' ? (
                <>
                  <RefreshCw />
                  {step.errorFeedback}
                </>
              ) : (
                <>
                  <span>{step.stage}</span>
                  <small>
                    {heard ? (participation ? step.afterListening : 'Neem rustig de tijd.') : 'Luister eerst.'}
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
                onNext(participation ? {
                    correct: true,
                    helpUsed: metrics.current.helpUsed,
                    tries: 0,
                    assessment: 'participation',
                  } : undefined);
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
