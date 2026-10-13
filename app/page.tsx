'use client';

import { EntryScreen } from '@/components/product/entry-design';
import { LearnerApp } from '@/components/product/learner-app';
import { CompactLearnerApp } from '@/components/product/compact-learner-app';
import { TeacherApp } from '@/components/product/staff-apps';
import { CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export type Portal = 'entry' | 'learner' | 'compact' | 'teacher';

export default function KlinkProductSlice() {
  const [portal, setPortal] = useState<Portal>('entry');
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const context = (document as Document & {
      modelContext?: { registerTool?: (tool: unknown, options?: { signal?: AbortSignal }) => void | Promise<void> };
    }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    void Promise.resolve(context.registerTool({
      name: 'open_klink_workspace',
      title: 'Open een Klink-werkplek',
      description: 'Open de cursist- of docentomgeving van Klink.',
      inputSchema: {
        type: 'object',
        properties: { workspace: { type: 'string', enum: ['entry', 'learner', 'compact', 'teacher'] } },
        required: ['workspace'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const workspace = (input as { workspace?: Portal }).workspace;
        if (!workspace || !['entry', 'learner', 'compact', 'teacher'].includes(workspace)) throw new Error('Onbekende werkplek.');
        setPortal(workspace);
        return { visibleWorkspace: workspace };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <div className="product-root" data-theme="taalroute">
      {portal === 'entry' && <EntryScreen onPortal={setPortal} />}
      {portal === 'learner' && <LearnerApp onExit={() => setPortal('entry')} onToast={setToast} />}
      {portal === 'compact' && <CompactLearnerApp onExit={() => setPortal('entry')} />}
      {portal === 'teacher' && <TeacherApp onExit={() => setPortal('entry')} onToast={setToast} />}
      {toast && <output className="toast-message"><CheckCircle2 />{toast}</output>}
    </div>
  );
}
