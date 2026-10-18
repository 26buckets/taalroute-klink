'use client';

import { contentLevels, contentHelp, levelLabel, type ContentSelection } from '@/lib/content-levels';

export function ContentLevelPicker({ selection, onChange }: { selection: ContentSelection; onChange: (selection: ContentSelection) => void }) {
  return <details className="cp-level-picker" data-level-picker>
    <summary>Niveau kiezen · {levelLabel(selection.level)}{selection.help && selection.help !== 'all' ? ` · ${contentHelp.find(item => item.id === selection.help)!.label}` : ''}</summary>
    <fieldset className="cp-chapter-levels"><legend>Leren lezen en schrijven</legend>{contentLevels.filter(item => item.id.startsWith('alfa-')).map(item => <button type="button" className="secondary-button" key={item.id} aria-pressed={selection.level === item.id} onClick={() => onChange({ ...selection, level: item.id })}>{item.label}</button>)}</fieldset>
    <fieldset className="cp-chapter-levels"><legend>Nederlands gebruiken</legend>{contentLevels.filter(item => ['a1', 'a2', 'b1'].includes(item.id)).map(item => <button type="button" className="secondary-button" key={item.id} aria-pressed={selection.level === item.id} onClick={() => onChange({ ...selection, level: item.id })}>{item.label}</button>)}</fieldset>
    <fieldset className="cp-chapter-levels"><legend className="sr-only">Alle inhoud</legend>{contentLevels.filter(item => ['all', 'support'].includes(item.id)).map(item => <button type="button" className="secondary-button" key={item.id} aria-pressed={selection.level === item.id} onClick={() => onChange({ ...selection, level: item.id })}>{item.label}</button>)}</fieldset>
    <fieldset className="cp-chapter-levels"><legend>Hulp bij de opdracht</legend>{contentHelp.map(item => <button type="button" className="secondary-button" key={item.id} aria-pressed={(selection.help ?? 'all') === item.id} onClick={() => onChange({ ...selection, help: item.id })}>{item.label}</button>)}</fieldset>
    <p>Kies samen met je docent. Je kunt verder zijn met spreken dan met lezen.</p>
  </details>;
}
