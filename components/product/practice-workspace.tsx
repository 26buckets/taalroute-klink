'use client';

import { LearnerApp } from './learner-app';
import { TeacherApp } from './staff-apps';
import { RouteSettingsProvider } from './route-settings';

export default function PracticeWorkspace({ portal, onExit, onToast }: {
  portal: 'learner' | 'teacher'; onExit: () => void; onToast: (text: string) => void;
}) {
  return <RouteSettingsProvider>{portal === 'learner'
    ? <LearnerApp onExit={onExit} onToast={onToast} />
    : <TeacherApp onExit={onExit} onToast={onToast} />}</RouteSettingsProvider>;
}
