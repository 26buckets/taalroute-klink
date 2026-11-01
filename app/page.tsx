'use client';

import { KlinkOpeningLoader } from '@/components/product/klink-opening-loader';

import { EntryScreen } from '@/components/product/entry-design';
import { CheckCircle2 } from 'lucide-react';
import { lazy, Suspense, useEffect, useState } from 'react';

const PracticeWorkspace = lazy(() => import('@/components/product/practice-workspace'));

export type Portal = 'entry' | 'learner' | 'teacher';

export default function KlinkProductSlice() {
  const [portal, setPortal] = useState<Portal>('entry');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const restore = () => setPortal(window.location.hash.startsWith('#learner') ? 'learner' : window.location.hash.startsWith('#teacher') ? 'teacher' : 'entry');
    restore();
    window.addEventListener('hashchange', restore);
    return () => window.removeEventListener('hashchange', restore);
  }, []);
  function openPortal(next: Portal) {
    setPortal(next);
    window.location.hash = next === 'entry' ? '' : next;
  }

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
        properties: { workspace: { type: 'string', enum: ['entry', 'learner', 'teacher'] } },
        required: ['workspace'],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute(input: unknown) {
        const workspace = (input as { workspace?: Portal }).workspace;
        if (!workspace || !['entry', 'learner', 'teacher'].includes(workspace)) throw new Error('Onbekende werkplek.');
        openPortal(workspace);
        return { visibleWorkspace: workspace };
      },
    }, { signal: lifecycle.signal })).catch(() => undefined);
    return () => lifecycle.abort();
  }, []);

  return (
    <div className="product-root" data-theme="taalroute">
      {portal === 'entry' && <EntryScreen onPortal={openPortal} />}
      {portal !== 'entry' && <Suspense fallback={<KlinkOpeningLoader />}><PracticeWorkspace portal={portal} onExit={() => openPortal('entry')} onToast={setToast} /></Suspense>}
      {toast && <output className="toast-message"><CheckCircle2 />{toast}</output>}
    </div>
  );
}
