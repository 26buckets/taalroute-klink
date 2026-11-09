'use client';
import { useExerciseViewTarget } from './exercise-view';
import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Check, FileText } from 'lucide-react';
import Image from './compact-image';
import './alfa-c-workspace.css';
import { AlfaCPanel } from './alfa-c-panel';

type Document = { id?: string; title?: string; text: string };
function documentKind({ id = '', title = '', text }: Document) {
  if (text.includes('Rivaro Parcel')) return 'parcel';
  if (/BON-|bon/i.test(id + title) || text.includes('Kassabon')) return 'receipt';
  if (/LATER-/.test(id) || text.startsWith('Bericht\nVan:')) return 'message';
  if (/AFSPRAAK-/.test(id) || text.includes('Afspraakkaart')) return 'appointment';
  if (/SAMEN-|rooster|programma/i.test(id + title + text.slice(0, 35))) return 'schedule';
  if (/formulier/i.test(title + text.slice(0, 30))) return 'form';
  return 'note';
}

export function PracticeDocument({ document, label }: { document: Document; label?: string }) {
  const textView = useExerciseViewTarget('text');
  const kind = documentKind(document), lines = document.text.split('\n');
  return <figure {...textView} className={`ac-document ac-document-${kind}`} data-document-id={document.id} data-document-kind={kind}>
    {label && label !== lines[0] && <figcaption>{label}</figcaption>}
    <div className="ac-document-paper">
      {lines.map((line, index) => {
        const price = kind === 'receipt' && line.match(/^(.*?)(€\s*\d+,\d{2})$/);
        const time = kind === 'schedule' && line.match(/^(\d{2}\.\d{2}(?: uur)?)\s+(.+)$/);
        const field = line.match(/^(Voor:|Afhaalplek:|Ophalen:)\s*(.*)$/);
        const heading = /^(Bericht(?: van school)?|Afspraakkaart|Rivaro Parcel|Afhaalbericht|Buurtmarkt|Kassabon|Programma.*|Boodschappen|Lesrooster|Uitnodiging|Marktactie|Aanmelden.*|Oefengegevens|Tafel schoonmaken)$/.test(line);
        return <div key={index} className={`ac-document-line${heading ? ' is-heading' : ''}${line.startsWith('Totaal') ? ' is-total' : ''}${price || time ? ' is-row' : ''}`}>
          {line === 'Rivaro Parcel' ? <Image unoptimized src="/alfa-c/rivaro-parcel.svg" width={190} height={50} alt="Rivaro Parcel" />
            : price ? <><span>{price[1]}</span><span>{price[2]}</span></>
              : time ? <><span>{time[1]}</span><span>{time[2]}</span></>
                : field ? <><strong>{field[1]}</strong>{' '}{field[2]}</> : line || <br />}
        </div>;
      })}
    </div>
  </figure>;
}

export function DocumentSet({ documents }: { documents: Document[] }) {
  const [selected, setSelected] = useState(0);
  const labels = documents.map((d, i) => d.title || `${d.id?.includes('-BON-') ? 'Bon' : 'Bericht'} ${d.id?.split('-').at(-1) || i + 1}`);
  return <div className={`ac-document-set${documents.length > 1 ? ' has-comparison' : ''}`}>
    {documents.length > 1 && <nav className="ac-document-switch" aria-label="Welke tekst?">{documents.map((d, i) => <button key={d.id ?? i} className="secondary-button" aria-pressed={selected === i} onClick={() => setSelected(i)}>{labels[i]}</button>)}</nav>}
    <div className="ac-documents">{documents.map((d, i) => <div key={d.id ?? i} className="ac-document-slot" data-current={selected === i}><PracticeDocument document={d} label={documents.length > 1 ? labels[i] : d.title && d.title !== d.text.split('\n')[0] ? d.title : undefined} /></div>)}</div>
  </div>;
}

export function AlfaCWorkspace({ source, supportOpen = false, ready = false, example = false, feedback, children }: { source: ReactNode; supportOpen?: boolean; ready?: boolean; example?: boolean; feedback?: ReactNode; children: ReactNode }) {
  const [view, setView] = useState<'source' | 'answer'>('source');
  const root = useRef<HTMLDivElement>(null), answerTab = useRef<HTMLButtonElement>(null);
  const [footer, setFooter] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => { setFooter(root.current?.closest('.ac-document-player')?.querySelector<HTMLElement>('.pilot-footer') ?? null); }, []);
  return <div ref={root} className="ac-workspace" data-mobile-view={supportOpen ? 'answer' : view} data-ready={ready}>
    <nav className="ac-panel-switch" aria-label="Tekst of opdracht"><button className="secondary-button" aria-pressed={!supportOpen && view === 'source'} onClick={() => setView('source')} disabled={supportOpen}><FileText />Tekst</button><button ref={answerTab} className="secondary-button" aria-pressed={supportOpen || view === 'answer'} onClick={() => setView('answer')}><Check />Opdracht</button></nav>
    <div className="ac-workspace-panels"><AlfaCPanel kind="source">{source}</AlfaCPanel><AlfaCPanel kind="answer">{children}</AlfaCPanel></div>
    {feedback}
    {footer && !ready && !supportOpen && view === 'source' && createPortal(<button className="primary-button ac-open-task" onClick={() => { setView('answer'); answerTab.current?.focus({ preventScroll: true }); }}><span>{example ? 'Bekijk voorbeeld' : 'Maak de opdracht'}</span><ArrowRight /></button>, footer)}
  </div>;
}
