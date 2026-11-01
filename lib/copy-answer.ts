// Only outer whitespace is optional; the visible model determines every character.
export function exactCopyAnswer(answer: string, value: string): boolean {
  return answer.normalize('NFC').trim() === value.normalize('NFC').trim();
}

export function copyDifferenceFeedback(answer: string, value: string, hint?: string): string | undefined {
  const expected = Array.from(answer.normalize('NFC').trim());
  const entered = Array.from(value.normalize('NFC').trim());
  for (let i = 0; i < Math.max(expected.length, entered.length); i++) {
    if (expected[i] !== entered[i]) return `Kijk bij teken ${i + 1}.${hint ? ' ' + hint : ''}`;
  }
}
