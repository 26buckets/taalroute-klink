import type { Ref } from 'react';
import { ArrowLeft } from 'lucide-react';

export function PracticeHeader({ title, backLabel, onBack, headingRef, meta, metaLabel }: {
  title: string; backLabel: string; onBack: () => void;
  headingRef?: Ref<HTMLHeadingElement>; meta?: string; metaLabel?: string;
}) {
  return <header className="cp-context-header">
    <button className="text-back" onClick={onBack} aria-label={backLabel} title={backLabel}><ArrowLeft /></button>
    <h1 ref={headingRef} tabIndex={-1}>{title}</h1>
    <small className="cp-context-meta" aria-label={metaLabel}>{meta}</small>
  </header>;
}
