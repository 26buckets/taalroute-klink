'use client';

import { useEffect, useState } from 'react';
import { playMedia, stopMedia, unlockMedia } from '@/lib/media-player';
import { recordingForWord, fetchWordRecording, wordRecordingKey } from '@/lib/word-listening';
import { spokenWords } from '@/lib/word-listening-text';
import { imageListeningWords, imageWordRectangle } from '@/lib/image-word-listening';

type TextWord = { text: string; node: Text; start: number; endNode: Text; end: number };
type Word = TextWord | { text: string; node: HTMLImageElement; source: string; box: number[] };
const excluded = [
  'script', 'style', 'svg', 'code', 'pre', 'input', 'textarea', 'select', 'audio', 'video',
  '[contenteditable]:not([contenteditable="false"])', '[hidden]', '[inert]',
  '.cp-sound-glyph', '.cp-letter-demo', '.cp-build-slots:not(.cp-sentence-slots)',
  '.cp-task-card:has(.cp-build-slots:not(.cp-sentence-slots)) .cp-tile-bank',
  '.cp-gap-choice .cp-choice-grid', '.sr-only', '.toast-message',
  '.kpd-sound-select', '.kpd-sound-audio', '.kpd-letter',
  '.cp-missing-word:not(figure)',
  '[data-word-listening-units="sound"]',
].join(', ');

function wordRange(word: TextWord) {
  const range = document.createRange();
  range.setStart(word.node, word.start);
  range.setEnd(word.endNode, word.end);
  return range;
}

function readableNode(node: Node | null): node is Text {
  if (node?.nodeType !== Node.TEXT_NODE || !node.parentElement || node.parentElement.closest(excluded)) return false;
  return visibleElement(node.parentElement);
}

function visibleElement(start: Element) {
  for (let element: Element | null = start; element; element = element.parentElement) {
    const style = getComputedStyle(element);
    if (style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0') return false;
  }
  return true;
}

function readingContainer(node: Text) {
  let container = node.parentElement!;
  while (container.parentElement && !container.matches('button, a, summary') && /^(inline|contents)/.test(getComputedStyle(container).display)) container = container.parentElement;
  return container;
}

function wordsIn(container: Element) {
  const fragments: { node: Text; start: number; end: number }[] = [];
  let text = '';
  const space = () => { if (text && !/\s$/.test(text)) text += ' '; };
  const read = (node: Node) => {
    if (readableNode(node)) { const start = text.length; text += node.data; fragments.push({ node, start, end: text.length }); return; }
    if (!(node instanceof Element)) return;
    if (node.matches(excluded)) { space(); return; }
    const block = node !== container && (node.tagName === 'BR' || !/^(inline|contents)/.test(getComputedStyle(node).display));
    if (block) space();
    node.childNodes.forEach(read);
    if (block) space();
  };
  read(container);
  const words: TextWord[] = [];
  for (const token of spokenWords(text)) {
    const first = fragments.find(fragment => fragment.start <= token.start && token.start < fragment.end);
    const last = fragments.find(fragment => fragment.start < token.end && token.end <= fragment.end);
    if (first && last) words.push({ text: token.text, node: first.node, start: token.start - first.start, endNode: last.node, end: token.end - last.start });
  }
  return { words, fragments };
}

function wordAtPoint(x: number, y: number): Word | undefined {
  const image = document.elementFromPoint(x, y);
  if (image instanceof HTMLImageElement) return imageWords(image).find(word => {
    const rect = imageWordRect(word);
    return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
  });
  const documentWithCaret = document as unknown as {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const position = documentWithCaret.caretPositionFromPoint?.(x, y);
  const caret = position ? undefined : documentWithCaret.caretRangeFromPoint?.(x, y);
  const node = position?.offsetNode ?? caret?.startContainer ?? null, offset = position?.offset ?? caret?.startOffset;
  if (!readableNode(node) || offset === undefined) return;
  // Caret APIs also return neighbouring text for whitespace and images.
  return wordsIn(readingContainer(node)).words.find(word => Array.from(wordRange(word).getClientRects()).some(rect => x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom));
}

function imageWords(image: HTMLImageElement) {
  if (image.closest(excluded) || !visibleElement(image)) return [];
  const source = new URL(image.currentSrc || image.src, document.baseURI).pathname;
  return imageListeningWords(source).map(word => ({ ...word, node: image, source }));
}

function imageWordRect(word: { node: HTMLImageElement; box: number[] }) {
  const image = word.node;
  return imageWordRectangle(image.getBoundingClientRect(), image.naturalWidth, image.naturalHeight, getComputedStyle(image).objectFit, word.box);
}

function currentWord(word: Word) {
  if (!word.node.isConnected) return false;
  if ('start' in word) return readableNode(word.node) && word.endNode.isConnected && word.start <= word.node.length && word.end <= word.endNode.length && wordRange(word).toString() === word.text;
  return visibleElement(word.node) && word.node.getClientRects().length > 0 && new URL(word.node.currentSrc || word.node.src, document.baseURI).pathname === word.source;
}

function scrollToWord(word: Word) {
  const bounds = () => 'start' in word ? wordRange(word).getBoundingClientRect() : imageWordRect(word);
  for (let parent = word.node.parentElement; parent; parent = parent.parentElement) {
    if (!/auto|scroll/.test(getComputedStyle(parent).overflowY) || parent.scrollHeight <= parent.clientHeight) continue;
    const rect = bounds(), clip = parent.getBoundingClientRect();
    if (rect.top < clip.top + 12) parent.scrollTop += rect.top - clip.top - 12;
    else if (rect.bottom > clip.bottom - 12) parent.scrollTop += rect.bottom - clip.bottom + 12;
  }
  const rect = bounds();
  if (rect.top < 12) window.scrollBy(0, rect.top - 12);
  else if (rect.bottom > innerHeight - 12) window.scrollBy(0, rect.bottom - innerHeight + 12);
}

function visibleWords(root: Element) {
  const words: Word[] = [], walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT), containers = new Map<Element, TextWord[]>();
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    if (node instanceof HTMLImageElement && node.getClientRects().length) { words.push(...imageWords(node)); continue; }
    if (!readableNode(node)) continue;
    const container = readingContainer(node);
    if (!containers.has(container)) containers.set(container, wordsIn(container).words);
    for (const word of containers.get(container)!) {
      if (word.node !== node) continue;
      if (Array.from(wordRange(word).getClientRects()).some(rect => rect.width > 0 && rect.height > 0)) words.push(word);
    }
  }
  return words;
}

export function WordListening() {
  const [message, setMessage] = useState('');
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    let pointer: { id: number; x: number; y: number } | undefined;
    let pending: { word: Word; before: number; href: string; exercise?: Element; marker?: string | null } | undefined;
    let keyboardWords: Word[] = [], keyboardAt = -1, request = 0;
    let nativeAudio: HTMLAudioElement | undefined, nativePlays = 0, startingWord = false;
    let download: AbortController | undefined, wordAudio = 0;
    let listeningNode: Node | undefined;
    const cancelWord = () => { request++; download?.abort(); download = undefined; if (wordAudio) { wordAudio = 0; stopMedia(); } };
    const playback = (event: Event) => { nativeAudio = (event as CustomEvent<HTMLAudioElement>).detail; nativePlays++; if (!startingWord) { request++; download?.abort(); wordAudio = 0; } };
    const recording = () => Boolean(document.querySelector('.cp-recorder button.recording, .cp-recorder button[aria-disabled="true"]'));
    const listen = (word: Word, previousPlays = nativePlays, completed?: () => void) => {
      if (recording()) { setMessage('Stop eerst je opname om een woord te beluisteren.'); completed?.(); return; }
      download?.abort();
      const current = ++request, nativeSource = nativeAudio?.dataset.klinkSource || nativeAudio?.getAttribute('src') || undefined;
      const source = recordingForWord(word.text, nativeSource);
      setMessage('');
      if (!source) { setMessage(`Het geluid voor ‘${word.text}’ is nog niet beschikbaar.`); completed?.(); return; }
      // A word card may already have started its exact recording through its own handler.
      if (previousPlays !== nativePlays && nativeSource === wordRecordingKey(source)) { completed?.(); return; }
      wordAudio = current;
      listeningNode = word.node;
      word.node.parentElement?.dispatchEvent(new CustomEvent('klink-word-audio-start', { bubbles: true, detail: current }));
      document.querySelectorAll('audio').forEach(audio => audio.pause());
      const start = (url: string) => {
        if (current !== request) return Promise.resolve(false);
        startingWord = true;
        const playing = playMedia(url, { waitUntilEnd: true, wordSourceKey: wordRecordingKey(source) });
        startingWord = false;
        return playing;
      };
      const playing = typeof source === 'string' ? start(source) : (async () => {
        const controller = new AbortController(); download = controller;
        let url: string | undefined;
        try {
          const [, blob] = await Promise.all([unlockMedia(), fetchWordRecording(source, controller.signal)]);
          if (current !== request) return false;
          if (!currentWord(word) || recording()) { cancelWord(); return false; }
          url = URL.createObjectURL(blob);
          return await start(url);
        } finally {
          if (url) URL.revokeObjectURL(url);
          if (download === controller) download = undefined;
        }
      })();
      void playing.then(played => {
        if (!played && current === request) setMessage('Het geluid kon niet worden afgespeeld. Probeer nog eens.');
      }, () => { if (current === request) setMessage('Het geluid kon niet worden afgespeeld. Probeer nog eens.'); }).finally(() => {
        if (wordAudio === current) wordAudio = 0;
        window.dispatchEvent(new CustomEvent('klink-word-audio-end', { detail: current }));
        completed?.();
      });
    };
    const rootFor = (element: Element | null) => element?.closest('.learner-app, [data-classroom="active"], .kpd') ??
      (document.querySelector('.learner-app, [data-classroom="active"]') ? element?.closest('[role="dialog"]') : undefined) ??
      (element === document.body ? document.querySelector('.learner-app, [data-classroom="active"], .kpd') : undefined);
    const requested = (word: Word) => {
      if (recording()) { setMessage('Stop eerst je opname om een woord te beluisteren.'); return false; }
      if (recordingForWord(word.text)) word.node.parentElement?.dispatchEvent(new Event('klink-word-audio-request', { bubbles: true }));
      return true;
    };
    const down = (event: PointerEvent) => {
      closeKeyboard();
      if (event.target instanceof Element && event.target.closest('[data-practice-next], [data-practice-previous], [data-practice-check], [data-practice-listen], .cp-recorder button')) cancelWord();
      pending = undefined;
      pointer = event.isPrimary && event.button === 0 && !event.ctrlKey && !event.metaKey
        ? { id: event.pointerId, x: event.clientX, y: event.clientY } : undefined;
    };
    const cancel = () => { pointer = undefined; pending = undefined; };
    const up = (event: PointerEvent) => {
      const start = pointer; pointer = undefined;
      if (!start || start.id !== event.pointerId || Math.hypot(event.clientX - start.x, event.clientY - start.y) > 6) return;
      if (!(event.target instanceof Element) || !rootFor(event.target)) return;
      if (event.target.closest('[data-practice-next], [data-practice-previous], [data-practice-check], [data-practice-listen], .cp-recorder button')) return;
      const inline = event.target.closest('button.cp-inline-word');
      if (inline && !inline.closest(':disabled')) return;
      const word = wordAtPoint(event.clientX, event.clientY);
      if (!word) return;
      if (!requested(word)) return;
      const exercise = word.node.parentElement?.closest('[data-exercise-id], [data-pilot-step], [data-functional-step], [data-daily-step]') ?? undefined;
      pending = { word, before: nativePlays, href: location.href, exercise, marker: exercise?.getAttribute('data-exercise-id') };
      if (event.target.closest(':disabled')) { listen(word); pending = undefined; }
    };
    const click = () => {
      const selected = pending; pending = undefined;
      // Bubble after the answer handler, while still in the mobile playback gesture.
      // A navigation word must not interrupt the next exercise's own recording.
      if (selected && selected.word.node.isConnected && selected.href === location.href && (!selected.exercise || selected.exercise.isConnected && selected.marker === selected.exercise.getAttribute('data-exercise-id'))) listen(selected.word, selected.before);
    };
    const capturedClick = (event: MouseEvent) => {
      const selected = pending;
      // A model card normally starts a whole instruction/phrase; its text needs only the tapped word.
      if (selected && event.target instanceof Element && event.target.closest('button.cp-model-content') && recordingForWord(selected.word.text)) {
        pending = undefined;
        event.preventDefault(); event.stopPropagation();
        listen(selected.word, selected.before);
        return;
      }
      // Some answer controls stop bubbling; their words remain audible too.
      queueMicrotask(() => { if (selected && pending === selected) click(); });
    };
    const closeKeyboard = () => {
      if (keyboardAt >= 0) window.getSelection()?.removeAllRanges();
      keyboardWords = []; keyboardAt = -1; setAnnouncement('');
    };
    const key = (event: KeyboardEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const root = rootFor(target);
      if (!root || target?.closest('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
      if (keyboardAt >= 0 && !currentWord(keyboardWords[keyboardAt])) {
        closeKeyboard();
        if (!(event.altKey && event.code === 'KeyW')) { event.preventDefault(); event.stopPropagation(); return; }
      }
      if (keyboardAt < 0 && [' ', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(event.key)) cancelWord();
      if (event.altKey && !event.ctrlKey && !event.metaKey && event.code === 'KeyW') {
        event.preventDefault(); event.stopPropagation();
        if (keyboardAt >= 0) { closeKeyboard(); return; }
        (target?.closest('[data-exercise-id]') ?? root.querySelector('[data-exercise-id]'))?.dispatchEvent(new Event('klink-word-audio-browse', { bubbles: true }));
        keyboardWords = visibleWords(root); keyboardAt = keyboardWords.length ? 0 : -1;
      } else if (keyboardAt >= 0 && ['ArrowLeft', 'ArrowRight', ' ', 'Enter', 'Escape'].includes(event.key)) {
        event.preventDefault(); event.stopPropagation();
        if (event.key === 'Escape') { cancelWord(); closeKeyboard(); return; }
        if (event.key === ' ' || event.key === 'Enter') { if (!event.repeat) { if (requested(keyboardWords[keyboardAt])) listen(keyboardWords[keyboardAt]); } return; }
        keyboardAt = Math.max(0, Math.min(keyboardWords.length - 1, keyboardAt + (event.key === 'ArrowRight' ? 1 : -1)));
      } else return;
      const word = keyboardWords[keyboardAt];
      if (!word?.node.isConnected) { closeKeyboard(); return; }
      const selection = window.getSelection();
      selection?.removeAllRanges(); if ('start' in word) selection?.addRange(wordRange(word));
      scrollToWord(word);
      setAnnouncement(`${word.text}. Spatie om te luisteren. Pijl naar links of rechts voor een ander woord. Escape om terug te gaan.`);
    };
    window.addEventListener('klink-audio-source', playback);
    window.addEventListener('pointerdown', down, true);
    window.addEventListener('pointerup', up, true);
    window.addEventListener('click', click);
    window.addEventListener('click', capturedClick, true);
    window.addEventListener('pointercancel', cancel, true);
    window.addEventListener('keydown', key, true);
    const routeChanged = () => { cancelWord(); closeKeyboard(); };
    const recordedAudio = (event: Event) => { if (wordAudio && event.target instanceof HTMLMediaElement) cancelWord(); };
    const inlineRequested = (event: Event) => {
      const { element, completed } = (event as CustomEvent<{element: HTMLButtonElement; completed?: () => void}>).detail;
      if (!(element instanceof HTMLButtonElement) || !element.matches('.cp-inline-word') || !visibleElement(element)) { completed?.(); return; }
      const word = wordsIn(element).words[0];
      if (word && requested(word)) listen(word, nativePlays, completed); else completed?.();
    };
    const inlineCanceled = (event: Event) => {
      const element = (event as CustomEvent<HTMLElement>).detail;
      if (wordAudio && listeningNode && element instanceof HTMLElement && element.contains(listeningNode)) cancelWord();
    };
    window.addEventListener('klink-inline-word-request', inlineRequested);
    window.addEventListener('klink-inline-word-cancel', inlineCanceled);
    window.addEventListener('play', recordedAudio, true);
    window.addEventListener('hashchange', routeChanged);
    return () => {
      cancelWord();
      window.removeEventListener('klink-inline-word-request', inlineRequested);
      window.removeEventListener('klink-inline-word-cancel', inlineCanceled);
      window.removeEventListener('play', recordedAudio, true);
      window.removeEventListener('klink-audio-source', playback);
      window.removeEventListener('pointerdown', down, true);
      window.removeEventListener('pointerup', up, true);
      window.removeEventListener('click', click);
      window.removeEventListener('click', capturedClick, true);
      window.removeEventListener('pointercancel', cancel, true);
      window.removeEventListener('keydown', key, true);
      window.removeEventListener('hashchange', routeChanged);
    };
  }, []);
  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(''), 3400);
    return () => clearTimeout(timeout);
  }, [message]);
  return <>
    <p className="sr-only">Woorden beluisteren met het toetsenbord: druk Alt+W. Kies een woord met de pijltjestoetsen en luister met Spatie. Escape sluit het luisteren.</p>
    <output className="sr-only" aria-live="polite">{announcement}</output>
    {message && <output className="toast-message">{message}</output>}
  </>;
}
