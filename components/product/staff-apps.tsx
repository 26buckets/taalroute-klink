'use client';

import { PackagePlayer } from '@/components/product/package-experience';
import { LessonCoverage } from '@/components/product/lesson-coverage';
import { ContentCoverage, ContentAudioRegister } from '@/components/product/content-audio-register';
import { NavButton, StaffShell, StaffTopbar } from '@/components/product/shared';
import {
  exerciseOpportunities,
  opportunityGroups,
  type OpportunityStatus,
} from '@/lib/exercise-opportunities';
import { contentPackages, allPackageWords, type PackageId } from '@/lib/package-content';
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

const totalExercises = contentPackages.reduce((sum, pack) => sum + pack.counts.exercises, 0);
const connectedTypes = [...new Set(contentPackages.flatMap(pack => pack.exerciseTypes.map(type => type.id)))];
const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  direct: 'Nog uit te werken',
  audio: 'Eerst opnamen controleren',
  metadata: 'Aanvullende voorbereiding',
};
function summarize(packs: typeof contentPackages) {
  return { counts: { exercises: packs.reduce((sum, pack) => sum + pack.counts.exercises, 0) }, exerciseTypes: connectedTypes.map(id => {
    const types = packs.flatMap(pack => pack.exerciseTypes).filter(type => type.id === id);
    return { id, label: types[0]?.label ?? contentPackages.flatMap(pack => pack.exerciseTypes).find(type => type.id === id)!.label, count: types.reduce((sum, type) => sum + type.count, 0), examples: types[0]?.examples ?? [] };
  }) };
}

type TeacherView = 'overview' | 'packages' | 'activities' | 'media' | 'package';

export function TeacherApp({ onExit, onToast }: { onExit: () => void; onToast: (message: string) => void }) {
  const [view, setView] = useState<TeacherView>('overview');
  const [selectedPackage, setSelectedPackage] = useState<PackageId>(contentPackages[0].id);

  function openPackage(packageId: PackageId) {
    setSelectedPackage(packageId);
    setView('package');
  }

  if (view === 'package') {
    return <PackagePlayer packageId={selectedPackage} onClose={() => setView('packages')} savedWordIds={[]} onToggleWord={() => onToast('Bewaren gebeurt in de cursistomgeving.')} onToast={onToast} />;
  }

  return (
    <StaffShell area="Docent" name="Docent" initials="TR" onExit={onExit} nav={<>
      <NavButton active={view === 'overview'} icon={<LayoutDashboard />} label="Overzicht" onClick={() => setView('overview')} />
      <NavButton active={view === 'packages'} icon={<PackageOpen />} label="Leesstappen" onClick={() => setView('packages')} badge="10" />
      <NavButton active={view === 'activities'} icon={<Shapes />} label="Oefenkaart" onClick={() => setView('activities')} badge={String(contentPackages.reduce((count, pack) => count + pack.lessons.length, 0))} />
      <NavButton active={view === 'media'} icon={<Images />} label="Media" onClick={() => setView('media')} />
    </>}>
      {view === 'overview' && <TeacherOverview onOpen={openPackage} onActivities={() => setView('activities')} />}
      {view === 'packages' && <TeacherPackages onOpen={openPackage} />}
      {view === 'activities' && <><div className="staff-content cp-teacher-content"><details className="cp-coverage-overview"><summary>Volledige inhoudslijn: van ontwerp naar app</summary><ContentCoverage /></details><LessonCoverage onOpen={openPackage} /></div><details className="cp-teacher-extra"><summary>Meer oefenvormen en mogelijkheden</summary><TeacherActivities /></details></>}
      {view === 'media' && <><div className="staff-content cp-teacher-content"><ContentAudioRegister /></div><TeacherMedia /></>}
    </StaffShell>
  );
}

function TeacherOverview({ onOpen, onActivities }: { onOpen: (packageId: PackageId) => void; onActivities: () => void }) {
  return <><StaffTopbar title="Klink inhoudsoverzicht" subtitle="Alfabeta+ · de Taalroute-leerlijn" /><div className="staff-content cp-teacher-content">
    <section className="cp-teacher-hero"><div><span className="eyebrow light">Taalroute</span><h2>De Taalroute-leesstappen in Klink</h2><p>De tien bouwgroepen bevatten de basisleesstappen, herhaling en uitbreidingen. Daarnaast staan de vijf routes voor langere woorden en de steunwoorden.</p><button className="accent-button" onClick={onActivities}>Bekijk de complete oefenkaart<ArrowRight /></button></div><div><span><strong>10</strong><small>bouwgroepen</small></span><span><strong>{allPackageWords.length}</strong><small>woordkaarten</small></span><span><strong>{totalExercises}</strong><small>oefeningen</small></span><span><strong>{connectedTypes.length}</strong><small>oefenvormen</small></span><span><strong>52</strong><small>opdrachtvarianten</small></span></div></section>
    <p className="cp-honesty-line"><CircleAlert />Start samen; bereid m, a en t afzonderlijk voor. Dit is nog geen volledige zelfstandige startroute. Beoordeel de uitspraak en herkenbaarheid van de beelden voordat je ermee oefent.</p>
    <section className="cp-teacher-package-cards">{contentPackages.map((pack) => <article key={pack.id}><header><span><PackageOpen /></span><div><h3>{pack.title}</h3></div></header><p>{pack.description}</p><div><span><strong>{pack.counts.lessons}</strong><small>lessen</small></span><span><strong>{pack.counts.coreWords}</strong><small>woorden</small></span><span><strong>{pack.counts.exercises}</strong><small>oefeningen</small></span><span><strong>{pack.counts.images}</strong><small>beelden</small></span></div><button className="primary-button wide" onClick={() => onOpen(pack.id)}>Open leesstappen<ArrowRight /></button></article>)}</section>
  </div></>;
}

function TeacherPackages({ onOpen }: { onOpen: (packageId: PackageId) => void }) {
  return <><StaffTopbar title="Leesstappen" subtitle="15 onderdelen · 302 lesroutes" /><div className="staff-content cp-teacher-content"><div className="page-heading"><div><span className="eyebrow">Taalroute</span><h2>Wat zit waar?</h2><p>Open een onderdeel om woorden, leesstappen, oefeningen en media te bekijken.</p></div></div><section className="cp-teacher-package-list">{contentPackages.map((pack) => <button key={pack.id} onClick={() => onOpen(pack.id)}><span><PackageOpen /></span><div><small>{pack.level}</small><strong>{pack.title}</strong><p>{pack.subtitle}</p></div><div><b>{pack.counts.lessons}</b><small>lessen</small></div><div><b>{pack.counts.coreWords}</b><small>woorden</small></div><div><b>{pack.counts.exercises}</b><small>oefeningen</small></div><ArrowRight /></button>)}</section></div></>;
}

function TeacherActivities() {
  const groups = summarize(contentPackages.filter(pack => pack.kind === 'group'));
  const routes = summarize(contentPackages.filter(pack => pack.kind !== 'group'));
  const statusCounts = Object.fromEntries(
    (['direct', 'audio', 'metadata'] as OpportunityStatus[]).map((status) => [
      status,
      exerciseOpportunities.filter((item) => item.status === status).length,
    ]),
  ) as Record<OpportunityStatus, number>;
  return <><StaffTopbar title="Oefenkaart" subtitle="Oefenvormen en mogelijkheden" /><div className="staff-content cp-teacher-content"><div className="page-heading"><div><span className="eyebrow">Complete kaart</span><h2>Wat bestaat al en wat kunnen we ermee maken?</h2><p>Bekijk de beschikbare oefeningen en ideeën voor verdere lessen. Een mogelijkheid in dit overzicht is nog geen beschikbare opdracht.</p></div></div><section className="cp-opportunity-summary"><article><strong>{totalExercises}</strong><span>beschikbare oefeningen</span><small>{connectedTypes.length} oefenvormen worden gebruikt</small></article><article><strong>18</strong><span>oefenvormen</span><small>vormen voor verschillende leerdoelen</small></article><article><strong>52</strong><span>mogelijke opdrachten</span><small>de complete didactische bibliotheek</small></article><article className="direct"><strong>{statusCounts.direct}</strong><span>mogelijk met bestaande woorden</span><small>nog geen uitgewerkte les</small></article><article className="audio"><strong>{statusCounts.audio}</strong><span>na audiocontrole</span><small>opnamen eerst controleren</small></article><article className="metadata"><strong>{statusCounts.metadata}</strong><span>voorbereiding nodig</span><small>zoals duidelijke aanwijzingen en antwoorden</small></article></section><section className="cp-activity-matrix"><header><span>Nr.</span><span>Oefenvorm</span><span>Bouwgroepen</span><span>Leesroutes</span><span>Samen</span></header>{groups.exerciseTypes.map((type, index) => { const other = routes.exerciseTypes.find((item) => item.id === type.id); const routeCount = other?.count ?? 0; return <article key={type.id}><span>{String(index + 1).padStart(2, '0')}</span><div><strong>{type.label}</strong><em>{type.examples.join(' · ')}</em></div><b>{type.count}</b><b>{routeCount}</b><b>{type.count + routeCount}</b></article>; })}<footer><span /><strong>Totaal concrete oefeningen</strong><b>{groups.counts.exercises}</b><b>{routes.counts.exercises}</b><b>{groups.counts.exercises + routes.counts.exercises}</b></footer></section><section className="cp-opportunity-atlas"><header><div><span className="eyebrow">Uitbreidingsbibliotheek</span><h2>Alle 52 mogelijke opdrachten</h2><p>Dit overzicht is voor maker en docent. De cursist krijgt per les alleen de volgende passende opdracht te zien.</p></div><div className="cp-opportunity-legend">{(['direct', 'audio', 'metadata'] as OpportunityStatus[]).map((status) => <span key={status} className={status}>{opportunityStatusLabels[status]}</span>)}</div></header>{opportunityGroups.map((group, groupIndex) => { const items = exerciseOpportunities.filter((item) => item.group === group); return <details key={group} open={groupIndex === 0}><summary><span>{String(groupIndex + 1).padStart(2, '0')}</span><div><strong>{group}</strong><small>{items.length} opdrachten</small></div><ArrowRight /></summary><div>{items.map((item) => <article key={item.id}><span>{items.indexOf(item) + 1}</span><div><strong>{item.title}</strong><small>{item.phase} · {item.level} · {item.response}</small></div><em>{item.response}</em><b className={item.status}>{opportunityStatusLabels[item.status]}</b></article>)}</div></details>; })}</section><aside className="cp-advice-card"><Route /><div><strong>Advies voor de cursistomgeving</strong><p>Laat nooit 52 keuzes tegelijk zien. Bouw per les een route van 8–16 korte activiteiten: voordoen, herkennen, construeren, produceren, betekenis, tempo en later herhalen. Zo ontstaat veel variatie zonder steeds nieuwe woorden te introduceren.</p></div></aside></div></>;
}

function TeacherMedia() {
  return <><StaffTopbar title="Beeld en geluid" subtitle="Controleren voor gebruik" /><div className="staff-content cp-teacher-content"><div className="page-heading"><div><span className="eyebrow">Controle</span><h2>Wat is aanwezig en wat staat nog open?</h2><p>Controleer of de uitspraak klopt en elk beeld de bedoelde betekenis laat zien. Sommige woorden hebben nog geen beeld of opname.</p></div></div><section className="cp-teacher-media-grid">{contentPackages.map((pack) => <article key={pack.id}><header><strong>{pack.title}</strong></header><div><Images /><span><b>{pack.media.imageAvailable} / {pack.media.imageExpected}</b><small>woordbeelden aanwezig</small></span></div><div><FileAudio /><span><b>{pack.media.audioAvailable}</b><small>woordopnamen aanwezig</small></span></div><ul><li><Check />Woorden beschikbaar</li><li className="open"><CircleAlert />{pack.media.imageReview}</li><li className="open"><CircleAlert />{pack.media.audioReview}</li>{pack.media.missing.length > 0 && <li className="open"><CircleAlert />{pack.media.missing.length} woordbeelden ontbreken</li>}</ul></article>)}</section></div></>;
}
