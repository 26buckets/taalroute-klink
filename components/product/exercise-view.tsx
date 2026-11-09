'use client';

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Image as Photo, ImageOff, Text } from 'lucide-react';
import { useRouteSettings, type ExerciseViewPreferences } from './route-settings';

type Kind = keyof ExerciseViewPreferences;
type Target = { kind: Kind; visible: boolean; reveal: () => void };
const ViewContext = createContext<{ targets: Map<string, Target>; register: (id: string, target?: Target) => void } | null>(null);

export function ExerciseViewProvider({ children }: { children: ReactNode }) {
  const [targets, setTargets] = useState(new Map<string, Target>());
  const register = useCallback((id: string, target?: Target) => setTargets(previous => {
    const next = new Map(previous); if (target) next.set(id, target); else next.delete(id); return next;
  }), []);
  return <ViewContext value={{ targets, register }}>{children}</ViewContext>;
}

export function useExerciseViewTarget(kind: Kind, available = true, onReveal?: () => void, initiallyHidden = false) {
  const context = useContext(ViewContext), { view } = useRouteSettings(), id = useId();
  const [revealed, setRevealed] = useState(false);
  const visible = view[kind] && (!initiallyHidden || revealed);
  const register = context?.register, reveal = useRef(onReveal);
  useEffect(() => { reveal.current = onReveal; }, [onReveal]);
  useEffect(() => {
    if (!register || !available) return;
    register(id, { kind, visible, reveal: () => { setRevealed(true); reveal.current?.(); } });
    return () => register(id);
  }, [register, id, kind, available, visible]);
  return context && available ? { 'data-view-content': kind, 'data-view-hidden': !visible, 'aria-hidden': !visible || undefined, inert: !visible || undefined } : {};
}

export function ExerciseViewPanel() {
  const context = useContext(ViewContext), { view, changeView } = useRouteSettings();
  if (!context) return null;
  return <fieldset className="cp-view-panel" aria-label="Foto en tekst">{(['photo', 'text'] as const).map(kind => {
    const targets = [...context.targets.values()].filter(target => target.kind === kind);
    const enabled = targets.length > 0, visible = enabled && targets.every(target => target.visible);
    const name = kind === 'photo' ? 'Foto' : 'Tekst';
    const label = enabled ? `${name} ${visible ? 'verbergen' : 'tonen'}` : `Geen ${kind === 'photo' ? 'foto' : 'oefentekst'} bij deze oefening`;
    const Icon = kind === 'photo' ? view.photo ? Photo : ImageOff : Text;
    return <button key={kind} type="button" className="cp-view-toggle" data-view-toggle={kind} aria-label={label} title={label} disabled={!enabled} aria-pressed={visible} onClick={() => {
      if (!visible) for (const target of targets) target.reveal();
      changeView({ ...view, [kind]: !visible });
    }}><span><Icon aria-hidden="true" /><small>{name}</small></span></button>;
  })}</fieldset>;
}
