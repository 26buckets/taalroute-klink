'use client';

import { useEffect, useRef, useState } from 'react';
import { emptyWritingAnswer, parseWritingAnswer, preserveAvailableCopyAnswers, saveWritingAnswer, updateWritingAnswer, writingAnswerKey } from '@/lib/writing-answer';

export function useWritingAnswer(sourceId: string | undefined) {
  const [value, setValue] = useState('');
  const [ready, setReady] = useState(!sourceId);
  const [error, setError] = useState(false);
  const current = useRef(emptyWritingAnswer());
  const pending = useRef(Promise.resolve());
  const unsavedSubmission = useRef(false);
  const visit = useRef(0);
  useEffect(() => {
    const activeVisit = ++visit.current;
    if (!sourceId) return;
    const key = writingAnswerKey(sourceId);
    async function restore() {
      let failed = false;
      try { await preserveAvailableCopyAnswers(localStorage); } catch { failed = true; }
      if (visit.current !== activeVisit) return;
      try {
        const raw = localStorage.getItem(key);
        const saved = parseWritingAnswer(raw);
        if (raw !== null && !saved) failed = true;
        current.current = saved ?? emptyWritingAnswer();
        setValue(current.current.draft);
      } catch { failed = true; }
      setError(failed);
      setReady(true);
    }
    const frame = requestAnimationFrame(() => { void restore(); });
    return () => { visit.current = activeVisit + 1; cancelAnimationFrame(frame); };
  }, [sourceId]);

  async function change(next: string, submitted = false) {
    setValue(next);
    if (!sourceId) return true;
    const activeVisit = visit.current;
    const answer = current.current = updateWritingAnswer(current.current, next, submitted);
    if (submitted) setReady(false);
    const saving = pending.current.then(async () => {
      try {
        const saved = await saveWritingAnswer(sourceId, answer, submitted || unsavedSubmission.current);
        unsavedSubmission.current = false;
        return saved;
      } catch (failure) {
        if (submitted) unsavedSubmission.current = true;
        throw failure;
      }
    });
    pending.current = saving.then(() => {}, () => {});
    try {
      const saved = await saving;
      if (visit.current !== activeVisit) return false;
      if (current.current === answer) current.current = saved;
      setError(false);
    } catch {
      if (visit.current !== activeVisit) return false;
      setError(true);
    } finally {
      if (submitted && visit.current === activeVisit) setReady(true);
    }
    return true;
  }

  return { value, ready, error, change };
}
