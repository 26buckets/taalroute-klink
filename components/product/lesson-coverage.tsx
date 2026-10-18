'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { contentPackages, type PackageId } from '@/lib/package-content';
import { lessonPlan, phaseLabels, planStatusLabels, type PlanStatus } from '@/lib/lesson-plan';
import { buildChecklist, buildStatusLabels, sentenceBridge, type BuildStatus } from '@/lib/build-checklist';
import { wordById } from '@/lib/klink-curriculum';
import { teacherPracticePlan } from '@/lib/teacher-practice-plan';
import { contentLevels, sourceContentLevel, wordContentLevel } from '@/lib/content-levels';
import { contentById } from '@/lib/connected-content';
import { contextReadiness, pictureGrowth, readinessLabels, practiceStages } from '@/lib/learner-route';
import { MyRoute, useRouteSettings } from './route-settings';
import { importedActivities, importedItems } from '@/lib/imported-practice';
import { chapterHash } from '@/lib/practice-chapters';

const statuses = Object.keys(planStatusLabels) as PlanStatus[];
const statusClasses: Record<BuildStatus, PlanStatus> = { works: 'connected', partial: 'available', missing: 'missing', different: 'unnecessary' };

export function LessonCoverage({ onOpen }: { onOpen: (id: PackageId) => void }) {
  const { settings } = useRouteSettings();
  const [packageId, setPackageId] = useState(contentPackages[0].id);
  const [lessonId, setLessonId] = useState(contentPackages[0].lessons[0].id);
  const pack = contentPackages.find(item => item.id === packageId)!;
  const lesson = pack.lessons.find(item => item.id === lessonId) ?? pack.lessons[0];
  const plan = lessonPlan(pack, lesson);
  const checklist = buildChecklist(pack, lesson);
  const bridge = sentenceBridge(pack, lesson);
  const teaching = teacherPracticePlan(pack, lesson);
  const words = (ids: string[] = []) => ids.map(id => wordById.get(id)?.word).join(' · ') || '—';
  return <section className="cp-lesson-coverage" aria-labelledby="lesson-coverage-title">
    <header><h2 id="lesson-coverage-title">De route per leesstap</h2><p>De bouwchecklist volgt dezelfde Taalroute-leesstappen. Werkt betekent aangesloten voor de doelwoorden van deze stap, niet dat de cursist het beheerst of dat de media zijn goedgekeurd. Gedeeltelijk betekent dat inhoud, dekking of aansluiting in de lesroute nog ontbreekt.</p></header>
    <div className="cp-coverage-filters">
      <label>Onderdeel<select value={packageId} onChange={event => { const next = contentPackages.find(item => item.id === event.target.value)!; setPackageId(next.id); setLessonId(next.lessons[0].id); }}>{contentPackages.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label>Leesstap<select value={lesson.id} onChange={event => setLessonId(event.target.value)}>{pack.lessons.map((item, index) => <option key={item.id} value={item.id}>{index + 1}. {item.title} — {words(item.newWords?.length ? item.newWords : item.returning)}</option>)}</select></label>
    </div>
    <dl className="cp-coverage-words"><div><dt>Bekende woorden</dt><dd>{words(lesson.known)}</dd></div><div><dt>Nieuwe woorden</dt><dd>{words(lesson.newWords)}</dd></div><div><dt>Woorden die terugkomen</dt><dd>{words(lesson.returning)}</dd></div></dl>
    {lesson.scope && <p>{lesson.scope}</p>}
    {importedActivities.length > 0 && <details className="cp-coverage-overview" data-content-practice><summary>Verder oefenen met de docent</summary>
      <p>Deze opdrachten staan bij de bestaande oefenhoofdstukken. Bereid de genoemde woorden, vormen en bediening samen voor. Koppel de opdracht aan het boekdoel, de echte bijeenkomst en de beschikbare lestijd.</p>
      <ul>{importedActivities.map(activity => <li key={activity.id}><a href={chapterHash({chapter: activity.chapter, activity: activity.id, level: 'all'})}>{activity.label}</a> — {importedItems.filter(item => item.domain === activity.domain).length} opdrachten</li>)}</ul>
      <p>Docentopdrachten worden als geoefend bijgehouden. Een afgeronde opdracht bewijst geen zelfstandig lezen of algemeen taalniveau.</p>
    </details>}
    <details className="cp-coverage-overview" data-level-coverage><summary>Niveaus, leeropbouw en beeldsteun</summary>
      <MyRoute />
      <p>Alfa A–C beschrijft de lees-/schrijflijn; A1–B1 betreft taalgebruik. Dit overzicht deelt broninhoud in, niet de beheersing van een cursist. Bronlabels en woordvoorwaarden zijn geen complete niveaucursus.</p>
      <div className="cp-coverage-table-wrap"><table className="cp-coverage-table"><caption>Aanbod in {pack.title}</caption><thead><tr><th>Groep</th><th>Woorden</th><th>Zinnen, teksten en gesprekken met bronlabel</th></tr></thead><tbody>{contentLevels.filter(level => !['all', 'support'].includes(level.id)).map(level => <tr key={level.id}><th scope="row">{level.label}</th><td>{pack.words.filter(word => wordContentLevel([word.id]) === level.id).length}</td><td>{[...pack.texts, ...pack.dialogues].filter(item => sourceContentLevel(contentById.get(item.id)?.sourceLevel) === level.id).length}</td></tr>)}</tbody></table></div>
      <p>Een nul betekent dat hier nog geen onderbouwde inhoud is ingedeeld. Niet-gelabelde bronnen blijven bij Gebruiken beschikbaar, maar worden niet tot Alfa C of B1 verklaard.</p>
      <ol>{practiceStages.map(stage => <li key={stage.id}><strong>{stage.label}.</strong> {stage.description}</li>)}</ol>
      <p>Klikroute: Lessen → onderdeel → Woorden / Stap voor stap / Oefenen met deze woorden / Gebruiken. De gekozen kleine stap wordt meegenomen naar Oefenen met deze woorden en Gebruiken. Alle woorden blijft een bewuste keuze; een bord of leerreeks wordt nooit half aangeboden.</p>
      <p>Bij dezelfde woorden telt groeien als minder voorbeeld, zelf terughalen, toepassen en gemengd herhalen. Klaar of een goede keuze bewijst geen algemeen niveau. Koppel de gekozen opdracht aan het bestaande boekdoel en het voorbeeldlesblok hieronder; controleer zichtbaar cursistgedrag voordat je moeilijker materiaal kiest.</p>
      <h3>Beeldopbouw</h3><ol>{pictureGrowth.map(stage => <li key={stage.id}><strong>{stage.label}.</strong> {stage.description} {stage.id === 'object' ? `${pack.words.filter(word => word.image).length} bestaande woordbeelden.` : stage.id === 'situation' ? `${pack.scenes.filter(scene => scene.image).length} bestaande situatiebeelden; bespreken met de docent, geen automatische beeldbegripscore.` : ''}</li>)}</ol>
      <p>Bij woordbouw en woorddictee: foto zichtbaar, foto als hulp of foto na een goed antwoord. Hulp blijft bereikbaar. Voorbeelden, antwoordkeuzes en situatiebeelden worden niet verborgen. Nieuwe beelden of beeldreeksen zijn niet gegenereerd; de bestaande afbeeldingen blijven ongewijzigd.</p>
      <h3>Van deze leesstap naar bestaande inhoud</h3>
      {[...pack.texts, ...pack.dialogues].filter(item => item.lessonIds?.includes(lesson.id)).map(item => { const placement = contextReadiness(item.id, pack, lesson, settings); return <p key={item.id}><strong>{item.title} — {readinessLabels[placement.status]}.</strong> {placement.reason}</p>; })}
    </details>
    <details className="cp-coverage-overview" data-teacher-practice-plan data-lesson-id={lesson.id}>
      <summary>Deze leesstap begeleiden: {teaching.focus || lesson.title}</summary>
      <p>Doel: de voorbereide woorden herkennen, lezen en betekenis geven met steeds minder hulp. Kies één kleine stap; het onderdeel is geen les die in één keer af moet.</p>
      <p><strong>Klikroute:</strong> Lessen → {pack.title} → Stap voor stap → leesstap {teaching.lessonNumber}: {lesson.title}. De fotokaart opent eerst het woordenoverzicht, niet meteen deze stap.</p>
      <p>Voorbeeldblok van 15 minuten actieve oefentijd. Pas dit in je werkelijk ingeroosterde les en bijbehorende boekdoel; dit is geen volledig lesplan. Pauzes en zelfstandig oefenen vallen hier niet onder.</p>
      <ol>{teaching.blocks.map(block => <li key={block.title}><strong>{block.title} · {block.minutes} minuten.</strong> {block.action}<p>Let op: {block.observe}</p></li>)}</ol>
      <p>{teaching.wordIds.length === 1 ? 'Deze stap heeft één woord. Werk met dat woord; maak geen kunstmatige keuzevraag met nog onbekende woorden.' : 'Meng de woorden van dit onderdeel pas wanneer ze zijn voorbereid. Kies bij Oefeningen één oefenvorm: als reeks of, waar beschikbaar, Op één blad.'}</p>
      <p>Stem hulp apart af op mondeling Nederlands, lezen/schrijven en digitale bediening. Een cursist kan goed spreken en toch net beginnen met lezen. Laat een vlottere lezer zonder voorbeeld proberen; geef een beginnende lezer eerst een model.</p>
      <p>De docent begeleidt de instructie. Nieuwe audio is gepauzeerd. Herhalen bewaart gegevens op dit apparaat, niet per cursist; gebruik dit op gedeelde apparaten niet als individueel beheersingsrapport.</p>
    </details>
    <ol className="cp-coverage-phases">{Object.entries(phaseLabels).map(([id, label]) => <li key={id}><strong>{label}</strong><span>{pack.exercises.filter(item => item.lessonId === lesson.id && item.phase === id && lesson.guidedExerciseIds?.includes(item.exerciseId)).length} in de route</span></li>)}</ol>
    <div className="cp-coverage-table-wrap"><table className="cp-coverage-table" data-build-checklist data-lesson-id={lesson.id}><caption>Vaste bouwchecklist voor {lesson.title}</caption><thead><tr><th>Vaardigheid</th><th>Status</th><th>Aansluiting en volgende bouwstap</th></tr></thead><tbody>{checklist.map(row => <tr key={row.id} data-check-id={row.id}><th scope="row">{row.title}</th><td><span className={`cp-plan-status ${statusClasses[row.status]}`}>{buildStatusLabels[row.status]}</span></td><td>{row.reason}</td></tr>)}</tbody></table></div>
    <details className="cp-coverage-overview" data-sentence-bridge><summary>Van deze woorden naar zinnen en tekstbegrip</summary><p>Doelwoorden: {words(bridge.wordIds)}.</p><p>{bridge.nextAction}</p>
      {bridge.models.length > 0 && <div className="cp-coverage-table-wrap"><table className="cp-coverage-table"><caption>Al gekoppelde luistermodellen — nog geen zelfstandig lezen</caption><thead><tr><th>Model</th><th>Overige woorden voorbereiden</th></tr></thead><tbody>{bridge.models.map(model => <tr key={model.id}><th scope="row">{model.text}<small>{model.kind === 'sentence' ? 'Zin' : 'Situatie'} · menselijke beoordeling open</small>{model.questions.map(question => <small key={question.id}>Vraag: {question.title} · {question.guided ? 'In de lesroute' : 'Bij Vrij oefenen'}<br />{question.objective}{question.preparation.map(note => <span key={note}><br />Vooraf: {note}</span>)}</small>)}</th><td>{model.wordsOutsideStep.join(' · ') || 'Geen extra geschreven vormen; betekenis en leesvoorwaarden blijven te controleren.'}</td></tr>)}</tbody></table></div>}
      <p>{bridge.readingNote}</p><ol>{bridge.stages.map(stage => <li key={stage.title}><strong>{stage.title}.</strong> {stage.action}</li>)}</ol>
    </details>
    <details className="cp-coverage-overview" data-existing-content><summary>Bestaande zinnen, teksten en gesprekken bij deze woorden ({bridge.existing.length})</summary>
      <p>De eerste plek en het terughalen komen uit Lexicon. Beschikbaar bij Zinnen en teksten, Gesprekken en Vrij oefenen; de korte woordles blijft ongewijzigd. Dit zijn plaatsingsvoorstellen met luistersteun, geen vrijgave voor zelfstandig lezen. Gebruik terughaalvoorstellen alleen na eerder aanbod; schuif ze mee bij een latere start. Dit is geen automatische herhaalplanner.</p>
      {bridge.existing.map(item => <details key={item.id} data-content-id={item.id}><summary>{item.kind === 'sentence' ? 'Zin' : item.kind === 'text' ? 'Tekst' : 'Gesprek'}: {item.title}</summary>
        <p>{item.text}</p>
        <dl><dt>Eerst aanbieden bij</dt><dd>{words(item.placement.firstWordIds)}</dd>
          <dt>Terughalen na eerder aanbod</dt><dd>{words(item.placement.returningWordIds)}</dd>
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
