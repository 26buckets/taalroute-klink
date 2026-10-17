'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { contentPackages, type PackageId } from '@/lib/package-content';
import { lessonPlan, phaseLabels, planStatusLabels, type PlanStatus } from '@/lib/lesson-plan';
import { buildChecklist, buildStatusLabels, sentenceBridge, type BuildStatus } from '@/lib/build-checklist';

const statuses = Object.keys(planStatusLabels) as PlanStatus[];
const statusClasses: Record<BuildStatus, PlanStatus> = { works: 'connected', partial: 'available', missing: 'missing', different: 'unnecessary' };

export function LessonCoverage({ onOpen }: { onOpen: (id: PackageId) => void }) {
  const [packageId, setPackageId] = useState(contentPackages[0].id);
  const [lessonId, setLessonId] = useState(contentPackages[0].lessons[0].id);
  const pack = contentPackages.find(item => item.id === packageId)!;
  const lesson = pack.lessons.find(item => item.id === lessonId) ?? pack.lessons[0];
  const plan = lessonPlan(pack, lesson);
  const checklist = buildChecklist(pack, lesson);
  const bridge = sentenceBridge(pack, lesson);
  const words = (ids: string[] = []) => ids.map(id => pack.words.find(word => word.id === id)?.word).join(' · ') || '—';
  return <section className="cp-lesson-coverage" aria-labelledby="lesson-coverage-title">
    <header><h2 id="lesson-coverage-title">De route per leesstap</h2><p>De bouwchecklist volgt dezelfde Taalroute-leesstappen. Werkt betekent aangesloten voor de doelwoorden van deze stap, niet dat de cursist het beheerst of dat de media zijn goedgekeurd. Gedeeltelijk betekent dat inhoud, dekking of aansluiting in de lesroute nog ontbreekt.</p></header>
    <div className="cp-coverage-filters">
      <label>Onderdeel<select value={packageId} onChange={event => { const next = contentPackages.find(item => item.id === event.target.value)!; setPackageId(next.id); setLessonId(next.lessons[0].id); }}>{contentPackages.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label>Leesstap<select value={lesson.id} onChange={event => setLessonId(event.target.value)}>{pack.lessons.map((item, index) => <option key={item.id} value={item.id}>{index + 1}. {item.title} — {words(item.newWords?.length ? item.newWords : item.returning)}</option>)}</select></label>
    </div>
    <dl className="cp-coverage-words"><div><dt>Bekende woorden</dt><dd>{words(lesson.known)}</dd></div><div><dt>Nieuwe woorden</dt><dd>{words(lesson.newWords)}</dd></div><div><dt>Woorden die terugkomen</dt><dd>{words(lesson.returning)}</dd></div></dl>
    {lesson.scope && <p>{lesson.scope}</p>}
    <ol className="cp-coverage-phases">{Object.entries(phaseLabels).map(([id, label]) => <li key={id}><strong>{label}</strong><span>{pack.exercises.filter(item => item.lessonId === lesson.id && item.phase === id && lesson.guidedExerciseIds?.includes(item.exerciseId)).length} in de route</span></li>)}</ol>
    <div className="cp-coverage-table-wrap"><table className="cp-coverage-table" data-build-checklist data-lesson-id={lesson.id}><caption>Vaste bouwchecklist voor {lesson.title}</caption><thead><tr><th>Vaardigheid</th><th>Status</th><th>Aansluiting en volgende bouwstap</th></tr></thead><tbody>{checklist.map(row => <tr key={row.id} data-check-id={row.id}><th scope="row">{row.title}</th><td><span className={`cp-plan-status ${statusClasses[row.status]}`}>{buildStatusLabels[row.status]}</span></td><td>{row.reason}</td></tr>)}</tbody></table></div>
    <details className="cp-coverage-overview" data-sentence-bridge><summary>Van deze woorden naar zinnen en tekstbegrip</summary><p>Doelwoorden: {words(bridge.wordIds)}.</p><p>{bridge.nextAction}</p>
      {bridge.models.length > 0 && <div className="cp-coverage-table-wrap"><table className="cp-coverage-table"><caption>Al gekoppelde luistermodellen — nog geen zelfstandig lezen</caption><thead><tr><th>Model</th><th>Overige woorden voorbereiden</th></tr></thead><tbody>{bridge.models.map(model => <tr key={model.id}><th scope="row">{model.text}<small>{model.kind === 'sentence' ? 'Zin' : 'Situatie'} · menselijke beoordeling open</small>{model.questions.map(question => <small key={question.id}>Vraag: {question.title} · {question.guided ? 'In de lesroute' : 'Bij Vrij oefenen'}<br />{question.objective}{question.preparation.map(note => <span key={note}><br />Vooraf: {note}</span>)}</small>)}</th><td>{model.wordsOutsideStep.join(' · ') || 'Geen extra geschreven vormen; betekenis en leesvoorwaarden blijven te controleren.'}</td></tr>)}</tbody></table></div>}
      <p>{bridge.readingNote}</p><ol>{bridge.stages.map(stage => <li key={stage.title}><strong>{stage.title}.</strong> {stage.action}</li>)}</ol>
    </details>
    <details className="cp-coverage-overview" data-existing-content><summary>Bestaande zinnen, teksten en gesprekken bij deze woorden ({bridge.existing.length})</summary>
      <p>Beschikbaar bij Zinnen en teksten, Gesprekken en Vrij oefenen. De korte woordles blijft ongewijzigd. Deze koppeling is een woordverband, geen vrijgave voor zelfstandig lezen. Ook een gesprek met een bekend woord kan veel mondelinge voorbereiding vragen.</p>
      {bridge.existing.map(item => <details key={item.id} data-content-id={item.id}><summary>{item.kind === 'sentence' ? 'Zin' : item.kind === 'text' ? 'Tekst' : 'Gesprek'}: {item.title}</summary>
        <p>{item.text}</p>
        <dl><dt>Doelwoorden in deze stap</dt><dd>{words(item.wordIds.filter(id => bridge.wordIds.includes(id)))}</dd>
          <dt>Andere woorden uit de woordenbank</dt><dd>{item.conditions.otherWords.map(word => word.word).join(' · ') || 'Geen'}</dd>
          <dt>Overige woordvormen en namen voorbereiden</dt><dd>{item.conditions.outsideWordBank.join(' · ') || 'Geen'}</dd>
          <dt>Klanktekens buiten de woorden van deze stap</dt><dd>{item.conditions.unitsOutsideStep.join(' · ') || 'Geen extra tekens in de gekoppelde woorden; controleer ook de overige vormen.'}</dd>
          <dt>Aanvullende leesvoorwaarden</dt><dd>{item.conditions.wordConditions.join(' ') || 'De losse woorden verbinden met behoud van de betekenis.'}</dd>
          <dt>Taalbelasting van de bestaande tekst</dt><dd>{/a2/i.test(item.sourceLevel) ? 'A2: ruimere woordenschat en zinsverbanden; geen zelfstandige Alfa-opdracht.' : /a1/i.test(item.sourceLevel) ? 'A1: mondelinge voorbereiding nodig; geen zelfstandige Alfa-opdracht.' : 'Met begeleiding; geen zelfstandig leesniveau vastgesteld.'}</dd>
        </dl><p>{item.conditions.note}</p>
        {item.discussion && <p>Bespreekvraag: {item.discussion.question}<br />Antwoord: {item.discussion.answer}<br />Bewijs: {item.discussion.evidence || 'Samen in de tekst terugzoeken.'}</p>}
      </details>)}
    </details>
    <details className="cp-coverage-overview" data-exercise-inventory><summary>Alle oefenvormen en ontbrekende inhoud</summary>
    <div className="cp-coverage-table-wrap"><table className="cp-coverage-table"><caption>Oefendoelen en ontbrekende inhoud voor {lesson.title}</caption><thead><tr><th>Oefendoel</th><th>Status</th><th>Wat is er nodig?</th></tr></thead><tbody>{plan.map(row => <tr key={row.id}><th scope="row">{row.title}<small>{phaseLabels[row.phase]}</small></th><td><span className={`cp-plan-status ${row.status}`}>{planStatusLabels[row.status]}</span></td><td>{row.reason}</td></tr>)}</tbody></table></div>
    </details>
    <button className="primary-button" onClick={() => onOpen(pack.id)}>Open deze lessen<ArrowRight /></button>
    <details className="cp-coverage-overview"><summary>Alle leesstappen in dit onderdeel ({pack.lessons.length})</summary><p>Aantallen oefendoelen per status, niet het aantal losse opdrachten.</p><div className="cp-coverage-table-wrap"><table className="cp-coverage-table"><thead><tr><th>Leesstap</th>{statuses.map(status => <th key={status}>{planStatusLabels[status]}</th>)}</tr></thead><tbody>{pack.lessons.map(item => { const rows = lessonPlan(pack, item); return <tr key={item.id}><th scope="row"><button onClick={() => setLessonId(item.id)}>{item.title}: {words(item.newWords?.length ? item.newWords : item.returning)}</button></th>{statuses.map(status => <td key={status}>{rows.filter(row => row.status === status).length}</td>)}</tr>; })}</tbody></table></div></details>
  </section>;
}
