'use client';
import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { wordAudioParts } from '@/lib/word-audio';
import { recordingForWord } from '@/lib/word-listening';

export function isWordAudioClick(event: MouseEvent) {
  return event.target instanceof Element && Boolean(event.target.closest('button.cp-inline-word'));
}
export function WordAudioText({ text, literalRanges }: { text: string; literalRanges?: { start: number; end: number }[] }) {
  const request = useRef(0);
  const currentElement = useRef<HTMLButtonElement | undefined>(undefined);
  const [active, setActive] = useState<number>();
  useEffect(() => () => {
    request.current++;
    if (currentElement.current) window.dispatchEvent(new CustomEvent('klink-inline-word-cancel', {detail:currentElement.current}));
  }, [text]);
  function listen(element: HTMLButtonElement, start: number) {
    const id = ++request.current;
    currentElement.current = element;
    setActive(start);
    window.dispatchEvent(new CustomEvent('klink-inline-word-request', { detail: {
      element, completed: () => { if (request.current === id) { currentElement.current=undefined;setActive(undefined); } },
    } }));
  }
  return <span>{wordAudioParts(text).map(part => {
    if (!part.word || literalRanges?.some(range => part.start >= range.start && part.start + part.text.length <= range.end)) return part.text;
    return recordingForWord(part.word) ? <button key={part.start} type="button" className="cp-inline-word" data-word-audio={part.word} data-word-state={active === part.start ? 'playing' : undefined} aria-label={`Luister naar ${part.text}`} onClick={event => { event.stopPropagation(); listen(event.currentTarget, part.start); }}>{part.text}</button>
      : <span key={part.start} data-word-audio-missing="missing" title="Voor dit woord is nog geen eenduidige opname gekoppeld.">{part.text}</span>;
  })}</span>;
}
