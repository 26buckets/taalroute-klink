'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Eye, PencilLine, RotateCcw, Undo2 } from 'lucide-react';
import {
  classroomRoutes,
  isCorrectSequence,
  matWord,
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
        priority
      />
      <span aria-hidden="true">+</span>
      <Image
        src="/taalroute-menu/klink-docent-suffix.svg"
        alt=""
        width={104.76}
        height={24}
        priority
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
  const [message, setMessage] = useState({ phase: state.phase, text: '' });
  const feedback = message.phase === state.phase ? message.text : '';
  const setFeedback = (text: string) =>
    setMessage({ phase: state.phase, text });
  const [question, setQuestion] = useState(0);
  const [photoCheck, setPhotoCheck] = useState(false);
  const [response, setResponse] = useState('');
  const [review, setReview] = useState(false);
  const [selectedWord, setSelectedWord] = useState('');
  const route = classroomRoutes[state.route];
  const shown = state.shown[state.phase];
  const sentence = (
    <p
      className={`kpd-route-text${state.route === 'c' ? ' kpd-message-text' : ''}`}
    >
      {route.example}
    </p>
  );
  const photo = (
    <Image
      className="kpd-photo"
      src={matWord.image!}
      alt="Een mat bij een deur"
      width={800}
      height={800}
    />
  );
  const revealButton = (
    <button className="secondary-button" onClick={reveal}>
      <Eye />
      {state.route === 'c' && state.phase === 5
        ? shown
          ? 'Voorbeeldantwoord verbergen'
          : 'Voorbeeldantwoord tonen'
        : shown
          ? 'Tekst verbergen'
          : 'Tekst tonen'}
    </button>
  );
  const messageParts = ['De mat is nat.', 'Leg hem buiten.'];
  const sequence = sequenceForRoute(state.route);
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
          <div className="kpd-picture-space">{state.image && photo}</div>
          <div className="kpd-actions">
            <button
              className="secondary-button"
              onClick={() => update({ image: !state.image })}
            >
              {state.image ? 'Beeld verbergen' : 'Beeld tonen'}
            </button>
          </div>
        </div>
        <div className="kpd-word-column">
          <div className="kpd-word-space">
            {shown && sentence}
            {state.phase === 1 && (
              <p>De docent leest voor. Luister en vertel.</p>
            )}
          </div>
          <div className="kpd-actions">{revealButton}</div>
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
          <span>De mat</span>
          <span>ligt</span>
          <span>bij de deur.</span>
        </p>
        <p>{assistance}</p>
      </>
    ) : (
      <>
        <p>
          {question === 0
            ? 'Welke zin vertelt wat er is?'
            : 'Welke zin zegt wat je moet doen?'}
        </p>
        <div className="kpd-message-choices">
          {messageParts.map((part, i) => (
            <button
              className="secondary-button"
              key={part}
              onClick={() =>
                setFeedback(
                  i === question
                    ? i === 0
                      ? 'Ja, de mat is nat.'
                      : 'Ja, je moet de mat buiten leggen.'
                    : 'Lees beide zinnen nog eens. Welke past bij de vraag?',
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
              setQuestion(1 - question);
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
                isCorrectSequence(state.route, state.order)
                  ? state.route === 'b'
                    ? 'Ja, de zin zegt waar de mat ligt.'
                    : 'Ja, eerst de situatie en dan de opdracht.'
                  : state.route === 'b'
                    ? 'Lees je zin. Begin met De mat en zoek daarna waar de mat ligt.'
                    : 'Begin met wat er is. Leg daarna wat je moet doen.',
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
              <>
                <p>
                  Waarnaar verwijst <strong>hem</strong>?
                </p>
                <div className="kpd-word-cards">
                  {['mat', 'nat', 'buiten'].map((word) => (
                    <button
                      className="secondary-button"
                      key={word}
                      onClick={() =>
                        setFeedback(
                          word === 'mat'
                            ? 'Ja, hem verwijst naar de mat.'
                            : 'Lees de eerste zin terug. Over welk voorwerp gaat het?',
                        )
                      }
                    >
                      {word}
                    </button>
                  ))}
                </div>
                {status}
              </>
            )}
          </div>
          <div className="kpd-actions">
            {revealButton}
            {shown && state.route === 'b' && (
              <button
                className="secondary-button"
                onClick={() => setPhotoCheck(!photoCheck)}
              >
                {photoCheck ? 'Foto verbergen' : 'Controleer met de foto'}
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
              {['De mat', 'ligt', 'bij de deur'].map((part) => (
                <button
                  className="secondary-button"
                  key={part}
                  onClick={() =>
                    setFeedback(
                      part === 'bij de deur'
                        ? 'Ja, bij de deur vertelt de plaats. Wijs die plek aan.'
                        : 'Zoek het deel dat zegt waar de mat ligt.',
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
      <div className="kpd-response-layout">
        <div>
          {sentence}
          <p>Vertel wat je doet.</p>
          {shown && (
            <p className="kpd-route-model">
              Een mogelijk antwoord: {route.replyModel}
            </p>
          )}
          <div className="kpd-actions">{revealButton}</div>
        </div>
        <div>
          <label className="kpd-response-label">
            Schrijf een kort antwoord.
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
              Bespreek het antwoord
            </button>
          </div>
          {review && (
            <output>
              Is duidelijk waar de mat nu ligt? Lees je antwoord terug.
            </output>
          )}
        </div>
      </div>
    );

  if (state.phase === 6)
    return (
      <>
        <PencilLine className="kpd-paper-icon" aria-hidden="true" />
        <p>
          {state.route === 'b'
            ? 'Lees, maak de zin en wijs de plaats aan.'
            : 'Lees het bericht en schrijf een kort antwoord.'}
        </p>
        {shown && sentence}
        <div className="kpd-actions">{revealButton}</div>
      </>
    );

  return (
    <>
      <p>
        {state.route === 'b'
          ? 'Lees zonder voorbeeld. Vertel waar de mat ligt.'
          : 'Vertel wat er moest gebeuren en waarom. Controleer daarna.'}
      </p>
      {shown && sentence}
      <div className="kpd-actions">
        {revealButton}
        <button className="secondary-button" onClick={onPractice}>
          Oefen het woord mat in Klink
        </button>
      </div>
    </>
  );
}

export function RouteWorksheet({
  route,
  variant,
}: {
  route: ClassroomRoute;
  variant: Variant;
}) {
  return (
    <article
      className="kpd-worksheet kpd-print-page kpd-route-worksheet"
      aria-label="Werkblad"
    >
      <header>
        <Image src="/klink-wordmark.svg" alt="Klink" width={125} height={41} />
        <h2>DE MAT</h2>
      </header>
      <Image
        className="kpd-paper-image"
        src={matWord.image!}
        width={800}
        height={800}
        alt="Een mat bij een deur"
      />
      <p className="kpd-paper-message">{classroomRoutes[route].example}</p>
      {route === 'b' ? (
        <>
          <p>
            1. Lees. Zet een streep onder de woorden die de plaats aangeven.
          </p>
          <p>2. Maak de zin met de kaartjes.</p>
          <div className="kpd-paper-wordcards">
            {['deur.', 'mat', 'bij', 'De', 'ligt', 'de'].map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>
          <div className="kpd-write-line" />
          <p>3. Dek de zin af. Schrijf de zin en lees terug.</p>
          {variant === 'support' && <p>De mat …</p>}
          <div className="kpd-write-line" />
        </>
      ) : (
        <>
          <p>1. Lees. Zet een streep onder de opdracht.</p>
          <p>
            2. Trek een lijn van <strong>hem</strong> naar het bedoelde woord in
            het bericht.
          </p>
          <p>3. De opdracht is klaar. Schrijf kort terug.</p>
          {variant === 'support' && <p>De mat …</p>}
          <div className="kpd-write-line" />
          <div className="kpd-write-line" />
          <p>Lees terug. Begrijpt de ander jouw antwoord?</p>
        </>
      )}
    </article>
  );
}

export function RouteCards({ route }: { route: ClassroomRoute }) {
  return (
    <article className="kpd-worksheet kpd-print-page" aria-label="Kaartjes">
      <header>
        <Image src="/klink-wordmark.svg" alt="Klink" width={125} height={41} />
        <h2>DE MAT</h2>
      </header>
      <div
        className="kpd-route-cut-cards"
      >
        {sequenceForRoute(route).map((text, i) => (
          <div key={i}>{text}</div>
        ))}
      </div>
    </article>
  );
}
