'use client';

import { createContext, useContext, useState, type ButtonHTMLAttributes, type Dispatch, type ReactNode, type SetStateAction } from 'react';
import { createPortal } from 'react-dom';
import { Volume2 } from 'lucide-react';
import { ExerciseViewProvider, ExerciseViewPanel } from './exercise-view';

const ListenCorner = createContext<[HTMLSpanElement | null, Dispatch<SetStateAction<HTMLSpanElement | null>>] | null>(null);

export function ExerciseAudioProvider({ children }: { children: ReactNode }) {
  const corner = useState<HTMLSpanElement | null>(null);
  return <ListenCorner value={corner}><ExerciseViewProvider>{children}</ExerciseViewProvider></ListenCorner>;
}

export function ExerciseAudioSlot({ children, info }: { children?: ReactNode; info?: ReactNode }) {
  const corner = useContext(ListenCorner);
  const Tag = info ? 'header' : 'div';
  return <Tag className="cp-exercise-tools"><span className="cp-listen-slot" ref={corner?.[1]} />{children}<ExerciseViewPanel />{info}</Tag>;
}

export function ExerciseListen({ label, inline = false, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; inline?: boolean }) {
  const corner = useContext(ListenCorner);
  const button = <button {...props} type="button" data-practice-listen aria-keyshortcuts="Space" className="secondary-button cp-exercise-listen" aria-label={label} title={label}><Volume2 aria-hidden="true" /></button>;
  // Only the control moves; its original handler and playback owner remain intact.
  return corner && !inline ? corner[0] && createPortal(button, corner[0]) : button;
}
