'use client';

import type { ReactNode } from 'react';
import { ArrowLeft, BookOpen, Presentation } from 'lucide-react';
import { ClassroomBrand } from './teacher-route-stage';

export function TeacherWorkspaceFrame({
  view,
  children,
  onNavigate,
}: {
  view: 'plus' | 'materials';
  children: ReactNode;
  onNavigate?: (hash: string) => void;
}) {
  return (
    <div className="product-root">
      <div className="learner-app consistent-layout kpd-workspace">
        <aside className="learner-nav">
          <nav aria-label="Docentnavigatie">
            <button
              className={view === 'plus' ? 'active' : ''}
              aria-current={view === 'plus' ? 'page' : undefined}
              onClick={() => {
                if (onNavigate) onNavigate('teacher/plus');
                else window.location.hash = 'teacher/plus';
              }}
            >
              <Presentation />
              <span>Lessen</span>
            </button>
            <button
              className={view === 'materials' ? 'active' : ''}
              aria-current={view === 'materials' ? 'page' : undefined}
              onClick={() => {
                if (onNavigate) onNavigate('teacher/materials');
                else window.location.hash = 'teacher/materials';
              }}
            >
              <BookOpen />
              <span>Werkbladen</span>
            </button>
            <button
              onClick={() => {
                if (onNavigate) onNavigate('learner/home');
                else window.location.hash = 'learner/home';
              }}
            >
              <ArrowLeft />
              <span>Terug naar Klink</span>
            </button>
          </nav>
        </aside>
        <main className="learner-main">
          <div className="kpd-home" data-teacher-card>
            <header className="kpd-home-header">
              <h1>
                <ClassroomBrand />
              </h1>

            </header>
            <h2>{view === 'plus' ? 'Kies een les' : 'Werkbladen'}</h2>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
