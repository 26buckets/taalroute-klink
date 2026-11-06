'use client';

import { createContext, useContext, type ComponentProps } from 'react';
import { ArrowRight } from 'lucide-react';

export const PracticeActionContext = createContext<{
  ready: boolean;
  next: () => void;
  disabled: boolean;
  label: string;
} | null>(null);

// Keep the primary action beside a short answer, including when automatic advance is paused.
export function PracticeCheckButton(props: ComponentProps<'button'>) {
  const action = useContext(PracticeActionContext);
  if (!action?.ready) return <button {...props} data-practice-check data-inline-check />;
  return <button className={props.className} type="button" data-practice-next data-inline-next
    disabled={action.disabled} onClick={action.next} aria-keyshortcuts="Enter ArrowRight">
    {action.label}<ArrowRight />
  </button>;
}
