'use client';

import { useState } from 'react';
import Image from './compact-image';
import { Eye, PencilLine, RotateCcw, Undo2 } from 'lucide-react';
import {
  getClassroomLesson,
  isCorrectSequence,
  sequenceForRoute,
  type ClassroomState,
  type ClassroomRoute,
  type Variant,
} from '@/lib/teacher-classroom';

export function ClassroomBrand() {
  return (
    <span className="kpd-brand">
      <span className="sr-only">Klink+docent</span>
      <Image
        src="/taalroute-menu/klink.svg"
        alt=""
        width={70.48}
        height={24}
        preload
      />
      <span aria-hidden="true">+</span>
      <Image
        src="/taalroute-menu/klink-docent-suffix.svg"
        alt=""
        width={104.76}
        height={24}
        preload
      />
    </span>
  );
}

export function TeacherRouteStage({
  state,
  update,
  reveal,
  onPractice,
}: {
  state: ClassroomState;
  update: (change: Partial<ClassroomState>) => void;
  reveal: () => void;
  onPractice: () => void;
}) {
  const { word: matWord, routes: classroomRoutes, presentation, display } = getClassroomLesson(state.lessonId);
  const [message, setMessage] = useState({ phase: state.phase, text: '' });
  const feedback = message.phase === state.phase ? message.text : '';
  const setFeedback = (text: string) =>
    setMessage({ phase: state.phase, text });
  const [question, setQuestion] = useState(0);
  const [photoCheck, setPhotoCheck] = useState(false);
  const response = state.ownSentence;
  const setResponse = (response: string) => update({ ownSentence: response });
  const [review, setReview] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const [selectedSentence, setSelectedSentence] = useState('');
  const textParts = classroomRoutes.c.example.split('\n');
  const route = classroomRoutes[state.route];
  const shown = state.shown[state.phase];
  const sentence = (
    <p
      className={`kpd-route-text${state.route === 'c' ? ' kpd-message-text' : ''}`}
    >
      {state.route === 'c'
        ? textParts.map((part) => <span key={part}>{part}</span>)
        : route.example}
    </p>
  );
  const photo = (
    <Image
      className="kpd-photo"
      src={matWord.image!}
      alt={matWord.word}
      width={800}
      height={800}
    />
  );
  const revealButton = (
    <button className="secondary-button" onClick={reveal}>
      <Eye />
      {state.route === 'c' && state.phase === 6
        ? shown
          ? 'Voorbeeldzin verbergen'
          : 'Voorbeeldzin tonen'
        : shown
          ? state.route === 'b' ? 'Zin verbergen' : 'Tekst verbergen'
          : state.route === 'b' ? 'Zin tonen' : 'Tekst tonen'}
    </button>
  );
  const sequence = sequenceForRoute(state.route, state.lessonId);
  const assistance =
    state.variant === 'support'
      ? 'Bekijk eerst het voorbeeld. Doe daarna zelf.'
      : state.variant === 'basic'
        ? 'Probeer het. Vraag zo nodig één aanwijzing.'
        : 'Probeer het zonder voorbeeld. Controleer daarna zelf.';
  const status = (
    <output className="kpd-route-feedback" aria-live="polite">
      {feedback}
    </output>
  );

  if (state.phase === 0 || state.phase === 1)
    return (
      <div className="kpd-picture-lesson">
        <div className="kpd-picture-column">
          <div className="kpd-picture-space" style={{ visibility: state.image ? 'visible' : 'hidden' }} aria-hidden={!state.image}>{photo}</div>
          <div className="kpd-actions kpd-visibility-controls">
            <button
              className="secondary-button"
              onClick={() => update({ image: !state.image })}
            >
              {state.image ? 'Beeld verbergen' : 'Beeld tonen'}
            </button>
            {revealButton}
          </div>
        </div>
        <div className="kpd-word-column">
          <div className="kpd-word-space">
            <div style={{ visibility: shown ? 'visible' : 'hidden' }} aria-hidden={!shown}>{sentence}</div>
            {state.route === 'c' && state.phase === 0 && (
              <p>{presentation.entryAction}</p>
            )}
            {state.phase === 1 && (
              <p>De docent leest voor. Luister en vertel.</p>
            )}
          </div>
        </div>
      </div>
    );

  if (state.phase === 2)
    return state.route === 'b' ? (
      <>
        <div className="kpd-word-cards">
          {route.tokens.map((word) => (
            <button
              className="secondary-button"
              key={word}
              aria-pressed={selectedWord === word}
              onClick={() => setSelectedWord(selectedWord === word ? '' : word)}
            >
              {word}
            </button>
          ))}
        </div>
        <p className="kpd-route-text kpd-phrase-line">
          {presentation.phrases.map(part => <span key={part}>{part}</span>)}
        </p>
        <p>{assistance}</p>
      </>
    ) : (
      <>
        <p>{classroomRoutes.c.questions[question].prompt}</p>
        <div className="kpd-message-choices">
          {textParts.map((part, i) => (
            <button
              className="secondary-button"
              key={part}
              onClick={() =>
                setFeedback(
                  i === classroomRoutes.c.questions[question].answer
                    ? `Ja. ${part}`
                    : 'Lees de zinnen nog eens. Welke past bij de vraag?',
                )
              }
            >
              {part}
            </button>
          ))}
        </div>
        {status}
        <div className="kpd-actions">
          <button
            className="secondary-button"
            onClick={() => {
              setQuestion((question + 1) % classroomRoutes.c.questions.length);
              setFeedback('');
            }}
          >
            Andere vraag
          </button>
        </div>
      </>
    );

  if (state.phase === 3)
    return (
      <>
        {shown && <p className="kpd-route-model">{sequence.join(' ')}</p>}
        <div className="kpd-sentence-slots" aria-label="Jouw volgorde">
          {state.order.length ? (
            state.order.map((id, index) => (
              <button
                className="secondary-button"
                key={id}
                aria-label={`Haal ${sequence[id]} weg`}
                onClick={() => {
                  update({ order: state.order.filter((_, i) => i !== index) });
                  setFeedback('');
                }}
              >
                {sequence[id]}
              </button>
            ))
          ) : (
            <span>Leg de kaartjes hier.</span>
          )}
        </div>
        <div className="kpd-word-cards" aria-label="Losse kaartjes">
          {sequence
            .map((_, i) => sequence.length - 1 - i)
            .map((id) => (
              <button
                className="secondary-button"
                key={id}
                disabled={state.order.includes(id)}
                onClick={() => {
                  update({ order: [...state.order, id] });
                  setFeedback('');
                }}
              >
                {sequence[id]}
              </button>
            ))}
        </div>
        <p className="kpd-assistance">{assistance}</p>
        <div className="kpd-actions">
          <button
            className="secondary-button"
            onClick={() => {
              update({ order: state.order.slice(0, -1) });
              setFeedback('');
            }}
          >
            <Undo2 />
            Eén terug
          </button>
          {revealButton}
          <button
            className="primary-button"
            onClick={() =>
              setFeedback(
                isCorrectSequence(state.route, state.order, state.lessonId)
                  ? state.lessonId !== 'mat' ? 'Ja, de zin staat in de goede volgorde.' : state.route === 'b'
                    ? 'Ja, de zin zegt waar de mat ligt.'
                    : 'Ja, de zin vertelt wat je op de mat doet.'
                  : state.lessonId !== 'mat' ? `Lees je zin. Begin met ${sequence[0]}.` : state.route === 'b'
                    ? 'Lees je zin. Begin met De mat en zoek daarna waar de mat ligt.'
                    : 'Begin met Ik. Zoek daarna wat ik doe en waarop.',
              )
            }
          >
            Kijk na
          </button>
          <button
            className="secondary-button"
            onClick={() => {
              update({
                order: [],
                shown: state.shown.map((v, i) => (i === 3 ? false : v)),
              });
              setFeedback('');
            }}
          >
            <RotateCcw />
            Opnieuw
          </button>
        </div>
        {status}
      </>
    );

  if (state.phase === 4)
    return (
      <div
        className={
          photoCheck && shown && state.route === 'b'
            ? 'kpd-picture-lesson'
            : 'kpd-read-lesson'
        }
      >
        {photoCheck && shown && state.route === 'b' && (
          <div className="kpd-picture-column">
            <div className="kpd-picture-space">{photo}</div>
          </div>
        )}
        <div className="kpd-word-column">
          <div className="kpd-word-space">
            {shown ? (
              sentence
            ) : (
              <span className="kpd-covered" aria-label="Tekst afgedekt">
                —
              </span>
            )}
            {shown && state.route === 'c' && (
              <p>Wat gebeurt er? Vertel hoe de zinnen bij elkaar horen.</p>
            )}
          </div>
          <div className="kpd-actions">
            {revealButton}
            {shown && state.route === 'b' && (
              <button
                className="secondary-button"
                onClick={() => setPhotoCheck(!photoCheck)}
              >
                {photoCheck ? 'Foto verbergen' : state.lessonId === 'mat' ? 'Controleer met de foto' : 'Foto bekijken'}
              </button>
            )}
          </div>
        </div>
      </div>
    );

  if (state.phase === 5 && state.route === 'b')
    return (
      <div className="kpd-picture-lesson">
        <div className="kpd-picture-column">
          <div className="kpd-picture-space">{photo}</div>
        </div>
        <div className="kpd-word-column">
          <div className="kpd-word-space">
            {sentence}
            <div className="kpd-message-choices">
              {presentation.phrases.map(part => part.replace(/\.$/, '')).map((part) => (
                <button
                  className="secondary-button"
                  key={part}
                  onClick={() =>
                    setFeedback(
                      part === presentation.phrases[2].replace(/\.$/, '')
                        ? `Ja, ${part} vertelt de plaats. Wijs die plek aan.`
                        : 'Zoek het deel dat de plaats vertelt.',
                    )
                  }
                >
                  {part}
                </button>
              ))}
            </div>
            {status}
          </div>
        </div>
      </div>
    );
  if (state.phase === 5)
    return (
      <>
        <p>Eén doet voor. De ander kiest en leest. Wissel daarna.</p>
        <div className="kpd-message-choices">
          {textParts.map((part) => (
            <button
              className="secondary-button"
              key={part}
              aria-pressed={selectedSentence === part}
              onClick={() => setSelectedSentence(part)}
            >
              {part}
            </button>
          ))}
        </div>
        {selectedSentence && (
          <output className="kpd-route-feedback" aria-live="polite">
            Lees de gekozen zin. Past die bij wat je zag?
          </output>
        )}
      </>
    );
  if (state.phase === 6 && state.route === 'c')
    return (
      <div className="kpd-response-layout">
        <div>
          <p>{presentation.ownPrompt}</p>
          <p>{presentation.ownHint}</p>
          {shown && (
            <p className="kpd-route-model">Bijvoorbeeld: {route.replyModel}</p>
          )}
          <div className="kpd-actions">{revealButton}</div>
        </div>
        <div>
          <label className="kpd-response-label">
            Schrijf hier je eigen zin.
            <textarea
              value={response}
              onChange={(e) => {
                setResponse(e.target.value);
                setReview(false);
              }}
              maxLength={160}
              rows={3}
            />
          </label>
          <div className="kpd-actions">
            <button
              className="secondary-button"
              disabled={!response.trim()}
              onClick={() => setReview(!review)}
            >
              Bespreek de zin
            </button>
          </div>
          {review && (
            <output>
              Past jouw zin bij {display}? Begrijpt de ander wat je bedoelt?
            </output>
          )}
        </div>
      </div>
    );

  if (state.phase === 6)
    return (
      <>
        <PencilLine className="kpd-paper-icon" aria-hidden="true" />
        <p>Lees, maak de zin en wijs de plaats aan.</p>
        {shown && sentence}
        <div className="kpd-actions">{revealButton}</div>
      </>
    );

  return (
    <>
      <p>
        {state.route === 'b'
          ? `Lees zonder voorbeeld. Vertel waar ${display} is.`
          : 'Vertel wat er gebeurt. Lees daarna de tekst nog eens.'}
      </p>
      {shown && sentence}
      <div className="kpd-actions">
        {revealButton}
        <button className="secondary-button" onClick={onPractice}>
          Oefen het woord {matWord.word} in Klink
        </button>
      </div>
    </>
  );
}

export function RouteWorksheet({
  route,
  variant,
  lessonId = "mat",
}: {
  route: ClassroomRoute;
  variant: Variant;
  lessonId?: string;
}) {
  const { word: matWord, routes: classroomRoutes, display } = getClassroomLesson(lessonId);
  return (
    <article
      className="kpd-worksheet kpd-print-page kpd-route-worksheet"
      aria-label="Werkblad"
    >
      <header>
        <Image src="/klink-wordmark.svg" alt="Klink" width={125} height={41} />
        <h2>{display.toUpperCase()}</h2>
      </header>
      <Image
        className="kpd-paper-image"
        src={matWord.image!}
        width={800}
        height={800}
        alt={matWord.word}
      />
      <p className="kpd-paper-message">{classroomRoutes[route].example}</p>
      {route === 'b' ? (
        <>
          <p>
            1. Lees. Zet een streep onder de woorden die de plaats aangeven.
          </p>
          <p>2. Maak de zin met de kaartjes.</p>
          <div className="kpd-paper-wordcards">
            {[...sequenceForRoute(route, lessonId)].reverse().map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
          <div className="kpd-write-line" />
          <p>3. Dek de zin af. Schrijf de zin en lees terug.</p>
          {variant === 'support' && <p>{display} …</p>}
          <div className="kpd-write-line" />
        </>
      ) : (
        <>
          <p>1. Lees. Doe voor wat je leest. Wijs de passende zin aan.</p>
          <p>2. Bouw de oefenzin met de losse woordkaartjes.</p>
          <p>3. Zeg of schrijf een eigen zin over {display}.</p>
          {variant === 'support' && <p>Bij mij …</p>}
          <div className="kpd-write-line" />
          <div className="kpd-write-line" />
          <p>Lees terug. Begrijpt de ander jouw zin?</p>
        </>
      )}
    </article>
  );
}

export function RouteCards({ route, lessonId = "mat" }: { route: ClassroomRoute; lessonId?: string }) {
  const { display } = getClassroomLesson(lessonId);
  return (
    <article className="kpd-worksheet kpd-print-page" aria-label="Kaartjes">
      <header>
        <Image src="/klink-wordmark.svg" alt="Klink" width={125} height={41} />
        <h2>{display.toUpperCase()}</h2>
      </header>
      <div className="kpd-route-cut-cards">
        {sequenceForRoute(route, lessonId).map((text, i) => (
          <div key={i}>{text}</div>
        ))}
      </div>
    </article>
  );
}
