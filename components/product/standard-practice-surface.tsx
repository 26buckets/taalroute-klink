'use client';

import { compactImageSrc } from '@/lib/compact-images';
import { useRef, useState } from 'react';
import { Check, RotateCcw, Volume2 } from 'lucide-react';
import type { AudioPlayer, PackageExercise, ExerciseAudio } from '@/lib/package-content';
import { normalizeAnswer, sameSelection, validStandardTask, type StandardTask, type SortTask, type MarkTask, type GapTask, type HotspotTask, type BranchTask, type BranchChoice } from '@/lib/standard-player-contract';

type Props = { exercise: PackageExercise; onAudio: AudioPlayer; onFinish: (answer: string, correct: boolean, feedback?: string) => void; onReset: () => void; onHelp: () => void; canAnswer: boolean; answeredCorrectly?: boolean };
type TaskProps<T> = Props & { task: T };
export function StandardPracticeSurface(props: Props) {
  const task = props.exercise.standardTask as StandardTask | undefined;
  if (!task || !validStandardTask(task)) return <section className="cp-task-card"><p>Deze oefening werkt nog niet. Kies met je docent een andere oefening.</p></section>;
  return <section className="cp-task-card cp-standard-task" data-standard-player={task.kind}>
    {typeof props.exercise.question === 'string' && task.kind === 'mark' && <h4>{props.exercise.question}</h4>}
    {task.kind === 'sort' && <SortSurface {...props} task={task} />}
    {task.kind === 'mark' && <MarkSurface {...props} task={task} />}
    {task.kind === 'gap' && <GapSurface {...props} task={task} />}
    {task.kind === 'hotspot' && <HotspotSurface {...props} task={task} />}
    {task.kind === 'branch' && <BranchSurface {...props} task={task} />}
  </section>;
}
function Help({ text, onHelp }: { text: string; onHelp: () => void }) {
  const [open, setOpen] = useState(false);
  return <><button className="secondary-button" aria-expanded={open} onClick={() => { setOpen(!open); onHelp(); }}>Help</button>{open && <p className="cp-source-text">{text}</p>}</>;
}
function SortSurface({ task, onAudio, onFinish, onReset, onHelp, canAnswer, answeredCorrectly }: TaskProps<SortTask>) {
  const [selected, setSelected] = useState(task.items[0].id);
  const [placements, setPlacements] = useState<Record<string, string>>({});
  const [sheet, setSheet] = useState(false);
  const [heard, setHeard] = useState<string[]>([]);
  const [audioError, setAudioError] = useState(false);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const selectedItem = task.items.find(item => item.id === selected);
  const done = (id: string) => placements[id] === task.items.find(item => item.id === id)?.categoryId;
  const locked = !canAnswer || answeredCorrectly;
  function place(categoryId: string, itemId = selected) {
    const item = task.items.find(item => item.id === itemId);
    if (locked || !item || done(itemId) || (task.basis === 'sound' && !heard.includes(itemId))) return;
    const next = { ...placements, [itemId]: categoryId };
    setPlacements(next); onReset();
    if (item.categoryId !== categoryId) { onFinish(JSON.stringify(next), false, task.help); return; }
    const remaining = task.items.find(i => next[i.id] !== i.categoryId);
    if (!remaining) onFinish(JSON.stringify(next), true, 'Goed. Alle woorden staan in het juiste vak.');
    else { setSelected(remaining.id); requestAnimationFrame(() => itemRefs.current[remaining.id]?.focus()); }
  }
  return <>
    <fieldset className="cp-practice-display" aria-label="Hoe wil je oefenen?">
      <button className="secondary-button" aria-pressed={!sheet} onClick={() => setSheet(false)}>Eén voor één</button>
      <button className="secondary-button" aria-pressed={sheet} onClick={() => setSheet(true)}>Op één blad</button>
    </fieldset>
    <p>Kies een woord. Kies daarna een vak.</p>
    <div className="cp-sort-items">{task.items.map(item => <div key={item.id} hidden={!sheet && selected !== item.id && !answeredCorrectly}>
      <button ref={node => { itemRefs.current[item.id] = node; }} className="secondary-button" data-sort-item={item.id} aria-pressed={selected === item.id} disabled={locked || done(item.id)} draggable={!locked && !done(item.id)} onDragStart={event => { event.dataTransfer.setData('text/plain', item.id); setSelected(item.id); }} onClick={() => setSelected(item.id)}>{task.basis === 'sound' ? 'Luister naar het woord' : item.label}{done(item.id) && <Check aria-label="Klaar" />}</button>
      {task.basis === 'sound' && <button data-practice-listen={selected === item.id ? true : undefined} aria-keyshortcuts="Space" className="secondary-button" aria-label={`Luister naar woord ${task.items.indexOf(item) + 1}`} onClick={async () => { setAudioError(false); try { const result = await onAudio(item.audio?.src, { waitUntilEnd: true }); if (result === false) throw Error('audio'); setHeard(ids => [...new Set([...ids, item.id])]); } catch { setAudioError(true); } }}><Volume2 /></button>}
      {placements[item.id] && <small>{task.categories.find(c => c.id === placements[item.id])?.label}</small>}
    </div>)}</div>
    {audioError && <output aria-live="polite">Het geluid werkt niet. Probeer het nog eens.</output>}
    <div className="cp-sort-categories">{task.categories.map(category => <button className="secondary-button" data-sort-category={category.id} key={category.id} disabled={locked || !selectedItem || done(selected) || (task.basis === 'sound' && !heard.includes(selected))} onClick={() => place(category.id)} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); place(category.id, event.dataTransfer.getData('text/plain')); }}>{category.label}<small>{task.items.filter(i => done(i.id) && placements[i.id] === category.id).map(i => i.label).join(' · ')}</small></button>)}</div>
    <Help text={task.help} onHelp={onHelp} />
  </>;
}
function MarkSurface({ task, exercise, onAudio, onFinish, onReset, onHelp, canAnswer, answeredCorrectly }: TaskProps<MarkTask>) {
  const [selected, setSelected] = useState<string[]>([]);
  return <>
    <p>Lees de vraag. Tik op de woorden met het antwoord.</p>
    {((exercise.sourceBlocks ?? []) as { id: string; audio?: ExerciseAudio }[]).filter(block => block.audio?.src).map(block => <button data-practice-listen aria-keyshortcuts="Space" key={block.id} className="secondary-button" onClick={() => { onHelp(); void onAudio(block.audio?.src); }}><Volume2 />Luister naar de tekst</button>)}
    <div className="cp-mark-text" aria-label="Tik op de woorden">{task.tokens.map(token => <button className="secondary-button" key={token.id} data-word-token={token.id} disabled={!canAnswer || answeredCorrectly} aria-pressed={selected.includes(token.id)} onClick={() => { setSelected(ids => ids.includes(token.id) ? ids.filter(id => id !== token.id) : [...ids, token.id]); onReset(); }}>{token.text}</button>)}</div>
    <div className="cp-task-actions"><button data-practice-check className="primary-button" disabled={!canAnswer || !selected.length || answeredCorrectly} onClick={() => onFinish(JSON.stringify(selected), task.acceptedSelections.some(ids => sameSelection(selected, ids)), task.acceptedSelections.some(ids => sameSelection(selected, ids)) ? 'Goed. Dit is het antwoord.' : task.help)}>Controleer<Check /></button>
      <button className="secondary-button" disabled={!selected.length || answeredCorrectly} onClick={() => { setSelected([]); onReset(); }}><RotateCcw />Wis</button></div>
    <Help text={task.help} onHelp={onHelp} />
  </>;
}
function GapSurface({ task, exercise, onAudio, onFinish, onReset, onHelp, canAnswer, answeredCorrectly }: TaskProps<GapTask>) {
  const [mode, setMode] = useState<'type' | 'choice'>('type');
  const [value, setValue] = useState('');
  const [model, setModel] = useState(false);
  const correct = (answer: string) => task.acceptedAnswers.some(allowed => normalizeAnswer(allowed) === normalizeAnswer(answer));
  function submit(answer: string) { if (canAnswer && answer.trim() && !answeredCorrectly) onFinish(answer, correct(answer), correct(answer) ? 'Dit woord past in de zin.' : task.help); }
  return <>
    <fieldset className="cp-practice-display" aria-label="Hoe wil je oefenen?">{(['type', 'choice'] as const).map(kind => <button key={kind} className="secondary-button" aria-pressed={mode === kind} disabled={answeredCorrectly} onClick={() => { setMode(kind); setValue(''); onReset(); if (kind === 'choice') onHelp(); }}>{kind === 'type' ? 'Zelf typen' : 'Kies een woord'}</button>)}</fieldset>
    {task.cue && <p className="cp-gap-cue">{task.cue}</p>}
    <h4 className="cp-gap-sentence">{task.before}<span aria-label="Hier mist een woord">…</span>{task.after}</h4>
    {mode === 'type' ? <form className="cp-dictation-form" onSubmit={event => { event.preventDefault(); submit(value); }}><label className="cp-text-entry"><span>Welk woord mist?</span><input value={value} disabled={!canAnswer || answeredCorrectly} autoComplete="off" autoCorrect="off" autoCapitalize="none" spellCheck={false} maxLength={120} onChange={event => { setValue(event.target.value); onReset(); }} /></label><button data-practice-check className="primary-button" type="submit" disabled={!canAnswer || !value.trim() || answeredCorrectly}>Controleer<Check /></button></form>
      : <div className="cp-choice-grid">{task.options.map(option => <div key={option.id} className="cp-extended-option"><button disabled={!canAnswer || answeredCorrectly} aria-pressed={value === option.label} onClick={() => { setValue(option.label); submit(option.label); }}>{option.label}</button></div>)}</div>}
    <Help text={task.help} onHelp={onHelp} />
    <button className="secondary-button" aria-expanded={model} onClick={() => { setModel(!model); onHelp(); }}>Voorbeeld</button>{model && <div className="cp-source-text"><p>{task.model}</p>{(exercise.modelAudio as ExerciseAudio)?.src && <button className="secondary-button" onClick={() => { onHelp(); void onAudio((exercise.modelAudio as ExerciseAudio).src); }}><Volume2 />Luister</button>}</div>}
  </>;
}
function HotspotSurface({ task, onFinish, onReset, onHelp, canAnswer, answeredCorrectly }: TaskProps<HotspotTask>) {
  const [selected, setSelected] = useState('');
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  function choose(id: string) { if (!canAnswer || answeredCorrectly || !loaded || failed) return; setSelected(id); onReset(); onFinish(id, task.correctRegionIds.includes(id), task.correctRegionIds.includes(id) ? 'Goed. Dit is de juiste plek.' : task.help); }
  return <>
    {failed && <output aria-live="polite">Je kunt het plaatje nu niet zien. Probeer het later nog eens.</output>}
    <div className="cp-hotspot-image">
      {/* The full uncropped image defines the normalized region coordinate system. */}
      {/* oxlint-disable-next-line nextjs/no-img-element */}
      <img src={task.image.src ? compactImageSrc(task.image.src) : undefined} alt={task.image.altText || 'Plaatje bij de oefening'} decoding="async" onLoad={() => setLoaded(true)} onError={() => setFailed(true)} />
      {loaded && !failed && task.regions.map((region, at) => <button key={region.id} className="secondary-button cp-hotspot-target" aria-label={`Plek ${at + 1}: ${region.label}`} aria-pressed={selected === region.id} disabled={!canAnswer || answeredCorrectly} style={{ left: `${(region.x + region.width / 2) * 100}%`, top: `${(region.y + region.height / 2) * 100}%` }} onClick={() => choose(region.id)}><span aria-hidden="true">{at + 1}</span></button>)}
    </div>
    <fieldset className="cp-hotspot-list"><legend>Tik op het plaatje. Of kies een plek in de lijst.</legend>{task.regions.map((region, at) => <button key={region.id} className="secondary-button" aria-pressed={selected === region.id} disabled={!canAnswer || answeredCorrectly || !loaded || failed} onClick={() => choose(region.id)}>{at + 1}. {region.label}</button>)}</fieldset>
    <Help text={task.help} onHelp={onHelp} />
  </>;
}
function BranchSurface({ task, onFinish, onReset, onHelp, canAnswer, answeredCorrectly }: TaskProps<BranchTask>) {
  const [nodeId, setNodeId] = useState(task.start);
  const [history, setHistory] = useState<{ nodeId: string; choiceId: string }[]>([]);
  const [choice, setChoice] = useState<BranchChoice>();
  const [ended, setEnded] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const node = task.nodes.find(n => n.id === nodeId)!;
  function focus() { requestAnimationFrame(() => heading.current?.focus()); }
  function back() { const last = history.at(-1); if (!last) return; setNodeId(last.nodeId); setHistory(h => h.slice(0, -1)); setChoice(undefined); setEnded(false); onReset(); onHelp(); focus(); }
  return <>
    <h4 tabIndex={-1} ref={heading}>{ended ? 'Je bent klaar.' : node.prompt}</h4>
    {!ended && <div className="cp-branch-options">{node.choices.map(option => <button className="secondary-button" key={option.id} aria-pressed={choice?.id === option.id} disabled={!canAnswer || answeredCorrectly} onClick={() => setChoice(option)}>{option.label}</button>)}</div>}
    {choice && <output aria-live="polite" className="cp-branch-consequence">{choice.consequence}</output>}
    {!ended && choice && <button data-practice-step-next data-practice-check className="primary-button" onClick={() => { const path = [...history, { nodeId, choiceId: choice.id }]; setHistory(path); if (choice.next) { setNodeId(choice.next); setChoice(undefined); } else { setEnded(true); onFinish(JSON.stringify(path), true, 'Je bent klaar. Praat met je docent over je keuze.'); } focus(); }} disabled={!canAnswer || answeredCorrectly}>{choice.next ? 'Verder' : 'Klaar'}<Check /></button>}
    <button className="secondary-button" disabled={!history.length} onClick={back}><RotateCcw />Terug</button>
    <Help text={task.help} onHelp={onHelp} />
  </>;
}
