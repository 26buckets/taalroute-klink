/* oxlint-disable jsx-a11y/prefer-tag-over-role -- Composite charts use keyboard-tested DOM/SVG semantics rather than raster images. */
'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api, useSave } from './client';
import { ROUTES } from '@/lib/inzicht/rules';
import {
  sourceModes,
  sourceMaterials,
  sourceMarks,
  type SourceMode,
} from '@/lib/inzicht/source-observation';
import {
  type buildReport,
  type SourcePayload,
  type Hours,
} from '@/lib/inzicht/reports';
import { NationalComparison } from './national-comparison';

type Distribution = ReturnType<typeof buildReport>['total'];
type Report = ReturnType<typeof buildReport> & {
  learners: { id: string; display_name: string }[];
  hours: Hours[];
  proofs: {
    id: string;
    learner_id: string;
    skill_id: string;
    skill_label: string;
    eligible: boolean;
    revoked: boolean;
    relation: string;
    correct: number;
    total: number;
    occurred_at: string;
    source_revision: number;
  }[];
};
type Detail = {
  revision: number;
  payload: SourcePayload;
  observation: { author_id: string; learner_name: string };
  history: {
    revision: number;
    payload: SourcePayload;
    changed_by: string;
    recorded_at: string;
  }[];
};
const pct = (n: number | null) =>
  n === null ? 'Niet beschikbaar' : `${Math.round(n * 100)}%`;
function Bars({ value, label }: { value: Distribution; label: string }) {
  const numbers = [
    value.independent,
    value.supported,
    value.unobserved,
    value.empty,
  ];
  return (
    <div className="ki-report-bars">
      <div
        className="ki-report-bar"
        role="img"
        aria-label={`${label}: ${numbers.map((n, i) => `${i < 3 ? sourceMarks[i].label : 'Niet ingevuld'} ${n}`).join(', ')}`}
      >
        {numbers.map((n, i) =>
          n > 0 ? (
            <span
              key={i}
              className={`ki-report-mark ki-report-mark-${i}`}
              style={{ width: `${value.total ? (n / value.total) * 100 : 0}%` }}
              aria-hidden="true"
            >
              {n}
            </span>
          ) : null,
        )}
      </div>
      <p className="ki-report-counts">
        ✓ {numbers[0]} · △ {numbers[1]} · — {numbers[2]} · Niet ingevuld{' '}
        {numbers[3]} · dekking {pct(value.coverage)} ({value.assessed}/
        {value.total})
      </p>
    </div>
  );
}
function ObservationPlot({
  points,
  axis,
  criterion,
  open,
}: {
  points: Report['points'];
  axis: string;
  criterion: number;
  open: (id: string, learner: string) => void;
}) {
  const visible = points
    .filter((p) => axis !== 'hours' || p.hours !== null)
    .slice(-100);
  const xValue = (p: Report['points'][number]) =>
    axis === 'hours' ? p.hours! : Date.parse(p.payload.observed_at);
  const xs = visible.map(xValue),
    lo = Math.min(...xs),
    hi = Math.max(...xs);
  const x = (p: Report['points'][number]) =>
    hi === lo ? 340 : 140 + ((xValue(p) - lo) / (hi - lo)) * 510;
  const labels = [
    'Zonder directe hulp',
    'Met hulp of model',
    'Niet waargenomen',
    'Niet ingevuld',
  ];
  const tick = (v: number) =>
    axis === 'hours'
      ? `${v.toFixed(2)} uur`
      : new Date(v).toLocaleString(
          'nl-NL',
          hi - lo < 86400000
            ? {
                day: 'numeric',
                month: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }
            : { day: 'numeric', month: 'numeric', year: 'numeric' },
        );
  return (
    <figure>
      <figcaption>
        Meetmomenten op {axis === 'hours' ? 'geregistreerde lesuren' : 'datum'}{' '}
        · klik een punt voor de bron
      </figcaption>
      {!visible.length ? (
        <p>Geen meetmomenten met deze tijdas beschikbaar.</p>
      ) : (
        <svg
          viewBox="0 0 700 245"
          className="ki-observation-plot"
          aria-label="Categorische observatiegrafiek, geen niveauscore"
        >
          {labels.map((l, i) => (
            <g key={l}>
              <text x="2" y={35 + i * 45} fontSize="12" fill="currentColor">
                {l}
              </text>
              <line
                x1="140"
                y1={30 + i * 45}
                x2="650"
                y2={30 + i * 45}
                stroke="currentColor"
                opacity="0.2"
              />
            </g>
          ))}
          {visible.map((p) => {
            const values =
              criterion < 0 ? p.payload.values : [p.payload.values[criterion]];
            return [0, 1, 2, null].map((mark, i) => {
              const count = values.filter((v) => v === mark).length;
              if (!count) return null;
              const label = `${new Date(p.payload.observed_at).toLocaleString('nl-NL')}, ${p.payload.material_id}, ${labels[i]}: ${count}, ${p.hours === null ? 'lesuren onbekend' : p.hours.toFixed(2) + ' lesuren'}`;
              return (
                <g
                  key={`${p.id}-${i}`}
                  role="button"
                  tabIndex={0}
                  aria-label={label}
                  onClick={() => open(p.id, p.learner_id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      open(p.id, p.learner_id);
                    }
                  }}
                >
                  <circle
                    cx={x(p)}
                    cy={30 + i * 45}
                    r="14"
                    fill="var(--primary)"
                  />
                  <text
                    x={x(p)}
                    y={34 + i * 45}
                    textAnchor="middle"
                    fill="var(--paper)"
                    fontSize="12"
                  >
                    {count}
                  </text>
                </g>
              );
            });
          })}
          <line x1="140" y1="198" x2="650" y2="198" stroke="currentColor" />
          <text x="140" y="223" fill="currentColor" fontSize="12">
            {tick(lo)}
          </text>
          <text
            x="650"
            y="223"
            fill="currentColor"
            textAnchor="end"
            fontSize="12"
          >
            {tick(hi)}
          </text>
        </svg>
      )}
      <p>
        Vier afzonderlijke categorieën; geen goed/fout-schaal. Getallen in
        punten zijn aantallen criteria. Samenvallende punten kunnen overlappen;
        de lijst hieronder bewaart ieder meetmoment.{' '}
        {points.length - visible.length > 0
          ? `${points.length - visible.length} momenten ontbreken in de grafiek door onbekende lesuren of de grens van 100 punten; ze blijven in de lijst.`
          : ''}
      </p>
    </figure>
  );
}
export function Reports({
  school,
  group,
  learners,
  initialLearner = '',
  go,
}: {
  school: string;
  group: string;
  learners: { id: string; display_name: string }[];
  initialLearner?: string;
  go: (part?: string) => string;
}) {
  const router = useRouter(),
    search = useSearchParams();
  const requested = search.get('report') ?? 'individual';
  const view = ['individual', 'group', 'national'].includes(requested)
    ? requested
    : 'individual';
  const setView = (next: string) =>
    router.push(go('rapportages') + '&report=' + next);
  const [learner, setLearner] = useState(
      initialLearner || learners[0]?.id || '',
    ),
    [mode, setMode] = useState('word'),
    [material, setMaterial] = useState(''),
    [level, setLevel] = useState(''),
    [condition, setCondition] = useState(''),
    [from, setFrom] = useState(''),
    [to, setTo] = useState(''),
    [minHours, setMinHours] = useState(''),
    [maxHours, setMaxHours] = useState(''),
    [axis, setAxis] = useState('date'),
    [criterion, setCriterion] = useState('-1'),
    [report, setReport] = useState<Report | null>(null),
    [error, setError] = useState(''),
    [selected, setSelected] = useState<Detail | null>(null),
    [refresh, setRefresh] = useState(0);
  useEffect(() => {
    let active = true;
    // oxlint-disable-next-line react/react-compiler -- Clear the old school/filter result before starting the next authorized request.
    setReport(null);
    setSelected(null);
    setError('');
    if (view === 'national')
      return () => {
        active = false;
      };
    const q = new URLSearchParams({
      class: group,
      mode,
      material,
      level,
      condition,
      from,
      to,
      minHours,
      maxHours,
      ...(view === 'individual' ? { learner } : {}),
    });
    api<Report>(`visual-reports?${q}`, school)
      .then((r) => {
        if (active) setReport(r);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [
    school,
    group,
    view,
    learner,
    mode,
    material,
    level,
    condition,
    from,
    to,
    minHours,
    maxHours,
    refresh,
  ]);
  async function drill(id: string, lid: string) {
    setError('');
    setSelected(null);
    try {
      setSelected(
        await api<Detail>(
          `source-observations/${id}?class=${encodeURIComponent(group)}&learner=${encodeURIComponent(lid)}`,
          school,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ophalen mislukt');
    }
  }
  const selectedIndex = Number(criterion);
  return (
    <section className="ki-card ki-reports">
      <h3>Rapportages</h3>
      <div className="ki-actions" role="group" aria-label="Rapportage kiezen">
        {[
          ['individual', 'Individuele groei'],
          ['group', 'Groepsontwikkeling'],
          ['national', 'Landelijke vergelijking'],
        ].map(([id, label]) => (
          <button
            className="secondary-button"
            key={id}
            aria-pressed={view === id}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>
      {view === 'national' ? (
        <NationalComparison />
      ) : (
        <>
          <h4>
            {view === 'individual' ? 'Individuele groei' : 'Groepsontwikkeling'}
          </h4>
          <p>
            Ruwe observaties: ✓ Zonder directe hulp · △ Met hulp of model · —
            Niet waargenomen · geen keuze: Niet ingevuld. Geen automatische
            niveauscore of beheersing. Een veranderde verdeling bewijst op
            zichzelf geen groei.
          </p>
          <div className="ki-report-filters">
            {view === 'individual' && (
              <label className="ki-field">
                <span>Cursist</span>
                <select
                  aria-label="Cursist"
                  value={learner}
                  onChange={(e) => setLearner(e.target.value)}
                >
                  {learners.map((l) => (
                    <option value={l.id} key={l.id}>
                      {l.display_name}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="ki-field">
              <span>Modus</span>
              <select
                aria-label="Modus"
                value={mode}
                onChange={(e) => {
                  setMode(e.target.value);
                  setCriterion('-1');
                }}
              >
                {Object.entries(sourceModes).map(([v, l]) => (
                  <option value={v} key={v}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <label className="ki-field">
              <span>Materiaal</span>
              <select
                aria-label="Materiaal"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
              >
                <option value="">Alle materialen (apart vergeleken)</option>
                {sourceMaterials.map((m) => (
                  <option value={m.id} key={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="ki-field">
              <span>Niveaudoel van de taak</span>
              <select
                aria-label="Niveaudoel van de taak"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
              >
                <option value="">Alle vastgelegde niveaudoelen</option>
                {ROUTES.map((l) => (
                  <option key={l}>{l}</option>
                ))}
              </select>
            </label>
            <label className="ki-field">
              <span>Afnameconditie</span>
              <input
                aria-label="Afnameconditie"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                maxLength={100}
              />
            </label>
            <label className="ki-field">
              <span>Vanaf</span>
              <input
                aria-label="Vanaf"
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </label>
            <label className="ki-field">
              <span>Tot en met</span>
              <input
                aria-label="Tot en met"
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </label>
            <label className="ki-field">
              <span>Minimaal geregistreerde lesuren</span>
              <input
                aria-label="Minimaal geregistreerde lesuren"
                type="number"
                min="0"
                step="0.25"
                value={minHours}
                onChange={(e) => setMinHours(e.target.value)}
              />
            </label>
            <label className="ki-field">
              <span>Maximaal geregistreerde lesuren</span>
              <input
                aria-label="Maximaal geregistreerde lesuren"
                type="number"
                min="0"
                step="0.25"
                value={maxHours}
                onChange={(e) => setMaxHours(e.target.value)}
              />
            </label>
          </div>
          {error && (
            <>
              <p role="alert">{error}</p>
              <button
                className="secondary-button"
                onClick={() => setRefresh((v) => v + 1)}
              >
                Rapportage opnieuw ophalen
              </button>
            </>
          )}
          {!report && !error ? (
            <output>Rapportage ophalen…</output>
          ) : (
            report && (
              <>
                <p>
                  Elke meting gebruikt haar nieuwste correctie. Oude revisies
                  blijven in de details. Dekking = daadwerkelijk waargenomen (✓
                  of △) / alle getoonde posities. Niet waargenomen en niet
                  ingevuld tellen niet als een negatieve prestatie.
                </p>
                {view === 'individual' ? (
                  <>
                    <h4>Totaal over geselecteerde observaties</h4>
                    <Bars
                      value={report.total}
                      label="Totale observatieverdeling"
                    />
                    <p>
                      {report.points.length} meetmomenten. Dit totaal beschrijft
                      de geselecteerde taken; het is geen vergelijkbare
                      totaalscore.
                    </p>
                    <div className="ki-report-filters">
                      <label className="ki-field">
                        <span>Vaardigheid / broncriterium</span>
                        <select
                          aria-label="Vaardigheid / broncriterium"
                          value={criterion}
                          onChange={(e) => setCriterion(e.target.value)}
                        >
                          <option value="-1">Alle zes criteria</option>
                          {(report.points[0]?.criteria ?? []).map((c, i) => (
                            <option key={i} value={i}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="ki-field">
                        <span>Tijdas</span>
                        <select
                          aria-label="Tijdas"
                          value={axis}
                          onChange={(e) => setAxis(e.target.value)}
                        >
                          <option value="date">Meetdatum</option>
                          <option value="hours">
                            Werkelijk gevolgde lesuren
                          </option>
                        </select>
                      </label>
                    </div>
                    <p>
                      Lesuren zijn opgetelde geregistreerde aanwezigheid tot het
                      meetmoment, exclusief pauzes en zelfstandig oefenen.
                      Ontbrekende registratie is onbekend; controleer
                      volledigheid. Er wordt geen vaste groei per lesuur
                      verondersteld.
                    </p>
                    <ObservationPlot
                      points={report.points}
                      axis={axis}
                      criterion={selectedIndex}
                      open={(id, lid) => void drill(id, lid)}
                    />
                    {!report.points.length ? (
                      <p>Nog geen observaties binnen deze selectie.</p>
                    ) : (
                      <ol className="ki-report-timeline">
                        {[...report.points]
                          .sort((a, b) =>
                            axis === 'hours'
                              ? (a.hours ?? Infinity) - (b.hours ?? Infinity)
                              : 0,
                          )
                          .map((p) => {
                            const d =
                              selectedIndex < 0
                                ? p.distribution
                                : (() => {
                                    const v = p.payload.values[selectedIndex];
                                    return {
                                      independent: v === 0 ? 1 : 0,
                                      supported: v === 1 ? 1 : 0,
                                      unobserved: v === 2 ? 1 : 0,
                                      empty: v === null ? 1 : 0,
                                      total: 1,
                                      assessed: v === 0 || v === 1 ? 1 : 0,
                                      coverage: v === 0 || v === 1 ? 1 : 0,
                                    };
                                  })();
                            return (
                              <li key={p.id}>
                                <button
                                  className="secondary-button"
                                  onClick={() => void drill(p.id, p.learner_id)}
                                >
                                  {new Date(
                                    p.payload.observed_at,
                                  ).toLocaleString('nl-NL')}{' '}
                                  · {p.payload.material_id} ·{' '}
                                  {p.hours === null
                                    ? 'Lesuren onbekend'
                                    : `${p.hours.toFixed(2)} lesuren`}{' '}
                                  · revisie {p.current_revision}
                                </button>
                                <Bars
                                  value={d}
                                  label={
                                    selectedIndex < 0
                                      ? 'Alle criteria'
                                      : p.criteria[selectedIndex]
                                  }
                                />
                              </li>
                            );
                          })}
                      </ol>
                    )}
                    <HoursEditor
                      key={learner}
                      school={school}
                      group={group}
                      learner={learner}
                      hours={report.hours}
                      changed={() => setRefresh((n) => n + 1)}
                    />
                    <h4>Gevalideerde toetsbewijzen — afzonderlijk kanaal</h4>
                    <p>
                      Deze lijst gebruikt uitsluitend cursist en periode; taak-
                      en urenfilters hierboven horen bij de bronobservaties.
                      Registratie van ✓, △ of — levert nooit een toetsbewijs op.
                      Staging bevat uitsluitend fictieve meetgegevens;
                      inhoudelijke validatie voor echte cursisten blijft open.
                    </p>
                    {report.proofs.length ? (
                      <div className="ki-table">
                        <table>
                          <caption>Onderliggende bewijsregistraties</caption>
                          <thead>
                            <tr>
                              <th>Vaardigheid</th>
                              <th>Meetdatum</th>
                              <th>Status</th>
                              <th>Bron</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.proofs.map((p) => (
                              <tr key={p.id}>
                                <td>{p.skill_label}</td>
                                <td>{p.occurred_at.slice(0, 10)}</td>
                                <td>
                                  {p.revoked
                                    ? 'Ingetrokken / vervangen'
                                    : p.eligible
                                      ? 'Toelaatbaar volgens geregistreerde rubric'
                                      : 'Geen geldig toetsbewijs'}
                                </td>
                                <td>
                                  <a
                                    href={
                                      go('bewijs') +
                                      `&learner=${encodeURIComponent(p.learner_id)}&skill=${encodeURIComponent(p.skill_id)}`
                                    }
                                  >
                                    Bekijk bewijs
                                  </a>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p>Geen toetsbewijzen beschikbaar in deze selectie.</p>
                    )}
                  </>
                ) : (
                  <>
                    <p>
                      Vergelijking per identiek materiaal, modus, bronversie,
                      niveaudoel, afnameconditie en kalendermaand. Alleen de
                      laatste observatie per cursist in zo’n combinatie telt.
                      Cursisten wegen gelijk. Taakdoelen in de groep:{' '}
                      {report.mix.join(', ') || 'geen gegevens'}.{' '}
                      {report.excluded} observaties uitgesloten wegens
                      ontbrekende taakcontext of klasinschrijving op het
                      meetmoment. Een cursist kan bij meerdere taakdoelen staan;
                      dit beschrijft geen vastgestelde cursistniveaus.
                    </p>
                    <p>
                      Gemiddelde per criterium = aandeel ✓ onder uitsluitend ✓
                      en △. De totale mediaan gebruikt het aandeel ✓ per
                      cursist. Dit zijn beschrijvende observatieverdelingen,
                      geen vaardigheidsniveau of effect van onderwijs. Geen
                      doorlopende groeilijn bij een wisselende
                      groepssamenstelling. Details tonen de feitelijke taken;
                      vergelijk perioden alleen na controle van groepsmix en
                      afname.
                    </p>
                    {!report.groups.length ? (
                      <p>Geen vergelijkbare groepsmetingen beschikbaar.</p>
                    ) : (
                      report.groups.map((g) => (
                        <article className="ki-observation" key={g.key}>
                          <h4>
                            {sourceModes[g.mode as SourceMode]} · {g.material} ·{' '}
                            {g.level} · {g.period}
                          </h4>
                          <p>
                            Groepssamenstelling:{' '}
                            {g.sameCohortAsPrevious === null
                              ? 'eerste getoonde periode'
                              : g.sameCohortAsPrevious
                                ? 'dezelfde cursisten als vorige periode'
                                : 'gewijzigd; geen rechtstreekse groeivergelijking'}
                            . Conditie: {g.condition} · bronversie {g.version} ·
                            n={g.n} van {g.population} ingeschreven cursisten ·
                            taakdekking {pct(g.coverage)}
                          </p>
                          {g.suppressed ? (
                            <p>
                              Niet beschikbaar: minder dan {report.minGroupN}{' '}
                              cursisten. Geen gemiddelde of mediaan getoond.
                            </p>
                          ) : (
                            <>
                              <p>
                                Mediaan aandeel zonder directe hulp:{' '}
                                {pct(g.medianIndependent)} · n={g.medianN} ·{' '}
                                {g.commonCriteria.length} gemeenschappelijk
                                waargenomen criteria. Geen ranglijst.
                              </p>
                              {g.distribution && (
                                <Bars
                                  value={g.distribution}
                                  label="Groepsverdeling"
                                />
                              )}
                              <ul>
                                {g.criteria.map((c) => (
                                  <li key={c.label}>
                                    {c.label}: gemiddeld aandeel ✓{' '}
                                    {pct(c.meanIndependent)} · waargenomen n=
                                    {c.n}
                                    {c.distribution && (
                                      <Bars
                                        value={c.distribution}
                                        label={c.label}
                                      />
                                    )}
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}
                        </article>
                      ))
                    )}
                    <p>
                      Alleen deze bevoegde klas en school. Geen aggregatie
                      tussen scholen. De grens van vijf is een technische
                      ondergrens, geen bewijs van anonimiteit of vervanging van
                      privacybeleid/DPIA.
                    </p>
                  </>
                )}
                {selected && (
                  <section
                    className="ki-card"
                    aria-label="Observatie en correctiehistorie"
                  >
                    <h4>Observatie en correctiehistorie</h4>
                    <p>
                      {selected.observation.learner_name} · auteur{' '}
                      {selected.observation.author_id}
                    </p>
                    <p>
                      Bron: {selected.payload.source} · versie{' '}
                      {selected.payload.source_version} ·{' '}
                      {selected.payload.material_id}
                    </p>
                    <ol>
                      {selected.history.map((h) => (
                        <li key={h.revision}>
                          <h5>
                            Revisie {h.revision} ·{' '}
                            {new Date(h.recorded_at).toLocaleString('nl-NL')}
                          </h5>
                          <p>
                            Gewijzigd door {h.changed_by} ·{' '}
                            {h.payload.reason ||
                              'Geen afzonderlijke toelichting vastgelegd'}
                          </p>
                          <ul>
                            {h.payload.values.map((v, i) => (
                              <li key={i}>
                                {report.points.find(
                                  (p) => p.payload.mode === h.payload.mode,
                                )?.criteria[i] ?? `Criterium ${i + 1}`}
                                :{' '}
                                {v === null
                                  ? 'Niet ingevuld'
                                  : `${sourceMarks[v].symbol} ${sourceMarks[v].label}`}
                              </li>
                            ))}
                          </ul>
                          <p>{h.payload.note}</p>
                          <p>
                            Volgende leerhandeling:{' '}
                            {h.payload.next || 'Niet ingevuld'}
                          </p>
                        </li>
                      ))}
                    </ol>
                    <button
                      className="secondary-button"
                      onClick={() => setSelected(null)}
                    >
                      Details sluiten
                    </button>
                  </section>
                )}
              </>
            )
          )}
        </>
      )}
    </section>
  );
}
function HoursEditor({
  school,
  group,
  learner,
  hours,
  changed,
}: {
  school: string;
  group: string;
  learner: string;
  hours: Hours[];
  changed: () => void;
}) {
  const [id, setId] = useState(''),
    [revision, setRevision] = useState(0),
    [date, setDate] = useState(''),
    [minutes, setMinutes] = useState(''),
    [reason, setReason] = useState(''),
    [history, setHistory] = useState<
      {
        revision: number;
        minutes: number;
        reason: string;
        attended_at: string;
      }[]
    >([]);
  const save = useSave();
  return (
    <details>
      <summary>Werkelijk gevolgde lesuren registreren en corrigeren</summary>
      <p>
        Registreer per bijeenkomst uitsluitend aanwezige lesminuten. Geen
        roosteruren, pauzes of zelfstandige oefentijd. Corrigeer een bestaande
        registratie om dubbel tellen te voorkomen; nul minuten trekt de bijdrage
        in met behoud van historie.
      </p>
      <ul>
        {hours.map((h) => (
          <li key={h.id}>
            {h.attended_at.slice(0, 10)} · {h.minutes} minuten · revisie{' '}
            {h.current_revision}{' '}
            <button
              className="secondary-button"
              onClick={() => {
                setId(h.id);
                setRevision(h.current_revision);
                setDate(
                  new Date(
                    new Date(h.attended_at).getTime() -
                      new Date(h.attended_at).getTimezoneOffset() * 60000,
                  )
                    .toISOString()
                    .slice(0, 16),
                );
                setMinutes(String(h.minutes));
                setReason('');
                void api<typeof history>(
                  `learning-hours?class=${encodeURIComponent(group)}&learner=${encodeURIComponent(learner)}`,
                  school,
                )
                  .then((rows) =>
                    setHistory(
                      rows.filter(
                        (r) =>
                          (r as typeof r & { entry_id: string }).entry_id ===
                          h.id,
                      ),
                    ),
                  )
                  .catch(() => setHistory([]));
              }}
            >
              Corrigeren
            </button>
          </li>
        ))}
      </ul>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const newId = id || crypto.randomUUID();
          setId(newId);
          void save.save(
            'learning-hours',
            school,
            {
              id: newId,
              class_id: group,
              learner_id: learner,
              expected_revision: revision,
              attended_at: new Date(date).toISOString(),
              minutes: Number(minutes),
              reason,
            },
            () => {
              setId('');
              setRevision(0);
              setDate('');
              setMinutes('');
              setReason('');
              changed();
            },
          );
        }}
      >
        <label className="ki-field">
          <span>Einde gevolgde bijeenkomst</span>
          <input
            aria-label="Einde gevolgde bijeenkomst"
            type="datetime-local"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label className="ki-field">
          <span>Werkelijk gevolgde minuten</span>
          <input
            aria-label="Werkelijk gevolgde minuten"
            type="number"
            required
            min="0"
            max="720"
            step="1"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
          />
        </label>
        <label className="ki-field">
          <span>Bron of reden van correctie</span>
          <input
            aria-label="Bron of reden van correctie"
            required
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </label>
        <button className="primary-button" disabled={save.busy || !learner}>
          Lesminuten bewaren
        </button>
        {save.error && <p role="alert">{save.error}</p>}
      </form>
      {history.length > 0 && (
        <ul>
          {history.map((h, i) => (
            <li key={i}>
              Revisie {h.revision}: {h.minutes} minuten · {h.reason}
            </li>
          ))}
        </ul>
      )}
    </details>
  );
}
