import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import chapters from '@/data/klink-teacher-manual.json';

type Props = { params: Promise<{ chapter: string }> };
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { chapter } = await params;
  const item = chapters.find(item => item.id === chapter);
  return { title: item ? `${item.title.replace(/^\d+ /, '')} | Klink docentenhandleiding` : 'Onderwerp niet gevonden | Klink' };
}
export default async function ManualChapter({ params }: Props) {
  const { chapter } = await params;
  const index = chapters.findIndex(item => item.id === chapter);
  if (index === -1) notFound();
  const item = chapters[index], previous = chapters[index - 1], next = chapters[index + 1];
  // Existing chapter references in reviewed, trusted text become wiki links.
  const html = item.html
    .replace(/<(\/?)h3>/g, '<$1h2>')
    .replace(/\bhoofdstuk (1[0-2]|[1-9])\b/g, '<a href="/docenten/hoofdstuk-$1">hoofdstuk $1</a>');
  return <>
    <nav className="wiki-breadcrumb" aria-label="Kruimelpad"><a href="/docenten">Docentenhandleiding</a><span aria-hidden="true">/</span><span>Onderwerp {index + 1}</span></nav>
    <article className="wiki-article"><header className="wiki-heading"><h1>{item.title.replace(/^\d+ /, '')}</h1></header><div dangerouslySetInnerHTML={{ __html: html }} /></article>
    <nav className="wiki-pagination" aria-label="Verder in de handleiding">
      {previous ? <a href={`/docenten/${previous.id}`}><ArrowLeft aria-hidden="true" /><span><small>Vorig onderwerp</small>{previous.title.replace(/^\d+ /, '')}</span></a> : <a href="/docenten"><ArrowLeft aria-hidden="true" />Overzicht</a>}
      {next && <a href={`/docenten/${next.id}`}><span><small>Volgend onderwerp</small>{next.title.replace(/^\d+ /, '')}</span><ArrowRight aria-hidden="true" /></a>}
    </nav>
  </>;
}
