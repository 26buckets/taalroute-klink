'use client';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Copy,
  KeyRound,
  Plus,
  Presentation,
  Users,
} from 'lucide-react';
import {
  playMedia,
  stopMedia,
} from './shared';
import { TeacherWorkspaceFrame } from './teacher-workspace-frame';
import { PackageExerciseBrowser } from './package-exercise-browser';
import { RouteSettingsProvider } from './route-settings';
import {
  assignedLesson,
  assignmentTitle,
  teachingCatalog,
  type TeachingAssignment,
  type TeachingWorkspace,
} from '@/lib/teaching';

type Mutation = { id: string; name: string; code: string; added: number };
type LearnerWorkspace = {
  person: { name: string };
  assignments: TeachingAssignment[];
};
type View = 'home' | 'groups' | 'assignments';
async function request<T = Mutation>(
  role: 'teacher' | 'learner',
  body?: Record<string, unknown>,
) {
  const response = await fetch(`/api/teaching?role=${role}`, {
    cache: 'no-store',
    ...(body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {}),
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok)
    throw Object.assign(
      new Error(data.error ?? 'Dit lukt nu niet. Probeer opnieuw.'),
      { status: response.status },
    );
  return data;
}
function Login({
  audience: role,
  onLogin,
}: {
  audience: 'teacher' | 'learner';
  onLogin: () => Promise<void>;
}) {
  const [code, setCode] = useState(''),
    [error, setError] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <section className="tw-login">
      <KeyRound aria-hidden="true" />
      <h1>
        {role === 'teacher'
          ? 'Mijn cursisten en opdrachten'
          : 'Mijn opdrachten'}
      </h1>
      <p>
        {role === 'teacher'
          ? 'Open je eigen docentwerkplek.'
          : 'Vul de oefencode van je docent in.'}
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          setError('');
          try {
            await request(role, { action: 'login', code });
            setCode('');
            await onLogin();
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <label>
          {role === 'teacher' ? 'Docentcode' : 'Mijn oefencode'}
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            maxLength={100}
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode={role === 'learner' ? 'numeric' : 'text'}
            type="password"
            required
          />
        </label>
        <button className="primary-button" disabled={busy || !code.trim()}>
          {busy ? 'Even wachten…' : 'Openen'}
          <ArrowRight />
        </button>
        {error && <p role="alert">{error}</p>}
      </form>
      {role === 'teacher' && (
        <button
          className="secondary-button"
          onClick={() => {
            window.location.hash = 'teacher/plus';
          }}
        >
          <Presentation />
          Klink+docent openen
        </button>
      )}
    </section>
  );
}
export function TeachingWorkspace({ onExit }: { onExit: () => void }) {
  const [workspace, setWorkspace] = useState<TeachingWorkspace | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [busy, setBusy] = useState(false);
  const [view, setView] = useState<View>('home'),
    [groupId, setGroupId] = useState(''),
    [groupName, setGroupName] = useState(''),
    [learnerName, setLearnerName] = useState('');
  const [selected, setSelected] = useState<string[]>([]),
    [packageId, setPackageId] = useState(teachingCatalog[0].id),
    [lessonId, setLessonId] = useState(teachingCatalog[0].lessons[0].id);
  const [issued, setIssued] = useState<{ name: string; code: string } | null>(
      null,
    ),
    [copied, setCopied] = useState(false),
    [editing, setEditing] = useState<{
      id: string;
      name: string;
      type: 'group' | 'learner';
    } | null>(null);
  const group = workspace?.groups.find((g) => g.id === groupId);
  const learners =
    workspace?.learners.filter((l) => l.group_id === groupId) ?? [];
  const pack = teachingCatalog.find((p) => p.id === packageId)!;
  async function load() {
    try {
      const data: TeachingWorkspace =
        await request<TeachingWorkspace>('teacher');
      setWorkspace(data);
      setGroupId((id) =>
        data.groups.some((g) => g.id === id) ? id : (data.groups[0]?.id ?? ''),
      );
      setError('');
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        setWorkspace(null);
        setIssued(null);
      } else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  // The initial request and hash restore synchronize the external account and URL.
  useEffect(() => {
    // eslint-disable-next-line react-compiler/react-compiler
    void load();
    const restore = () => {
      const hash = window.location.hash;
      setView(
        hash === '#teacher/groups'
          ? 'groups'
          : hash === '#teacher/assignments'
            ? 'assignments'
            : 'home',
      );
      setIssued(null);
    };
    restore();
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, []);
  function navigate(next: View) {
    setView(next);
    setIssued(null);
    setNotice('');
    setEditing(null);
    window.location.hash = next === 'home' ? 'teacher' : `teacher/${next}`;
  }
  async function mutate(body: Record<string, unknown>) {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const result = await request('teacher', body);
      await load();
      return result;
    } catch (e) {
      setError((e as Error).message);
      if ((e as { status?: number }).status === 401) {
        setWorkspace(null);
        setIssued(null);
      }
      return null;
    } finally {
      setBusy(false);
    }
  }
  function chooseGroup(id: string) {
    setGroupId(id);
    setSelected([]);
    setIssued(null);
    setEditing(null);
    setNotice('');
  }
  const messages = (
    <>
      {error && (
        <p className="tw-message" role="alert">
          {error}
        </p>
      )}
      {notice && <output className="tw-message">{notice}</output>}
    </>
  );
  const groupPicker = (
    <label>
      Groep
      <select value={groupId} onChange={(e) => chooseGroup(e.target.value)}>
        {workspace?.groups.map((g) => (
          <option key={g.id} value={g.id}>
            {g.name}
          </option>
        ))}
      </select>
    </label>
  );
  return (
    <TeacherWorkspaceFrame view={view} identity={workspace?.person.name ?? null}
      onNavigate={next => { if (next === 'plus' || next === 'materials') window.location.hash = `teacher/${next}`; else navigate(next); }}
      onExit={() => {
        void request('teacher', { action: 'logout' }).then(() => { setWorkspace(null); setIssued(null); onExit(); }).catch(e => setError(e.message));
      }}>
        {loading ? (
          <output>Even laden…</output>
        ) : !workspace ? (
          <>
            {messages}
            <Login audience="teacher" onLogin={load} />
          </>
        ) : (
          <>
              {messages}
              {view === 'home' ? (
                <div className="tw-home">
                  <button onClick={() => navigate('groups')}>
                    <Users />
                    <h2>Cursisten en groepen</h2>
                    <p>Maak een groep en voeg cursisten toe.</p>
                    <span>
                      {workspace.groups.length} groepen ·{' '}
                      {workspace.learners.length} cursisten
                      <ArrowRight />
                    </span>
                  </button>
                  <button onClick={() => navigate('assignments')}>
                    <BookOpen />
                    <h2>Opdrachten klaarzetten</h2>
                    <p>Kies een leesstap voor jouw cursisten.</p>
                    <span>
                      {
                        workspace.assignments.filter((a) => !a.completed_at)
                          .length
                      }{' '}
                      openstaande opdrachten
                      <ArrowRight />
                    </span>
                  </button>
                  <button
                    onClick={() => {
                      window.location.hash = 'teacher/plus';
                    }}
                  >
                    <Presentation />
                    <h2>Klink+docent</h2>
                    <p>Open de les op het digibord.</p>
                    <span>
                      Les openen
                      <ArrowRight />
                    </span>
                  </button>
                </div>
              ) : (
                <>
                  {view === 'groups' && (
                    <form
                      className="tw-inline"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const result = await mutate({
                          action: 'create-group',
                          name: groupName,
                        });
                        if (result) {
                          chooseGroup(result.id);
                          setGroupName('');
                        }
                      }}
                    >
                      <label>
                        Nieuwe groep
                        <input
                          maxLength={80}
                          value={groupName}
                          onChange={(e) => setGroupName(e.target.value)}
                          placeholder="Bijvoorbeeld: maandagmorgen"
                          required
                        />
                      </label>
                      <button
                        className="primary-button"
                        disabled={busy || !groupName.trim()}
                      >
                        <Plus />
                        Groep maken
                      </button>
                    </form>
                  )}
                  {workspace.groups.length === 0 ? (
                    <section className="tw-empty">
                      <Users />
                      <h2>Begin met een groep</h2>
                      <p>
                        Voeg daarna cursisten toe en zet hun opdrachten klaar.
                      </p>
                      {view === 'assignments' && (
                        <button
                          className="primary-button"
                          onClick={() => navigate('groups')}
                        >
                          Groep maken
                          <ArrowRight />
                        </button>
                      )}
                    </section>
                  ) : (
                    <>
                      <div className="tw-inline">
                        {groupPicker}
                        {view === 'groups' && (
                          <button
                            className="secondary-button"
                            onClick={() =>
                              setEditing({
                                id: groupId,
                                name: group?.name ?? '',
                                type: 'group',
                              })
                            }
                          >
                            Groepsnaam wijzigen
                          </button>
                        )}
                      </div>
                      {editing && (
                        <form
                          className="tw-inline"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const result = await mutate({
                              action: `rename-${editing.type}`,
                              groupId,
                              learnerId: editing.id,
                              name: editing.name,
                            });
                            if (result) setEditing(null);
                          }}
                        >
                          <label>
                            Naam wijzigen
                            <input
                              value={editing.name}
                              maxLength={80}
                              onChange={(e) =>
                                setEditing({ ...editing, name: e.target.value })
                              }
                              required
                            />
                          </label>
                          <button className="primary-button" disabled={busy}>
                            Opslaan
                          </button>
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => setEditing(null)}
                          >
                            Annuleren
                          </button>
                        </form>
                      )}
                      {view === 'groups' ? (
                        <>
                          <form
                            className="tw-inline"
                            onSubmit={async (e) => {
                              e.preventDefault();
                              const result = await mutate({
                                action: 'create-learner',
                                groupId,
                                name: learnerName,
                              });
                              if (result) {
                                setIssued({
                                  name: result.name,
                                  code: result.code,
                                });
                                setCopied(false);
                                setLearnerName('');
                              }
                            }}
                          >
                            <label>
                              Naam cursist
                              <input
                                maxLength={80}
                                value={learnerName}
                                onChange={(e) => setLearnerName(e.target.value)}
                                required
                              />
                            </label>
                            <button
                              className="primary-button"
                              disabled={busy || !learnerName.trim()}
                            >
                              <Plus />
                              Cursist toevoegen
                            </button>
                          </form>
                          {issued && (
                            <section
                              className="tw-code"
                              aria-label="Nieuwe oefencode"
                            >
                              <h2>Oefencode voor {issued.name}</h2>
                              <p>
                                Geef deze code aan de cursist. Hij wordt alleen
                                nu getoond.
                              </p>
                              <strong>
                                {issued.code.match(/.{1,4}/g)?.join(' ')}
                              </strong>
                              <p>Open Klink en kies Mijn opdrachten.</p>
                              <button
                                className="secondary-button"
                                onClick={async () => {
                                  try {
                                    await navigator.clipboard.writeText(
                                      issued.code.match(/.{1,4}/g)?.join(' ') ??
                                        issued.code,
                                    );
                                    setCopied(true);
                                  } catch {
                                    setError(
                                      'Kopiëren lukt niet. Schrijf de code over.',
                                    );
                                  }
                                }}
                              >
                                {copied ? <Check /> : <Copy />}
                                {copied ? 'Gekopieerd' : 'Code kopiëren'}
                              </button>
                              <button
                                className="secondary-button"
                                onClick={() => setIssued(null)}
                              >
                                Klaar
                              </button>
                            </section>
                          )}
                          <div className="tw-roster">
                            {learners.length === 0 && (
                              <p>Deze groep heeft nog geen cursisten.</p>
                            )}
                            {learners.map((l) => (
                              <article key={l.id}>
                                <div>
                                  <h2>{l.name}</h2>
                                  <p>
                                    {
                                      workspace.assignments.filter(
                                        (a) =>
                                          a.learner_id === l.id &&
                                          !a.completed_at,
                                      ).length
                                    }{' '}
                                    opdrachten open
                                  </p>
                                </div>
                                <div className="tw-row-actions">
                                  <button
                                    className="secondary-button"
                                    onClick={() => {
                                      navigate('assignments');
                                      setSelected([l.id]);
                                    }}
                                  >
                                    Opdracht klaarzetten
                                  </button>
                                  <button
                                    className="secondary-button"
                                    aria-label={`Naam wijzigen: ${l.name}`}
                                    onClick={() =>
                                      setEditing({
                                        id: l.id,
                                        name: l.name,
                                        type: 'learner',
                                      })
                                    }
                                  >
                                    Naam wijzigen
                                  </button>
                                  <button
                                    className="secondary-button"
                                    disabled={busy}
                                    aria-label={`Nieuwe oefencode: ${l.name}`}
                                    onClick={async () => {
                                      if (
                                        !window.confirm(
                                          `Nieuwe oefencode maken voor ${l.name}? De oude code en bestaande aanmelding vervallen.`,
                                        )
                                      )
                                        return;
                                      const result = await mutate({
                                        action: 'reset-code',
                                        groupId,
                                        learnerId: l.id,
                                      });
                                      if (result) {
                                        setIssued({
                                          name: l.name,
                                          code: result.code,
                                        });
                                        setCopied(false);
                                      }
                                    }}
                                  >
                                    Nieuwe code
                                  </button>
                                </div>
                              </article>
                            ))}
                          </div>
                        </>
                      ) : (
                        <>
                          {learners.length === 0 ? (
                            <p>
                              Voeg eerst cursisten toe bij Cursisten en groepen.
                            </p>
                          ) : (
                            <form
                              className="tw-assignment"
                              onSubmit={async (e) => {
                                e.preventDefault();
                                const result = await mutate({
                                  action: 'assign',
                                  groupId,
                                  learnerIds: selected,
                                  packageId,
                                  lessonId,
                                });
                                if (result) {
                                  setNotice(
                                    result.added
                                      ? `${result.added} ${result.added === 1 ? 'opdracht staat' : 'opdrachten staan'} klaar.`
                                      : 'Deze leesstap staat al klaar voor de gekozen cursisten.',
                                  );
                                }
                              }}
                            >
                              <fieldset>
                                <legend>1. Voor wie?</legend>
                                <label className="tw-check">
                                  <input
                                    type="checkbox"
                                    checked={
                                      selected.length === learners.length &&
                                      learners.length > 0
                                    }
                                    onChange={(e) =>
                                      setSelected(
                                        e.target.checked
                                          ? learners.map((l) => l.id)
                                          : [],
                                      )
                                    }
                                  />
                                  Hele groep
                                </label>
                                <div className="tw-checks">
                                  {learners.map((l) => (
                                    <label className="tw-check" key={l.id}>
                                      <input
                                        type="checkbox"
                                        checked={selected.includes(l.id)}
                                        onChange={(e) =>
                                          setSelected(
                                            e.target.checked
                                              ? [...selected, l.id]
                                              : selected.filter(
                                                  (id) => id !== l.id,
                                                ),
                                          )
                                        }
                                      />
                                      {l.name}
                                    </label>
                                  ))}
                                </div>
                              </fieldset>
                              <fieldset>
                                <legend>2. Welke leesstap?</legend>
                                <div className="tw-inline">
                                  <label>
                                    Onderdeel
                                    <select
                                      value={packageId}
                                      onChange={(e) => {
                                        const p = teachingCatalog.find(
                                          (p) => p.id === e.target.value,
                                        )!;
                                        setPackageId(p.id);
                                        setLessonId(p.lessons[0].id);
                                      }}
                                    >
                                      {teachingCatalog
                                        .filter((p) => p.lessons.length)
                                        .map((p) => (
                                          <option key={p.id} value={p.id}>
                                            {p.title}
                                          </option>
                                        ))}
                                    </select>
                                  </label>
                                  <label>
                                    Leesstap
                                    <select
                                      value={lessonId}
                                      onChange={(e) =>
                                        setLessonId(e.target.value)
                                      }
                                    >
                                      {pack.lessons.map((l) => (
                                        <option key={l.id} value={l.id}>
                                          {l.title} · {l.count} opdrachten
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>
                              </fieldset>
                              <button
                                className="primary-button"
                                disabled={busy || selected.length === 0}
                              >
                                Klaarzetten voor {selected.length}{' '}
                                {selected.length === 1
                                  ? 'cursist'
                                  : 'cursisten'}
                                <ArrowRight />
                              </button>
                            </form>
                          )}
                          <h2>Klaargezette opdrachten</h2>
                          <div className="tw-roster">
                            {workspace.assignments
                              .filter((a) =>
                                learners.some((l) => l.id === a.learner_id),
                              )
                              .map((a) => (
                                <article key={a.id}>
                                  <div>
                                    <h3>
                                      {
                                        workspace.learners.find(
                                          (l) => l.id === a.learner_id,
                                        )?.name
                                      }
                                    </h3>
                                    <p>{assignmentTitle(a)}</p>
                                  </div>
                                  <span>
                                    {a.completed_at ? 'Afgerond' : 'Klaargezet'}
                                  </span>
                                </article>
                              ))}
                          </div>
                        </>
                      )}
                    </>
                  )}
                </>
              )}
          </>
        )}
    </TeacherWorkspaceFrame>
  );
}
export function AssignedLearner() {
  const [data, setData] = useState<{
      person: { name: string };
      assignments: TeachingAssignment[];
    } | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(''),
    [active, setActive] = useState<TeachingAssignment | null>(null),
    [pending, setPending] = useState('');
  async function load() {
    try {
      setData(await request<LearnerWorkspace>('learner'));
      setError('');
    } catch (e) {
      if ((e as { status?: number }).status === 401) {
        setData(null);
        setActive(null);
      } else setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }
  // The initial request and hash restore synchronize the external account and URL.
  useEffect(() => {
    // eslint-disable-next-line react-compiler/react-compiler
    void load();
    return () => stopMedia();
  }, []);
  async function finish(id: string) {
    try {
      await request('learner', { action: 'complete', id });
      setPending('');
      await load();
    } catch (e) {
      setError((e as Error).message);
      if ((e as { status?: number }).status === 401) {
        setData(null);
        setActive(null);
        setPending('');
      } else setPending(id);
    }
  }
  const lesson = active
    ? assignedLesson(active.package_id, active.lesson_id)
    : null;
  return (
    <RouteSettingsProvider>
      <main className="tw tw-learner">
        {loading ? (
          <output>Even laden…</output>
        ) : (
          <>
            {error && (
              <p className="tw-message" role="alert">
                {error}
              </p>
            )}
            {pending && (
              <button
                className="primary-button"
                onClick={() => void finish(pending)}
              >
                Afronding opnieuw opslaan
              </button>
            )}
            {!data ? (
              <Login audience="learner" onLogin={load} />
            ) : active && lesson ? (
              <>
                <button
                  className="secondary-button"
                  onClick={() => {
                    stopMedia();
                    setActive(null);
                  }}
                >
                  <ArrowLeft />
                  Mijn opdrachten
                </button>
                <PackageExerciseBrowser
                  key={active.id}
                  pack={lesson.pack}
                  exercises={lesson.exercises}
                  guided
                  onAudio={(source) => (source ? playMedia(source) : undefined)}
                  title={lesson.lesson.title}
                  completeLabel="Mijn opdrachten"
                  onComplete={() => setActive(null)}
                  onLessonDone={() => void finish(active.id)}
                />
              </>
            ) : (
              <>
                <header className="tw-learner-header">
                  <div>
                    <h1>Mijn opdrachten</h1>
                    <p>{data.person.name}</p>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={async () => {
                      try {
                        await request('learner', { action: 'logout' });
                        stopMedia();
                        setData(null);
                        setActive(null);
                        setPending('');
                      } catch (e) {
                        setError((e as Error).message);
                      }
                    }}
                  >
                    Afsluiten
                  </button>
                </header>
                {!data.assignments.length && (
                  <p>Je docent heeft nog geen opdracht klaargezet.</p>
                )}
                <div className="tw-home">
                  {data.assignments.map((a) => (
                    <button
                      key={a.id}
                      disabled={!assignedLesson(a.package_id, a.lesson_id)}
                      onClick={() => {
                        setError('');
                        setActive(a);
                      }}
                    >
                      <BookOpen />
                      <h2>{assignmentTitle(a)}</h2>
                      <span>
                        {a.completed_at ? 'Nog een keer' : 'Beginnen'}
                        <ArrowRight />
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </RouteSettingsProvider>
  );
}
