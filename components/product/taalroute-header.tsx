"use client";
import { useLayoutEffect, useRef, useState } from 'react';
import { Maximize, Minimize, Menu, ChevronDown, Presentation, ListChecks } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
const apps = [["studio", "Studio", "/", "#096cdb"], ["muziek", "Muziek", "/", "#7545e8"], ["actief", "Actief", "/", "#0090f2"], ["digibord", "DigiBord", "/", "#0090f2"], ["spreektijd", "Spreektijd", "/", "#c76349"], ["klankstudio", "Klankstudio", "/", "#285f47"], ["missies", "Missies", "/#docent", "#59402d"], ["oppad", "Op Pad", "/docent/", "#096cdb"], ["theaterlezen", "Theaterlezen", "/", "#a27722"], ["zinnen", "Zinnen", "/", "#91472f"], ["klink", "KLINK", "/", "#482c46"]];
export function TaalrouteHeader({ classroom = false }: { classroom?: boolean }) {
  const panel=useRef<HTMLDivElement>(null), header=useRef<HTMLElement>(null);
  const [full,setFull]=useState(false),[message,setMessage]=useState('');
  useLayoutEffect(()=>{
    const menu=(window as unknown as {TaalrouteMenu?:{mount:(p:HTMLElement,a:HTMLAnchorElement|null)=>void}}).TaalrouteMenu;
    if(panel.current)menu?.mount(panel.current,panel.current.querySelector('a'));
    const sync=()=>setFull(Boolean(document.fullscreenElement));sync();document.addEventListener('fullscreenchange',sync);
    const outside=(event:PointerEvent)=>{for(const d of header.current?.querySelectorAll<HTMLDetailsElement>('details[open]')||[])if(!d.contains(event.target as Node))d.open=false;};
    const escape=(event:KeyboardEvent)=>{if(event.key==='Escape'){const d=(event.target as Element).closest('details');if(d&&header.current?.contains(d)){d.open=false;d.querySelector('summary')?.focus();event.stopPropagation();}}};
    const navigate=(event:MouseEvent)=>{if((event.target as Element).closest('a'))for(const d of header.current?.querySelectorAll<HTMLDetailsElement>('details[open]')||[])d.open=false;};
    document.addEventListener('keydown',escape);document.addEventListener('click',navigate);
    document.addEventListener('pointerdown',outside);
    return()=>{document.removeEventListener('fullscreenchange',sync);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',escape);document.removeEventListener('click',navigate);};
  },[]);
  async function fullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();setMessage('');}catch{setMessage('Volledig scherm is niet beschikbaar.');}}
  return <header className="taalroute-header" ref={header}>
    <div className="taalroute-header-brand"><details className="tr-app-chooser" inert={classroom || undefined}><summary aria-label="Taalroute-apps"><Image className="header-taalroute-logo" src="/taalroute-logo.svg" alt="Taalroute" width={750} height={94} priority /><ChevronDown aria-hidden="true" /></summary><nav className="taalroute-suite-links" aria-label="Taalroute-apps">{apps.map(([id,name,path,color])=><a className="tr-suite-row" data-app-id={id} key={id} aria-label={id==='studio'?'Studio, Docentenomgeving':name} href={`https://${id}.taalroute.nl${path}`} target="_blank" rel="noopener noreferrer" style={{'--app-color':color} as React.CSSProperties}><Image src={`/taalroute-menu/${id==='klink'?'klink-brand':id}.svg`} alt="" width={136} height={17} loading="eager" unoptimized/><span className="tr-suite-label"><span className="tr-suite-wordmark">{id==='klink'?<span className="tr-klink-wordmark">KLINK</span>:name}{id==='studio'&&<small>Docentenomgeving</small>}</span><small className="taalroute-beta">BETA</small></span></a>)}</nav></details><span className="header-brand-divider" aria-hidden="true"/><Link href="/" aria-label="Klink — naar de startpagina" tabIndex={classroom ? -1 : undefined} onClick={event => { if (classroom) event.preventDefault(); }}><Image className="header-klink-logo" src="/klink-wordmark.svg" alt="Klink" width={770} height={252} priority /></Link><small className="klink-header-beta">BETA</small></div>
    <div className="hdr001-controls"><button className="hdr001-fullscreen" type="button" onClick={fullscreen} aria-label={full?'Normale weergave':'Volledig scherm'} aria-pressed={full}>{full?<Minimize/>:<Maximize/>}</button><details className="hdr001-menu" hidden={classroom}><summary className="hdr001-menu-trigger" aria-label="Menu"><Menu/></summary><div ref={panel} className="hdr001-panel"><a href="https://studio.taalroute.nl/#/apps/klink/handleiding">Docentenhandleiding</a>
      {/* oxlint-disable-next-line next/no-html-link-for-pages -- Native hashchange drives the existing Klink router. */}
      <a href="/#teacher/plus"><Presentation aria-hidden="true"/><span>Klink Plus docent</span></a><a href="/klink-oefenoverzicht-archief-vervolg-20261030.html"><ListChecks aria-hidden="true"/><span>Oefenoverzicht · bèta</span></a></div></details><output className="hdr001-status" aria-label="Schermmelding">{message}</output></div>
  </header>;
}
