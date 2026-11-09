'use client';

import { createContext, useContext, useId, useState, type ButtonHTMLAttributes, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { CircleHelp, Volume2 } from 'lucide-react';
import { ExerciseViewProvider, ExerciseViewPanel } from './exercise-view';

const ListenCorner = createContext<[HTMLSpanElement | null, Dispatch<SetStateAction<HTMLSpanElement | null>>] | null>(null);
const HelpCorner = createContext<{
  button: HTMLSpanElement | null; panel: HTMLDivElement | null;
  setButton: (node: HTMLSpanElement | null) => void; setPanel: (node: HTMLDivElement | null) => void;
} | null>(null);

export function ExerciseAudioProvider({ children }: { children: ReactNode }) {
  const corner = useState<HTMLSpanElement | null>(null);
  const [button, setButton] = useState<HTMLSpanElement | null>(null);
  const [panel, setPanel] = useState<HTMLDivElement | null>(null);
  return <ListenCorner value={corner}><HelpCorner value={{ button, panel, setButton, setPanel }}><ExerciseViewProvider>{children}</ExerciseViewProvider></HelpCorner></ListenCorner>;
}

export function ExerciseAudioSlot({ children, info }: { children?: ReactNode; info?: ReactNode }) {
  const corner = useContext(ListenCorner);
  const help = useContext(HelpCorner);
  const Tag = info ? 'header' : 'div';
  return <Tag className="cp-exercise-tools"><span className="cp-listen-slot" ref={corner?.[1]} />{children}<ExerciseViewPanel /><span className="cp-help-button-slot" ref={help?.setButton} />{info}<div className="cp-help-panel-slot" ref={help?.setPanel} /></Tag>;
}

export function ExerciseListen({ label, showLabel = false, inline = false, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; showLabel?: boolean; inline?: boolean }) {
  const corner = useContext(ListenCorner);
  const button = <button {...props} type="button" data-practice-listen aria-keyshortcuts="Space" className="secondary-button cp-exercise-listen" aria-label={label} title={label}><Volume2 aria-hidden="true" />{showLabel ? <span>{label}</span> : <span className="cp-listen-caption">Luister</span>}</button>;
  // Only the control moves; its original handler and playback owner remain intact.
  return corner && !inline ? corner[0] && createPortal(button, corner[0]) : button;
}

export function ExerciseHelp({ children, open, closeLabel = 'Verberg voorbeeld', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { open: boolean; closeLabel?: string }) {
  const corner = useContext(HelpCorner);
  const id = useId();
  const label = open ? closeLabel : 'Help';
  const panel = children ? <div id={id} className="cp-exercise-help-panel">{children}</div> : null;
  const button = <button {...props} type="button" className="secondary-button cp-exercise-help" aria-label="Help" title={label}
    aria-expanded={open} aria-controls={panel ? id : undefined}>
    <CircleHelp aria-hidden="true" /><span>Help</span>
  </button>;
  if (!corner) return <>{button}{panel}</>;
  return <>{corner.button && createPortal(button, corner.button)}{panel && corner.panel && createPortal(panel, corner.panel)}</>;
}
