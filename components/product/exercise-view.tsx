'use client';

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Image as Photo, ImageOff, Text } from 'lucide-react';
import { useRouteSettings, type ExerciseViewPreferences } from './route-settings';

type Kind = keyof ExerciseViewPreferences;
type Target = { kind: Kind; reveal: () => void };
const ViewContext = createContext<{ targets: Map<string, Target>; register: (id: string, target?: Target) => void } | null>(null);

export function ExerciseViewProvider({ children }: { children: ReactNode }) {
  const [targets, setTargets] = useState(new Map<string, Target>());
  const register = useCallback((id: string, target?: Target) => setTargets(previous => {
    const next = new Map(previous); if (target) next.set(id, target); else next.delete(id); return next;
  }), []);
  return <ViewContext value={{ targets, register }}>{children}</ViewContext>;
}

export function useExerciseViewTarget(kind: Kind, available = true, onReveal?: () => void) {
  const context = useContext(ViewContext), { view } = useRouteSettings(), id = useId();
  const register = context?.register, reveal = useRef(onReveal);
  useEffect(() => { reveal.current = onReveal; }, [onReveal]);
  useEffect(() => {
    if (!register || !available) return;
    register(id, { kind, reveal: () => reveal.current?.() });
    return () => register(id);
  }, [register, id, kind, available]);
  return context && available ? { 'data-view-content': kind, 'data-view-hidden': !view[kind], 'aria-hidden': !view[kind] || undefined, inert: !view[kind] || undefined } : {};
}

export function ExerciseViewPanel() {
  const context = useContext(ViewContext), { view, changeView } = useRouteSettings();
  if (!context) return null;
  return <fieldset className="cp-view-panel" aria-label="Foto en tekst">{(['photo', 'text'] as const).map(kind => {
    const enabled = [...context.targets.values()].some(target => target.kind === kind);
    const name = kind === 'photo' ? 'Foto' : 'Tekst';
    const label = enabled ? `${name} ${view[kind] ? 'verbergen' : 'tonen'}` : `Geen ${kind === 'photo' ? 'foto' : 'oefentekst'} bij deze oefening`;
    const Icon = kind === 'photo' ? view.photo ? Photo : ImageOff : Text;
    return <button key={kind} type="button" className="cp-view-toggle" data-view-toggle={kind} aria-label={label} title={label} disabled={!enabled} aria-pressed={enabled && view[kind]} onClick={() => {
      if (!view[kind]) for (const target of context.targets.values()) if (target.kind === kind) target.reveal();
      changeView({ ...view, [kind]: !view[kind] });
    }}><span><Icon aria-hidden="true" /></span></button>;
  })}</fieldset>;
}
