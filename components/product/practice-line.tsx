'use client';

import { Eye, Search, Puzzle, PencilLine, MessageCircle, RefreshCw } from 'lucide-react';
import { practiceStages } from '@/lib/learner-route';

const stageIcons = [Eye, Search, Puzzle, PencilLine, MessageCircle, RefreshCw];
const stageLabels = ['Kijken', 'Herkennen', 'Namaken', 'Zelf maken', 'Gebruiken', 'Herhalen'];

export function PracticeLine({ available, selected, onSelect }: { available?: string[]; selected?: string; onSelect?: (id: string) => void }) {
  return <section className={`cp-practice-line${onSelect ? '' : ' cp-practice-line-overview'}`} aria-label="Oefenlijn"><h2>Zo oefen je</h2>
    <ol>{practiceStages.map((stage, index) => {
      const Icon = stageIcons[index], enabled = !available || available.includes(stage.id);
      const number = <span className="cp-line-number">{index + 1}</span>;
      const label = <><Icon aria-hidden="true" /><strong>{stageLabels[index]}</strong>{!enabled && <small>Nog niet bij deze keuze</small>}</>;
      return <li key={stage.id}>{onSelect ? <button type="button" disabled={!enabled} aria-current={selected === stage.id ? 'step' : undefined} onClick={() => onSelect(stage.id)} data-stage-link={stage.id}>{number}{label}</button> : <>{number}<div>{label}</div></>}</li>;
    })}</ol>
  </section>;
}
