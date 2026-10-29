'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Presentation,
  Users,
} from 'lucide-react';
import { NavButton, StaffShell, StaffTopbar } from './shared';

export type TeacherView =
  | 'home'
  | 'groups'
  | 'assignments'
  | 'plus'
  | 'materials';
const titles = {
  home: 'Wat wil je doen?',
  groups: 'Cursisten en groepen',
  assignments: 'Opdrachten klaarzetten',
  plus: 'Klink+docent',
  materials: 'Werkbladen',
};

export function TeacherWorkspaceFrame({
  view,
  identity,
  onExit,
  onNavigate,
  title,
  children,
}: {
  view: TeacherView;
  identity?: string | null;
  onExit?: () => void;
  onNavigate?: (view: TeacherView) => void;
  title?: ReactNode;
  children: ReactNode;
}) {
  const [account, setAccount] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState('');
  useEffect(() => {
    if (identity !== undefined) return;
    const controller = new AbortController();
    void fetch('/api/teaching?role=teacher', {
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401) {
          setAccount(null);
          return;
        }
        if (!response.ok)
          throw new Error('De aanmelding kan nu niet worden gecontroleerd.');
        const data = (await response.json()) as { person: { name: string } };
        setAccount(data.person.name);
      })
      .catch((e) => {
        if (!controller.signal.aborted) setError((e as Error).message);
      });
    return () => controller.abort();
  }, [identity]);
  const name = identity === undefined ? account : identity;
  function navigate(next: TeacherView) {
    if (onNavigate) onNavigate(next);
    else window.location.hash = next === 'home' ? 'teacher' : `teacher/${next}`;
  }
  async function exit() {
    if (onExit) {
      onExit();
      return;
    }
    try {
      const response = await fetch('/api/teaching?role=teacher', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      });
      if (!response.ok)
        throw new Error('Afsluiten lukt nu niet. Probeer opnieuw.');
      window.location.hash = '';
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <StaffShell
      area="Docent"
      name={name ?? 'Docent'}
      initials="TR"
      onExit={() => void exit()}
      nav={
        <>
          <NavButton
            icon={<Users />}
            active={view === 'groups'}
            label="Cursisten en groepen"
            onClick={() => navigate('groups')}
          />
          <NavButton
            icon={<BookOpen />}
            active={view === 'assignments'}
            label="Opdrachten"
            onClick={() => navigate('assignments')}
          />
          <NavButton
            icon={<Presentation />}
            active={view === 'plus'}
            label="Klink+docent"
            onClick={() => navigate('plus')}
          />
          <NavButton
            icon={<BookOpen />}
            active={view === 'materials'}
            label="Werkbladen"
            onClick={() => navigate('materials')}
          />
        </>
      }
    >
      <div className="tw tw-workspace">
        <StaffTopbar
          title="Docentomgeving"
          subtitle={
            name
              ? `Aangemeld als ${name}`
              : name === null
                ? 'Niet aangemeld'
                : 'Aanmelding controleren…'
          }
          actions={
            <a
              className="secondary-button"
              href="https://studio.taalroute.nl/#/apps/klink/handleiding"
              target="_blank"
              rel="noopener noreferrer"
            >
              Handleiding in Studio
              <ArrowRight />
            </a>
          }
        />
        <div className="tw-content" data-teacher-card>
          <div className="tw-location">
            <button
              className="tw-back"
              disabled={view === 'home'}
              onClick={() => navigate('home')}
            >
              <ArrowLeft />
              Overzicht
            </button>
            <h2>{title ?? titles[view]}</h2>
          </div>
          <div className="tw-body">
            {error && (
              <p role="alert" className="tw-message">
                {error}
              </p>
            )}
            {children}
          </div>
        </div>
      </div>
    </StaffShell>
  );
}
