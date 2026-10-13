'use client';

import { Brand } from '@/components/product/shared';
import {
  contentPackages,
  levelLabels,
  levelOrder,
  type PackageEntry,
  type PackageLevel,
} from '@/lib/package-content';
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  BookOpen,
  Check,
  CheckCircle2,
  Circle,
  CircleHelp,
  ListChecks,
  LoaderCircle,
  Mic2,
  PackageOpen,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

type ContentItem = {
  id: string;
  kind: string;
  title?: string;
  targetText?: string;
  displayText?: string;
  sentenceSegments?: { id: string; text: string }[];
};

type ContentOption = {
  id: string;
  text: string;
  correct?: boolean;
  feedbackId?: string;
  feedback?: { text?: string };
};

type CriteriaFeedback = {
  index: number;
  criterion: string;
  metFeedbackId?: string;
  needsWorkFeedbackId?: string;
};

type ContentExercise = {
  id: string;
  exerciseTypeId:
    | 'TE-01'
    | 'TE-02'
    | 'TE-03'
    | 'WO-02'
    | 'SP-01'
    | 'SC-01'
    | 'SC-02';
  instruction: { targetText: string; targetAudioId?: string };
  help?: { text?: string; audioId?: string };
  options?: ContentOption[];
  tiles?: string[];
  answer?: string | string[];
  criteria?: string[];
  example?: string;
  feedback?: {
    after_marked_done?: { text?: string };
    when_correct?: { text?: string };
    when_incorrect?: { text?: string };
    when_criteria_met?: { text?: string };
    when_criteria_missing?: { text?: string };
    continueFeedbackId?: string;
    afterHelpSuccessFeedbackId?: string;
    permutationFeedback?: { source_indices: number[]; feedbackId: string }[];
    criteriaFeedback?: CriteriaFeedback[];
    allCriteriaMetFeedbackId?: string;
  };
};

type ContentPack = {
  pack: {
    id: string;
    title: string;
    level: PackageLevel;
    objective?: string;
    support?: string;
  };
  items: ContentItem[];
  exerciseInstances: ContentExercise[];
};

type FeedbackRecord = {
  id: string;
  displayText: string;
  correct?: boolean | null;
};

type FeedbackState = {
  tone: 'idle' | 'right' | 'wrong';
  title: string;
  text: string;
};

const activityLabels: Record<ContentExercise['exerciseTypeId'], string> = {
  'TE-01': 'Lezen',
  'TE-02': 'Koppelen',
  'TE-03': 'Volgorde',
  'WO-02': 'Woord herkennen',
  'SP-01': 'Nazeggen',
  'SC-01': 'Schrijven',
  'SC-02': 'Schrijven',
};

const idleFeedback: FeedbackState = {
  tone: 'idle',
  title: 'Neem de tijd',
  text: 'Lees rustig. Gebruik de hulp als je die nodig hebt.',
};

export function PackageLibrary({
  onBack,
  onOpen,
}: {
  onBack: () => void;
  onOpen: (entry: PackageEntry) => void;
}) {
  const [packageId, setPackageId] = useState<'1' | '2'>('1');
  const currentPackage =
    contentPackages.find((item) => item.id === packageId) ?? contentPackages[0];
  const availableLevels = levelOrder.filter((level) =>
    currentPackage.entries.some((entry) => entry.level === level),
  );
  const [level, setLevel] = useState<PackageLevel>(availableLevels[0]);
  const currentLevel = availableLevels.includes(level)
    ? level
    : availableLevels[0];
  const entries = currentPackage.entries.filter(
    (entry) => entry.level === currentLevel,
  );

  return (
    <div className="learner-page package-library-page">
      <button className="text-back" onClick={onBack}>
        <ArrowLeft />
        Terug naar home
      </button>
      <header className="package-library-heading">
        <div>
          <span className="eyebrow">Klink leespakketten</span>
          <h1>Lees, oefen en gebruik de tekst</h1>
          <p>
            De inhoud staat los van de speler. Zo blijft elk pakket herkenbaar
            en kan de vorm rustig meegroeien.
          </p>
        </div>
        <div className="klink-cycle" aria-label="De vijf stappen van Klink">
          {['Kijken', 'Luisteren', 'Inoefenen', 'Nazeggen', 'Koppelen'].map(
            (step, index) => (
              <span key={step}>
                <b>{'KLINK'[index]}</b>
                <small>{step}</small>
              </span>
            ),
          )}
        </div>
      </header>

      <section className="package-switcher" aria-label="Kies een pakket">
        {contentPackages.map((item) => (
          <button
            key={item.id}
            className={item.id === packageId ? 'active' : ''}
            onClick={() => {
              setPackageId(item.id);
              setLevel('ALFA_A');
            }}
          >
            <span className="package-number">
              <PackageOpen />
              {item.id}
            </span>
            <span>
              <strong>{item.title}</strong>
              <small>{item.subtitle}</small>
              <em>{item.summary}</em>
            </span>
            {item.id === packageId ? <CheckCircle2 /> : <ArrowRight />}
          </button>
        ))}
      </section>

      <section className="package-browser">
        <header>
          <div>
            <span className="eyebrow">Niveau</span>
            <h2>{currentPackage.title}</h2>
          </div>
          <span className="prototype-label">Proefomgeving</span>
        </header>
        <div className="package-levels" role="tablist" aria-label="Niveaus">
          {availableLevels.map((item) => (
            <button
              key={item}
              role="tab"
              aria-selected={currentLevel === item}
              className={currentLevel === item ? 'active' : ''}
              onClick={() => setLevel(item)}
            >
              {levelLabels[item]}
              <small>
                {
                  currentPackage.entries.filter((entry) => entry.level === item)
                    .length
                }
              </small>
            </button>
          ))}
        </div>
        <div className="package-text-grid">
          {entries.map((entry, index) => (
            <button
              key={`${entry.packageId}-${entry.id}`}
              onClick={() => onOpen(entry)}
            >
              <span className="text-card-index">
                {String(index + 1).padStart(2, '0')}
              </span>
              <span className="text-card-copy">
                <small>{levelLabels[entry.level]} · 8 activiteiten</small>
                <strong>{entry.title}</strong>
                <em>
                  {entry.pilot
                    ? 'Aparte B1-pilotbank'
                    : 'Lezen, vragen, volgorde, spreken en schrijven'}
                </em>
              </span>
              <ArrowRight />
            </button>
          ))}
        </div>
        {packageId === '2' && currentLevel === 'B1' && (
          <p className="pilot-note">
            <CircleHelp />
            Deze B1-tekst is een aparte pilotbank en hoort niet formeel bij
            Pakket 2.
          </p>
        )}
      </section>
    </div>
  );
}

export function PackagePlayer({
  entry,
  onClose,
  onToast,
}: {
  entry: PackageEntry;
  onClose: () => void;
  onToast: (message: string) => void;
}) {
  const [pack, setPack] = useState<ContentPack | null>(null);
  const [feedbackBank, setFeedbackBank] = useState<FeedbackRecord[]>([]);
  const [loadError, setLoadError] = useState('');
  const [activityIndex, setActivityIndex] = useState(0);
  const [complete, setComplete] = useState(false);
  const [selectedOption, setSelectedOption] = useState('');
  const [sequence, setSequence] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [criteriaChecks, setCriteriaChecks] = useState<boolean[]>([]);
  const [feedback, setFeedback] = useState<FeedbackState>(idleFeedback);
  const [helpShown, setHelpShown] = useState(false);
  const [helpCount, setHelpCount] = useState(0);
  const startedAt = useRef(0);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(entry.path).then(async (response) => {
        if (!response.ok) throw new Error('Pakket kon niet worden geladen.');
        return (await response.json()) as ContentPack;
      }),
      entry.feedbackPath
        ? fetch(entry.feedbackPath).then(async (response) =>
            response.ok ? ((await response.json()) as FeedbackRecord[]) : [],
          )
        : Promise.resolve([] as FeedbackRecord[]),
    ])
      .then(([loadedPack, loadedFeedback]) => {
        if (!active) return;
        setPack(loadedPack);
        setFeedbackBank(loadedFeedback);
        startedAt.current = Date.now();
      })
      .catch((error: unknown) => {
        if (active)
          setLoadError(
            error instanceof Error
              ? error.message
              : 'Pakket kon niet worden geladen.',
          );
      });
    return () => {
      active = false;
    };
  }, [entry]);

  const activity = pack?.exerciseInstances[activityIndex];
  const story = pack?.items.find((item) => item.kind === 'text');
  const feedbackById = useMemo(
    () => new Map(feedbackBank.map((item) => [item.id, item])),
    [feedbackBank],
  );

  function resetActivity(nextActivity?: ContentExercise) {
    setSelectedOption('');
    setSequence([]);
    setDraft('');
    setCriteriaChecks(
      (
        nextActivity?.criteria ??
        nextActivity?.feedback?.criteriaFeedback?.map(
          (item) => item.criterion,
        ) ??
        []
      ).map(() => false),
    );
    setFeedback(idleFeedback);
    setHelpShown(false);
    setHelpCount(0);
    startedAt.current = Date.now();
  }

  function unavailableAudio() {
    onToast(
      'De audioteksten zijn voorbereid, maar de audio is nog niet vrijgegeven.',
    );
  }

  function resolveFeedback(id?: string) {
    return id ? feedbackById.get(id)?.displayText : undefined;
  }

  function saveAttempt(answer: string, isCorrect: boolean) {
    if (!pack || !activity) return;
    void fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        exerciseId: activity.id,
        skillKey: `${pack.pack.id}.${activity.exerciseTypeId.toLowerCase()}`,
        answer,
        isCorrect,
        helpCount,
        responseMs: Date.now() - startedAt.current,
      }),
    }).catch(() => undefined);
  }

  function checkChoice() {
    if (!activity || !selectedOption) return;
    const option = activity.options?.find((item) => item.id === selectedOption);
    const correct = option?.correct ?? selectedOption === activity.answer;
    const text =
      option?.feedback?.text ??
      resolveFeedback(option?.feedbackId) ??
      (correct
        ? 'Goed gelezen. Dit antwoord past bij de tekst.'
        : 'Dit antwoord past niet bij de tekst. Lees nog eens en probeer opnieuw.');
    saveAttempt(option?.text ?? selectedOption, correct);
    setFeedback({
      tone: correct ? 'right' : 'wrong',
      title: correct ? 'Goed gelezen' : 'Kijk nog een keer',
      text,
    });
  }

  function checkSequence() {
    if (!activity || !Array.isArray(activity.answer)) return;
    const correct = activity.answer.every(
      (item, index) => sequence[index] === item,
    );
    let text = correct
      ? activity.feedback?.when_correct?.text
      : activity.feedback?.when_incorrect?.text;
    if (!text && activity.feedback?.permutationFeedback) {
      const indices = sequence.map(
        (item) => activity.answer?.indexOf(item) ?? -1,
      );
      const feedbackId = activity.feedback.permutationFeedback.find((item) =>
        item.source_indices.every(
          (index, position) => indices[position] === index,
        ),
      )?.feedbackId;
      text = resolveFeedback(feedbackId);
    }
    if (correct && helpShown)
      text =
        resolveFeedback(activity.feedback?.afterHelpSuccessFeedbackId) ?? text;
    text ??= correct
      ? 'De zinnen staan in dezelfde volgorde als in de tekst.'
      : 'De volgorde klopt nog niet. Zoek de zinnen terug in de tekst.';
    saveAttempt(sequence.join(' | '), correct);
    setFeedback({
      tone: correct ? 'right' : 'wrong',
      title: correct ? 'Goede volgorde' : 'Probeer opnieuw',
      text,
    });
  }

  function checkCriteria() {
    if (!activity) return;
    const criteria =
      activity.criteria ??
      activity.feedback?.criteriaFeedback?.map((item) => item.criterion) ??
      [];
    const correct = criteria.length > 0 && criteriaChecks.every(Boolean);
    let text = correct
      ? activity.feedback?.when_criteria_met?.text
      : activity.feedback?.when_criteria_missing?.text;
    if (!text && correct)
      text = resolveFeedback(activity.feedback?.allCriteriaMetFeedbackId);
    if (!text && !correct) {
      const firstMissing = activity.feedback?.criteriaFeedback?.find(
        (_, index) => !criteriaChecks[index],
      );
      text = resolveFeedback(firstMissing?.needsWorkFeedbackId);
    }
    text ??= correct
      ? 'Je hebt alle punten gecontroleerd. Je kunt verder.'
      : 'Controleer de punten nog eens. Pas je antwoord aan als dat nodig is.';
    setFeedback({
      tone: correct ? 'right' : 'wrong',
      title: correct ? 'Zelf gecontroleerd' : 'Kijk nog een keer',
      text,
    });
  }

  function markReadingDone() {
    if (!activity) return;
    const text =
      activity.feedback?.after_marked_done?.text ??
      resolveFeedback(activity.feedback?.continueFeedbackId) ??
      'Je bent klaar met de tekst. Nu kun je de vragen maken.';
    setFeedback({ tone: 'right', title: 'Tekst gelezen', text });
  }

  function checkActivity() {
    if (!activity) return;
    if (activity.exerciseTypeId === 'TE-01') return markReadingDone();
    if (
      activity.exerciseTypeId === 'TE-02' ||
      activity.exerciseTypeId === 'WO-02'
    )
      return checkChoice();
    if (activity.exerciseTypeId === 'TE-03') return checkSequence();
    checkCriteria();
  }

  function nextActivity() {
    if (!pack) return;
    if (activityIndex === pack.exerciseInstances.length - 1) {
      setComplete(true);
      return;
    }
    const nextIndex = activityIndex + 1;
    resetActivity(pack.exerciseInstances[nextIndex]);
    setActivityIndex(nextIndex);
  }

  function addSequenceItem(item: string) {
    if (feedback.tone === 'right' || sequence.includes(item)) return;
    setSequence((current) => [...current, item]);
    if (feedback.tone === 'wrong') setFeedback(idleFeedback);
  }

  function removeSequenceItem(item: string) {
    if (feedback.tone === 'right') return;
    setSequence((current) => current.filter((entry) => entry !== item));
    if (feedback.tone === 'wrong') setFeedback(idleFeedback);
  }

  if (loadError) {
    return (
      <div className="package-loading">
        <CircleHelp />
        <h1>Dit pakket kon niet open</h1>
        <p>{loadError}</p>
        <button className="primary-button" onClick={onClose}>
          Terug naar pakketten
        </button>
      </div>
    );
  }

  if (!pack || !activity || !story) {
    return (
      <div className="package-loading">
        <LoaderCircle className="spin" />
        <strong>Pakket laden…</strong>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="package-complete">
        <div>
          <CheckCircle2 />
        </div>
        <span className="eyebrow">8 van 8 activiteiten</span>
        <h1>{pack.pack.title} is doorlopen</h1>
        <p>
          Je hebt gelezen, gekoppeld, geordend, gesproken en geschreven. Dit is
          een oefenresultaat, geen formele niveaubeoordeling.
        </p>
        <div className="package-complete-actions">
          <button
            className="secondary-button"
            onClick={() => {
              resetActivity(pack.exerciseInstances[0]);
              setComplete(false);
              setActivityIndex(0);
            }}
          >
            <RotateCcw />
            Nog een keer
          </button>
          <button className="primary-button" onClick={onClose}>
            Kies een andere tekst
            <ArrowRight />
          </button>
        </div>
      </div>
    );
  }

  const progress = ((activityIndex + 1) / pack.exerciseInstances.length) * 100;
  const criteria =
    activity.criteria ??
    activity.feedback?.criteriaFeedback?.map((item) => item.criterion) ??
    [];
  const isChoice =
    activity.exerciseTypeId === 'TE-02' || activity.exerciseTypeId === 'WO-02';
  const isSequence = activity.exerciseTypeId === 'TE-03';
  const isSpeaking = activity.exerciseTypeId === 'SP-01';
  const isWriting =
    activity.exerciseTypeId === 'SC-01' || activity.exerciseTypeId === 'SC-02';
  const canCheck =
    activity.exerciseTypeId === 'TE-01' ||
    (isChoice && Boolean(selectedOption)) ||
    (isSequence && sequence.length === (activity.tiles?.length ?? 0)) ||
    isSpeaking ||
    (isWriting && draft.trim().length > 0);

  return (
    <div className="package-player">
      <header className="package-player-header">
        <button onClick={onClose} aria-label="Sluit deze tekst">
          <ArrowLeft />
        </button>
        <Brand dark />
        <div className="package-player-title">
          <span>
            {entry.packageId === '1'
              ? 'Pakket 1'
              : entry.pilot
                ? 'Pakket 2 · B1-pilot'
                : 'Pakket 2'}{' '}
            · {levelLabels[pack.pack.level]}
          </span>
          <strong>{pack.pack.title}</strong>
        </div>
        <button onClick={unavailableAudio}>
          <Volume2 />
          <span>Luister</span>
        </button>
      </header>
      <div className="package-player-progress">
        <span style={{ width: `${progress}%` }} />
      </div>

      <main className="package-player-workspace">
        <aside className="package-story-panel">
          <header>
            <BookOpen />
            <span>
              <small>TEKST</small>
              <strong>{story.title ?? pack.pack.title}</strong>
            </span>
          </header>
          <div className="package-story-copy">
            {(story.sentenceSegments?.length
              ? story.sentenceSegments.map((item) => item.text)
              : splitSentences(story.displayText ?? story.targetText ?? '')
            ).map((sentence, index) => (
              <p key={`${index}-${sentence}`}>{sentence}</p>
            ))}
          </div>
          <footer>
            <span>{levelLabels[pack.pack.level]}</span>
            <small>De tekst blijft tijdens de oefeningen zichtbaar.</small>
          </footer>
        </aside>

        <section className="package-activity-panel">
          <header className="package-instruction">
            <button
              onClick={unavailableAudio}
              aria-label="Luister naar de opdracht"
            >
              <AudioLines />
            </button>
            <div>
              <span>
                {activityLabels[activity.exerciseTypeId]} · activiteit{' '}
                {activityIndex + 1} van {pack.exerciseInstances.length}
              </span>
              <h1>{activity.instruction.targetText}</h1>
            </div>
          </header>

          <div className="package-activity-canvas">
            {activity.exerciseTypeId === 'TE-01' && (
              <div className="reading-activity">
                <BookOpen />
                <strong>{story.title ?? pack.pack.title}</strong>
                <p>
                  Lees de tekst links rustig door. Je mag iedere zin opnieuw
                  lezen.
                </p>
                <button className="secondary-button" onClick={unavailableAudio}>
                  <Volume2 />
                  Audio volgt na vrijgave
                </button>
              </div>
            )}

            {isChoice && (
              <div
                className={`package-options ${activity.exerciseTypeId === 'WO-02' ? 'words' : ''}`}
              >
                {activity.options?.map((option) => (
                  <button
                    key={option.id}
                    className={selectedOption === option.id ? 'selected' : ''}
                    disabled={feedback.tone === 'right'}
                    onClick={() => {
                      setSelectedOption(option.id);
                      if (feedback.tone === 'wrong') setFeedback(idleFeedback);
                    }}
                  >
                    <span>
                      {selectedOption === option.id ? (
                        <Check />
                      ) : (
                        option.id.replace(/\D/g, '') || '•'
                      )}
                    </span>
                    <strong>{option.text}</strong>
                  </button>
                ))}
              </div>
            )}

            {isSequence && (
              <div className="sequence-activity">
                <div className="sequence-chosen">
                  <small>Jouw volgorde</small>
                  {sequence.length === 0 && (
                    <p>Tik hieronder op de zin die eerst komt.</p>
                  )}
                  {sequence.map((item, index) => (
                    <button key={item} onClick={() => removeSequenceItem(item)}>
                      <span>{index + 1}</span>
                      {item}
                    </button>
                  ))}
                </div>
                <div className="sequence-source">
                  <small>Nog kiezen</small>
                  {activity.tiles
                    ?.filter((item) => !sequence.includes(item))
                    .map((item) => (
                      <button key={item} onClick={() => addSequenceItem(item)}>
                        {item}
                        <ArrowRight />
                      </button>
                    ))}
                </div>
              </div>
            )}

            {isSpeaking && (
              <div className="criteria-activity speaking">
                <span className="criteria-icon">
                  <Mic2 />
                </span>
                <h2>Zeg je antwoord hardop</h2>
                <p>
                  Opnemen wordt pas aangezet wanneer de audio en opnamefunctie
                  zijn vrijgegeven. Controleer je antwoord nu zelf.
                </p>
                <CriteriaList
                  criteria={criteria}
                  checks={criteriaChecks}
                  setChecks={setCriteriaChecks}
                  disabled={feedback.tone === 'right'}
                />
              </div>
            )}

            {isWriting && (
              <div className="criteria-activity writing">
                <label>
                  Jouw antwoord
                  <textarea
                    value={draft}
                    disabled={feedback.tone === 'right'}
                    onChange={(event) => {
                      setDraft(event.target.value);
                      if (feedback.tone === 'wrong') setFeedback(idleFeedback);
                    }}
                    placeholder="Schrijf hier…"
                  />
                </label>
                <CriteriaList
                  criteria={criteria}
                  checks={criteriaChecks}
                  setChecks={setCriteriaChecks}
                  disabled={feedback.tone === 'right'}
                />
              </div>
            )}

            {helpShown && (
              <aside className="package-help-card">
                <CircleHelp />
                <div>
                  <strong>Hulp</strong>
                  <p>
                    {activity.help?.text ??
                      'Lees de tekst nog eens en kijk wat de opdracht precies vraagt.'}
                  </p>
                  {activity.example && (
                    <p>
                      <b>Voorbeeld:</b> {activity.example}
                    </p>
                  )}
                </div>
              </aside>
            )}
          </div>
        </section>
      </main>

      <footer className={`package-player-footer ${feedback.tone}`}>
        <div className="package-feedback-icon">
          {feedback.tone === 'right' ? (
            <Check />
          ) : feedback.tone === 'wrong' ? (
            <RotateCcw />
          ) : (
            <Circle />
          )}
        </div>
        <div className="package-feedback-copy">
          <strong>{feedback.title}</strong>
          <small>{feedback.text}</small>
        </div>
        {feedback.tone !== 'right' && (
          <button
            className="secondary-button"
            onClick={() => {
              setHelpShown(true);
              setHelpCount((value) => value + 1);
            }}
          >
            <CircleHelp />
            Hulp
          </button>
        )}
        {feedback.tone === 'right' ? (
          <button className="success-button" onClick={nextActivity}>
            {activityIndex === pack.exerciseInstances.length - 1
              ? 'Afronden'
              : 'Verder'}
            <ArrowRight />
          </button>
        ) : (
          <button
            className="primary-button"
            disabled={!canCheck}
            onClick={checkActivity}
          >
            <ListChecks />
            {activity.exerciseTypeId === 'TE-01'
              ? 'Tekst gelezen'
              : 'Controleer'}
          </button>
        )}
      </footer>
    </div>
  );
}

function CriteriaList({
  criteria,
  checks,
  setChecks,
  disabled,
}: {
  criteria: string[];
  checks: boolean[];
  setChecks: (checks: boolean[]) => void;
  disabled: boolean;
}) {
  return (
    <div className="criteria-list">
      <small>Controleer jezelf</small>
      {criteria.map((criterion, index) => (
        <button
          key={criterion}
          className={checks[index] ? 'checked' : ''}
          disabled={disabled}
          onClick={() =>
            setChecks(
              checks.map((value, itemIndex) =>
                itemIndex === index ? !value : value,
              ),
            )
          }
        >
          <span>{checks[index] ? <Check /> : <Circle />}</span>
          {criterion}
        </button>
      ))}
    </div>
  );
}

function splitSentences(text: string) {
  return (
    text
      .match(/[^.!?]+[.!?]+|[^.!?]+$/g)
      ?.map((sentence) => sentence.trim())
      .filter(Boolean) ?? [text]
  );
}
