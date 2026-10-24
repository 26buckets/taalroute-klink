'use client';

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Check, ChevronDown, type LucideIcon } from 'lucide-react';

export type ExerciseMenuProps = {
  value: string;
  options: { id: string; label: string; icon: LucideIcon }[];
  onSelect: (id: string) => void;
};

export function ExerciseMenu({ value, options, onSelect, heading, controls, onOpenChange }: ExerciseMenuProps & { heading?: ReactNode; controls?: ReactNode; onOpenChange?: (open: boolean) => void }) {
  const [open, updateOpen] = useState(false);
  function setOpen(next: boolean) { updateOpen(next); onOpenChange?.(next); }
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const selected = options.find(option => option.id === value);
  if (!selected || options.length < 2) return <>{heading}{controls}</>;
  const Icon = selected.icon;
  const label = (option: ExerciseMenuProps['options'][number]) => option.id === 'sound-compare' ? 'Vergelijk klanken' : option.label;
  function closeOnEscape(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === 'Escape' && open) { event.stopPropagation(); setOpen(false); trigger.current?.focus(); }
  }
  return <section className="cp-exercise-menu" aria-label="Oefening kiezen">
    <div className="cp-exercise-menu-bar">
      <div className="cp-exercise-menu-current"><Icon aria-hidden="true" />{heading ?? <span>{label(selected)}</span>}</div>
      <button onKeyDown={closeOnEscape} ref={trigger} type="button" className="secondary-button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>Andere oefening<ChevronDown aria-hidden="true" /></button>
      {controls}
    </div>
    <fieldset id={id} className="cp-exercise-menu-options" hidden={!open}><legend className="sr-only">Beschikbare oefeningen</legend>
      {options.map(option => {
        const OptionIcon = option.icon;
        return <button onKeyDown={closeOnEscape} key={option.id} type="button" data-exercise-choice={option.id} aria-pressed={option.id === value} onClick={() => {
          setOpen(false); trigger.current?.focus(); if (option.id !== value) onSelect(option.id);
        }}><OptionIcon aria-hidden="true" /><span>{label(option)}</span><Check className="cp-exercise-menu-check" aria-hidden="true" /></button>;
      })}
    </fieldset>
  </section>;
}
