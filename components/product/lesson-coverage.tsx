'use client';

import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { contentPackages, type PackageId } from '@/lib/package-content';
import { lessonPlan, phaseLabels, planStatusLabels, type PlanStatus } from '@/lib/lesson-plan';

const statuses = Object.keys(planStatusLabels) as PlanStatus[];

export function LessonCoverage({ onOpen }: { onOpen: (id: PackageId) => void }) {
  const [packageId, setPackageId] = useState(contentPackages[0].id);
  const [lessonId, setLessonId] = useState(contentPackages[0].lessons[0].id);
  const pack = contentPackages.find(item => item.id === packageId)!;
  const lesson = pack.lessons.find(item => item.id === lessonId) ?? pack.lessons[0];
  const plan = lessonPlan(pack, lesson);
  const words = (ids: string[] = []) => ids.map(id => pack.words.find(word => word.id === id)?.word).join(' · ') || '—';
  return <section className="cp-lesson-coverage" aria-labelledby="lesson-coverage-title">
    <header><h2 id="lesson-coverage-title">De route per leesstap</h2><p>De bestaande Taalroute-indeling blijft leidend. ‘Werkt al’ betekent technisch aangesloten, niet inhoudelijk vrijgegeven. Uitspraak, beeldbetekenis en instructie-audio vragen nog controle.</p></header>
    <div className="cp-coverage-filters">
      <label>Onderdeel<select value={packageId} onChange={event => { const next = contentPackages.find(item => item.id === event.target.value)!; setPackageId(next.id); setLessonId(next.lessons[0].id); }}>{contentPackages.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      <label>Leesstap<select value={lesson.id} onChange={event => setLessonId(event.target.value)}>{pack.lessons.map((item, index) => <option key={item.id} value={item.id}>{index + 1}. {item.title} — {words(item.newWords?.length ? item.newWords : item.returning)}</option>)}</select></label>
    </div>
    <dl className="cp-coverage-words"><div><dt>Bekende woorden</dt><dd>{words(lesson.known)}</dd></div><div><dt>Nieuwe woorden</dt><dd>{words(lesson.newWords)}</dd></div><div><dt>Woorden die terugkomen</dt><dd>{words(lesson.returning)}</dd></div></dl>
    {lesson.scope && <p>{lesson.scope}</p>}
    <ol className="cp-coverage-phases">{Object.entries(phaseLabels).map(([id, label]) => <li key={id}><strong>{label}</strong><span>{pack.exercises.filter(item => item.lessonId === lesson.id && item.phase === id && lesson.guidedExerciseIds?.includes(item.exerciseId)).length} in de route</span></li>)}</ol>
    <p>Betekenis koppelen is nog geen oefenen in een situatie. Een combinatie of zin krijgt eigen luistervoorwaarden én leesvoorwaarden; een hoorbaar woord maakt een zin niet zelfstandig leesbaar.</p>
    <div className="cp-coverage-table-wrap"><table className="cp-coverage-table"><caption>Oefendoelen en ontbrekende inhoud voor {lesson.title}</caption><thead><tr><th>Oefendoel</th><th>Status</th><th>Wat is er nodig?</th></tr></thead><tbody>{plan.map(row => <tr key={row.id}><th scope="row">{row.title}<small>{phaseLabels[row.phase]}</small></th><td><span className={`cp-plan-status ${row.status}`}>{planStatusLabels[row.status]}</span></td><td>{row.reason}</td></tr>)}</tbody></table></div>
    <button className="primary-button" onClick={() => onOpen(pack.id)}>Open deze lessen<ArrowRight /></button>
    <details className="cp-coverage-overview"><summary>Alle leesstappen in dit onderdeel ({pack.lessons.length})</summary><p>Aantallen oefendoelen per status, niet het aantal losse opdrachten.</p><div className="cp-coverage-table-wrap"><table className="cp-coverage-table"><thead><tr><th>Leesstap</th>{statuses.map(status => <th key={status}>{planStatusLabels[status]}</th>)}</tr></thead><tbody>{pack.lessons.map(item => { const rows = lessonPlan(pack, item); return <tr key={item.id}><th scope="row"><button onClick={() => setLessonId(item.id)}>{item.title}: {words(item.newWords?.length ? item.newWords : item.returning)}</button></th>{statuses.map(status => <td key={status}>{rows.filter(row => row.status === status).length}</td>)}</tr>; })}</tbody></table></div></details>
  </section>;
}
