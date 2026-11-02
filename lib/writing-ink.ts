export type InkStroke = [number, number][];
export type WritingInk = { version: 1; draft: InkStroke[]; first?: InkStroke[]; last?: InkStroke[]; modelSeen?: true; firstUsedModel?: boolean };
export const writingInkDatabase = 'klink-writing-ink-v1';
export const emptyWritingInk = (): WritingInk => ({ version: 1, draft: [] });
export const hasWritingInk = (strokes: InkStroke[]) => strokes.some(stroke => stroke.some(point => Math.hypot(point[0] - stroke[0][0], point[1] - stroke[0][1]) > 2));

export function validateWritingInk(value: unknown): WritingInk {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid writing record');
  const row = value as Record<string, unknown>;
  if (row.version !== 1 || (row.modelSeen !== undefined && row.modelSeen !== true) || (row.firstUsedModel !== undefined && typeof row.firstUsedModel !== 'boolean')) throw new Error('Invalid writing version');
  for (const key of ['draft', 'first', 'last']) {
    const strokes = row[key];
    if (key !== 'draft' && strokes === undefined) continue;
    if (!Array.isArray(strokes) || strokes.length > 1000) throw new Error('Invalid writing strokes');
    let points = 0;
    for (const stroke of strokes) {
      if (!Array.isArray(stroke) || !stroke.length || (points += stroke.length) > 100000 || stroke.some(p => !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite) || p[0] < 0 || p[0] > 1000 || p[1] < 0 || p[1] > 450)) throw new Error('Invalid writing points');
    }
  }
  if ((row.first === undefined) !== (row.last === undefined) || (row.first !== undefined && (!hasWritingInk(row.first as InkStroke[]) || !hasWritingInk(row.last as InkStroke[])))) throw new Error('Invalid submitted writing');
  if ((row.first === undefined && row.firstUsedModel !== undefined) || (row.first !== undefined && typeof row.firstUsedModel !== 'boolean')) throw new Error('Invalid writing support history');
  return value as WritingInk;
}

export function updateWritingInk(current: WritingInk, draft: InkStroke[], submitted = false): WritingInk {
  return validateWritingInk({ ...current, draft, ...(submitted && hasWritingInk(draft) ? { first: current.first ?? draft, last: draft, firstUsedModel: current.firstUsedModel ?? current.modelSeen === true } : {}) });
}

export function openWritingInk(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(writingInkDatabase, 1);
    request.onupgradeneeded = () => request.result.createObjectStore('answers');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Writing storage blocked'));
  });
}

export function loadWritingInk(db: IDBDatabase, id: string): Promise<WritingInk> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('answers', 'readonly');
    const request = transaction.objectStore('answers').get(id);
    transaction.oncomplete = () => { try { resolve(request.result === undefined ? emptyWritingInk() : validateWritingInk(request.result)); } catch (error) { reject(error); } };
    transaction.onerror = transaction.onabort = () => reject(transaction.error);
  });
}

export function saveWritingInk(db: IDBDatabase, id: string, value: WritingInk, submitted = false): Promise<WritingInk> {
  validateWritingInk(value);
  return new Promise((resolve, reject) => {
    const transaction = db.transaction('answers', 'readwrite');
    const store = transaction.objectStore('answers'), request = store.get(id);
    let saved: WritingInk, failure: unknown;
    request.onsuccess = () => {
      try {
        const previous = request.result === undefined ? emptyWritingInk() : validateWritingInk(request.result);
        // A stale second tab may update its draft, but must never erase an earlier submission.
        saved = validateWritingInk({ ...previous, ...value,
          ...(previous.first ? { first: previous.first, firstUsedModel: previous.firstUsedModel } : {}),
          ...(!submitted && previous.last ? { last: previous.last } : {}),
          ...(previous.modelSeen || value.modelSeen ? { modelSeen: true } : {}),
        });
        store.put(saved, id);
      } catch (error) { failure = error; transaction.abort(); }
    };
    transaction.oncomplete = () => resolve(saved);
    transaction.onerror = transaction.onabort = () => reject(failure ?? transaction.error);
  });
}
