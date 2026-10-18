'use client';

import { usePathname } from 'next/navigation';
import { ArrowLeft, ChevronDown } from 'lucide-react';

export function ManualNavigation({ chapters }: { chapters: { id: string; title: string }[] }) {
  const pathname = usePathname();
  const links = [{ href: '/docenten', label: 'Overzicht' }, ...chapters.map(chapter => ({ href: `/docenten/${chapter.id}`, label: chapter.title.replace(/^\d+ /, '') }))];
  const navigation = <nav aria-label="Onderwerpen in de handleiding"><ul>{links.map(link => <li key={link.href}><a href={link.href} aria-current={pathname === link.href ? 'page' : undefined}>{link.label}</a></li>)}</ul></nav>;
  return (
    <aside className="wiki-sidebar">
      <a className="manual-back" href="/#learner/home"><ArrowLeft aria-hidden="true" />Naar Klink</a>
      <a className="wiki-skip" href="#wiki-inhoud">Naar de inhoud</a>
      <div className="wiki-desktop-navigation"><p className="wiki-navigation-title">Docentenhandleiding</p>{navigation}</div>
      <details className="wiki-mobile-navigation" key={pathname}><summary>Onderwerpen<ChevronDown aria-hidden="true" /></summary>{navigation}</details>
    </aside>
  );
}
