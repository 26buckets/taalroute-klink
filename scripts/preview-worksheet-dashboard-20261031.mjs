import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Presentation, FileText, ArrowRight } from 'lucide-react';
const out='outputs/werkbladen-review-20261031';
const icon=C=>renderToStaticMarkup(createElement(C,{size:22,'aria-hidden':true}));
const content=`<section class="worksheet-proposal">
<p class="intro">Kies een les. Het digibord en de werkbladen horen bij elkaar.</p>
<div class="lesson-grid">${['Mat','Tas','Map','Man','Pan','Jas','Pen','Pet'].map(word=>`<article class="lesson-item"><h3>${word}</h3><div class="lesson-options"><button class="secondary-button">${icon(Presentation)}<span>${word} · Digibordles</span>${icon(ArrowRight)}</button><button class="secondary-button">${icon(FileText)}<span>${word} · Werkblad</span>${icon(ArrowRight)}</button></div></article>`).join('')}</div>
</section>`;
const css=`.worksheet-proposal{padding:0 24px 24px}.worksheet-proposal .intro{margin:0 0 12px;font-size:18px}.lesson-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.lesson-item{border:1px solid var(--line);border-radius:var(--radius);padding:8px;min-width:0}.lesson-item h3{font-size:22px;line-height:28px;font-weight:500;margin:0 0 8px}.lesson-options{display:grid;gap:8px}.lesson-options button{width:100%;height:48px;font-size:18px;justify-content:flex-start;padding:10px 12px}.lesson-options button span{flex:1;text-align:left}@media(max-width:899px){.lesson-grid{grid-template-columns:1fr}.worksheet-proposal{padding:0 16px 16px}.lesson-options button{font-size:16px}}`;
writeFileSync(out+'/dashboard-voorstel.html',`<!doctype html><html lang="nl"><meta charset="utf-8"><title>Werkbladen — structuurvoorstel</title><style>body{font:18px Arial,sans-serif;background:#edf2ef;color:#1b2523;margin:24px}button{background:white;color:inherit;border:1px solid #b9c8c3;border-radius:4px;display:flex;gap:10px;align-items:center}svg{flex-shrink:0}${css}</style><main><h1>Werkbladen</h1>${content}</main></html>`);
const browser=await chromium.launch();try{const page=await browser.newPage({viewport:{width:1440,height:900}});await page.goto('http://127.0.0.1:18981/#teacher/materials');await page.locator('.kpd-prepare').waitFor();await page.locator('.kpd-prepare').evaluate((el,html)=>el.outerHTML=html,content);await page.addStyleTag({content:css});await page.screenshot({path:out+'/dashboard-voorstel.png',fullPage:true});}finally{await browser.close();}
