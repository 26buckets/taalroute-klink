'use client';

import { useEffect, useMemo, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { audioStatusLabels, type AudioRegisterRow } from '@/lib/audio-register';
import {
  contentCoverage,
  connectedContentCounts,
} from '@/lib/content-coverage';
import { playMedia, stopMedia } from '@/lib/media-player';
import { learningAreaCoverage } from '@/lib/learning-areas';
import { chapterHash, practiceChapters } from '@/lib/practice-chapters';

export function ContentCoverage() {
  const areas = useMemo(() => learningAreaCoverage(), []);
  return (
    <section className="cp-lesson-coverage" data-content-coverage>
      <h2>De volledige inhoudslijn</h2>
      <h3>Rechtstreeks oefenen</h3>
      <p>De woordroute blijft bij Lessen. Deze hoofdstukken openen daarnaast rechtstreeks de bestaande oefeninhoud, zonder eerst een woordles te volgen.</p>
      <nav className="cp-chapter-levels" aria-label="Oefenhoofdstukken voor de docent">{practiceChapters.map(chapter => <a className="secondary-button" key={chapter.id} href={chapterHash({ chapter: chapter.id, level: 'all' })}>{chapter.title}</a>)}</nav>
      <p>Alfa A/B volgt de bestaande leesvoorwaarden van alle betrokken woorden. A1/A2 is het niveau van de bron, met hulp; geen behaalde cursistniveaus. B1 is nog niet aangesloten. Klanken bevat nu woordcontrasten, Spelling woordbouw en dictee: losse klankmodellen en expliciete spellingregels blijven open.</p>
      <h3>Hoofdonderwerpen van Klink</h3>
      <p>Eigen Taalroute-onderdelen, op dezelfde woordenbank. Dit is de volledige bouwomvang; een aangekondigd onderwerp is niet automatisch een complete leerlijn.</p>
      <div className="cp-coverage-table-wrap"><table className="cp-coverage-table" data-learning-areas>
        <caption>Beschikbaar en nog aan te sluiten</caption>
        <thead><tr><th>Hoofdonderwerp</th><th>Doel</th><th>Nu aangesloten</th><th>Nog nodig</th></tr></thead>
        <tbody>{areas.map(area => <tr key={area.id}><th scope="row">{area.title}</th><td>{area.purpose}</td><td>{area.status}<small>{area.sections} woordgroepen</small>{area.connectedActivities.join(' · ') || 'Nog geen passende opdrachten aangesloten.'}</td><td>{area.remaining}</td></tr>)}</tbody>
      </table></div>
      <p>
        De uitgewerkte methode is breder dan de aangesloten woordroute. Hier
        staan ontwerp, huidige aansluiting en ontbrekend werk apart. Dit
        overzicht beschrijft ook wat de aparte cursisthoofdstukken nog niet dekken.
      </p>
      <p>
        {connectedContentCounts.sentences} zinnen,{' '}
        {connectedContentCounts.texts} teksten en{' '}
        {connectedContentCounts.dialogues} gesprekken zijn gekoppeld als
        luisterinhoud. Dat zijn geen aantallen zelfstandige begripslessen.
      </p>
      <div className="cp-coverage-table-wrap">
        <table className="cp-coverage-table">
          <caption>Van bestaand ontwerp naar bruikbare opdrachten</caption>
          <thead>
            <tr>
              <th>Domein</th>
              <th>Ontwerp</th>
              <th>Aansluiting</th>
              <th>Nog uitwerken</th>
            </tr>
          </thead>
          <tbody>
            {contentCoverage.map((row) => (
              <tr key={row.id}>
                <th scope="row">{row.title}</th>
                <td>{row.designed}</td>
                <td>
                  {row.status}
                  <small>
                    {row.sectionIds.length} onderdelen met een verwante
                    opdracht; geen volledige domeindekking.
                  </small>
                </td>
                <td>{row.next}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Boekdoel, gekozen leesstap en docentlesplan blijven de basis. Plaatsing
        in een echte bijeenkomst, observatiepunten en praktijkbeoordeling zijn
        niet door deze inventaris afgerond.
      </p>
    </section>
  );
}

type Summary = {
  active: { total: number; connected: number; missing: number; parked: number; review: number; archive: number };
  planned: {
    total: number;
    connected: number;
    missing: number;
    archive: number;
  };
  sections: { id: string; title: string }[];
  boundary: string;
};
const kindLabels: Record<string, string> = {
  word: 'Woord',
  instruction: 'Instructie/hulp',
  sentence: 'Zin',
  text: 'Tekst',
  dialogue: 'Gespreksbeurt',
  answer: 'Antwoord',
  sound: 'Klankvoorbereiding',
  situation: 'Situatie',
  'prepared-script': 'Voorraadspreektekst',
};

export function ContentAudioRegister() {
  const [scope, setScope] = useState('active');
  const [rows, setRows] = useState<AudioRegisterRow[]>([]);
  const [summary, setSummary] = useState<Summary>();
  const [status, setStatus] = useState('all');
  const [section, setSection] = useState('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retry, setRetry] = useState(0);
  const [playing, setPlaying] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    fetch('/content-register/summary.json', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw Error();
        return response.json();
      })
      .then((value) => {
        if (
          !value ||
          typeof value !== 'object' ||
          !('active' in value) ||
          !('planned' in value) ||
          !('sections' in value) ||
          !Array.isArray(value.sections)
        )
          throw Error();
        if (!controller.signal.aborted) setSummary(value as Summary);
      })
      .catch(() => {
        if (!controller.signal.aborted)
          setError('Het overzicht kon niet worden geladen.');
      });
    return () => controller.abort();
  }, [retry]);
  useEffect(() => {
    const controller = new AbortController();
    stopMedia();
    fetch(`/content-register/${scope}.json`, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw Error();
        return response.json();
      })
      .then((value) => {
        if (!Array.isArray(value)) throw Error();
        if (!controller.signal.aborted) {
          setRows(value);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setLoading(false);
          setError('De audiomatrix kon niet worden geladen.');
        }
      });
    return () => {
      controller.abort();
      stopMedia();
    };
  }, [scope, retry]);
  const filtered = useMemo(
    () =>
      rows.filter(
        (row) =>
          (status === 'all' || row.status === status) &&
          (section === 'all' || row.sectionIds.includes(section)) &&
          `${row.text} ${row.id}`
            .toLocaleLowerCase('nl')
            .includes(query.toLocaleLowerCase('nl')),
      ),
    [rows, status, section, query],
  );
  const lastPage = Math.max(0, Math.ceil(filtered.length / 40) - 1);
  const currentPage = Math.min(page, lastPage);
  function startLoading() {
    setLoading(true);
    setError('');
    setRows([]);
    setPage(0);
    setPlaying('');
  }
  async function play(row: AudioRegisterRow) {
    const source = row.status === 'review' || row.status === 'archive' ? row.candidateSrc : row.status === 'connected' ? row.src : undefined;
    if (!source) return;
    setError('');
    setPlaying(row.id);
    try {
      await playMedia(source, { waitUntilEnd: true });
    } catch {
      setError('Deze opname kon niet afspelen. Probeer opnieuw.');
    } finally {
      setPlaying((current) => (current === row.id ? '' : current));
    }
  }
  return (
    <section className="cp-lesson-coverage" data-audio-register>
      <h2>Inhoud klaarzetten, audio later koppelen</h2>
      <p>
        Iedere regel heeft een vaste audio-ID. Een opname kan later aan die ID
        worden gekoppeld, zonder de woordenindeling te veranderen. Alleen
        aanwezige gekoppelde bestanden hebben een actieve luisterknop.
      </p>
      {summary && (
        <>
          <p>
            Huidige inhoud: {summary.active.connected} gekoppelde audio-ID’s;{' '}
            {summary.active.missing} zonder opname; {summary.active.review ?? 0} klaar voor luisterbeoordeling; {summary.active.archive ?? 0} archiefkandidaten; {summary.active.parked}{' '}
            geparkeerd. Voorraad: {summary.planned.total} verschillende
            spreekteksten per stemrol, nog niet toegewezen aan de huidige route.
          </p>
          <p>{summary.boundary}</p>
        </>
      )}
      <div className="cp-coverage-filters">
        <label>
          Omvang
          <select
            aria-label="Omvang"
            value={scope}
            onChange={(event) => {
              startLoading();
              setScope(event.target.value);
              setSection('all');
            }}
          >
            <option value="active">Huidige inhoud en klankvoorbereiding</option>
            <option value="planned">
              Voorraad spreekteksten — nog plaatsen
            </option>
          </select>
        </label>
        <label>
          Audio
          <select
            aria-label="Audio"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(0);
            }}
          >
            <option value="all">Alle statussen</option>
            {Object.entries(audioStatusLabels).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {scope === 'active' && (
          <label>
            Onderdeel
            <select
              aria-label="Onderdeel"
              value={section}
              onChange={(event) => {
                setSection(event.target.value);
                setPage(0);
              }}
            >
              <option value="all">Alle onderdelen</option>
              {summary?.sections.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Zoek tekst of audio-ID
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(0);
            }}
          />
        </label>
      </div>
      {error && (
        <p role="alert">
          {error}{' '}
          <button
            className="secondary-button"
            onClick={() => {
              startLoading();
              setRetry((value) => value + 1);
            }}
          >
            Opnieuw laden
          </button>
        </p>
      )}
      {loading ? (
        <output>Audiomatrix laden…</output>
      ) : (
        <>
          <output>
            {filtered.length} regels gevonden. Pagina {currentPage + 1} van{' '}
            {lastPage + 1}.
          </output>
          <div className="cp-coverage-table-wrap">
            <table className="cp-coverage-table">
              <caption>
                {scope === 'active'
                  ? 'Huidige inhoud'
                  : 'Voorraad — geen automatische generatieopdracht'}
              </caption>
              <thead>
                <tr>
                  <th>Inhoud en audio-ID</th>
                  <th>Plaats en rol</th>
                  <th>Opname</th>
                  <th>Controle</th>
                </tr>
              </thead>
              <tbody>
                {filtered
                  .slice(currentPage * 40, currentPage * 40 + 40)
                  .map((row) => (
                    <tr key={row.id} data-audio-id={row.id}>
                      <th scope="row">
                        {row.text}
                        <small>
                          {kindLabels[row.kind] ?? row.kind} · {row.id}
                        </small>
                      </th>
                      <td>
                        {row.role === 'instruction'
                          ? 'Instructie/steun'
                          : row.role === 'sound-model'
                            ? 'Klankmodel'
                            : 'Doeltaal'}
                        <small>
                          {row.placement === 'unplaced'
                            ? 'Nog niet geplaatst'
                            : `${row.placement === 'preparation' ? 'Voorbereiding bij ' : ''}${row.lessonIds.length} leesstappen`}
                        </small>
                        <small>
                          {row.sectionIds
                            .map(
                              (id) =>
                                summary?.sections.find((item) => item.id === id)
                                  ?.title ?? id,
                            )
                            .join(' · ')}
                        </small>
                        {row.voiceId && <small>Stem-ID: {row.voiceId}</small>}
                      </td>
                      <td>
                        {audioStatusLabels[row.status]}
                        <br />
                        <button
                          className="secondary-button"
                          disabled={!(row.status === 'connected' && row.src) && !(['review', 'archive'].includes(row.status) && row.candidateSrc)}
                          aria-label={`Luister: ${row.text}`}
                          onClick={() => void play(row)}
                        >
                          <Volume2 aria-hidden="true" />
                          {playing === row.id
                            ? 'Speelt…'
                            : row.status === 'connected'
                              ? 'Luister'
                              : 'Audio later'}
                        </button>
                      </td>
                      <td>
                        {row.review}
                        <small>{row.note}</small>
                        {row.existingAudioId && (
                          <small>
                            Bestaande audio-ID: {row.existingAudioId}
                          </small>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {!filtered.length && <p>Geen regels voor deze selectie.</p>}
          <div className="cp-coverage-filters">
            <button
              className="secondary-button"
              disabled={currentPage === 0}
              onClick={() => setPage(currentPage - 1)}
            >
              Vorige pagina
            </button>
            <button
              className="secondary-button"
              disabled={currentPage >= lastPage}
              onClick={() => setPage(currentPage + 1)}
            >
              Volgende pagina
            </button>
            <a
              className="secondary-button"
              href={`/content-register/${scope}.json`}
              download
            >
              Download deze volledige matrix
            </a>
          </div>
        </>
      )}
      <p>
        Vóór generatie: selectie en exacte spreektekst controleren; aparte
        stemmen voor instructie en doeltaal vastleggen. Vóór gebruik: uitspraak,
        bestandskoppeling en Taalroute-audiometadata controleren. De korte t
        blijft geparkeerd.
      </p>
    </section>
  );
}
