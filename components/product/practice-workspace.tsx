'use client';

import { lazy, Suspense } from 'react';
import { KlinkOpeningLoader } from './klink-opening-loader';
import { RouteSettingsProvider } from './route-settings';

const loadLearner = () => import('./learner-app').then(m => ({ default: m.LearnerApp }));
const loadTeacher = () => import('./staff-apps').then(m => ({ default: m.TeacherApp }));
const LearnerApp = lazy(loadLearner);
const TeacherApp = lazy(loadTeacher);

export default function PracticeWorkspace({ portal, onExit, onToast }: {
  portal: 'learner' | 'teacher'; onExit: () => void; onToast: (text: string) => void;
}) {
  return <RouteSettingsProvider><Suspense fallback={<KlinkOpeningLoader />}>{portal === 'learner'
    ? <LearnerApp onExit={onExit} onToast={onToast} />
    : <TeacherApp onExit={onExit} onToast={onToast} />}</Suspense></RouteSettingsProvider>;
}
