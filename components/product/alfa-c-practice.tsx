'use client';
import { ExerciseAudioProvider, ExerciseAudioSlot, ExerciseListen } from './exercise-listen';
import { recordPilotRounds } from '@/lib/alfa-c-round-progress';
import { useEffect, useRef, useState, type ReactNode } from 'react';
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
import { AlfaCExplanation, useAlfaCReadAlong } from './alfa-c-readalong';
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
import { dailyBlocks } from '@/lib/alfa-c-dagelijks';
import { AlfaCDailyPractice } from './alfa-c-dagelijks';
import { AlfaCFunctionalPractice } from './alfa-c-functioneel';

export function AlfaCPractice(props: Parameters<typeof AlfaCPracticeContent>[0]) {
  return <ExerciseAudioProvider><AlfaCPracticeContent {...props} /></ExerciseAudioProvider>;
}

function AlfaCPracticeContent({ selected, backHref, header }: { selected: string; backHref: string; header: ReactNode }) {
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
    recordPilotRounds(next);
    setProgress(next);
    try {
      localStorage.setItem(pilotStorageKey, JSON.stringify(next));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
  }
  function choose() { stopMedia(); window.location.hash = backHref; }
  const block = pilotBlocks.find((b) => b.id === selected),
    steps = review ?? block?.steps ?? [],
    at = review ? reviewAt : (progress.positions[selected ?? ''] ?? 0),
    step = steps[at];
  if (!loaded)
    return (
      <div className="learner-page">
        <p>Even laden…</p>
      </div>
    );
  const functionalBlock = functionalBlocks.find(b => b.id === selected);
  const dailyBlock = dailyBlocks.find(b => b.id === selected);
  if (dailyBlock) return <AlfaCDailyPractice key={dailyBlock.id} block={dailyBlock} backHref={backHref} header={header} />;
  if (functionalBlock) return <AlfaCFunctionalPractice key={functionalBlock.id} block={functionalBlock} backHref={backHref} header={header} />;
  return (
    <div className="learner-page cp-chapters cp-chapter-playing pilot-page">
      {header}
      {storageError && (
        <output>
          Bewaren lukt niet op dit apparaat. Je kunt wel verder oefenen.
        </output>
      )}
      {!block ? <p>Deze opdracht is niet beschikbaar.</p> : !step ? (
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
  const readAlong = useAlfaCReadAlong();
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
  async function play(source?: string, guide?: 'instruction' | 'example' | 'help' | 'error' | 'good', explanation = false) {
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
        const ok = await readAlong.play(src, {
          signal: controller.signal,
          waitUntilEnd: true,
          playbackRate: src.startsWith('/package-audio/alfa-c-') ? 1 : undefined,
        }, explanation);
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
            <div className="pilot-tools ac-support-tools">
              <ExerciseListen inline={!model} label={model ? 'Luister naar het voorbeeld' : 'Luister naar de uitleg'}
                onClick={() => void play(step.exercise.prompt?.audio?.src, model ? 'example' : 'instruction', true)} disabled={busy} />
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
          <div className="cp-exercise-stage">
            <ExerciseAudioSlot />
            {audioError && (
              <p role="alert">{alfaCCommonTexts['Geluidsbestand werkt niet'].text}</p>
            )}
            {readAlong.reading && <AlfaCExplanation reading={readAlong.reading} onClose={() => { stopPlayback(); readAlong.clear(); }} />}
            {!readAlong.reading && !model && !help && (
              <div className="pilot-instruction">
                {startText && <p>{startText}</p>}
                {reviewText && <p>{reviewText}</p>}
                <p>{step.spokenInstruction}</p>
              </div>
            )}
            {!readAlong.reading && help && (
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
            <output data-motion-feedback={result}>
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
                model || busy || Boolean(readAlong.reading) || !(participation ? heard : result === 'right')
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
