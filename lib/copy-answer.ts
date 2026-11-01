// Only outer whitespace is optional; the visible model determines every character.
export function exactCopyAnswer(answer: string, value: string): boolean {
  return answer.normalize('NFC').trim() === value.normalize('NFC').trim();
}
