'use client';

import { useLayoutEffect, useState, type ReactNode } from 'react';
import { classroomHash, readClassroom } from '@/lib/teacher-classroom';
import { TeacherClassroom } from './teacher-classroom';
import { TaalrouteHeader } from './taalroute-header';

// Check before showing any route: Back and reload must not reveal preparation.
export function ClassroomBoundary({ children }: { children: ReactNode }) {
  const [classroom, setClassroom] = useState<boolean | null>(null);
  useLayoutEffect(() => {
    const restore = () => {
      const active = readClassroom().active;
      if (active && !window.location.hash.startsWith(classroomHash))
        window.history.replaceState(null, '', classroomHash);
      setClassroom(active || window.location.hash.startsWith(classroomHash));
    };
    restore();
    window.addEventListener('hashchange', restore);
    window.addEventListener('popstate', restore);
    window.addEventListener('pageshow', restore);
    return () => {
      window.removeEventListener('hashchange', restore);
      window.removeEventListener('popstate', restore);
      window.removeEventListener('pageshow', restore);
    };
  }, []);
  function exit() {
    if (window.location.pathname !== '/') {
      window.location.assign('/#teacher');
      return;
    }
    window.location.hash = 'teacher';
    setClassroom(false);
  }
  if (classroom === null) return <output>Klink wordt geopend…</output>;
  return (
    <>
      <TaalrouteHeader classroom={classroom} />
      {classroom ? <TeacherClassroom onExit={exit} /> : children}
    </>
  );
}
