import { spokenWords } from './word-listening-text.ts';

export type FormValues = Record<string, string>;
export type SourceFormField = { id: string; label: string; acceptedAnswers: string[]; normalization: 'exact' | 'case' | 'case-space' | 'digits' | 'date' | 'time'; wrongExamples: string[]; feedback: { correct: string; retry: string } };
export type FormCheck = 'missing' | 'matched' | 'retry' | 'review';
export type WritingFormAnswer = { version: 1; draft: FormValues; first?: FormValues; last?: FormValues };
export const writingFormDatabase = 'klink-writing-form-v1';
export const emptyWritingFormAnswer = (): WritingFormAnswer => ({ version: 1, draft: {} });
export const completeWritingForm = (values: FormValues, fields: SourceFormField[]) => fields.length > 0 && fields.every(field => Boolean(values[field.id]?.trim()));

export function writingFormLiteralRanges(text: string) {
  const ranges = [...text.matchAll(/[\p{L}\p{N}._%+-]+@[\p{L}\p{N}.-]+\.[\p{L}]{2,}|\b[1-9]\d{3}\s?[A-Z]{2}\b/gu)].map(match => ({ start: match.index, end: match.index + match[0].length }));
  for (const token of spokenWords(text)) if (/^(?:\d[\d.,]*[a-z]?|[abc]\d(?:-[a-z\d]+)*)$/iu.test(token.text)) ranges.push({ start: token.start, end: token.end });
  return ranges;
}

function comparable(value: string, mode: SourceFormField['normalization']) {
  const text = value.normalize('NFC').trim();
  if (mode === 'case') return text.toLocaleLowerCase('nl-NL');
  if (mode === 'case-space') return text.replace(/\s+/g, ' ').toLocaleLowerCase('nl-NL');
  if (mode === 'digits') return /^\d+$/.test(text.replace(/\s/g, '')) ? text.replace(/\s/g, '') : undefined;
  if (mode === 'date') {
    const match = /^(\d{2})([-/])(\d{2})\2(\d{4})$/.exec(text);
    if (!match) return;
    const [, day, , month, year] = match, d = Number(day), m = Number(month), y = Number(year);
    return y >= 1000 && m >= 1 && m <= 12 && d >= 1 && d <= new Date(y, m, 0).getDate() ? `${day}-${month}-${year}` : undefined;
  }
  if (mode === 'time') return /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(text) ? text : undefined;
  return text;
}

export function checkWritingFormField(value: string, field: SourceFormField): FormCheck {
  if (!value.trim()) return 'missing';
  const raw = value.normalize('NFC').trim(), normalized = comparable(value, field.normalization);
  const matches = (candidate: string) => raw === candidate.normalize('NFC').trim() || (normalized !== undefined && normalized === comparable(candidate, field.normalization));
  if (field.acceptedAnswers.some(matches)) return 'matched';
  if (field.wrongExamples.some(matches)) return 'retry';
  return 'review';
}

export function validateWritingFormAnswer(value: unknown, fields: SourceFormField[]): WritingFormAnswer {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid form record');
  const row = value as Record<string, unknown>, ids = new Set(fields.map(field => field.id));
  if (!ids.size || ids.size !== fields.length || row.version !== 1 || Object.keys(row).some(key => !['version', 'draft', 'first', 'last'].includes(key))) throw new Error('Invalid form version');
  for (const key of ['draft', 'first', 'last']) {
    const values = row[key];
    if (key !== 'draft' && values === undefined) continue;
    if (!values || typeof values !== 'object' || Array.isArray(values) || Object.entries(values).some(([id, text]) => !ids.has(id) || typeof text !== 'string' || text.length > 500)) throw new Error('Invalid form fields');
    if (key !== 'draft' && !completeWritingForm(values as FormValues, fields)) throw new Error('Incomplete submitted form');
  }
  if ((row.first === undefined) !== (row.last === undefined)) throw new Error('Invalid form history');
  return value as WritingFormAnswer;
}

export function updateWritingFormAnswer(current: WritingFormAnswer, draft: FormValues, fields: SourceFormField[], submitted = false): WritingFormAnswer {
  if (submitted && !completeWritingForm(draft, fields)) throw new Error('Complete all form fields before submission');
  return validateWritingFormAnswer({ ...current, draft, ...(submitted ? { first: current.first ?? draft, last: draft } : {}) }, fields);
}

export function openWritingForm(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(writingFormDatabase, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('answers');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Form storage blocked'));
  });
}

export function loadWritingForm(db: IDBDatabase, id: string, fields: SourceFormField[]): Promise<WritingFormAnswer> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('answers'), request = transaction.objectStore('answers').get(id);
    transaction.oncomplete = () => { try { resolve(request.result === undefined ? emptyWritingFormAnswer() : validateWritingFormAnswer(request.result, fields)); } catch (error) { reject(error); } };
    transaction.onerror = transaction.onabort = () => reject(transaction.error);
  });
}

export function saveWritingForm(db: IDBDatabase, id: string, value: WritingFormAnswer, fields: SourceFormField[], submitted = false): Promise<WritingFormAnswer> {
  validateWritingFormAnswer(value, fields);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('answers', 'readwrite'), store = transaction.objectStore('answers'), request = store.get(id);
    let saved: WritingFormAnswer, failure: unknown;
    request.onsuccess = () => {
      try {
        const previous = request.result === undefined ? emptyWritingFormAnswer() : validateWritingFormAnswer(request.result, fields);
        // Merge inside the transaction so a stale second tab cannot replace the first submission.
        saved = validateWritingFormAnswer({ ...value, ...(previous.first ? { first: previous.first } : {}), ...(!submitted && previous.last ? { last: previous.last } : {}) }, fields);
        store.put(saved, id);
      } catch (error) { failure = error; transaction.abort(); }
    };
    transaction.oncomplete = () => resolve(saved);
    transaction.onerror = transaction.onabort = () => reject(failure ?? transaction.error);
  });
}
