'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from './client';
import { ROUTES } from '@/lib/inzicht/rules';
import {
  sourceCriteria,
  sourceMarks,
  sourceMaterial,
  sourceMaterials,
  sourceModes,
  type SourceMark,
  type SourceMode,
} from '@/lib/inzicht/source-observation';

type Learner = { id: string; display_name: string };
type Draft = {
  id: string;
  mode: SourceMode;
  material_id: string;
  values: SourceMark[];
  note: string;
  next: string;
  observed_at: string;
  level?: string;
  condition?: string;
  reason?: string;
};
type Saved = Draft & {
  current_revision: number;
  author_id: string;
  updated_at: string;
  editable: boolean;
};
type ApiRow = Omit<Saved, keyof Draft> & {
  material_id: string;
  mode: SourceMode;
  id: string;
  payload: Draft;
};
type SavedResponse = {
  id: string;
  revision: number;
  saved_at: string;
  source: string;
};

function fresh(mode: SourceMode = 'word', material_id = 'mat'): Draft {
  return {
    id: crypto.randomUUID(),
    mode,
    material_id,
    values: [null, null, null, null, null, null],
    note: '',
    next: '',
    observed_at: new Date().toISOString(),
  };
}
function labelFor(mode: SourceMode, id: string) {
  const material = sourceMaterial(id)!;
  return mode === 'word'
    ? material.word
    : mode === 'sentence'
      ? material.sentence.content
      : material.title;
}
const entryKey = (mode: SourceMode, material: string) => `${mode}:${material}`;

export function SourceObservationForm({
  school,
  group,
  learners,
  selected,
  originalId,
}: {
  school: string;
  group: string;
  learners: Learner[];
  selected: string;
  originalId?: string;
}) {
  const [learnerId, setLearnerId] = useState(selected || learners[0]?.id || '');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [status, setStatus] = useState('');
  const [saveFailed, setSaveFailed] = useState(false);
  const [draft, setDraft] = useState<Draft>(() => fresh());
  const [history, setHistory] = useState<Saved[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const current = useRef<Draft>(draft);
  const cache = useRef(new Map<string, Draft>());
  const lastByKey = useRef(new Map<string, string>());
  const revisions = useRef(new Map<string, number>());
  const dirty = useRef(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queue = useRef<Promise<void>>(Promise.resolve());
  const epoch = useRef(0);
  const isMounted = useRef(true);
  const switching = useRef(false);
  const pendingWrites = useRef(0);
  const retryKeys = useRef(
    new Map<string, { signature: string; key: string }>(),
  );

  // shortcut: Browser history during an offline edit is not recoverable; add a router blocker before offline use is supported.
  // Native reload/closing guard: server acknowledgement is the only source
  // of truth. Do not silently discard a pending edit on page reload.
  useEffect(() => {
    const warnOnExit = (event: BeforeUnloadEvent) => {
      if (dirty.current || pendingWrites.current > 0) {
        event.preventDefault();
      }
    };
    const guardLink = (event: MouseEvent) => {
      const link = (event.target as Element)?.closest('a');
      if (link && (dirty.current || pendingWrites.current > 0)) {
        event.preventDefault();
        event.stopPropagation();
        setStatus('Bewaar eerst de observatie voordat je dit scherm verlaat.');
      }
    };
    const guardContext = (event: Event) => {
      if (dirty.current || pendingWrites.current > 0) {
        event.preventDefault();
        setStatus('Bewaar eerst de observatie voordat je dit scherm verlaat.');
      }
    };
    window.addEventListener('inzicht:before-navigation', guardContext);
    document.addEventListener('click', guardLink, true);
    window.addEventListener('beforeunload', warnOnExit);
    return () => {
      window.removeEventListener('beforeunload', warnOnExit);
      window.removeEventListener('inzicht:before-navigation', guardContext);
      document.removeEventListener('click', guardLink, true);
    };
  }, []);

  // Prevent a stale response from a previous student overwriting the selected student's UI.
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);
  useEffect(() => {
    let active = true;
    const token = ++epoch.current;
    if (debounce.current) clearTimeout(debounce.current);
    // When navigating to another student, block data crossover. The previous
    // selection's pending save has its own captured class and learner context.
    dirty.current = false;
    cache.current.clear();
    lastByKey.current.clear();
    revisions.current.clear();
    retryKeys.current.clear();
    // oxlint-disable-next-line react/react-compiler -- Clear the previous learner while loading the authorized dossier.
    setLoading(true);
    setLoadError('');
    setStatus('');
    setSaveFailed(false);
    api<ApiRow[]>(
      `source-observations?class=${encodeURIComponent(group)}&learner=${encodeURIComponent(learnerId)}`,
      school,
    )
      .then((rows) => {
        if (!active || token !== epoch.current) return;
        const restored = rows.map((r) => ({
          ...r.payload,
          id: r.id,
          material_id: r.material_id,
          mode: r.mode,
          current_revision: Number(r.current_revision),
          author_id: r.author_id,
          updated_at: r.updated_at,
          editable: r.editable,
        }));
        for (const row of restored) {
          revisions.current.set(row.id, row.current_revision);
          const key = entryKey(row.mode, row.material_id);
          if (!lastByKey.current.has(key)) lastByKey.current.set(key, row.id);
          cache.current.set(row.id, {
            ...row,
            id: row.id,
            mode: row.mode,
            material_id: row.material_id,
            values: [...row.values],
            note: row.note,
            next: row.next,
            observed_at: row.observed_at,
          });
        }
        setHistory(restored);
        const chosen = originalId
          ? restored.find((x) => x.id === originalId)
          : restored[0];
        const next = chosen
          ? {
              ...chosen,
              id: chosen.id,
              mode: chosen.mode,
              material_id: chosen.material_id,
              values: [...chosen.values],
              note: chosen.note,
              next: chosen.next,
              observed_at: chosen.observed_at,
            }
          : fresh();
        current.current = next;
        setDraft(next);
        setLoading(false);
      })
      .catch((e) => {
        if (active && token === epoch.current) {
          setLoadError(e.message);
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [school, group, learnerId, originalId]);

  function saveNow(): Promise<void> {
    if (debounce.current) clearTimeout(debounce.current);
    if (!dirty.current) return queue.current;
    dirty.current = false;
    const captured = {
      ...current.current,
      values: [...current.current.values],
    };
    const learner = learnerId;
    // Reuse the same idempotency key after a lost server response to an
    // identical request. A fresh edit uses a fresh key; a revision conflict
    // then requires explicit comparison instead of silent overwriting.
    const signature = JSON.stringify({ school, group, learner, captured });
    const previousKey = retryKeys.current.get(captured.id);
    const key =
      previousKey?.signature === signature
        ? previousKey.key
        : crypto.randomUUID();
    retryKeys.current.set(captured.id, { signature, key });
    const myEpoch = epoch.current;
    pendingWrites.current += 1;
    setIsSaving(true);
    setStatus('Bewaren…');
    queue.current = queue.current
      .catch(() => {})
      .then(async () => {
        // No client status of saved until an authenticated server response arrives.
        const result = await api<SavedResponse>(
          'source-observations',
          school,
          {
            class_id: group,
            learner_id: learner,
            id: captured.id,
            material_id: captured.material_id,
            mode: captured.mode,
            values: captured.values,
            level: captured.level,
            condition: captured.condition,
            reason: captured.reason,
            note: captured.note,
            next: captured.next,
            observed_at: captured.observed_at,
            expected_revision: revisions.current.get(captured.id) ?? 0,
          },
          key,
        );
        revisions.current.set(result.id, result.revision);
        setSaveFailed(false);
        if (retryKeys.current.get(result.id)?.key === key)
          retryKeys.current.delete(result.id);
        if (isMounted.current && myEpoch === epoch.current) {
          setHistory((old) => {
            const row = {
              ...captured,
              current_revision: result.revision,
              author_id: '',
              editable: true,
              updated_at: result.saved_at,
            };
            return [row, ...old.filter((item) => item.id !== captured.id)];
          });
          if (
            !dirty.current &&
            current.current.id === captured.id &&
            JSON.stringify(current.current) === JSON.stringify(captured)
          )
            setStatus('Opgeslagen in Klink Inzicht');
        }
      })
      .catch((error: unknown) => {
        if (isMounted.current && myEpoch === epoch.current) {
          setSaveFailed(true);
          setStatus(
            error instanceof Error
              ? `Niet opgeslagen: ${error.message}`
              : 'Niet opgeslagen. Probeer opnieuw.',
          );
          // A failed response may belong to an older observation. Never mark a
          // different, newly selected observation as dirty because of it.
          if (current.current.id === captured.id) dirty.current = true;
        }
        throw error;
      })
      .finally(() => {
        pendingWrites.current = Math.max(0, pendingWrites.current - 1);
        if (isMounted.current && myEpoch === epoch.current)
          setIsSaving(pendingWrites.current > 0);
      });
    return queue.current;
  }
  function edit(next: Draft) {
    current.current = next;
    setDraft(next);
    dirty.current = true;
    cache.current.set(next.id, next);
    lastByKey.current.set(entryKey(next.mode, next.material_id), next.id);
    setStatus('Nog niet opgeslagen');
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      void saveNow().catch(() => {});
    }, 450);
  }
  // Switching never discards a draft with a pending or failed server save.
  // Await the exact queued write and verify that no additional edit happened.
  async function beforeSwitch(): Promise<boolean> {
    if (switching.current) return false;
    switching.current = true;
    const previous = current.current;
    try {
      await saveNow();
      if (dirty.current || current.current.id !== previous.id) {
        setStatus('Er zijn nog niet opgeslagen wijzigingen. Bewaar eerst.');
        return false;
      }
      return true;
    } catch {
      setStatus(
        'Niet opgeslagen. De huidige observatie blijft open. Probeer opnieuw.',
      );
      return false;
    } finally {
      switching.current = false;
    }
  }
  async function changeLearner(nextLearner: string) {
    if (nextLearner === learnerId || !(await beforeSwitch())) return;
    setLearnerId(nextLearner);
  }
  async function changeSelection(mode: SourceMode, material: string) {
    if (
      mode === current.current.mode &&
      material === current.current.material_id
    )
      return;
    if (!(await beforeSwitch())) return;
    const lastId = lastByKey.current.get(entryKey(mode, material));
    const matching = history.find(
      (h) => h.mode === mode && h.material_id === material,
    );
    const cached = lastId ? cache.current.get(lastId) : undefined;
    const next =
      cached ||
      (matching
        ? {
            ...matching,
            id: matching.id,
            mode,
            material_id: material,
            values: [...matching.values],
            note: matching.note,
            next: matching.next,
            observed_at: matching.observed_at,
          }
        : fresh(mode, material));
    cache.current.set(next.id, next);
    lastByKey.current.set(entryKey(mode, material), next.id);
    current.current = next;
    setDraft(next);
    setStatus(
      revisions.current.has(next.id)
        ? 'Eerder opgeslagen observatie'
        : 'Nieuwe observatie, nog leeg',
    );
    // Changing tabs or source material is not itself an observation.
  }
  async function startNewObservation() {
    if (!(await beforeSwitch())) return;
    const next = fresh(current.current.mode, current.current.material_id);
    current.current = next;
    cache.current.set(next.id, next);
    lastByKey.current.set(entryKey(next.mode, next.material_id), next.id);
    setDraft(next);
    setStatus('Nieuwe observatie begonnen');
  }
  async function openPreviousObservation(id: string) {
    if (!(await beforeSwitch())) return;
    const historical = history.find((row) => row.id === id);
    if (!historical) {
      setStatus('Deze observatie bestaat niet meer in de lijst.');
      return;
    }
    const next = cache.current.get(id) || {
      ...historical,
      id: historical.id,
      mode: historical.mode,
      material_id: historical.material_id,
      values: [...historical.values],
      note: historical.note,
      next: historical.next,
      observed_at: historical.observed_at,
    };
    current.current = next;
    setDraft(next);
    lastByKey.current.set(
      entryKey(historical.mode, historical.material_id),
      id,
    );
    setStatus(`Eerdere observatie, revisie ${historical.current_revision}`);
  }
  async function exportPdf() {
    try {
      // Never export a combination of an older server revision and fresh
      // unsaved edits, nor a different learner selected during PDF creation.
      const exportTarget = {
        ...current.current,
        values: [...current.current.values],
      };
      const exportLearner = learnerId;
      await saveNow();
      if (
        dirty.current ||
        learnerId !== exportLearner ||
        JSON.stringify(current.current) !== JSON.stringify(exportTarget)
      ) {
        setStatus(
          'De observatie is gewijzigd tijdens het bewaren. Bewaar opnieuw vóór PDF-export.',
        );
        return;
      }
      if (!revisions.current.has(exportTarget.id)) {
        setStatus(
          'Vul eerst een observatie in zodat deze opgeslagen kan worden.',
        );
        return;
      }
      const authorized = await api<{
        payload: Draft;
        revision: number;
        observation: {
          learner_name: string;
          class_name: string;
          school_name: string;
          author_id: string;
        };
        exported_at: string;
      }>(
        `source-observations/${exportTarget.id}/export?class=${encodeURIComponent(group)}&learner=${encodeURIComponent(exportLearner)}&revision=${revisions.current.get(exportTarget.id)}`,
        school,
      );
      const snapshot = authorized.payload;
      const material = sourceMaterial(snapshot.material_id)!;
      const learner = authorized.observation.learner_name;
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      doc.setProperties({
        title: 'Observatie',
        author: 'Taalroute',
        creator: 'Klink Inzicht',
      });
      let y = 20;
      function room(h: number) {
        if (y + h > 274) {
          doc.addPage();
          y = 20;
        }
      }
      function write(value: string, size = 11, step = 6) {
        doc.setFontSize(size);
        const lines = String(value)
          .split('\n')
          .flatMap((line) => doc.splitTextToSize(line || ' ', 172));
        lines.forEach((line: string) => {
          room(step);
          doc.text(line, 18, y);
          y += step;
        });
      }
      function drawMark(value: SourceMark, x: number, b: number) {
        doc.setLineWidth(0.45);
        if (value === 0) {
          doc.line(x, b - 1.5, x + 1.1, b);
          doc.line(x + 1.1, b, x + 3.2, b - 3.2);
        }
        if (value === 1) doc.triangle(x, b, x + 1.8, b - 3.3, x + 3.6, b);
        if (value === 2) doc.line(x, b - 1.5, x + 3.5, b - 1.5);
      }
      write('Observatie', 22, 10);
      write(`Cursist: ${learner}`, 12, 7);
      write(
        `Klas: ${authorized.observation.class_name}  School: ${authorized.observation.school_name}`,
        10,
      );
      write(`Beoordelaar: ${authorized.observation.author_id}`, 9);
      write(`Export: ${authorized.exported_at}`, 9);
      write(
        `${sourceModes[snapshot.mode]}: ${snapshot.mode === 'word' ? material.word : material.title}`,
        13,
        7,
      );
      write(
        `Datum: ${new Date(snapshot.observed_at).toLocaleDateString('nl-NL', { dateStyle: 'long', timeZone: 'Europe/Amsterdam' })}`,
        10,
      );
      write(
        `Revisie: ${authorized.revision}  Observatie: ${exportTarget.id}`,
        9,
      );
      if (snapshot.mode !== 'word') {
        y += 3;
        write(material[snapshot.mode].content);
      }
      y += 5;
      sourceMarks.forEach((mark) => {
        room(6);
        drawMark(mark.value, 18, y);
        doc.setFontSize(9);
        doc.text(mark.label, 25, y);
        y += 6;
      });
      y += 5;
      sourceCriteria(snapshot.mode, snapshot.material_id).forEach(
        (criterion, i) => {
          room(13);
          doc.setDrawColor(215, 221, 217);
          doc.setLineWidth(0.2);
          doc.line(18, y - 4, 192, y - 4);
          doc.setDrawColor(23, 32, 30);
          doc.setFontSize(11);
          doc.text(criterion, 18, y + 2);
          const v = snapshot.values[i];
          if (v !== null) {
            drawMark(v, 101, y + 2);
            doc.text(sourceMarks[v].label, 108, y + 2);
          } else doc.text('Niet ingevuld', 108, y + 2);
          y += 13;
        },
      );
      for (const [label, value] of [
        ['Opmerking', snapshot.note],
        ['Volgende leerhandeling', snapshot.next],
      ]) {
        room(18);
        y += 4;
        write(label, 12, 7);
        write(value || ' ');
        y += 3;
      }
      const pages = doc.getNumberOfPages();
      for (let page = 1; page <= pages; page++) {
        doc.setPage(page);
        doc.setFontSize(9);
        doc.text(String(page), 192, 286, { align: 'right' });
      }
      doc.save(
        `observatie-${sourceModes[snapshot.mode].toLowerCase()}-${material.word}.pdf`,
      );
    } catch (error) {
      setStatus(
        error instanceof Error
          ? `De PDF kon niet worden gemaakt: ${error.message}`
          : 'De PDF kon niet worden gemaakt.',
      );
    }
  }
  if (!learners.length)
    return <section className="ki-card">Voeg eerst een cursist toe.</section>;
  const material = sourceMaterial(draft.material_id)!;
  const criteria = sourceCriteria(draft.mode, draft.material_id);
  const editable =
    (history.find((h) => h.id === draft.id)?.editable ?? true) &&
    !isSaving &&
    !saveFailed;
  return (
    <section
      className="ki-card ki-source-observation"
      aria-label="Observatie per woord, zin of tekst"
    >
      <h3>Observatie</h3>
      <label className="ki-field">
        <span>Cursist</span>
        <select
          value={learnerId}
          onChange={(e) => {
            void changeLearner(e.target.value);
          }}
          disabled={loading || isSaving}
        >
          {learners.map((l) => (
            <option key={l.id} value={l.id}>
              {l.display_name}
            </option>
          ))}
        </select>
      </label>
      {loading ? (
        <p>Observaties ophalen…</p>
      ) : loadError ? (
        <p role="alert">{loadError}</p>
      ) : (
        <>
          <fieldset
            className="ki-source-modes"
            aria-label="Waarover observeer je?"
          >
            {(Object.keys(sourceModes) as SourceMode[]).map((m) => (
              <button
                type="button"
                key={m}
                aria-pressed={draft.mode === m}
                onClick={() => {
                  void changeSelection(m, draft.material_id);
                }}
              >
                {sourceModes[m]}
              </button>
            ))}
          </fieldset>
          <label className="ki-field">
            <span>Kies een {sourceModes[draft.mode].toLowerCase()}</span>
            <select
              value={draft.material_id}
              onChange={(e) => {
                void changeSelection(draft.mode, e.target.value);
              }}
            >
              {sourceMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {labelFor(draft.mode, m.id)}
                </option>
              ))}
            </select>
          </label>
          <label className="ki-field">
            <span>Observatiedatum en tijd</span>
            <input
              aria-label="Observatiedatum en tijd"
              type="datetime-local"
              value={new Date(
                new Date(draft.observed_at).getTime() -
                  new Date(draft.observed_at).getTimezoneOffset() * 60000,
              )
                .toISOString()
                .slice(0, 16)}
              disabled={!editable}
              onChange={(e) => {
                if (e.target.value)
                  edit({
                    ...draft,
                    observed_at: new Date(e.target.value).toISOString(),
                  });
              }}
            />
          </label>
          <label className="ki-field">
            <span>Niveaudoel van de taak (geen cursistniveau)</span>
            <select
              aria-label="Niveaudoel van de taak (geen cursistniveau)"
              value={draft.level ?? ''}
              disabled={!editable}
              onChange={(e) => edit({ ...draft, level: e.target.value })}
            >
              <option value="">Niet vastgelegd</option>
              {ROUTES.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </label>
          <label className="ki-field">
            <span>Afnameconditie / vergelijkbare taakreeks</span>
            <input
              aria-label="Afnameconditie / vergelijkbare taakreeks"
              maxLength={100}
              value={draft.condition ?? ''}
              disabled={!editable}
              onChange={(e) => edit({ ...draft, condition: e.target.value })}
            />
          </label>
          <p>
            Gebruik dezelfde conditie uitsluitend bij dezelfde instructie,
            materiaalversie en afname. Ontbrekende context wordt niet gemiddeld
            in groepsrapportages.
          </p>
          <label className="ki-field">
            <span>Toelichting bij correctie</span>
            <input
              aria-label="Toelichting bij correctie"
              maxLength={500}
              value={draft.reason ?? ''}
              disabled={!editable}
              onChange={(e) => edit({ ...draft, reason: e.target.value })}
            />
          </label>
          {!isSaving &&
            history.find((h) => h.id === draft.id)?.editable === false && (
              <output>
                Deze observatie is door een andere docent ingevuld. Je kunt haar
                bekijken of een nieuwe observatie beginnen, maar niet wijzigen.
              </output>
            )}
          <h4>{draft.mode === 'word' ? material.word : material.title}</h4>
          {draft.mode !== 'word' && (
            <p className="ki-source-context">{material[draft.mode].content}</p>
          )}
          <div className="ki-source-legend" aria-label="Vaste observatietekens">
            {sourceMarks.map((r) => (
              <span key={r.value}>
                <strong aria-hidden="true">{r.symbol}</strong> {r.label}
              </span>
            ))}
          </div>
          <div className="ki-source-rows">
            {criteria.map((criterion, index) => (
              <fieldset
                className="ki-source-row"
                key={`${draft.mode}:${draft.material_id}:${index}`}
              >
                <legend>{criterion}</legend>
                <div className="ki-source-choices">
                  {sourceMarks.map((r) => (
                    <label
                      key={r.value}
                      className={
                        draft.values[index] === r.value ? 'is-selected' : ''
                      }
                      title={r.label}
                    >
                      <input
                        type="radio"
                        name={`source-${draft.id}-${index}`}
                        value={r.value}
                        checked={draft.values[index] === r.value}
                        disabled={!editable}
                        onChange={() =>
                          edit({
                            ...draft,
                            values: draft.values.map((v, i) =>
                              i === index ? r.value : v,
                            ),
                          })
                        }
                        aria-label={r.label}
                      />
                      <span aria-hidden="true">{r.symbol}</span>
                    </label>
                  ))}
                  <button
                    type="button"
                    className="secondary-button"
                    disabled={!editable}
                    aria-label={`${criterion}: keuze wissen`}
                    onClick={() =>
                      edit({
                        ...draft,
                        values: draft.values.map((v, i) =>
                          i === index ? null : v,
                        ),
                      })
                    }
                  >
                    Niet ingevuld
                  </button>
                </div>
              </fieldset>
            ))}
          </div>
          <label className="ki-field">
            <span>Opmerking</span>
            <textarea
              aria-label="Opmerking"
              maxLength={1000}
              value={draft.note}
              disabled={!editable}
              onChange={(e) => edit({ ...draft, note: e.target.value })}
            />
          </label>
          <label className="ki-field">
            <span>Volgende leerhandeling</span>
            <textarea
              aria-label="Volgende leerhandeling"
              maxLength={1000}
              value={draft.next}
              disabled={!editable}
              onChange={(e) => edit({ ...draft, next: e.target.value })}
            />
          </label>
          <div className="ki-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void startNewObservation();
              }}
            >
              Nieuwe observatie
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                void saveNow().catch(() => {});
              }}
              disabled={isSaving || loading}
            >
              Nu bewaren
            </button>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                void exportPdf();
              }}
            >
              Download observatie (PDF)
            </button>
          </div>
          <output className="ki-source-status" aria-live="polite">
            {status}
          </output>
          <p>
            Dit is een observatie, geen automatische beheersingsscore. Niet
            waargenomen is geen onvoldoende.
          </p>
          <details>
            <summary>
              Eerdere observaties van deze cursist (laatste 200)
            </summary>
            {history.length ? (
              history.map((h) => (
                <button
                  className="ki-source-history"
                  type="button"
                  key={h.id}
                  onClick={() => {
                    void openPreviousObservation(h.id);
                  }}
                >
                  {sourceModes[h.mode]} · {h.material_id} ·{' '}
                  {new Date(h.observed_at).toLocaleDateString('nl-NL')}
                </button>
              ))
            ) : (
              <p>Nog geen opgeslagen observaties.</p>
            )}
          </details>
        </>
      )}
    </section>
  );
}

export function SourceObservationHistory({
  school,
  group,
  learnerId,
  go,
}: {
  school: string;
  group: string;
  learnerId: string;
  go: (path?: string) => string;
}) {
  const [entries, setEntries] = useState<ApiRow[]>([]);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api<ApiRow[]>(
      `source-observations?class=${encodeURIComponent(group)}&learner=${encodeURIComponent(learnerId)}`,
      school,
    )
      .then((rows) => {
        if (active) {
          setEntries(rows);
          setError('');
        }
      })
      .catch((e) => {
        if (active)
          setError(e instanceof Error ? e.message : 'Ophalen is niet gelukt.');
      });
    return () => {
      active = false;
    };
  }, [school, group, learnerId]);
  if (error)
    return (
      <p role="alert">Bronobservaties konden niet worden opgehaald: {error}</p>
    );
  if (!entries.length) return null;
  return (
    <section>
      <h4>Woord-, zin- en tekstobservaties</h4>
      {entries.map((row) => (
        <article className="ki-observation" key={row.id}>
          <p>
            {sourceModes[row.mode]} · {sourceMaterial(row.material_id)?.title} ·
            revisie {row.current_revision}
          </p>
          <p>
            {row.payload.values
              .map((v) => (v === null ? 'Leeg' : sourceMarks[v].symbol))
              .join(' ')}
          </p>
          <a
            href={
              go('observeren') +
              `&learner=${encodeURIComponent(learnerId)}&source=${encodeURIComponent(row.id)}`
            }
          >
            Open de observatie
          </a>
        </article>
      ))}
    </section>
  );
}
