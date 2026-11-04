'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check } from 'lucide-react';
import { WordAudioText } from './word-audio-text';
import { emptyWritingFormAnswer, loadWritingForm, openWritingForm, saveWritingForm, updateWritingFormAnswer, type SourceFormField, type WritingFormAnswer } from '@/lib/writing-form';

export type WritingExample = { text: string; explanation?: string };
const writingField: SourceFormField = { id: 'text', label: 'Jouw tekst', acceptedAnswers: [], wrongExamples: [], normalization: 'exact', feedback: { correct: '', retry: '' }, maxLength: 10000 };
const fields = [writingField];

export function SourceWritingText({ id, context, support, examples, criteria, label, canAnswer, onReset, onHelp, onFinish, children }: {
  id: string; context: string; support: string[]; examples: WritingExample[]; criteria: string[]; label: string; canAnswer: boolean;
  onReset: () => void; onHelp: () => void; onFinish: (answer: string, correct: boolean, feedback?: string) => void; children: ReactNode;
}) {
  const [answer, setAnswer] = useState(emptyWritingFormAnswer), current = useRef(answer), connection = useRef<IDBDatabase | null>(null), active = useRef(true);
  const [ready, setReady] = useState(false), [error, setError] = useState(false), [saving, setSaving] = useState(false), [comparing, setComparing] = useState(false);
  useEffect(() => {
    let db: IDBDatabase | undefined, alive = true; active.current = true;
    void (async () => {
      try {
        db = await openWritingForm(); const saved = await loadWritingForm(db, id, fields);
        if (!alive) { db.close(); return; }
        connection.current = db; current.current = saved; setAnswer(saved); setReady(true);
      } catch { db?.close(); if (alive) setError(true); }
    })();
    return () => { alive = false; active.current = false; connection.current = null; db?.close(); };
  }, [id]);
  async function persist(value: WritingFormAnswer, submitted = false) {
    current.current = value; setAnswer(value);
    try {
      if (!connection.current) throw new Error('Writing storage unavailable');
      const saved = await saveWritingForm(connection.current, id, value, fields, submitted);
      if (active.current) { if (current.current === value) { current.current = saved; setAnswer(saved); } setError(false); }
      return true;
    } catch { if (active.current) setError(true); return false; }
  }
  async function compare() {
    if (!ready || !canAnswer || saving || !current.current.draft.text?.trim()) return;
    setSaving(true);
    if (await persist(updateWritingFormAnswer(current.current, current.current.draft, fields, true), true) && active.current) { setComparing(true); onHelp(); }
    if (active.current) setSaving(false);
  }
  const draft = answer.draft.text ?? '';
  return <section className="cp-task-card cp-extended-task" data-source-writing-text={id}>
    {children}
    <div className="cp-source-text"><p><WordAudioText text={context} /></p>{support.length > 0 && <ul>{support.map(text => <li key={text}><WordAudioText text={text} /></li>)}</ul>}</div>
    <label className="cp-text-entry"><span>{label}</span><textarea rows={3} maxLength={writingField.maxLength} value={draft} disabled={!ready || !canAnswer || saving} onChange={event => { onReset(); setComparing(false); void persist(updateWritingFormAnswer(current.current, {text: event.target.value}, fields)); }} /></label>
    {error && <output role="alert">Bewaren lukt niet. Je invoer blijft in dit scherm. Houd deze oefening open.</output>}
    <button data-practice-check className="primary-button" disabled={!ready || !canAnswer || saving || !draft.trim()} onClick={() => void compare()}>Bewaar en vergelijk<Check /></button>
    {comparing && answer.first && answer.last && <>
      <div className="cp-source-text"><p>Je eerste eigen tekst:</p><p style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{answer.first.text}</p></div>
      <div className="cp-source-text"><p>Voorbeelden</p>{examples.map(example => <div key={example.text}><p><WordAudioText text={example.text} /></p>{example.explanation && <p><WordAudioText text={example.explanation} /></p>}</div>)}<p>Jouw tekst mag anders zijn.</p></div>
      {criteria.length > 0 && <ul>{criteria.map(text => <li key={text}><WordAudioText text={text} /></li>)}</ul>}
      <p>Kijk zelf of samen met je docent na.</p>
      <button data-practice-check className="primary-button" disabled={!canAnswer || error || saving} onClick={() => onFinish(JSON.stringify({first: answer.first?.text, last: answer.last?.text, selfReviewed: true, automaticGrammarScoring: false}), true, 'Je hebt je eigen tekst geschreven en vergeleken.')}>Nagekeken en klaar<Check /></button>
    </>}
  </section>;
}
