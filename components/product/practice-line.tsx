'use client';

import { Eye, Search, Puzzle, PencilLine, MessageCircle, RefreshCw, Image, Images, PanelsTopLeft, GalleryHorizontalEnd, FileImage, CircleDashed } from 'lucide-react';
import { practiceStages, pictureGrowth } from '@/lib/learner-route';
import { contentPackages } from '@/lib/package-content';

const stageIcons = [Eye, Search, Puzzle, PencilLine, MessageCircle, RefreshCw];
const stageLabels = ['Kijken', 'Herkennen', 'Namaken', 'Zelf maken', 'Gebruiken', 'Herhalen'];
const pictureIcons = [Image, Images, PanelsTopLeft, GalleryHorizontalEnd, FileImage];
const pictureLabels = ['Woordbeeld', 'Beelden kiezen', 'Situatie', 'Beeldverhaal', 'Praktijkbeeld'];
const picturesPresent = [contentPackages.some(pack => pack.words.some(word => word.image)), contentPackages.some(pack => pack.words.filter(word => word.image).length > 1), contentPackages.some(pack => pack.scenes.some(scene => scene.image)), false, false];

export function PracticeLine({ available, selected, onSelect }: { available?: string[]; selected?: string; onSelect?: (id: string) => void }) {
  return <section className="cp-practice-line" aria-label="Oefenlijn"><h2>Zo oefen je</h2>
    <ol>{practiceStages.map((stage, index) => {
      const Icon = stageIcons[index], enabled = !available || available.includes(stage.id);
      const label = <><span className="cp-line-number">{index + 1}</span><Icon aria-hidden="true" /><strong>{stageLabels[index]}</strong>{!enabled && <small>Nog niet bij deze keuze</small>}</>;
      return <li key={stage.id}>{onSelect ? <button type="button" disabled={!enabled} aria-current={selected === stage.id ? 'step' : undefined} onClick={() => onSelect(stage.id)} data-stage-link={stage.id}>{label}</button> : <div>{label}</div>}</li>;
    })}</ol>
  </section>;
}

export function PictureGrowthLine() {
  return <section className="cp-picture-growth" aria-label="Beeldopbouw"><h2>Van woordbeeld naar situatie</h2><ol>{pictureGrowth.map((step, index) => {
    const Icon = pictureIcons[index];
    return <li key={step.id} data-picture-stage={step.id} data-available={picturesPresent[index]}><Icon aria-hidden="true" /><strong>{pictureLabels[index]}</strong><small>{picturesPresent[index] ? index === 2 ? 'Met de docent' : 'Aanwezig' : <><CircleDashed aria-hidden="true" />Nog niet beschikbaar</>}</small></li>;
  })}</ol></section>;
}
