'use client';
import { useState } from 'react';
import { descriptors, descriptorSources } from '@/lib/inzicht/descriptors';
import { ROUTES } from '@/lib/inzicht/rules';
export function NationalComparison() {
  const [level, setLevel] = useState('Alfa A');
  const descriptor = descriptors[level],
    source = descriptorSources[descriptor.source];
  return (
    <section aria-label="Landelijke vergelijking">
      <h4>Landelijke vergelijking</h4>
      <p>
        <strong>
          Landelijke gemiddelden, percentielen en normbanden: niet beschikbaar.
        </strong>
      </p>
      <p>
        Er is geen gelicenseerde, gevalideerde landelijke normdataset
        geïmporteerd. Daarom staan hier geen Nederlandse gemiddelde scores en
        geen vergelijking met de Nederlandse bevolking.
      </p>
      <label className="ki-field">
        <span>Niveau voor doeloriëntatie</span>
        <select
          aria-label="Niveau voor doeloriëntatie"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          {ROUTES.map((l) => (
            <option key={l}>{l}</option>
          ))}
        </select>
      </label>
      <h5>{level}: doeloriëntatie</h5>
      <p>
        Alfa A, Alfa B en Alfa C beschrijven de ontwikkeling van geletterdheid.
        ERK A1, A2 en B1 beschrijven communicatieve taalvaardigheid. Ze zijn
        geen één-op-één omzetting en geen gemiddelde van Nederland. Een
        niveaudoel is geen vaststelling van het niveau van een cursist.
      </p>
      <p>
        Brongebonden samenvattingen van gepubliceerde descriptoren; lees de
        volledige bron voor voorwaarden en voorbeelden.
      </p>
      <dl>
        {descriptor.items.map(([skill, goal]) => (
          <div key={skill}>
            <dt>
              <strong>{skill}</strong>
            </dt>
            <dd>{goal}</dd>
          </div>
        ))}
      </dl>
      <p>
        <a href={source.url} target="_blank" rel="noreferrer">
          {source.title}
        </a>{' '}
        · pagina’s {source.pages} · bron gecontroleerd op 1 november 2026.
      </p>
      <p>{source.scope}</p>
      <p>
        Deze doelen zijn niet automatisch gekoppeld aan de zes
        observatiecriteria. Een inhoudelijk gevalideerde koppeling en passende
        toetsafname zijn nodig voordat er een niveau-uitspraak mogelijk is. Voor
        volwassen Alfa A/B/C blijft de selectie van de toepasselijke volledige
        volwassenendescriptoren een inhoudelijke reviewpoort.
      </p>
      <ul>
        <li>
          <a
            href="https://www.slo.nl/thema/vakspecifieke-thema/mvt/erk/"
            target="_blank"
            rel="noreferrer"
          >
            SLO — Europees Referentiekader
          </a>
        </li>
      </ul>
      <details>
        <summary>
          Wanneer kan een echte landelijke vergelijking worden getoond?
        </summary>
        <p>
          Pas na controle van licentie en validatie, methodiek, referentiegroep,
          cohort, N, meetinstrument, versie, afname- en publicatiedatums,
          onzekerheidsmarge en aantoonbare vergelijkbaarheid met de lokale
          meting. Het huidige observatieformulier levert op zichzelf geen
          genormeerde toetsscore.
        </p>
        <p>
          De schoolgegevens worden niet tussen scholen samengevoegd. Daarvoor
          zijn een passende grondslag, privacybeleid en DPIA-beoordeling nodig.
          Een technische minimumgroepsgrootte vervangt die beoordeling niet.
        </p>
      </details>
    </section>
  );
}
