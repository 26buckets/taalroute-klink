import data from '../data/klink-source-repeat-rounds.json' with { type: 'json' };
import { productionIndex } from './production-practice.ts';
import type { PackageExercise } from './package-content';

export const sourceRepeatRounds = data.rounds;
export type SourceRepeat = typeof sourceRepeatRounds[number];

export function sourceRepeatBanks(round: SourceRepeat) {
  if (round.positions.length !== 12 || new Set(round.positions.map(p => p.sourceId)).size !== 12 || round.positions.some((p, i) => p.id !== `${round.id}:${String(i + 1).padStart(2, '0')}`)) throw new Error('Invalid repeat positions');
  return [...new Set(round.positions.map(p => p.bankId))].map(id => {
    const bank = productionIndex.find(row => row.id === id);
    if (!bank || !bank.url.startsWith('/practice-content/') || bank.url.includes('..')) throw new Error('Unknown repeat source');
    return bank;
  });
}

export function sourceRepeatExercises(round: SourceRepeat, banks: ReadonlyMap<string, PackageExercise[]>) {
  sourceRepeatBanks(round);
  return round.positions.map(position => {
    const source = banks.get(position.bankId)?.find(e => e.exerciseId === position.sourceId);
    if (!source) throw new Error('Missing repeat source');
    // Keep source content in its original bank; only this session receives independent position IDs.
    return { ...structuredClone(source), exerciseId: position.id, repeatSourceId: source.exerciseId };
  });
}
