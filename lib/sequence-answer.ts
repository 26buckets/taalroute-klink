export type SequenceAnswer = { version: 1; itemIds: string[]; draft: string[]; first?: string[]; last?: string[] };
export const sequenceAnswerKey = (sourceId: string) => `klink.sequence-answer.v1:${sourceId}`;
export const emptySequenceAnswer = (itemIds: string[]): SequenceAnswer => ({ version: 1, itemIds: [...itemIds].sort(), draft: [] });

export function parseSequenceAnswer(raw: string | null, itemIds: string[]): SequenceAnswer | undefined {
  try {
    const row: unknown = JSON.parse(raw ?? 'null');
    if (!row || typeof row !== 'object' || Array.isArray(row)) return;
    const value = row as Record<string, unknown>;
    const ids = [...itemIds].sort();
    const valid = (order: unknown): order is string[] => Array.isArray(order) && order.length <= ids.length && new Set(order).size === order.length && order.every(id => typeof id === 'string' && ids.includes(id));
    if (value.version !== 1 || !valid(value.itemIds) || JSON.stringify([...value.itemIds].sort()) !== JSON.stringify(ids) || !valid(value.draft)) return;
    for (const key of ['first', 'last']) if (value[key] !== undefined && (!valid(value[key]) || value[key].length !== ids.length)) return;
    if ((value.first === undefined) !== (value.last === undefined)) return;
    return { version: 1, itemIds: ids, draft: [...value.draft], ...(value.first ? { first: [...value.first as string[]], last: [...value.last as string[]] } : {}) };
  } catch { return; }
}

export function updateSequenceAnswer(current: SequenceAnswer, draft: string[], submitted = false): SequenceAnswer {
  if (new Set(draft).size !== draft.length || draft.some(id => !current.itemIds.includes(id)) || (submitted && draft.length !== current.itemIds.length)) throw new Error('Ongeldige kaartvolgorde');
  return { ...current, draft: [...draft], ...(submitted ? { first: current.first ?? [...draft], last: [...draft] } : {}) };
}
