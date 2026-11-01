'use client';
import {useLayoutEffect, useRef, useState, type ReactNode} from 'react';
import {createPortal} from 'react-dom';
import {ArrowLeft, ArrowRight} from 'lucide-react';
import {panelPageStarts, type PanelBox} from './panel-pages';

export function AlfaCPanel({kind, children}: {kind: 'source' | 'answer'; children: ReactNode}) {
  const viewport = useRef<HTMLDivElement>(null), content = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({height: 0, total: 0, starts: [0]});
  const [page, setPage] = useState(0), [footer, setFooter] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    const outer = viewport.current!, body = content.current!;
    setFooter(outer.closest('.ac-document-player')?.querySelector<HTMLElement>('.pilot-footer') ?? null);
    let frame = 0;
    function measure() {
      const height = outer.clientHeight;
      if (height <= 0 || outer.getBoundingClientRect().width === 0) return;
      body.style.setProperty('--ac-panel-height', `${height}px`);
      body.removeAttribute('data-tight');
      if (body.getBoundingClientRect().height > height + 1) body.setAttribute('data-tight', 'true');
      const origin = body.getBoundingClientRect().top, boxes: PanelBox[] = [];
      const add = (r: DOMRect) => { if (r.width && r.height) boxes.push({top: r.top - origin, bottom: r.bottom - origin}); };
      for (const element of body.querySelectorAll('button, input, textarea, label, .ac-document-line, .ac-built-answer, img')) add(element.getBoundingClientRect());
      const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent?.trim() || node.parentElement?.closest('svg, button, input, textarea, .sr-only')) continue;
        const range = document.createRange(); range.selectNodeContents(node);
        for (const r of range.getClientRects()) add(r);
      }
      const total = Math.ceil(body.getBoundingClientRect().height);
      const starts = panelPageStarts(height, total, boxes);
      setLayout(old => old.height === height && old.total === total && JSON.stringify(old.starts) === JSON.stringify(starts) ? old : {height, total, starts});
      setPage(old => Math.min(old, starts.length - 1));
    }
    const schedule = () => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); };
    const resize = new ResizeObserver(schedule), changes = new MutationObserver(schedule);
    resize.observe(outer); resize.observe(body); changes.observe(body, {childList: true, subtree: true, characterData: true});
    measure();
    return () => { cancelAnimationFrame(frame); resize.disconnect(); changes.disconnect(); };
  }, []);
  const index = Math.min(page, layout.starts.length - 1), start = layout.starts[index];
  const end = layout.starts[index + 1] ?? layout.total;
  const paged = layout.starts.length > 1;
  const offset = paged ? -start : Math.max(0, (layout.height - layout.total) / 2);
  const name = kind === 'source' ? 'Tekst' : 'Opdracht';
  return <div ref={viewport} className={`ac-panel-viewport ac-${kind}-viewport`} data-panel-pages={layout.starts.length} data-panel-page={index + 1} data-panel-height={layout.height}
    onScrollCapture={event => {
      const target = event.target as HTMLElement;
      if (target === viewport.current || target.classList.contains('ac-page-window')) {
        target.scrollTop = 0; target.scrollLeft = 0;
      }
    }}
    onFocusCapture={event => {
      const body = content.current!;
      if (!body.contains(event.target)) return;
      const r = event.target.getBoundingClientRect(), top = r.top - body.getBoundingClientRect().top;
      const next = layout.starts.findIndex((value, i) => top >= value - 1 && top < (layout.starts[i + 1] ?? layout.total));
      if (next >= 0) setPage(next);
    }}>
    <div className="ac-page-window" style={{height: paged ? end - start : '100%'}}>
      <div ref={content} className={`ac-panel-content ac-${kind}-panel`} style={{transform: `translateY(${offset}px)`}}>{children}</div>
    </div>
    {paged && footer && createPortal(<nav className="ac-page-nav" data-panel={kind} aria-label={`${name}, delen`}>
      <span className="ac-page-name">{name}</span>
      <button className="secondary-button" aria-label={`Vorig deel van ${name.toLowerCase()}`} disabled={index === 0} onClick={() => setPage(index - 1)}><ArrowLeft /></button>
      <span aria-live="polite">{index + 1} / {layout.starts.length}</span>
      <button className="secondary-button" aria-label={`Volgend deel van ${name.toLowerCase()}`} disabled={index === layout.starts.length - 1} onClick={() => setPage(index + 1)}><ArrowRight /></button>
    </nav>, footer)}
  </div>;
}
