import type { ExerciseAudio, ExerciseImage } from './package-content';

export type SortTask = { kind: 'sort'; basis: 'meaning' | 'letter' | 'sound' | 'spelling'; categories: { id: string; label: string }[]; items: { id: string; label: string; categoryId: string; audio?: ExerciseAudio; audioApproved?: boolean }[]; help: string };
export type MarkTask = { kind: 'mark'; text: string; tokens: { id: string; text: string; start: number; end: number }[]; acceptedSelections: string[][]; help: string };
export type GapTask = { kind: 'gap'; cue?: string; before: string; after: string; acceptedAnswers: string[]; options: { id: string; label: string }[]; help: string; model: string };
export type HotspotTask = { kind: 'hotspot'; image: ExerciseImage; imageReview: 'open' | 'approved'; regions: { id: string; label: string; x: number; y: number; width: number; height: number }[]; correctRegionIds: string[]; help: string };
export type BranchChoice = { id: string; label: string; consequence: string; next: string | null };
export type BranchTask = { kind: 'branch'; start: string; nodes: { id: string; prompt: string; choices: BranchChoice[] }[]; help: string };
export type StandardTask = SortTask | MarkTask | GapTask | HotspotTask | BranchTask;

export const normalizeAnswer = (value: string) => value.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('nl-NL').replace(/[.!?]+$/, '');
export function sameSelection(chosen: string[], expected: string[]) {
  return chosen.length === expected.length && new Set(chosen).size === chosen.length && expected.every(id => chosen.includes(id));
}
export function orderAccepted(chosen: string[], expected: string[], alternatives: string[][] = []) {
  return [expected, ...alternatives].some(order => order.length === chosen.length && order.every((id, at) => chosen[at] === id));
}
export function markTask(text: string, evidence: string, answer: string): MarkTask | undefined {
  const tokens = Array.from(text.matchAll(/\S+/gu), (match) => ({ id: `word-${match.index}`, text: match[0], start: match.index, end: match.index + match[0].length }));
  const evidenceStart = text.indexOf(evidence);
  if (evidenceStart < 0 || !tokens.length) return;
  const phrase = normalizeAnswer(answer);
  const candidates: string[][] = [];
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].start < evidenceStart || tokens[i].end > evidenceStart + evidence.length) continue;
    for (let j = i; j < tokens.length && tokens[j].end <= evidenceStart + evidence.length; j++) {
      if (normalizeAnswer(text.slice(tokens[i].start, tokens[j].end)) === phrase) candidates.push(tokens.slice(i, j + 1).map(token => token.id));
    }
  }
  // No inferred answer spans: retain the existing sentence task when the answer is not literally present.
  if (!candidates.length) return;
  return { kind: 'mark', text, tokens, acceptedSelections: candidates, help: 'Tik op de woorden met het antwoord. Toch een ander woord? Tik nog eens op het woord.' };
}
export function validStandardTask(task: StandardTask): boolean {
  const unique = (ids: string[]) => ids.length > 0 && ids.every(Boolean) && new Set(ids).size === ids.length;
  if (task.kind === 'sort') return unique(task.categories.map(c => c.id)) && task.categories.length >= 2 && unique(task.items.map(i => i.id)) && task.items.every(i => task.categories.some(c => c.id === i.categoryId) && (task.basis !== 'sound' || Boolean(i.audioApproved && i.audio?.src && i.audio.audioId)));
  if (task.kind === 'mark') return unique(task.tokens.map(t => t.id)) && task.tokens.every(t => t.text === task.text.slice(t.start, t.end)) && task.acceptedSelections.length > 0 && task.acceptedSelections.every(ids => unique(ids) && ids.every(id => task.tokens.some(t => t.id === id)));
  if (task.kind === 'gap') return task.acceptedAnswers.some(a => normalizeAnswer(a)) && unique(task.options.map(o => o.id)) && task.options.some(o => task.acceptedAnswers.some(a => normalizeAnswer(a) === normalizeAnswer(o.label)));
  if (task.kind === 'hotspot') return task.imageReview === 'approved' && Boolean(task.image.src) && unique(task.regions.map(r => r.id)) && task.regions.every(r => [r.x,r.y,r.width,r.height].every(Number.isFinite) && r.x >= 0 && r.y >= 0 && r.width > 0 && r.height > 0 && r.x + r.width <= 1 && r.y + r.height <= 1) && task.correctRegionIds.length > 0 && task.correctRegionIds.every(id => task.regions.some(r => r.id === id));
  if (!unique(task.nodes.map(n => n.id)) || !task.nodes.some(n => n.id === task.start)) return false;
  if (!task.nodes.every(n => n.choices.length >= 2 && unique(n.choices.map(c => c.id)) && n.choices.every(c => c.label && c.consequence && (c.next === null || task.nodes.some(target => target.id === c.next))))) return false;
  const reachable = new Set<string>();
  const visit = (id: string) => { if (reachable.has(id)) return; reachable.add(id); task.nodes.find(n => n.id === id)!.choices.forEach(c => { if (c.next) visit(c.next); }); };
  visit(task.start);
  const canFinish = new Set(task.nodes.filter(n => n.choices.some(c => c.next === null)).map(n => n.id));
  for (let i = 0; i < task.nodes.length; i++) task.nodes.forEach(n => { if (n.choices.some(c => c.next && canFinish.has(c.next))) canFinish.add(n.id); });
  return reachable.size === task.nodes.length && task.nodes.every(n => canFinish.has(n.id));
}
