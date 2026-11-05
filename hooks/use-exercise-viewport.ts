'use client';

import { useLayoutEffect, type RefObject } from 'react';

export function useExerciseViewport(exerciseStage: RefObject<HTMLDivElement | null>, guided: boolean, practiceRound: boolean, completed: boolean) {
  useLayoutEffect(() => {
    const stage = exerciseStage.current;
    const main = stage?.closest<HTMLElement>('.learner-main');
    if (!stage || !main) return;
    const viewport = window.visualViewport;
    let fullHeight = window.innerHeight;
    const resize = () => {
      const focused = main.contains(document.activeElement) && document.activeElement?.matches('input, textarea');
      const visibleHeight = viewport?.height ?? window.innerHeight;
      const keyboard = window.innerWidth <= 820 && Boolean(stage.querySelector('.cp-text-entry, .cp-form-fields')) && (focused || main.dataset.keyboardOpen === 'true') && visibleHeight < fullHeight - 100;
      if (!keyboard && !focused) fullHeight = window.innerHeight;
      main.dataset.keyboardOpen = String(keyboard);
      main.style.setProperty('--exercise-visible-height', `${visibleHeight}px`);
      main.style.setProperty('--exercise-viewport-top', `${viewport?.offsetTop ?? 0}px`);
      const nav = document.querySelector<HTMLElement>('.learner-nav');
      const bottom = keyboard ? visibleHeight + (viewport?.offsetTop ?? 0) : nav && getComputedStyle(nav).position === 'fixed' ? nav.getBoundingClientRect().top : window.innerHeight;
      const feedback = stage.parentElement?.querySelector<HTMLElement>('.cp-exercise-feedback');
      const top = stage.getBoundingClientRect().top + main.scrollTop;
      stage.style.setProperty('--practice-stage-height', `${Math.max(keyboard ? 0 : 180, bottom - top - (feedback?.offsetHeight ?? 112) - 12)}px`);
    };
    let resizeFrame = 0;
    const observer = new ResizeObserver(() => { cancelAnimationFrame(resizeFrame); resizeFrame = requestAnimationFrame(resize); });
    observer.observe(main);
    for (const el of main.querySelectorAll('.cp-context-header, .cp-practice-display, .cp-exercise-record-head, .cp-exercise-feedback')) observer.observe(el);
    window.addEventListener('resize', resize);
    viewport?.addEventListener('resize', resize);
    viewport?.addEventListener('scroll', resize);
    main.addEventListener('focusin', resize);
    main.addEventListener('focusout', resize);
    resize();
    return () => {
      observer.disconnect(); cancelAnimationFrame(resizeFrame); window.removeEventListener('resize', resize);
      viewport?.removeEventListener('resize', resize); viewport?.removeEventListener('scroll', resize);
      main.removeEventListener('focusin', resize); main.removeEventListener('focusout', resize);
      delete main.dataset.keyboardOpen;
      main.style.removeProperty('--exercise-visible-height'); main.style.removeProperty('--exercise-viewport-top');
    };
  }, [exerciseStage, guided, practiceRound, completed]);
}
