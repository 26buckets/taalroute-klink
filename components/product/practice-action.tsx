'use client';

import { createContext, useContext, type ComponentProps } from 'react';
import { ArrowRight } from 'lucide-react';

export const PracticeActionContext = createContext<{
  ready: boolean;
  next: () => void;
  disabled: boolean;
  label: string;
} | null>(null);

// Keep Check with the answer; the same action advances once ready.
export function PracticeCheckButton(props: ComponentProps<'button'>) {
  const action = useContext(PracticeActionContext);
  if (!action?.ready) return <button {...props} data-practice-check data-inline-check />;
  return <button className={props.className} type="button" data-practice-next data-inline-next data-mobile-continue={action.label === 'Verder' || undefined}
    disabled={action.disabled} onClick={action.next} aria-keyshortcuts="Enter ArrowRight">
    {action.label}<ArrowRight />
  </button>;
}
