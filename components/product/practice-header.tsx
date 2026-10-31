import type { ReactNode, Ref } from 'react';
import { ArrowLeft } from 'lucide-react';

export function PracticeHeader({ title, backLabel, onBack, headingRef, meta, metaLabel, actions }: {
  title: ReactNode; backLabel: string; onBack?: () => void;
  headingRef?: Ref<HTMLHeadingElement>; meta?: string; metaLabel?: string; actions?: ReactNode;
}) {
  return <header className="cp-context-header">
    {onBack && <button className="text-back" onClick={onBack} aria-label={backLabel} title={backLabel}><ArrowLeft /></button>}
    <h1 ref={headingRef} tabIndex={-1}>{title}</h1>
    <small className="cp-context-meta" aria-label={metaLabel}>{meta}</small>
    {actions}
  </header>;
}
