export function normalizeSpokenWord(text: string) {
  return text.normalize('NFC').toLocaleLowerCase('nl').replace(/’/g, "'").replace(/[‐‑]/g, '-');
}

export function spokenWords(text: string) {
  return Array.from(text.matchAll(/['’][stnm](?!\p{L})(?:[‐‑-][\p{L}\p{M}\p{N}]+)*|\p{L}[\p{L}\p{M}\p{N}]*(?:['’‐‑-][\p{L}\p{M}\p{N}]+)*|\p{N}+(?:[.,]\p{N}+)*(?:\p{L}[\p{L}\p{M}\p{N}]*)?/gu)).flatMap(match => {
    // The source exercise deliberately omits spaces; its four prepared words stay separately audible.
    const parts = normalizeSpokenWord(match[0]) === 'ditismijnleesboek' ? ['dit', 'is', 'mijn', 'leesboek'] : [match[0]];
    let start = match.index;
    return parts.map(part => {
      const word = text.slice(start, start + part.length), token = { text: word, key: normalizeSpokenWord(word), start, end: start + word.length };
      start = token.end;
      return token;
    });
  });
}

export function singleSpokenWord(text: string) {
  const words = spokenWords(text);
  return words.length === 1 && text.trim().replace(/[.!?,;:]$/u, '') === words[0].text ? words[0].key : undefined;
}
