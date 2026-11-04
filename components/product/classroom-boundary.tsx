'use client';

import { KlinkOpeningLoader } from './klink-opening-loader';

import { lazy, Suspense, useEffect, useLayoutEffect, useState, type ReactNode } from 'react';
import {
  classroomHash,
  classroomMaterialsHash,
  readClassroomActive,
} from '@/lib/classroom-visibility';
import { TaalrouteHeader } from './taalroute-header';
import { loadTeacherWithRecovery } from './teacher-module-recovery';

let teacherModule: Promise<typeof import('./teacher-classroom')> | undefined;
const loadTeacher = () => teacherModule ??= loadTeacherWithRecovery(() => import('./teacher-classroom'));
const TeacherClassroom = lazy(() => loadTeacher().then(m => ({ default: m.TeacherClassroom })));
const TeacherMaterials = lazy(() => loadTeacher().then(m => ({ default: m.TeacherMaterials })));

// Check before showing any route: Back and reload must not reveal teacher-only material.
export function ClassroomBoundary({ children }: { children: ReactNode }) {
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const loaded = () => { if (!cancelled) setWorkspaceLoaded(true); };
    const preload = readClassroomActive() || window.location.hash.startsWith(classroomHash)
      ? loadTeacher()
      : /^#(?:learner|teacher)/.test(window.location.hash)
        ? import('./practice-workspace').then(m => m.preloadPracticeWorkspace(window.location.hash.startsWith('#learner') ? 'learner' : 'teacher')) : Promise.resolve();
    void preload.then(loaded, loaded);
    return () => { cancelled = true; };
  }, []);
  const [classroom, setClassroom] = useState<boolean | null>(null);
  const [projecting, setProjecting] = useState(false);
  const [materials, setMaterials] = useState(false);
  useLayoutEffect(() => {
    const restore = () => {
      const active = readClassroomActive();
      const [path, query] = window.location.hash.split('?');
      const worksheet = path === classroomMaterialsHash;
      // Only the deliberate worksheet link may interrupt projection; keep the lesson mounted.
      const fromLesson = worksheet && new URLSearchParams(query).get('from') === 'lesson';
      if (active && !window.location.hash.startsWith(classroomHash) && !fromLesson)
        window.history.replaceState(null, '', classroomHash);
      setProjecting(active);
      setClassroom(active || window.location.hash.startsWith(classroomHash));
      setMaterials(worksheet && (!active || fromLesson));
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
  if (classroom === null || !workspaceLoaded) return <KlinkOpeningLoader />;
  return (
    <>
      <TaalrouteHeader classroom={projecting && !materials} />
      <Suspense fallback={<KlinkOpeningLoader />}>
        {classroom && <div hidden={materials}><TeacherClassroom onActiveChange={setProjecting} /></div>}
        {materials && <TeacherMaterials />}
        {!classroom && !materials && children}
      </Suspense>
    </>
  );
}
