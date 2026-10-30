'use client';

import { useLayoutEffect, useState, type ReactNode } from 'react';
import {
  classroomHash,
  classroomMaterialsHash,
  readClassroom,
} from '@/lib/teacher-classroom';
import { TeacherClassroom, TeacherMaterials } from './teacher-classroom';
import { TaalrouteHeader } from './taalroute-header';

// Check before showing any route: Back and reload must not reveal teacher-only material.
export function ClassroomBoundary({ children }: { children: ReactNode }) {
  const [classroom, setClassroom] = useState<boolean | null>(null);
  const [projecting, setProjecting] = useState(false);
  const [materials, setMaterials] = useState(false);
  useLayoutEffect(() => {
    const restore = () => {
      const active = readClassroom().active;
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
  function exit() {
    if (window.location.pathname !== '/') {
      window.location.assign('/');
      return;
    }
    window.location.hash = '';
    setClassroom(false);
    setMaterials(false);
  }
  if (classroom === null) return <output>Klink wordt geopend…</output>;
  return (
    <>
      <TaalrouteHeader classroom={projecting} />
      {classroom ? (
        <TeacherClassroom onExit={exit} onActiveChange={setProjecting} />
      ) : materials ? (
        <TeacherMaterials />
      ) : (
        children
      )}
    </>
  );
}
