'use client';

import { LogOut, MoreHorizontal, Search } from 'lucide-react';
import Image from 'next/image';
import { ReactNode } from 'react';
import { applyDefaultAudioRate, DEFAULT_AUDIO_RATE } from '@/lib/media-player';
import { isWithdrawnAudio } from '@/lib/audio-policy';
export { playMedia, stopMedia } from '@/lib/media-player';

export function playAudio(file: string, rate = DEFAULT_AUDIO_RATE) {
  if (isWithdrawnAudio(`/audio/pb/${file}.m4a`)) return;
  const audio = new Audio(`/audio/pb/${file}.m4a`);
  applyDefaultAudioRate(audio);
  audio.defaultPlaybackRate = rate;
  audio.playbackRate = rate;
  void audio.play();
}

export function Brand({ dark = false }: { dark?: boolean; label?: string }) {
  return (
    <span className={`brand ${dark ? 'brand-dark' : ''}`}>
      <Image className="taalroute-logo" src="/taalroute-logo.svg" alt="Taalroute" width={750} height={94} priority />
      <span className="brand-divider" aria-hidden="true" />
      <Image className="product-name klink-wordmark" src="/klink-wordmark.svg" alt="Klink" width={770} height={252} priority />
    </span>
  );
}

export function StaffShell({ area, name, initials, nav, children, onExit }: {
  area: string; name: string; initials: string; nav: ReactNode; children: ReactNode; onExit: () => void;
}) {
  return (
    <div className="staff-app">
      <aside className="staff-sidebar">
        <Brand label={area} />
        <div className="staff-nav">{nav}</div>
        <button className="staff-account" onClick={onExit}><span>{initials}</span><span><strong>{name}</strong><small>{area}</small></span><LogOut /></button>
      </aside>
      <main className="staff-main">{children}</main>
    </div>
  );
}

export function NavButton({ active, icon, label, onClick, badge }: {
  active?: boolean; icon: ReactNode; label: string; onClick: () => void; badge?: string;
}) {
  return <button className={active ? 'active' : ''} onClick={onClick}>{icon}<span>{label}</span>{badge && <b>{badge}</b>}</button>;
}

export function StaffTopbar({ title, subtitle, actions }: { title: string; subtitle: string; actions?: ReactNode }) {
  return (
    <header className="staff-topbar">
      <div><h1>{title}</h1><p>{subtitle}</p></div>
      <div className="topbar-actions">{actions}<button className="icon-button" aria-label="Zoeken"><Search /></button><button className="icon-button" aria-label="Meer"><MoreHorizontal /></button></div>
    </header>
  );
}
