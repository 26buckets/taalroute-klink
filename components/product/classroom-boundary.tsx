'use client';

import { lazy, Suspense, useLayoutEffect, useState, type ReactNode } from 'react';
import {
  classroomHash,
  classroomMaterialsHash,
  readClassroomActive,
} from '@/lib/classroom-visibility';
import { TaalrouteHeader } from './taalroute-header';

const TeacherClassroom = lazy(() => import('./teacher-classroom').then(m => ({ default: m.TeacherClassroom })));
const TeacherMaterials = lazy(() => import('./teacher-classroom').then(m => ({ default: m.TeacherMaterials })));

// Check before showing any route: Back and reload must not reveal teacher-only material.
export function ClassroomBoundary({ children }: { children: ReactNode }) {
  const [classroom, setClassroom] = useState<boolean | null>(null);
  const [projecting, setProjecting] = useState(false);
  const [materials, setMaterials] = useState(false);
  useLayoutEffect(() => {
    const restore = () => {
      const active = readClassroomActive();
      if (active && !window.location.hash.startsWith(classroomHash))
        window.history.replaceState(null, '', classroomHash);
      setProjecting(active);
      setClassroom(active || window.location.hash.startsWith(classroomHash));
      setMaterials(!active && window.location.hash === classroomMaterialsHash);
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
  if (classroom === null) return <output>Klink wordt geopend…</output>;
  return (
    <>
      <TaalrouteHeader classroom={projecting} />
      <Suspense fallback={<output>Klink wordt geopend…</output>}>{classroom ? (
        <TeacherClassroom onActiveChange={setProjecting} />
      ) : materials ? (
        <TeacherMaterials />
      ) : (
        children
      )}</Suspense>
    </>
  );
}
