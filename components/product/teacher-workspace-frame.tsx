'use client';

import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Presentation } from 'lucide-react';
import { NavButton, StaffShell, StaffTopbar } from './shared';

export function TeacherWorkspaceFrame({ view, title, children }: {
  view: 'plus' | 'materials'; title?: ReactNode; children: ReactNode;
}) {
  const exit = () => { window.location.href = '/'; };
  return <StaffShell area="Docent" name="Klink+docent" initials="TR" onExit={exit} nav={<>
    <NavButton icon={<Presentation />} active={view === 'plus'} label="Klink+docent" onClick={() => { window.location.hash = 'teacher/plus'; }} />
    <NavButton icon={<BookOpen />} active={view === 'materials'} label="Werkbladen" onClick={() => { window.location.hash = 'teacher/materials'; }} />
  </>}>
    <div className="tw tw-workspace">
      <StaffTopbar title="Klink+docent" subtitle="Digibordlessen" actions={<a className="secondary-button" href="https://studio.taalroute.nl/#/apps/klink/handleiding" target="_blank" rel="noopener noreferrer">Handleiding in Studio<ArrowRight /></a>} />
      <div className="tw-content" data-teacher-card>
        <div className="tw-location"><button className="tw-back" onClick={exit}><ArrowLeft />Terug naar Klink</button><h2>{title ?? 'Werkbladen'}</h2></div>
        <div className="tw-body">{children}</div>
      </div>
    </div>
  </StaffShell>;
}
