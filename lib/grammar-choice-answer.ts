export type GrammarChoiceAnswer = { version: 1; optionIds: string[]; first?: string; last?: string };
export const grammarChoiceKey = (sourceId: string) => `klink.grammar-choice.v1:${sourceId}`;
export const emptyGrammarChoice = (optionIds: string[]): GrammarChoiceAnswer => ({ version: 1, optionIds: [...optionIds].sort() });

export function parseGrammarChoice(raw: string | null, optionIds: string[]): GrammarChoiceAnswer | undefined {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return;
    const row = value as Record<string, unknown>;
    const ids = [...optionIds].sort();
    if (row.version !== 1 || !Array.isArray(row.optionIds) || !row.optionIds.every(id => typeof id === 'string') || JSON.stringify([...row.optionIds].sort((a, b) => a.localeCompare(b))) !== JSON.stringify(ids)) return;
    if ((row.first === undefined) !== (row.last === undefined)) return;
    if (row.first !== undefined && (typeof row.first !== 'string' || typeof row.last !== 'string' || !ids.includes(row.first) || !ids.includes(row.last))) return;
    return { version: 1, optionIds: ids, ...(row.first !== undefined ? { first: row.first as string, last: row.last as string } : {}) };
  } catch { return; }
}

export function submitGrammarChoice(current: GrammarChoiceAnswer, optionId: string): GrammarChoiceAnswer {
  if (!current.optionIds.includes(optionId)) throw new Error('Onbekende keuze');
  return { ...current, first: current.first ?? optionId, last: optionId };
}
