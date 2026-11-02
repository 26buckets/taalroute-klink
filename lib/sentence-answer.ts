export type OwnSentence = { draft: string; first?: { medium: 'typed' | 'spoken'; text: string } };
export function parseOwnSentence(raw: string | null): OwnSentence {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || typeof value.draft !== 'string' || value.draft.length > 10000) return { draft: '' };
    const first = value.first;
    return { draft: value.draft, ...(first && ['typed', 'spoken'].includes(first.medium) && typeof first.text === 'string' && first.text.trim() && first.text.length <= 10000 ? { first: { medium: first.medium, text: first.text } } : {}) };
  } catch { return { draft: '' }; }
}

export function checkSentenceAnswer(expected: string, entered: string, copying: boolean) {
  const words = (text: string) => text.normalize('NFC').toLocaleLowerCase('nl-NL').match(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/gu) ?? [];
  const target = words(expected), actual = words(entered);
  const sameWords = target.length === actual.length && target.every((word, i) => word === actual[i]);
  const exact = expected.normalize('NFC').trim() === entered.normalize('NFC').trim();
  if (sameWords) return { correct: copying ? exact : true, feedback: exact ? 'Goed. Je hebt de zin nauwkeurig overgenomen.' : 'De woorden staan goed. Kijk ook naar hoofdletters, spaties en leestekens.' };
  const sameSet = target.length === actual.length && [...target].sort().every((word, i) => word === [...actual].sort()[i]);
  return { correct: false, feedback: sameSet ? 'Je hebt de woorden. Zet ze in dezelfde volgorde als in de opname.' : `Controleer woord ${target.findIndex((word, i) => word !== actual[i]) + 1 || target.length + 1}. Let op ontbrekende woorden, spelling en werkwoordsvormen.` };
}
