'use client';

import { useCallback, useEffect, useRef, type KeyboardEvent } from 'react';

export function practiceBusy(root: HTMLElement | null, ignoreAudio = false) {
  return Boolean(root?.querySelector('[data-practice-busy="true"], [data-practice-recording="true"]')) ||
    Array.from(root?.querySelectorAll<HTMLMediaElement>('audio, video') ?? []).some(media => !media.paused && !media.ended && (!ignoreAudio || media.tagName !== 'AUDIO'));
}

export function usePracticeKeyboard({ enabled = true, busy = false, allowAudioNext = false, onUse, onListen }: {
  enabled?: boolean;
  busy?: boolean;
  allowAudioNext?: boolean;
  onUse?: () => void;
  onListen?: () => void;
} = {}) {
  const ref = useRef<HTMLElement>(null);
  const onKeyDownCapture = useCallback((event: KeyboardEvent<HTMLElement> | globalThis.KeyboardEvent, fallbackRoot?: HTMLElement) => {
    if (!enabled || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || ('nativeEvent' in event ? event.nativeEvent.isComposing : event.isComposing)) return;
    const root = fallbackRoot ?? event.currentTarget as HTMLElement, target = fallbackRoot ?? event.target as HTMLElement;
    if (!['Enter', ' ', 'ArrowLeft', 'ArrowRight'].includes(event.key) || target.closest('textarea, select, [contenteditable]:not([contenteditable="false"]), [role="menu"], [role="listbox"], [role="slider"], [role="tablist"], audio, video, [role="dialog"], [aria-haspopup="dialog"]')) return;
    const input = target.closest('input');
    if (input && event.key !== 'Enter') return;
    if (event.repeat) { event.preventDefault(); return; }
    root.dataset.practiceKeyboard = 'true';
    if (!target.closest('[data-practice-automatic]')) onUse?.();
    const item = target.closest<HTMLElement>('[data-practice-item]');
    const selectedAnswer = target.closest('.cp-choice-grid button[aria-pressed="true"], .cp-evidence-options button[aria-pressed="true"], .cp-large-options button[aria-pressed="true"]');
    const confirmAnswer = event.key === 'Enter' && (selectedAnswer || (item ?? root).dataset.practiceReady === 'true' && (input || target.closest('[data-practice-check]')));
    const button = target.closest('button, a, summary, [role="button"]');
    root.dataset.practiceFocusNext = event.key === ' ' && (!button || selectedAnswer) ? 'false' : 'true';
    // Keep native button activation, except replaying audio from a selected answer.
    if (!confirmAnswer && button && (event.key === 'Enter' || event.key === ' ' && !selectedAnswer)) return;
    if (!confirmAnswer && input?.form) return;
    event.preventDefault();
    const forwardDuringAudio = allowAudioNext && !item && root.dataset.practiceReady === 'true' && (event.key === 'Enter' || event.key === 'ArrowRight');
    if ((busy && !forwardDuringAudio) || practiceBusy(root, forwardDuringAudio)) return;
    const unfinishedItem = root.querySelector<HTMLElement>('[data-practice-item][data-practice-ready="false"]');
    if (!item && root.querySelector('[data-practice-item]') && (unfinishedItem || event.key !== 'Enter')) {
      (unfinishedItem ?? root.querySelector<HTMLElement>('[data-practice-item]'))?.focus();
      return;
    }
    const scope = item ?? root;
    const click = (selector: string, within: HTMLElement = root) => {
      const action = Array.from(within.querySelectorAll<HTMLButtonElement>(selector)).find(button => button.getClientRects().length > 0);
      if (!action) return false;
      if (!action.disabled && action.getAttribute('aria-disabled') !== 'true') action.click();
      return true;
    };
    const move = (direction: number) => {
      if (item) {
        if (direction > 0 && item.dataset.practiceReady !== 'true') return;
        const items = Array.from(root.querySelectorAll<HTMLElement>('[data-practice-item]'));
        const adjacent = items[items.indexOf(item) + direction];
        if (adjacent) { adjacent.focus(); return; }
        if (direction > 0) {
          const unfinished = items.find(row => row.dataset.practiceReady !== 'true');
          if (unfinished) { unfinished.focus(); return; }
        }
      }
      if (root.dataset.practiceReady !== 'true' && click(direction > 0 ? '[data-practice-step-next]' : '[data-practice-step-previous]')) return;
      click(direction > 0 ? '[data-practice-next]' : '[data-practice-previous]');
    };
    if (event.key === ' ') {
      if (!click('[data-practice-listen]', scope) && !item) onListen?.();
    } else if (event.key === 'ArrowLeft') move(-1);
    else if (event.key === 'ArrowRight' || scope.getAttribute('data-practice-ready') === 'true') move(1);
    else if (!click('[data-practice-check]', scope) && !item) click('[data-practice-next]');
  }, [enabled, busy, allowAudioNext, onUse, onListen]);
  useEffect(() => {
    // A correct answer can disable the focused button and leave focus on the page.
    const keyFromPage = (event: globalThis.KeyboardEvent) => {
      const root = ref.current;
      if (!['Enter', ' ', 'ArrowLeft', 'ArrowRight'].includes(event.key) || !root?.getClientRects().length || (event.target !== document.body && event.target !== document.documentElement)) return;
      if (Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"], [role="menu"], [role="listbox"]')).some(panel => panel.getClientRects().length)) return;
      onKeyDownCapture(event, root);
    };
    document.addEventListener('keydown', keyFromPage);
    return () => document.removeEventListener('keydown', keyFromPage);
  }, [onKeyDownCapture]);
  return { ref, onKeyDownCapture, onPointerDownCapture: () => {
    // A mouse or touch answer must not inherit an earlier keyboard focus move.
    if (ref.current) delete ref.current.dataset.practiceFocusNext;
  } };
}
