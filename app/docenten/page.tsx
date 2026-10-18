import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import chapters from '@/data/klink-teacher-manual.json';
import { ManualLegacyLink } from '@/components/product/manual-legacy-link';

export const metadata: Metadata = { title: 'Docentenhandleiding | Klink · Taalroute', description: 'Vind praktische uitleg over voorbereiden, begeleiden, feedback en herhalen met Klink.' };
const groups = [
  { title: 'Beginnen met Klink', chapters: chapters.slice(0, 4) },
  { title: 'Tijdens de les', chapters: chapters.slice(4, 9) },
  { title: 'Plannen en verantwoorden', chapters: chapters.slice(9) },
];

export default function TeacherManual() {
  return <>
    <ManualLegacyLink />
    <header className="wiki-heading"><p className="manual-eyebrow">Klink · Voor docenten en begeleiders</p><h1>Docentenhandleiding</h1><p>Kies het onderwerp dat je nodig hebt. Elk onderwerp heeft een eigen pagina.</p></header>
    <a className="wiki-quickstart" href="/docenten/hoofdstuk-1"><span><strong>Voor het eerst met Klink?</strong><span>Begin met de snelstart voor de docent.</span></span><ArrowRight aria-hidden="true" /></a>
    <div className="wiki-topic-groups">{groups.map(group => <section key={group.title}><h2>{group.title}</h2><ul>{group.chapters.map(chapter => <li key={chapter.id}><a href={`/docenten/${chapter.id}`}>{chapter.title.replace(/^\d+ /, '')}<ArrowRight aria-hidden="true" /></a></li>)}</ul></section>)}</div>
    <a className="manual-teacher-entry" href="/#teacher/activities">Open de docentomgeving<ArrowRight aria-hidden="true" /></a>
  </>;
}
