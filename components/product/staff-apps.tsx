'use client';

import { PackagePlayer } from '@/components/product/package-experience';
import { NavButton, StaffShell, StaffTopbar } from '@/components/product/shared';
import { contentPackages, getPackage, type PackageId } from '@/lib/package-content';
import {
  ArrowRight,
  Check,
  CircleAlert,
  FileAudio,
  Images,
  LayoutDashboard,
  PackageOpen,
  Route,
  Shapes,
} from 'lucide-react';
import { useState } from 'react';

type TeacherView = 'overview' | 'packages' | 'activities' | 'media' | 'package';

export function TeacherApp({ onExit, onToast }: { onExit: () => void; onToast: (message: string) => void }) {
  const [view, setView] = useState<TeacherView>('overview');
  const [selectedPackage, setSelectedPackage] = useState<PackageId>('CP001');

  function openPackage(packageId: PackageId) {
    setSelectedPackage(packageId);
    setView('package');
  }

  if (view === 'package') {
    return <PackagePlayer packageId={selectedPackage} onClose={() => setView('packages')} savedWordIds={[]} onToggleWord={() => onToast('Bewaren gebeurt in de cursistomgeving.')} onToast={onToast} />;
  }

  return (
    <StaffShell area="Docent" name="Nora Smit" initials="NS" onExit={onExit} nav={<>
      <NavButton active={view === 'overview'} icon={<LayoutDashboard />} label="Overzicht" onClick={() => setView('overview')} />
      <NavButton active={view === 'packages'} icon={<PackageOpen />} label="Pakketten" onClick={() => setView('packages')} badge="2" />
      <NavButton active={view === 'activities'} icon={<Shapes />} label="Oefenkaart" onClick={() => setView('activities')} badge="18" />
      <NavButton active={view === 'media'} icon={<Images />} label="Media" onClick={() => setView('media')} />
    </>}>
      {view === 'overview' && <TeacherOverview onOpen={openPackage} onActivities={() => setView('activities')} />}
      {view === 'packages' && <TeacherPackages onOpen={openPackage} />}
      {view === 'activities' && <TeacherActivities />}
      {view === 'media' && <TeacherMedia />}
    </StaffShell>
  );
}

function TeacherOverview({ onOpen, onActivities }: { onOpen: (packageId: PackageId) => void; onActivities: () => void }) {
  return <><StaffTopbar title="Klink inhoudsoverzicht" subtitle="Alfabeta+ · CP001 tot en met CP016" /><div className="staff-content cp-teacher-content">
    <section className="cp-teacher-hero"><div><span className="eyebrow light">Nu geladen</span><h2>CP001 en CP002 zijn echte contentpakketten</h2><p>Niet twee kleine leesreeksen, maar samen 1.187 concrete oefeningen in 18 verschillende activiteitsoorten.</p><button className="accent-button" onClick={onActivities}>Bekijk alle 18 soorten<ArrowRight /></button></div><div><span><strong>2</strong><small>pakketten</small></span><span><strong>42</strong><small>woordkaarten</small></span><span><strong>1.187</strong><small>oefeningen</small></span><span><strong>18</strong><small>activiteitsoorten</small></span></div></section>
    <section className="cp-teacher-package-cards">{contentPackages.map((pack) => <article key={pack.id}><header><span><PackageOpen /></span><div><small>{pack.id}</small><h3>{pack.title}</h3></div><b>{pack.status}</b></header><p>{pack.description}</p><div><span><strong>{pack.counts.lessons}</strong><small>lessen</small></span><span><strong>{pack.counts.coreWords}</strong><small>woorden</small></span><span><strong>{pack.counts.exercises}</strong><small>oefeningen</small></span><span><strong>{pack.counts.images}</strong><small>beelden</small></span></div><button className="primary-button wide" onClick={() => onOpen(pack.id)}>Open pakket<ArrowRight /></button></article>)}</section>
    <p className="cp-honesty-line"><CircleAlert />De inhoud en beelden zijn inspecteerbaar. Audio, menselijke mediareview en runtimecontrole zijn nog niet als afgerond vastgelegd.</p>
  </div></>;
}

function TeacherPackages({ onOpen }: { onOpen: (packageId: PackageId) => void }) {
  return <><StaffTopbar title="Contentpakketten" subtitle="CP001 en CP002 · later doorlopend tot CP016" /><div className="staff-content cp-teacher-content"><div className="page-heading"><div><span className="eyebrow">Pakketten</span><h2>Wat zit waar?</h2><p>Open een pakket om woorden, lessen, oefeningen, teksten, gesprekken en media afzonderlijk te bekijken.</p></div></div><section className="cp-teacher-package-list">{contentPackages.map((pack) => <button key={pack.id} onClick={() => onOpen(pack.id)}><span><PackageOpen /></span><div><small>{pack.id} · {pack.level}</small><strong>{pack.title}</strong><p>{pack.subtitle}</p></div><div><b>{pack.counts.lessons}</b><small>lessen</small></div><div><b>{pack.counts.coreWords}</b><small>woorden</small></div><div><b>{pack.counts.exercises}</b><small>oefeningen</small></div><ArrowRight /></button>)}</section></div></>;
}

function TeacherActivities() {
  const cp001 = getPackage('CP001');
  const cp002 = getPackage('CP002');
  return <><StaffTopbar title="Oefenkaart" subtitle="18 activiteitsoorten · aantallen uit de pakketbron" /><div className="staff-content cp-teacher-content"><div className="page-heading"><div><span className="eyebrow">Werkvormen</span><h2>Niet zes, maar achttien verschillende soorten</h2><p>Een activiteitsoort is de bediening of werkvorm. Iedere soort wordt daarna vaak herhaald met andere woorden, zinnen en contexten.</p></div></div><section className="cp-activity-matrix"><header><span>Nr.</span><span>Activiteitsoort</span><span>CP001</span><span>CP002</span><span>Samen</span></header>{cp001.exerciseTypes.map((type, index) => { const other = cp002.exerciseTypes.find((item) => item.id === type.id); const cp002Count = other?.count ?? 0; return <article key={type.id}><span>{String(index + 1).padStart(2, '0')}</span><div><small>{type.id}</small><strong>{type.label}</strong><em>{type.examples.join(' · ')}</em></div><b>{type.count}</b><b>{cp002Count}</b><b>{type.count + cp002Count}</b></article>; })}<footer><span /><strong>Totaal concrete oefeningen</strong><b>{cp001.counts.exercises}</b><b>{cp002.counts.exercises}</b><b>{cp001.counts.exercises + cp002.counts.exercises}</b></footer></section><aside className="cp-advice-card"><Route /><div><strong>Advies voor de cursistomgeving</strong><p>Laat niet achttien knoppen tegelijk zien. Orden de werkvormen binnen de vijf herkenbare KLINK-stappen en toon per les één duidelijke volgende handeling. De volledige kaart hoort bij docent en maker.</p></div></aside></div></>;
}

function TeacherMedia() {
  return <><StaffTopbar title="Media en vrijgave" subtitle="Feitelijke status per contentpakket" /><div className="staff-content cp-teacher-content"><div className="page-heading"><div><span className="eyebrow">Controle</span><h2>Wat is aanwezig en wat staat nog open?</h2><p>Aanwezige bestanden zijn niet automatisch gelijk aan vrijgegeven media.</p></div></div><section className="cp-teacher-media-grid">{contentPackages.map((pack) => <article key={pack.id}><header><span>{pack.id}</span><strong>{pack.title}</strong></header><div><Images /><span><b>{pack.media.imageAvailable} / {pack.media.imageExpected}</b><small>beeldbindingen aanwezig</small></span></div><div><FileAudio /><span><b>{pack.media.audioAvailable}</b><small>audiobestanden aanwezig</small></span></div><ul><li><Check />Inhoud geladen</li><li className="open"><CircleAlert />{pack.media.imageReview}</li><li className="open"><CircleAlert />{pack.media.audioReview}</li>{pack.media.missing.length > 0 && <li className="open"><CircleAlert />{pack.media.missing.length} beeldbindingen ontbreken</li>}</ul></article>)}</section></div></>;
}
