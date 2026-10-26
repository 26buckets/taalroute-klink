'use client';

import { useEffect, useRef, useState } from 'react';
import { Eye, Search, Puzzle, PencilLine, MessageCircle, RefreshCw, X } from 'lucide-react';
import { Dialog, DialogClose, DialogContent, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { practiceStages } from '@/lib/learner-route';

const stageIcons = [Eye, Search, Puzzle, PencilLine, MessageCircle, RefreshCw];
const stageLabels = ['Kijken', 'Herkennen', 'Namaken', 'Zelf maken', 'Gebruiken', 'Herhalen'];

export function PracticeLine({ available, selected, onSelect }: { available?: string[]; selected?: string; onSelect?: (id: string) => void }) {
  const [explanation, setExplanation] = useState<number | null>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const line = useRef<HTMLElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (explanation === null) return;
    // Keyboard events inside an iframe do not bubble to the dialog.
    const dismiss = (event: MessageEvent) => {
      if (event.origin !== location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data === 'klink:close-explanation') setExplanation(null);
      if (event.data === 'klink:focus-close') { window.focus(); close.current?.focus(); }
    };
    window.addEventListener('message', dismiss);
    return () => window.removeEventListener('message', dismiss);
  }, [explanation]);
  return <Dialog open={explanation !== null} onOpenChange={open => { if (!open) setExplanation(null); }}><section ref={line} className={`cp-practice-line${onSelect ? '' : ' cp-practice-line-overview'}`} aria-label="Oefenlijn"><h2>Zo oefen je</h2>
    <ol>{practiceStages.map((stage, index) => {
      const Icon = stageIcons[index], enabled = !available || available.includes(stage.id);
      const number = <span className="cp-line-number">{index + 1}</span>;
      const label = <><Icon aria-hidden="true" /><strong>{stageLabels[index]}</strong>{!enabled && <small>Nog niet bij deze keuze</small>}</>;
      return <li key={stage.id}>{onSelect ? <button type="button" disabled={!enabled} aria-current={selected === stage.id ? 'step' : undefined} onClick={() => onSelect(stage.id)} data-stage-link={stage.id}>{number}{label}</button> : <>{number}<DialogTrigger type="button" onClick={() => setExplanation(index)} aria-label={`${stageLabels[index]}: bekijk de uitleg`}>{label}</DialogTrigger></>}</li>;
    })}</ol>
  </section>
    {explanation !== null && <DialogContent className="cp-practice-explanation" showCloseButton={false} initialFocus={close} aria-modal="true" aria-describedby={undefined}>
      <div className="cp-practice-explanation-heading">
        <DialogTitle>{stageLabels[explanation]}</DialogTitle>
        <DialogClose ref={close} type="button" aria-label="Uitleg sluiten" onKeyDown={event => {
          if (event.key === 'Tab' && event.shiftKey) {
            const doc = frame.current?.contentDocument;
            const last = doc?.querySelector<HTMLElement>('.description[open] #description') ?? doc?.querySelector('summary');
            if (last) { event.preventDefault(); last.focus(); }
          }
        }}><X aria-hidden="true" />Sluiten</DialogClose>
      </div>
      <iframe ref={frame} title={`${stageLabels[explanation]}: zo oefen je`} src={`/practice-explanations/index.html?step=${explanation}`} onLoad={event => {
        const root = event.currentTarget.contentDocument?.documentElement;
        if (!root || !line.current) return;
        const theme = getComputedStyle(line.current);
        for (const name of ['--ink', '--muted', '--primary', '--primary-dark', '--paper', '--canvas', '--line-strong', '--focus', '--radius']) root.style.setProperty(name, theme.getPropertyValue(name));
        root.style.fontFamily = theme.fontFamily;
      }} />
    </DialogContent>}
  </Dialog>;
}
