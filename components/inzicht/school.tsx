'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ExerciseSurface } from '@/components/product/package-exercise-browser';
import type { PackageDefinition, PackageExercise } from '@/lib/package-content';
import { api, useSave } from './client';
import type { Content } from '@/lib/inzicht/rules';

type Registry = {
  classes: { id: string; name: string }[];
  learners: { id: string; display_name: string }[];
  memberships: { id: string; user_id: string }[];
  links: { id: string; learner_id: string; membership_id: string }[];
};
export function Registrar({ school }: { school: string }) {
  const [data, setData] = useState<Registry | null>(null),
    [error, setError] = useState(''),
    [token, setToken] = useState(''),
    [version, setVersion] = useState(0);
  const save = useSave();
  useEffect(() => {
    let active = true;
    api<Registry>('registrar', school)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [school, version]);
  if (error) return <p role="alert">{error}</p>;
  if (!data) return <p>Schoolregistratie ophalen…</p>;
  return (
    <section className="ki-card">
      <h2>Geverifieerde accountkoppeling</h2>
      <p>
        Alleen schoolregistratie. Geen inzage in observaties of persoonlijke
        leerresultaten. In deze proef worden uitsluitend fictieve identiteiten
        gecontroleerd.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void save.save<{ token: string }>(
            'invites',
            school,
            {
              learner_id: f.get('learner'),
              membership_id: f.get('member'),
              identity_checked: f.get('checked') === 'on',
            },
            (r) => setToken(r.token),
          );
        }}
      >
        <label className="ki-field">
          <span>Voorlopig schoolprofiel</span>
          <select name="learner">
            {data.learners.map((l) => (
              <option key={l.id} value={l.id}>
                {l.display_name}
              </option>
            ))}
          </select>
        </label>
        <label className="ki-field">
          <span>Bedoeld schoolaccount</span>
          <select name="member">
            {data.memberships.map((m) => (
              <option key={m.id} value={m.id}>
                {m.user_id}
              </option>
            ))}
          </select>
        </label>
        <label className="ki-check">
          <input type="checkbox" name="checked" required />
          Ik heb de fictieve identiteit gecontroleerd. Een overeenkomstige naam
          alleen is onvoldoende.
        </label>
        <button className="primary-button" disabled={save.busy}>
          Eenmalige uitnodiging maken
        </button>
      </form>
      {token && (
        <div className="ki-preview">
          <p>
            Uitsluitend aan de bedoelde testcursist overdragen. De uitnodiging
            vervalt na 30 minuten en werkt alleen in diens ingelogde
            schoolaccount.
          </p>
          <label className="ki-field">
            <span>Testuitnodiging</span>
            <textarea value={token} readOnly />
          </label>
        </div>
      )}
      <p role="alert">{save.error}</p>
      <h3>Klasindeling</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void save.save(
            'enrollments',
            school,
            {
              class_id: f.get('class'),
              learner_id: f.get('learner'),
              status: f.get('status'),
              confirmed: true,
            },
            () => setVersion((v) => v + 1),
          );
        }}
      >
        <label className="ki-field">
          <span>Cursist voor klasindeling</span>
          <select name="learner">
            {data.learners.map((l) => (
              <option key={l.id} value={l.id}>
                {l.display_name}
              </option>
            ))}
          </select>
        </label>
        <label className="ki-field">
          <span>Doelklas</span>
          <select name="class">
            {data.classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="ki-field">
          <span>Indeling</span>
          <select name="status">
            <option value="active">Toevoegen of heropenen</option>
            <option value="ended">Uitschrijven; historie behouden</option>
          </select>
        </label>
        <p>
          Andere klassen en historische resultaten blijven behouden. Controleer
          de bedoelde cursist en klas voor je bevestigt.
        </p>
        <button className="secondary-button" disabled={save.busy}>
          Klasindeling bevestigen
        </button>
      </form>
      <h3>Actieve koppelingen</h3>
      {data.links.map((l) => (
        <div className="ki-actions" key={l.id}>
          <span>
            {data.learners.find((x) => x.id === l.learner_id)?.display_name} ·{' '}
            {l.membership_id.split(':').at(-1)}
          </span>
          <button
            className="secondary-button"
            disabled={save.busy}
            onClick={() =>
              void save.save('unlink', school, { link_id: l.id }, () =>
                setVersion((v) => v + 1),
              )
            }
          >
            Ontkoppelen; historie behouden
          </button>
        </div>
      ))}
    </section>
  );
}
type MySchool = {
  linked: boolean;
  classes: { id: string; name: string }[];
  assignments: {
    id: string;
    group_id: string;
    content_version_id: string;
    instructions: string;
    title: string;
    status: string;
  }[];
  attempts: { id: string; correct: number; created_at: string }[];
};
type ExerciseAccess = {
  content: Content;
  class: string;
  assignment: string | null;
};
export function SchoolLearner({ school }: { school: string }) {
  const [data, setData] = useState<MySchool | null>(null),
    [error, setError] = useState(''),
    [active, setActive] = useState<ExerciseAccess | null>(null),
    [version, setVersion] = useState(0);
  const router = useRouter(),
    search = useSearchParams();
  const requestedClass = search.get('class') ?? '',
    content = search.get('content') ?? '',
    assignment = search.get('assignment') ?? '';
  const save = useSave();
  useEffect(() => {
    let current = true;
    api<MySchool>('my-school', school)
      .then((d) => {
        if (current) setData(d);
      })
      .catch((e) => {
        if (current) setError(e.message);
      });
    return () => {
      current = false;
    };
  }, [school, version, content, requestedClass]);
  useEffect(() => {
    let current = true;
    const result =
      content && requestedClass
        ? api<ExerciseAccess>(
            `school-practice?class=${encodeURIComponent(requestedClass)}&content=${encodeURIComponent(content)}${assignment ? `&assignment=${encodeURIComponent(assignment)}` : ''}`,
            school,
          )
        : Promise.resolve(null);
    result
      .then((value) => {
        if (current) {
          setActive(value);
          setError('');
        }
      })
      .catch((e) => {
        if (current) {
          setActive(null);
          setError(e.message);
        }
      });
    return () => {
      current = false;
    };
  }, [school, content, requestedClass, assignment, version]);
  function open(a: MySchool['assignments'][number]) {
    router.push(
      `/inzicht/oefenen?school=${encodeURIComponent(school)}&class=${a.group_id}&content=${a.content_version_id}&assignment=${a.id}`,
    );
  }
  if (active)
    return (
      <SchoolPlayer
        school={school}
        access={active}
        close={() => {
          setActive(null);
          router.push(`/inzicht?school=${encodeURIComponent(school)}`);
        }}
      />
    );
  return (
    <section className="ki-card">
      <h2>Mijn school</h2>
      <p>
        Je oefent voor deze school. Je persoonlijke Klink-gegevens worden hier
        niet gedeeld.
      </p>
      {!data ? (
        <p>Ophalen…</p>
      ) : !data.linked ? (
        <>
          <h3>Uitnodiging accepteren</h3>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void save.save(
                'accept-invite',
                school,
                { token: new FormData(e.currentTarget).get('token') },
                () => setVersion((v) => v + 1),
              );
            }}
          >
            <label className="ki-field">
              <span>Eenmalige testuitnodiging</span>
              <input name="token" required maxLength={64} autoComplete="off" />
            </label>
            <button className="primary-button" disabled={save.busy}>
              Schoolprofiel koppelen
            </button>
          </form>
        </>
      ) : (
        <>
          {content && !requestedClass && (
            <label className="ki-field">
              <span>Kies de schoolklas voor deze oefening</span>
              <select
                defaultValue=""
                onChange={(e) =>
                  router.push(
                    `/inzicht/oefenen?school=${encodeURIComponent(school)}&class=${encodeURIComponent(e.target.value)}&content=${encodeURIComponent(content)}`,
                  )
                }
              >
                <option value="" disabled>
                  Kies een klas
                </option>
                {data.classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <h3>Mijn opdrachten</h3>
          {!data.assignments.length ? (
            <p>Er staan nog geen opdrachten klaar.</p>
          ) : (
            data.assignments.map((a) => (
              <article className="ki-preview" key={a.id}>
                <h4>{a.title}</h4>
                <p>{data.classes.find((c) => c.id === a.group_id)?.name}</p>
                <p>{a.instructions}</p>
                <p>
                  {a.status === 'finished' ? 'Geoefend' : 'Klaar om te oefenen'}
                </p>
                <button className="primary-button" onClick={() => open(a)}>
                  Oefening openen
                </button>
              </article>
            ))
          )}
          <h3>Opgeslagen oefenpogingen</h3>
          <p>
            {data.attempts.length} pogingen voor deze school bewaard. Dit is
            geen niveaucertificaat.
          </p>
        </>
      )}
      <p role="alert">{error || save.error}</p>
    </section>
  );
}
function SchoolPlayer({
  school,
  access,
  close,
}: {
  school: string;
  access: ExerciseAccess;
  close: () => void;
}) {
  const [notice, setNotice] = useState(''),
    [correct, setCorrect] = useState(false),
    [audioError, setAudioError] = useState('');
  const audio = useRef<HTMLAudioElement | null>(null);
  const save = useSave();
  useEffect(
    () => () => {
      audio.current?.pause();
    },
    [],
  );
  const exercise = access.content.metadata.exercise as PackageExercise,
    pack = access.content.metadata.pack as PackageDefinition;
  return (
    <section className="ki-card">
      <button className="secondary-button" onClick={close}>
        Terug naar mijn opdrachten
      </button>
      <h2>{access.content.title}</h2>
      <div className="cp-exercise-card">
        <ExerciseSurface
          exercise={exercise}
          pack={pack}
          guided={false}
          canAnswer={!save.busy}
          answeredCorrectly={correct}
          speakingOptionId=""
          onOpenExercise={() => {}}
          onHelp={() => {}}
          onReset={() => {
            setCorrect(false);
            setNotice('');
          }}
          onAudio={async (src) => {
            if (!src) return false;
            try {
              audio.current?.pause();
              audio.current = new Audio(src);
              await audio.current.play();
              setAudioError('');
              return true;
            } catch {
              setAudioError('Luisteren is niet gelukt. Probeer opnieuw.');
              return false;
            }
          }}
          onFinish={(answer) => {
            void save.save<{ correct: boolean }>(
              `school-practice?class=${access.class}&content=${access.content.id}${access.assignment ? `&assignment=${access.assignment}` : ''}`,
              school,
              { answer },
              (r) => {
                setCorrect(r.correct);
                setNotice(
                  r.correct
                    ? 'Goed. Je oefenpoging is bewaard.'
                    : 'Je oefenpoging is bewaard. Probeer opnieuw.',
                );
              },
            );
          }}
        />
      </div>
      <output>{save.busy ? 'Bewaren…' : notice}</output>
      <p role="alert">{save.error || audioError}</p>
      <p>Oefenactiviteit; geen automatische beheersingsscore.</p>
    </section>
  );
}
