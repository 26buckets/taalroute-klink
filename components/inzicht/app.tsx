'use client';

import {
  cloneElement,
  useEffect,
  useId,
  useState,
  type SubmitEvent,
  type ReactElement,
} from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Check,
  ClipboardPen,
  Plus,
  Users,
  Grid2X2,
  CalendarDays,
  LogOut,
  ArrowRight,
} from 'lucide-react';
import {
  ROUTES,
  type Content,
  type Mastery,
  type Policy,
  type Skill,
  type Suggestion,
} from '@/lib/inzicht/rules';
import './inzicht.css';
import { api, useSave } from './client';
import { Registrar, SchoolLearner } from './school';
import { Reports } from './reports';
import {
  SourceObservationForm,
  SourceObservationHistory,
} from './source-observation';

type School = { id: string; name: string; role: string };
type Group = {
  id: string;
  name: string;
  start_level: string;
  period: string;
  status: string;
  version: number;
  learners_count: number;
};
type Learner = {
  id: string;
  display_name: string;
  membership_id: string | null;
  enrollment_status: string;
};
type Observation = {
  id: string;
  skill_id: string;
  current_revision: number;
  payload: {
    situation: string;
    outcome: string;
    independence: string;
    note: string;
    observed_at: string;
  };
};
type Profile = {
  learner: Learner;
  observations: Observation[];
  history: {
    revision: number;
    reason: string;
    payload: Observation['payload'];
  }[];
  link: { id: string; membership_id: string } | null;
};
type ClassDetail = { group: Group; learners: Learner[]; policy: Policy };
type Matrix = {
  skills: Skill[];
  rows: { id: string; name: string; cells: Record<string, Mastery> }[];
  processing: string;
  pending: number;
};
type Assignment = {
  id: string;
  title: string;
  status: string;
  starts_at: string;
  ends_at: string | null;
};
type Preview = {
  id: string;
  target_date: string;
  schedule_source: string;
  suggestions: Suggestion[];
  warning: string | null;
};
type EvidenceDetail = {
  skill: Skill;
  mastery: Mastery;
  events: {
    id: string;
    occurred_at: string;
    relation: string;
    revoked: boolean;
    outcome: string;
    source_revision: number;
  }[];
};
const roleLabels: Record<string, string> = {
  teacher: 'Docent',
  assistant: 'Onderwijsassistent',
  registrar: 'Schoolregistratie',
  learner: 'Cursist',
  school_admin: 'Schoolbeheer',
  support: 'Ondersteuning',
  content_editor: 'Contentbeheer',
};
const labels = {
  UNKNOWN: 'Niet gemeten',
  DEVELOPING: 'In ontwikkeling',
  MASTERED: 'Beheerst',
};
const outcomes = {
  successful: 'Kan',
  partial: 'Kan gedeeltelijk',
  not_yet: 'Kan nog niet',
  not_assessed: 'Niet beoordeeld',
};
const independence = {
  independent: 'Zelfstandig',
  hint: 'Met een hint',
  model: 'Na voordoen',
  unknown: 'Onbekend',
};
const asText = (value: string, map: Record<string, string>) =>
  map[value] ?? value;

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactElement<{ id?: string }>;
}) {
  const id = useId();
  return (
    <div className="ki-field">
      <label htmlFor={id}>{label}</label>
      {cloneElement(children, { id })}
    </div>
  );
}
function ErrorText({ text }: { text: string }) {
  return text ? (
    <p className="ki-error" role="alert">
      {text}
    </p>
  ) : null;
}
function Status({ value }: { value: Mastery }) {
  return (
    <>
      <span>{labels[value.status]}</span>
      {value.attention && <small> · extra ondersteuning</small>}
      {value.recheck && <small> · hercontrole</small>}
      {value.stale && <small> · verouderd</small>}
    </>
  );
}

export function InzichtApp({ online = false }: { online?: boolean }) {
  const router = useRouter(),
    pathname = usePathname(),
    search = useSearchParams();
  const [me, setMe] = useState<{ user: string; schools: School[] } | null>(
      null,
    ),
    [checking, setChecking] = useState(true),
    [loginError, setLoginError] = useState('');
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [mfa, setMfa] = useState<{
    mfa?: 'enroll' | 'verify';
    secret?: string;
    uri?: string;
  } | null>(null);
  const [code, setCode] = useState('');
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  useEffect(() => {
    if (mfa || recoveryCodes.length)
      document.getElementById('ki-login-step')?.focus();
  }, [mfa, recoveryCodes.length]);
  function openAccount() {
    setMfa(null);
    setCode('');
    setRecoveryCodes([]);
    setToken('');
    api<{ user: string; schools: School[] }>('me', '')
      .then(setMe)
      .catch((e) => setLoginError(e.message));
  }
  const login = useSave();
  const school = search.get('school') ?? me?.schools[0]?.id ?? '';
  const selected = me?.schools.find((s) => s.id === school);
  const route = pathname.replace(/^\/inzicht\/?/, '').split('/');
  const href = (path: string, extra = '') =>
    `/inzicht${path}?school=${encodeURIComponent(school)}${extra}`;
  useEffect(() => {
    let current = true;
    api<{ user: string; schools: School[] }>('me', '')
      .then((value) => {
        if (current) setMe(value);
      })
      .catch(() => {})
      .finally(() => {
        if (current) setChecking(false);
      });
    return () => {
      current = false;
    };
  }, []);
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) {
        setMe(null);
        location.reload();
      }
    };
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);
  async function logout() {
    if (
      !window.dispatchEvent(
        new Event('inzicht:before-navigation', { cancelable: true }),
      )
    )
      return;
    setLoginError('');
    try {
      await api('logout', school, {});
      setMe(null);
      setToken('');
      router.replace('/inzicht');
    } catch (e) {
      setMe(null);
      setLoginError(
        e instanceof Error
          ? e.message
          : 'Afmelden niet bevestigd; sluit dit venster.',
      );
    }
  }
  return (
    <main className="ki-app">
      <div className="ki-test">
        Testomgeving · alleen fictieve gegevens · niet voor echte
        cursistgegevens
      </div>
      <header className="ki-heading">
        <div>
          <p className="ki-eyebrow">Klink Inzicht</p>
          <h1 tabIndex={-1}>Zicht op je groep</h1>
        </div>
        {me && (
          <button className="secondary-button" onClick={logout}>
            <LogOut />
            Afmelden
          </button>
        )}
      </header>
      {checking ? (
        <output>Toegang controleren…</output>
      ) : !me ? (
        <section className="ki-card">
          {recoveryCodes.length ? (
            <>
              <h2 id="ki-login-step" tabIndex={-1}>
                Bewaar je herstelcodes
              </h2>
              <p>
                Elke code werkt één keer, samen met je wachtwoord. Bewaar ze
                apart van je wachtwoord. Deze codes worden niet opnieuw getoond.
              </p>
              <Field label="Herstelcodes">
                <textarea
                  readOnly
                  rows={8}
                  value={recoveryCodes.join('\n')}
                  autoComplete="off"
                />
              </Field>
              <button className="primary-button" onClick={openAccount}>
                Ik heb de herstelcodes bewaard
              </button>
            </>
          ) : mfa ? (
            <>
              <h2 id="ki-login-step" tabIndex={-1}>
                {mfa.mfa === 'enroll'
                  ? 'Extra beveiliging instellen'
                  : 'Bevestig je aanmelding'}
              </h2>
              {mfa.mfa === 'enroll' ? (
                <>
                  <p>
                    Voeg dit testaccount toe aan je authenticator-app met deze
                    instelsleutel. Kies tijdgebaseerde codes en vul daarna de
                    zescijferige code in. Deel de sleutel niet.
                  </p>
                  <Field label="Instelsleutel">
                    <input
                      readOnly
                      autoComplete="off"
                      value={mfa.secret ?? ''}
                    />
                  </Field>
                  <p>
                    <a href={mfa.uri}>Open je authenticator</a>
                  </p>
                </>
              ) : (
                <p>
                  Vul de actuele code uit je authenticator in. Je kunt ook een
                  ongebruikte herstelcode invoeren. Wacht bij een al gebruikte
                  code op de volgende code.
                </p>
              )}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void login.save<{ recovery_codes: string[] }>(
                    'mfa',
                    '',
                    { code },
                    (result) => {
                      setCode('');
                      setMfa(null);
                      if (result.recovery_codes.length)
                        setRecoveryCodes(result.recovery_codes);
                      else openAccount();
                    },
                  );
                }}
              >
                <Field label="Authenticatorcode of herstelcode">
                  <input
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoComplete="one-time-code"
                    maxLength={40}
                    required
                  />
                </Field>
                <button className="primary-button" disabled={login.busy}>
                  Aanmelding bevestigen
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  disabled={login.busy}
                  onClick={() =>
                    void login.save('mfa/cancel', '', {}, () => {
                      setMfa(null);
                      setCode('');
                      setToken('');
                    })
                  }
                >
                  Opnieuw aanmelden
                </button>
                <ErrorText text={login.error || loginError} />
              </form>
            </>
          ) : (
            <>
              <h2>Testomgeving openen</h2>
              <p>
                {online
                  ? 'Meld je aan met je fictieve testaccount. Alleen voor de besloten proef.'
                  : 'Gebruik je persoonlijke testcode. Dit is nog geen echte Klink-accountlogin.'}
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void login.save<{
                    ok?: boolean;
                    mfa?: 'enroll' | 'verify';
                    secret?: string;
                    uri?: string;
                  }>(
                    online ? 'login' : 'session',
                    '',
                    online ? { email, password: token } : { token },
                    (next) => {
                      setToken('');
                      setLoginError('');
                      if (online && next.mfa) setMfa(next);
                      else openAccount();
                    },
                  );
                }}
              >
                <>
                  {online && (
                    <Field label="E-mailadres">
                      <input
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        maxLength={254}
                      />
                    </Field>
                  )}
                </>
                <Field label={online ? 'Wachtwoord' : 'Testtoegang'}>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    autoComplete={online ? 'current-password' : 'off'}
                    required
                    maxLength={online ? 200 : 64}
                  />
                </Field>
                <button className="primary-button" disabled={login.busy}>
                  Openen <ArrowRight />
                </button>
                <ErrorText text={login.error || loginError} />
              </form>
            </>
          )}
        </section>
      ) : (
        <>
          <Field label="Actieve school">
            <select
              value={school}
              onChange={(e) => {
                if (
                  window.dispatchEvent(
                    new Event('inzicht:before-navigation', {
                      cancelable: true,
                    }),
                  )
                )
                  router.push(
                    `/inzicht?school=${encodeURIComponent(e.target.value)}`,
                  );
              }}
            >
              {me.schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} · {roleLabels[s.role] ?? s.role}
                </option>
              ))}
            </select>
          </Field>
          {!selected ? (
            <p role="alert">Geen toegang tot deze school.</p>
          ) : selected.role === 'learner' ? (
            <SchoolLearner key={school} school={school} />
          ) : selected.role === 'registrar' ? (
            <Registrar key={school} school={school} />
          ) : !['teacher', 'assistant'].includes(selected.role) ? (
            <section className="ki-card">
              <h2>Schoolbeheer</h2>
              <p>
                Deze administratieve rol heeft geen onderwijsinzage. Voor
                dossierhandelingen is een afzonderlijke klas- en
                onderwijsbevoegdheid nodig.
              </p>
              {['school_admin', 'support'].includes(selected.role) && (
                <OperationalStatus key={school} school={school} />
              )}
            </section>
          ) : (
            <>
              <nav className="ki-nav" aria-label="Inzicht">
                <Link
                  prefetch={false}
                  href={href('')}
                  aria-current={!route[0] ? 'page' : undefined}
                >
                  <CalendarDays />
                  Vandaag
                </Link>
                <Link
                  prefetch={false}
                  href={href('/klassen')}
                  aria-current={route[0] === 'klassen' ? 'page' : undefined}
                >
                  <Users />
                  Mijn klassen
                </Link>
                <Link prefetch={false} href={href('/cursisten')}>
                  Cursisten
                </Link>
                <Link prefetch={false} href={href('/vaardigheden')}>
                  <Grid2X2 />
                  Vaardigheden
                </Link>
                <details>
                  <summary>Meer</summary>
                  <Link prefetch={false} href={href('/observaties')}>
                    Observaties
                  </Link>
                  <Link prefetch={false} href={href('/opdrachten')}>
                    Opdrachten
                  </Link>
                  <Link prefetch={false} href={href('/toegang')}>
                    Toegang
                  </Link>
                  <Link prefetch={false} href={href('/advies')}>
                    Lesadvies
                  </Link>
                </details>
              </nav>
              <Workspace
                key={`${school}:${pathname}:${search.toString()}`}
                school={school}
                route={route}
                href={href}
              />
            </>
          )}
        </>
      )}
    </main>
  );
}

function Workspace({
  school,
  route,
  href,
}: {
  school: string;
  route: string[];
  href: (p: string, e?: string) => string;
}) {
  const router = useRouter(),
    search = useSearchParams();
  const [classes, setClasses] = useState<Group[] | null>(null),
    [detail, setDetail] = useState<ClassDetail | null>(null),
    [matrix, setMatrix] = useState<Matrix | null>(null),
    [error, setError] = useState('');
  const gid =
    route[0] === 'klassen' && route[1] !== 'nieuw'
      ? route[1]
      : (search.get('class') ?? '');
  const section = route[0] === 'klassen' ? (route[2] ?? 'cursisten') : route[0];
  useEffect(() => {
    let active = true;
    Promise.all([
      api<Group[]>('classes', school),
      gid ? api<ClassDetail>(`classes/${gid}`, school) : Promise.resolve(null),
      gid && section === 'matrix'
        ? api<Matrix>(`classes/${gid}/matrix`, school)
        : Promise.resolve(null),
    ])
      .then(([cs, d, m]) => {
        if (active) {
          setClasses(cs);
          setDetail(d);
          setMatrix(m);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [school, gid, section]);
  if (error)
    return (
      <section className="ki-card">
        <ErrorText text={error} />
        <Link prefetch={false} href={href('/klassen')}>
          Terug naar mijn klassen
        </Link>
      </section>
    );
  if (!classes) return <output>Ophalen…</output>;
  if (route[0] === 'klassen' && route[1] === 'nieuw')
    return (
      <NewClass
        school={school}
        done={(id) => router.push(href(`/klassen/${id}`))}
        cancel={href('/klassen')}
      />
    );
  if (!gid)
    return (
      <>
        <div className="ki-actions">
          <h2>
            {!route[0]
              ? 'Vandaag'
              : ((
                  {
                    cursisten: 'Cursisten',
                    vaardigheden: 'Vaardigheden',
                    observaties: 'Observaties',
                    opdrachten: 'Opdrachten',
                    toegang: 'Toegang',
                    advies: 'Lesadvies',
                  } as Record<string, string>
                )[route[0]] ?? 'Mijn klassen')}
          </h2>
          <Link
            prefetch={false}
            className="primary-button"
            href={href('/klassen/nieuw')}
          >
            <Plus />
            Nieuwe klas
          </Link>
        </div>
        <p>
          {classes.length
            ? 'Kies de klas waarin je wilt werken.'
            : 'Maak je eerste klas aan. Je kunt daarna voorlopige cursisten toevoegen en observeren.'}
        </p>
        <div className="ki-cards">
          {classes.map((c) => (
            <article className="ki-card" key={c.id}>
              <h3>{c.name}</h3>
              <p>
                {c.start_level} · {c.learners_count} cursisten ·{' '}
                {c.status === 'active' ? 'Actief' : 'Gearchiveerd'}
              </p>
              <Link
                prefetch={false}
                className="secondary-button"
                href={href(
                  `/klassen/${c.id}${section && section !== 'klassen' ? `/${section}` : ''}`,
                )}
              >
                Openen <ArrowRight />
              </Link>
              {!route[0] && (
                <Link
                  prefetch={false}
                  href={href(`/klassen/${c.id}/observeren`)}
                >
                  Observeren
                </Link>
              )}
            </article>
          ))}
        </div>
      </>
    );
  if (!detail) return <output>Klas openen…</output>;
  const go = (part = '') => href(`/klassen/${gid}${part ? `/${part}` : ''}`);
  return (
    <>
      <Link prefetch={false} href={href('/klassen')} className="ki-back">
        <ArrowLeft />
        Mijn klassen
      </Link>
      <div className="ki-actions">
        <div>
          <h2>{detail.group.name}</h2>
          <p>
            {detail.group.start_level} ·{' '}
            {
              detail.learners.filter((l) => l.enrollment_status === 'active')
                .length
            }{' '}
            cursisten ·{' '}
            {detail.group.status === 'active' ? 'Actief' : 'Gearchiveerd'}
          </p>
        </div>
        <Link prefetch={false} href={go('bewerken')}>
          Bewerken
        </Link>
      </div>
      <div className="ki-actions">
        <Link
          prefetch={false}
          href={go('toevoegen')}
          className="secondary-button"
        >
          <Plus />
          Cursist toevoegen
        </Link>
        <Link
          prefetch={false}
          href={go('observeren')}
          className="primary-button"
        >
          <ClipboardPen />
          Observeren
        </Link>
        <Link prefetch={false} href={go('opdrachten')}>
          Oefening klaarzetten
        </Link>
      </div>
      <nav className="ki-tabs" aria-label="Klas">
        {[
          ['cursisten', 'Cursisten'],
          ['matrix', 'Vaardigheden'],
          ['observaties', 'Observaties'],
          ['rapportages', 'Rapportages'],
          ['opdrachten', 'Opdrachten'],
          ['toegang', 'Toegang'],
        ].map(([p, label]) => (
          <Link
            prefetch={false}
            key={p}
            href={go(p)}
            aria-current={section === p ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
        <details>
          <summary>Meer</summary>
          <Link prefetch={false} href={go('advies')}>
            Lesadvies
          </Link>
          <a href={`/api/inzicht/classes/${gid}/export?school=${school}`}>
            Klaslijst downloaden
          </a>
          <a href={`/api/inzicht/classes/${gid}/report?school=${school}`}>
            Onderwijsrapport downloaden
          </a>
        </details>
      </nav>
      {section === 'rapportages' ? (
        <Reports
          key={school + gid}
          school={school}
          group={gid}
          learners={detail.learners}
          initialLearner={search.get('learner') ?? ''}
          go={go}
        />
      ) : section === 'toevoegen' ? (
        <AddLearner
          school={school}
          group={gid}
          done={(id) => router.push(go(`profiel/${id}`))}
          cancel={go()}
        />
      ) : section === 'bewerken' ? (
        <EditClass
          school={school}
          group={detail.group}
          done={() => router.push(go())}
        />
      ) : section === 'observeren' &&
        !search.get('correction') &&
        !search.get('general') ? (
        <>
          <Link prefetch={false} href={go('observeren') + '&general=1'}>
            Algemene vaardigheidsobservatie
          </Link>
          <SourceObservationForm
            school={school}
            group={gid}
            learners={detail.learners}
            selected={search.get('learner') ?? ''}
            originalId={search.get('source') ?? ''}
          />
        </>
      ) : section === 'observeren' ? (
        <ObservationForm
          school={school}
          group={gid}
          learners={detail.learners}
          selected={search.get('learner') ?? ''}
          correction={search.get('correction') ?? ''}
          done={(id) => router.push(go(`profiel/${id}`) + '&saved=1')}
        />
      ) : section === 'profiel' ? (
        <LearnerProfile school={school} group={gid} id={route[3]} go={go} />
      ) : section === 'matrix' || section === 'vaardigheden' ? (
        matrix && (
          <MatrixView school={school} group={gid} go={go} initial={matrix} />
        )
      ) : section === 'bewijs' ? (
        <EvidenceView
          school={school}
          group={gid}
          learner={search.get('learner') ?? ''}
          skill={search.get('skill') ?? ''}
          go={go}
        />
      ) : section === 'toegang' ? (
        <AccessForm school={school} group={gid} learners={detail.learners} />
      ) : section === 'opdrachten' ? (
        <Assignments school={school} group={gid} learners={detail.learners} />
      ) : section === 'advies' ? (
        <Advice school={school} group={gid} />
      ) : section === 'observaties' ? (
        <section className="ki-card">
          <h3>Observaties per cursist</h3>
          <p>
            Kies een cursist om de volledige historie te bekijken of een nieuwe
            observatie toe te voegen.
          </p>
          <Learners learners={detail.learners} go={go} />
        </section>
      ) : (
        <>
          <Learners learners={detail.learners} go={go} />
          <Link
            prefetch={false}
            className="primary-button ki-advice"
            href={go('advies')}
          >
            Wat heeft mijn groep morgen nodig?
          </Link>
        </>
      )}
    </>
  );
}
function Learners({
  learners,
  go,
}: {
  learners: Learner[];
  go: (p?: string) => string;
}) {
  return (
    <section className="ki-card">
      <h3>Cursisten</h3>
      {!learners.length ? (
        <p>Voeg cursisten toe om te beginnen.</p>
      ) : (
        <ul className="ki-list">
          {learners.map((l) => (
            <li key={l.id}>
              <Link prefetch={false} href={go(`profiel/${l.id}`)}>
                {l.display_name}
              </Link>
              <span>
                {l.membership_id
                  ? 'Gekoppeld account'
                  : 'Nog geen Klink-account'}
              </span>
              <Link
                prefetch={false}
                href={go('observeren') + `&learner=${l.id}`}
              >
                Observeren
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
function NewClass({
  school,
  done,
  cancel,
}: {
  school: string;
  done: (id: string) => void;
  cancel: string;
}) {
  const { save, busy, error } = useSave();
  return (
    <section className="ki-card">
      <h2>Nieuwe klas</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void save<{ id: string }>(
            'classes',
            school,
            {
              name: f.get('name'),
              start_level: f.get('level'),
              period: f.get('period'),
            },
            (r) => done(r.id),
          );
        }}
      >
        <Field label="Klasnaam">
          <input name="name" required maxLength={100} />
        </Field>
        <Field label="Startniveau">
          <select name="level">
            {ROUTES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <Field label="Periode (optioneel)">
          <input name="period" maxLength={100} />
        </Field>
        <p>Het startniveau beperkt de leerstof niet. Stel toegang apart in.</p>
        <ErrorText text={error} />
        <div className="ki-actions">
          <button className="primary-button" disabled={busy}>
            {busy ? 'Bewaren…' : 'Klas bewaren'}
          </button>
          <Link prefetch={false} href={cancel}>
            Annuleren
          </Link>
        </div>
      </form>
    </section>
  );
}
function AddLearner({
  school,
  group,
  done,
  cancel,
}: {
  school: string;
  group: string;
  done: (id: string) => void;
  cancel: string;
}) {
  const { save, busy, error } = useSave();
  return (
    <section className="ki-card">
      <h3>Voorlopige cursist toevoegen</h3>
      <p>
        De naam maakt een nieuw schoolprofiel. Een bestaand account wordt nooit
        automatisch gekoppeld.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save<{ id: string }>(
            `classes/${group}/learners`,
            school,
            { name: new FormData(e.currentTarget).get('name') },
            (r) => done(r.id),
          );
        }}
      >
        <Field label="Naam">
          <input name="name" required maxLength={100} />
        </Field>
        <ErrorText text={error} />
        <div className="ki-actions">
          <button className="primary-button" disabled={busy}>
            Cursist bewaren
          </button>
          <Link prefetch={false} href={cancel}>
            Annuleren
          </Link>
        </div>
      </form>
    </section>
  );
}
function EditClass({
  school,
  group,
  done,
}: {
  school: string;
  group: Group;
  done: () => void;
}) {
  const { save, busy, error } = useSave();
  return (
    <section className="ki-card">
      <h3>Klas bewerken</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void save(
            `classes/${group.id}`,
            school,
            {
              name: f.get('name'),
              status: f.get('status'),
              expected_version: group.version,
            },
            done,
          );
        }}
      >
        <Field label="Klasnaam">
          <input
            name="name"
            defaultValue={group.name}
            required
            maxLength={100}
          />
        </Field>
        <Field label="Status">
          <select name="status" defaultValue={group.status}>
            <option value="active">Actief</option>
            <option value="archived">Archiveren; historie behouden</option>
          </select>
        </Field>
        <ErrorText text={error} />
        <button className="primary-button" disabled={busy}>
          Wijziging bevestigen
        </button>
      </form>
    </section>
  );
}

function ObservationForm({
  school,
  group,
  learners,
  selected,
  correction,
  done,
}: {
  school: string;
  group: string;
  learners: Learner[];
  selected: string;
  correction: string;
  done: (id: string) => void;
}) {
  const { save, busy, error } = useSave(),
    [defs, setDefs] = useState<Skill[]>([]),
    [original, setOriginal] = useState<Observation | null>(null),
    [loadError, setLoadError] = useState('');
  useEffect(() => {
    let active = true;
    Promise.all([
      api<Skill[]>('skills', school),
      correction
        ? api<Profile>(`learners/${selected}?class=${group}`, school)
        : Promise.resolve(null),
    ])
      .then(([s, p]) => {
        if (active) {
          setDefs(s);
          setOriginal(p?.observations.find((o) => o.id === correction) ?? null);
        }
      })
      .catch((e) => {
        if (active) setLoadError(e.message);
      });
    return () => {
      active = false;
    };
  }, [school, group, selected, correction]);
  if (!learners.length) return <p>Voeg eerst een cursist toe.</p>;
  if (loadError) return <ErrorText text={loadError} />;
  if (!defs.length || (correction && !original))
    return <p>Formulier openen…</p>;
  function submit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const lid = f.get('learner') as string;
    void save(
      `observations${correction ? `/${correction}` : ''}`,
      school,
      {
        class_id: group,
        learner_id: lid,
        skill_id: f.get('skill'),
        situation: f.get('situation'),
        outcome: f.get('outcome'),
        independence: f.get('independence'),
        note: f.get('note') ?? '',
        observed_at: new Date(f.get('date') as string).toISOString(),
        ...(original
          ? {
              expected_revision: original.current_revision,
              reason: f.get('reason'),
            }
          : {}),
      },
      () => done(lid),
    );
  }
  return (
    <section className="ki-card">
      <h3>{correction ? 'Observatie corrigeren' : 'Observeren'}</h3>
      <form onSubmit={submit}>
        <Field label="Cursist">
          <select name="learner" defaultValue={selected || learners[0].id}>
            {learners.map((l) => (
              <option key={l.id} value={l.id}>
                {l.display_name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Vaardigheid">
          <select name="skill" defaultValue={original?.skill_id}>
            {defs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Concrete taaksituatie">
          <input
            name="situation"
            required
            maxLength={300}
            defaultValue={original?.payload.situation}
          />
        </Field>
        <div className="ki-columns">
          <Field label="Waargenomen resultaat">
            <select
              name="outcome"
              defaultValue={original?.payload.outcome ?? 'not_assessed'}
            >
              {Object.entries(outcomes).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Zelfstandigheid">
            <select
              name="independence"
              defaultValue={original?.payload.independence ?? 'unknown'}
            >
              {Object.entries(independence).map(([v, l]) => (
                <option key={v} value={v}>
                  {l}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <details open={Boolean(correction)}>
          <summary>Meer details</summary>
          <Field label="Observatiedatum">
            <input
              type="datetime-local"
              name="date"
              required
              defaultValue={new Date(
                Date.parse(
                  original?.payload.observed_at ?? new Date().toISOString(),
                ) -
                  new Date().getTimezoneOffset() * 60000,
              )
                .toISOString()
                .slice(0, 16)}
            />
          </Field>
          <Field label="Didactische opmerking (optioneel)">
            <textarea
              name="note"
              maxLength={1000}
              defaultValue={original?.payload.note}
            />
          </Field>
          <p>
            Beschrijf wat de cursist bij een taak deed. Noteer geen medische of
            andere gevoelige details.
          </p>
          {original && (
            <Field label="Reden voor correctie">
              <input name="reason" required maxLength={300} />
            </Field>
          )}
        </details>
        <p>
          Deze observatie wordt bewaard als didactische notitie. Zonder
          goedgekeurde rubric is dit geen meetbewijs.
        </p>
        <ErrorText text={error} />
        <button className="primary-button" disabled={busy}>
          {busy ? 'Bewaren…' : 'Observatie bewaren'}
        </button>
      </form>
    </section>
  );
}
function LearnerProfile({
  school,
  group,
  id,
  go,
}: {
  school: string;
  group: string;
  id: string;
  go: (p?: string) => string;
}) {
  const [data, setData] = useState<Profile | null>(null),
    [error, setError] = useState('');
  const search = useSearchParams();
  useEffect(() => {
    let active = true;
    api<Profile>(`learners/${id}?class=${group}`, school)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [school, group, id]);
  if (error) return <ErrorText text={error} />;
  if (!data) return <p>Profiel ophalen…</p>;
  return (
    <section className="ki-card">
      <div className="ki-actions">
        <h3>{data.learner.display_name}</h3>
        <Link
          prefetch={false}
          className="primary-button"
          href={go('observeren') + `&learner=${id}`}
        >
          Observeren
        </Link>
      </div>
      <p>
        {data.link
          ? 'Geverifieerd schoolaccount'
          : 'Nog geen Klink-account · voorlopige cursist'}
      </p>
      {search.get('saved') && (
        <output>
          Opgeslagen als observatie; geen meetbewijs. De voortgangsverwerking
          kan nog bezig zijn.
        </output>
      )}
      <SourceObservationHistory
        school={school}
        group={group}
        learnerId={id}
        go={go}
      />
      <h4>Oudere algemene observaties</h4>
      {!data.observations.length ? (
        <p>Nog geen observaties.</p>
      ) : (
        data.observations.map((o) => (
          <article className="ki-observation" key={o.id}>
            <p>
              <time>
                {new Date(o.payload.observed_at).toLocaleString('nl-NL')}
              </time>{' '}
              · versie {o.current_revision}
            </p>
            <h4>{o.payload.situation}</h4>
            <p>
              {asText(o.payload.outcome, outcomes)} ·{' '}
              {asText(o.payload.independence, independence)}
            </p>
            <p>{o.payload.note}</p>
            <Link
              prefetch={false}
              href={go('observeren') + `&learner=${id}&correction=${o.id}`}
            >
              Corrigeren met reden
            </Link>
          </article>
        ))
      )}
      <details>
        <summary>Volledige correctiehistorie</summary>
        {data.history.map((h, i) => (
          <article key={i}>
            <p>
              Versie {h.revision} · {h.reason}
            </p>
            <p>
              {h.payload.situation} · {asText(h.payload.outcome, outcomes)}
            </p>
          </article>
        ))}
      </details>
    </section>
  );
}
function MatrixView({
  school,
  group,
  go,
  initial,
}: {
  school: string;
  group: string;
  go: (p?: string) => string;
  initial: Matrix;
}) {
  const [data, setData] = useState(initial),
    [offset, setOffset] = useState(0);
  const save = useSave();
  const visible = data.skills.slice(offset, offset + 20);
  return (
    <section className="ki-card">
      <h3>Vaardigheden</h3>
      <p>
        Niet gemeten betekent niet dat iemand het niet kan. Extra ondersteuning
        en hercontrole zijn afzonderlijke signalen.
      </p>
      {data.pending > 0 && (
        <div>
          <output>
            Observaties opgeslagen; verwerking voortgang nog bezig (
            {data.pending}).
          </output>
          <button
            className="secondary-button"
            disabled={save.busy}
            onClick={() =>
              void save.save<Matrix>(
                `classes/${group}/matrix`,
                school,
                {},
                setData,
              )
            }
          >
            Voortgang bijwerken
          </button>
        </div>
      )}
      <ErrorText text={save.error} />
      <section className="ki-table" aria-label="Vaardighedenmatrix">
        <table>
          <thead>
            <tr>
              <th scope="col">Cursist</th>
              {visible.map((s) => (
                <th key={s.id} scope="col">
                  {s.label}
                  <small>
                    {data.rows.filter((r) => r.cells[s.id].measured).length}{' '}
                    gemeten / {data.rows.length} actief
                  </small>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r) => (
              <tr key={r.id}>
                <th scope="row">{r.name}</th>
                {visible.map((s) => (
                  <td key={s.id}>
                    <Link
                      prefetch={false}
                      href={go('bewijs') + `&learner=${r.id}&skill=${s.id}`}
                      aria-label={`${r.name}, ${s.label}, ${labels[r.cells[s.id].status]}, bekijk bewijs`}
                    >
                      <Status value={r.cells[s.id]} />
                    </Link>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      {!data.rows.length && <p>Nog geen cursisten.</p>}
      {data.skills.length > 20 && (
        <div className="ki-actions">
          <button
            disabled={!offset}
            onClick={() => setOffset(Math.max(0, offset - 20))}
          >
            Vorige leerdoelen
          </button>
          <button
            disabled={offset + 20 >= data.skills.length}
            onClick={() => setOffset(offset + 20)}
          >
            Volgende leerdoelen
          </button>
        </div>
      )}
    </section>
  );
}
function EvidenceView({
  school,
  group,
  learner,
  skill,
  go,
}: {
  school: string;
  group: string;
  learner: string;
  skill: string;
  go: (p?: string) => string;
}) {
  const [data, setData] = useState<EvidenceDetail | null>(null),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api<EvidenceDetail>(
      `evidence?class=${group}&learner=${learner}&skill=${skill}`,
      school,
    )
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [school, group, learner, skill]);
  if (error) return <ErrorText text={error} />;
  if (!data) return <p>Bewijs ophalen…</p>;
  return (
    <section className="ki-card">
      <Link prefetch={false} href={go('matrix')}>
        Terug naar de matrix
      </Link>
      <h3>{data.skill.label}</h3>
      <p>
        <Status value={data.mastery} />
      </p>
      <h4>Waarom?</h4>
      <p>
        Alleen geschikt, onafhankelijk, individueel meetbewijs kan de
        beheersingsstatus verhogen. Oefenactiviteit en algemene observaties
        blijven apart.
      </p>
      {!data.events.length ? (
        <p>Nog geen onderliggend bewijs.</p>
      ) : (
        data.events.map((e) => (
          <article key={e.id}>
            <p>
              {new Date(e.occurred_at).toLocaleDateString('nl-NL')} ·{' '}
              {e.relation === 'TRAIN'
                ? 'Observatie/oefenactiviteit; geen meting'
                : 'Meetbewijs'}{' '}
              · bronversie {e.source_revision}
              {e.revoked ? ' · vervangen of ingetrokken' : ''}
            </p>
            <p>{asText(e.outcome, outcomes)}</p>
          </article>
        ))
      )}
      <Link
        prefetch={false}
        className="primary-button"
        href={go('observeren') + `&learner=${learner}`}
      >
        Observeren / opnieuw controleren
      </Link>
    </section>
  );
}

function AccessForm({
  school,
  group,
  learners,
}: {
  school: string;
  group: string;
  learners: Learner[];
}) {
  const [target, setTarget] = useState('*'),
    [policy, setPolicy] = useState<Policy | null>(null),
    [preview, setPreview] = useState<{
      impact_hash: string;
      affected: { id: string }[];
    } | null>(null),
    [inherit, setInherit] = useState(false),
    [notice, setNotice] = useState(''),
    [loadError, setLoadError] = useState('');
  const save = useSave();
  useEffect(() => {
    let active = true;
    api<Policy>(`classes/${group}/policy?learner=${target}`, school)
      .then((p) => {
        if (active) setPolicy(p);
      })
      .catch((e) => {
        if (active) setLoadError(e.message);
      });
    return () => {
      active = false;
    };
  }, [school, group, target]);
  return (
    <section className="ki-card">
      <h3>Leerstoftoegang</h3>
      <Field label="Voor wie">
        <select
          value={target}
          onChange={(e) => {
            setTarget(e.target.value);
            setInherit(false);
            setPolicy(null);
            setPreview(null);
            setNotice('');
          }}
        >
          <option value="*">Klasstandaard</option>
          {learners.map((l) => (
            <option key={l.id} value={l.id}>
              {l.display_name} · individuele uitzondering
            </option>
          ))}
        </select>
      </Field>
      <ErrorText text={loadError} />
      {policy && (
        <>
          {target !== '*' && (
            <button
              className="secondary-button"
              disabled={save.busy}
              onClick={() => {
                void api<Policy>(`classes/${group}/policy`, school)
                  .then((p) => {
                    setPolicy(p);
                    setInherit(true);
                    setPreview(null);
                  })
                  .catch((e) => setLoadError(e.message));
              }}
            >
              Klasstandaard herstellen
            </button>
          )}
          {inherit && (
            <p>
              Na bevestiging volgt deze cursist weer de klasstandaard, ook bij
              latere wijzigingen.
            </p>
          )}
          <fieldset>
            <legend>Beschikbare leerroutes</legend>
            {ROUTES.map((r) => (
              <label className="ki-check" key={r}>
                <input
                  type="checkbox"
                  checked={policy.allowed_routes.includes(r)}
                  onChange={(e) => {
                    setInherit(false);
                    setPolicy({
                      ...policy,
                      allowed_routes: e.target.checked
                        ? [...policy.allowed_routes, r]
                        : policy.allowed_routes.filter((x) => x !== r),
                    });
                    setPreview(null);
                  }}
                />
                {r}
              </label>
            ))}
          </fieldset>
          <Field label="Oefenmodus">
            <select
              value={policy.exercise_mode}
              onChange={(e) => {
                setInherit(false);
                setPolicy({
                  ...policy,
                  exercise_mode: e.target.value as Policy['exercise_mode'],
                });
                setPreview(null);
              }}
            >
              <option value="free">Vrij binnen toegestane routes</option>
              <option value="assigned">Alleen opdrachten</option>
            </select>
          </Field>
          <p>
            Dit geldt alleen in deze schoolklas. De persoonlijke Klink-omgeving
            blijft apart.
          </p>
          <button
            className="secondary-button"
            disabled={save.busy}
            onClick={() =>
              void save.save(
                `classes/${group}/policy`,
                school,
                { learner_id: target, ...policy, inherit, preview: true },
                setPreview,
              )
            }
          >
            Bekijk impact en cursistaanbod
          </button>
          {preview && (
            <div className="ki-preview">
              <h4>Dit ziet de cursist</h4>
              <p>
                {policy.allowed_routes.join(', ') || 'Geen routes beschikbaar'}{' '}
                ·{' '}
                {policy.exercise_mode === 'free'
                  ? 'vrij oefenen'
                  : 'alleen opdrachten'}
              </p>
              <p>
                {preview.affected.length} open opdrachten opnieuw gecontroleerd
                bij starten; historie blijft bewaard.
              </p>
              <button
                className="primary-button"
                disabled={save.busy}
                onClick={() =>
                  void save.save(
                    `classes/${group}/policy`,
                    school,
                    {
                      learner_id: target,
                      inherit,
                      ...policy,
                      impact_hash: preview.impact_hash,
                      confirmed: true,
                    },
                    () => {
                      setPreview(null);
                      setNotice('Toegang opgeslagen.');
                    },
                  )
                }
              >
                Toegang bevestigen
              </button>
            </div>
          )}
        </>
      )}
      <ErrorText text={save.error} />
      <output>{notice}</output>
    </section>
  );
}
function Assignments({
  school,
  group,
  learners,
}: {
  school: string;
  group: string;
  learners: Learner[];
}) {
  const [catalog, setCatalog] = useState<Content[]>([]),
    [list, setList] = useState<Assignment[]>([]),
    [selected, setSelected] = useState(''),
    [recipients, setRecipients] = useState<string[]>([]),
    [preview, setPreview] = useState(false),
    [note, setNote] = useState(''),
    [start, setStart] = useState(''),
    [end, setEnd] = useState(''),
    [withdraw, setWithdraw] = useState(''),
    [notice, setNotice] = useState(''),
    [loadError, setLoadError] = useState('');
  const save = useSave();
  useEffect(() => {
    let active = true;
    Promise.all([
      api<Content[]>(`classes/${group}/catalog`, school),
      api<Assignment[]>(`classes/${group}/assignments`, school),
    ])
      .then(([c, a]) => {
        if (active) {
          setCatalog(c.filter((x) => x.product === 'klink'));
          setList(a);
        }
      })
      .catch((e) => {
        if (active) setLoadError(e.message);
      });
    return () => {
      active = false;
    };
  }, [school, group]);
  const content = catalog.find((c) => c.id === selected);
  return (
    <section className="ki-card">
      <h3>Oefening klaarzetten</h3>
      <ErrorText text={loadError} />
      {!catalog.length ? (
        <p>Geen passende gecontroleerde oefening beschikbaar.</p>
      ) : (
        <>
          <Field label="1. Selecteer oefening">
            <select
              value={selected}
              onChange={(e) => {
                setSelected(e.target.value);
                setPreview(false);
              }}
            >
              <option value="">Kies een gepubliceerde oefening</option>
              {catalog.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title} · {c.level_code}
                </option>
              ))}
            </select>
          </Field>
          <fieldset>
            <legend>2. Voor wie</legend>
            {learners
              .filter((l) => l.enrollment_status === 'active')
              .map((l) => (
                <label className="ki-check" key={l.id}>
                  <input
                    type="checkbox"
                    checked={recipients.includes(l.id)}
                    onChange={(e) => {
                      setRecipients(
                        e.target.checked
                          ? [...recipients, l.id]
                          : recipients.filter((id) => id !== l.id),
                      );
                      setPreview(false);
                    }}
                  />
                  {l.display_name}
                </label>
              ))}
          </fieldset>
          <Field label="Instructie voor de cursist">
            <textarea
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                setPreview(false);
              }}
              maxLength={1000}
            />
          </Field>
          <Field label="3. Beschikbaar vanaf (leeg is direct)">
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => {
                setStart(e.target.value);
                setPreview(false);
              }}
            />
          </Field>
          <Field label="Beschikbaar tot (leeg is zonder einddatum)">
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => {
                setEnd(e.target.value);
                setPreview(false);
              }}
            />
          </Field>
          <button
            className="secondary-button"
            disabled={!content || !recipients.length}
            onClick={() => setPreview(true)}
          >
            4. Bekijk cursistvoorbeeld
          </button>
          {preview && content && (
            <div className="ki-preview">
              <h4>{content.title}</h4>
              <p>{note}</p>
              <p>
                {start
                  ? new Date(start).toLocaleString('nl-NL')
                  : 'Direct beschikbaar'}{' '}
                ·{' '}
                {end
                  ? `tot ${new Date(end).toLocaleString('nl-NL')}`
                  : 'zonder einddatum'}
              </p>
              <p>
                {recipients.length} cursisten · oefenactiviteit, geen
                automatische beheersingsscore.
              </p>
              <button
                className="primary-button"
                disabled={save.busy}
                onClick={() =>
                  void save.save(
                    `classes/${group}/assignments`,
                    school,
                    {
                      content_id: selected,
                      learner_ids: recipients,
                      starts_at: start
                        ? new Date(start).toISOString()
                        : new Date().toISOString(),
                      ends_at: end ? new Date(end).toISOString() : null,
                      instructions: note,
                    },
                    () => {
                      setPreview(false);
                      setNotice('Opdracht bewaard.');
                      api<Assignment[]>(`classes/${group}/assignments`, school)
                        .then(setList)
                        .catch((e) => setLoadError(e.message));
                    },
                  )
                }
              >
                5. Opdracht bevestigen
              </button>
            </div>
          )}
        </>
      )}
      <ErrorText text={save.error} />
      <output>{notice}</output>
      <h4>Bewaarde opdrachten</h4>
      {!list.length ? (
        <p>Nog geen opdrachten.</p>
      ) : (
        list.map((a) => (
          <article className="ki-preview" key={a.id}>
            <p>
              {a.title} · {a.status === 'active' ? 'Actief' : 'Ingetrokken'}
            </p>
            <p>
              Vanaf {new Date(a.starts_at).toLocaleString('nl-NL')}
              {a.ends_at
                ? ` tot ${new Date(a.ends_at).toLocaleString('nl-NL')}`
                : ''}
            </p>
            {a.status === 'active' &&
              (withdraw !== a.id ? (
                <button
                  className="secondary-button"
                  onClick={() => setWithdraw(a.id)}
                >
                  Opdracht intrekken
                </button>
              ) : (
                <>
                  <p>
                    Intrekken sluit deze opdracht voor cursisten. Opgeslagen
                    pogingen en historie blijven bewaard.
                  </p>
                  <button
                    className="primary-button"
                    disabled={save.busy}
                    onClick={() =>
                      void save.save(
                        `classes/${group}/assignments/${a.id}`,
                        school,
                        { action: 'withdraw', confirmed: true },
                        () => {
                          setWithdraw('');
                          setList(
                            list.map((item) =>
                              item.id === a.id
                                ? { ...item, status: 'withdrawn' }
                                : item,
                            ),
                          );
                          setNotice('Opdracht ingetrokken.');
                        },
                      )
                    }
                  >
                    Intrekken bevestigen
                  </button>
                  <button
                    className="secondary-button"
                    onClick={() => setWithdraw('')}
                  >
                    Annuleren
                  </button>
                </>
              ))}
          </article>
        ))
      )}
    </section>
  );
}
function Advice({ school, group }: { school: string; group: string }) {
  const [date, setDate] = useState(() => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d.toLocaleDateString('en-CA');
    }),
    [source, setSource] = useState('UNKNOWN'),
    [preview, setPreview] = useState<Preview | null>(null),
    [notice, setNotice] = useState(''),
    [note, setNote] = useState('');
  const save = useSave();
  return (
    <section className="ki-card">
      <h3>Wat heeft mijn groep morgen nodig?</h3>
      <p>Voorstellen volgens vaste regels. Jij bepaalt wat je gebruikt.</p>
      <Field label="Lesdatum">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setSource('TEACHER_SELECTED');
            setPreview(null);
          }}
          required
        />
      </Field>
      {source === 'UNKNOWN' && (
        <p>
          Er is geen bevestigd rooster. Morgen is een voorstel, geen ingeplande
          les.
        </p>
      )}
      <button
        className="primary-button"
        disabled={save.busy}
        onClick={() =>
          void save.save(
            `classes/${group}/recommendations`,
            school,
            { target_date: date, schedule_source: source },
            setPreview,
          )
        }
      >
        Voorstel bekijken
      </button>
      <ErrorText text={save.error} />
      {preview && (
        <>
          <p>{preview.warning}</p>
          {!preview.suggestions.length ? (
            <p>Nog geen cursisten of adviezen.</p>
          ) : (
            preview.suggestions.map((s, i) => (
              <article className="ki-preview" key={i}>
                <h4>
                  Voorstel ·{' '}
                  {s.type === 'whole-class'
                    ? 'Samen herhalen'
                    : s.type === 'small-group'
                      ? 'Kleine ondersteuningsgroep'
                      : s.type === 'extension'
                        ? 'Vervolg verkennen'
                        : 'Eerst controleren'}
                </h4>
                <p>{s.rationale}</p>
                <p>
                  Gemeten {s.measured} van {s.active} · aandacht {s.attention}{' '}
                  van {s.measured}
                </p>
                <p>
                  {s.content_id
                    ? 'Een gepubliceerde oefening is gevonden. Kies de concrete opdracht via Oefening klaarzetten.'
                    : 'Geen passende gecontroleerde oefening beschikbaar.'}
                </p>
                <p>
                  {s.duration === null
                    ? 'Duur onbekend'
                    : `${s.duration} minuten`}{' '}
                  · {s.evidence_ids.length} onderliggende bewijzen
                </p>
              </article>
            ))
          )}
          <Field label="Mijn leskeuze / aanpassing">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={1000}
            />
          </Field>
          <div className="ki-actions">
            <button
              className="primary-button"
              disabled={save.busy}
              onClick={() =>
                void save.save(
                  `plans/${preview.id}`,
                  school,
                  { action: 'approve', confirmed: true, note, assignments: [] },
                  () => {
                    setPreview(null);
                    setNotice(
                      'Leskeuze bewaard. Er zijn geen opdrachten automatisch uitgegeven.',
                    );
                  },
                )
              }
            >
              <Check />
              Leskeuze goedkeuren
            </button>
            <button
              className="secondary-button"
              disabled={save.busy}
              onClick={() =>
                void save.save(
                  `plans/${preview.id}`,
                  school,
                  { action: 'reject' },
                  () => {
                    setPreview(null);
                    setNotice(
                      'Voorstel overgeslagen; leerlingstatus ongewijzigd.',
                    );
                  },
                )
              }
            >
              Overslaan
            </button>
          </div>
        </>
      )}
      <output>{notice}</output>
    </section>
  );
}

function OperationalStatus({ school }: { school: string }) {
  const [status, setStatus] = useState<{
    pending_groups: number;
    failed_groups: number;
    last_success_at: string | null;
  } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api<{
      pending_groups: number;
      failed_groups: number;
      last_success_at: string | null;
    }>('operations', school)
      .then((value) => {
        if (active) setStatus(value);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [school]);
  return (
    <section aria-label="Verwerkingsstatus">
      <h3>Voortgang verwerken</h3>
      {status ? (
        <>
          <p>
            Klassen in verwerking: {status.pending_groups}. Daarvan wachten op
            een nieuwe poging: {status.failed_groups}.
          </p>
          <p>
            {status.failed_groups
              ? 'Een berekening is niet gelukt. De gegevens zijn bewaard; de testomgeving probeert het opnieuw.'
              : 'Er is geen verwerkingsfout gemeld.'}
          </p>
          <p>
            Laatste geslaagde automatische verwerking:{' '}
            {status.last_success_at
              ? new Date(status.last_success_at).toLocaleString('nl-NL')
              : 'nog niet beschikbaar'}
            .
          </p>
          <p>Vernieuw de pagina om de actuele status op te halen.</p>
        </>
      ) : (
        <p>{error || 'Status ophalen…'}</p>
      )}
    </section>
  );
}
