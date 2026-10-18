'use client';

import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { ArrowRight, CircleDashed } from 'lucide-react';
import { availableContentLevels, contentLevels, levelLabel } from '@/lib/content-levels';
import { defaultRouteSettings, parseRouteSettings, routeSettingsKey, type RouteSettings } from '@/lib/learner-route';
import { stopMedia } from './shared';

const RouteContext = createContext({ settings: defaultRouteSettings, change: (_next: RouteSettings) => {}, stored: true });
export const useRouteSettings = () => useContext(RouteContext);

export function RouteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RouteSettings>(defaultRouteSettings);
  const [stored, setStored] = useState(true);
  useEffect(() => {
    const read = () => { try { setSettings(parseRouteSettings(localStorage.getItem(routeSettingsKey))); } catch { setStored(false); } };
    read();
    const sync = (event: StorageEvent) => { if (event.key === routeSettingsKey || event.key === null) read(); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function change(next: RouteSettings) {
    stopMedia(); setSettings(next);
    try { localStorage.setItem(routeSettingsKey, JSON.stringify(next)); setStored(true); } catch { setStored(false); }
  }
  return <RouteContext.Provider value={{ settings, change, stored }}>{children}</RouteContext.Provider>;
}

export function MyRoute({ onChange, onBrowse }: { onChange?: (settings: RouteSettings) => void; onBrowse?: () => void } = {}) {
  const { settings, change, stored } = useRouteSettings();
  const labelId = useId();
  function update(next: RouteSettings) { change(next); if (next.literacy !== settings.literacy || next.language !== settings.language) onChange?.(next); }
  const title = `Mijn route${settings.literacy !== 'all' ? ` · ${levelLabel(settings.literacy)}` : ''}${settings.language !== 'all' ? ` · ${levelLabel(settings.language)}` : ''}`;
  const choices = <>
    <p>Kies samen met je docent.</p>
    <div className="cp-route-axes">{(['literacy', 'language'] as const).map(axis => <fieldset key={axis} className="cp-route-axis"><legend>{axis === 'literacy' ? 'Leren lezen en schrijven' : 'Nederlands gebruiken'}</legend>
      <div className="cp-route-levels">{contentLevels.filter(item => axis === 'literacy' ? item.id.startsWith('alfa-') : ['a1', 'a2', 'b1'].includes(item.id)).map(item => {
        const present = availableContentLevels.has(item.id), selected = settings[axis] === item.id;
        return <button type="button" className="cp-route-level" key={item.id} disabled={!present} aria-label={item.label} aria-describedby={`${labelId}-${item.id}`} aria-pressed={selected} onClick={() => update({ ...settings, [axis]: item.id })}>
          <strong>{item.label}</strong><span id={`${labelId}-${item.id}`}>{!present ? <><CircleDashed aria-hidden="true" />Nog niet beschikbaar</> : selected ? 'Gekozen' : axis === 'literacy' ? 'Woorden oefenen' : 'Met de docent'}</span>
        </button>;
      })}</div>
      <button type="button" className="cp-route-reset" aria-pressed={settings[axis] === 'all'} onClick={() => update({ ...settings, [axis]: 'all' })}>Samen kiezen</button>
    </fieldset>)}</div>
    {onBrowse && <button type="button" className="primary-button" onClick={onBrowse}>Bekijk mijn oefeningen<ArrowRight aria-hidden="true" /></button>}
    <p className="cp-route-note">Dit is je oefenkeuze, niet je behaalde niveau. Je keuze geldt op dit apparaat.</p>
    {!stored && <output>Je keuze werkt nu, maar kan hier niet worden bewaard.</output>}
  </>;
  return <>
    {onBrowse ? <section className="cp-route-panel" data-my-route><h2>Kies je oefenroute</h2>{choices}</section> : <details className="cp-level-picker cp-my-route" data-my-route><summary>{title}</summary>{choices}</details>}
    {!onBrowse && <PictureHelp />}
  </>;
}

export function PictureHelp() {
  const { settings, change } = useRouteSettings();
  return <details className="cp-level-picker cp-picture-settings" data-picture-settings><summary>Hulp bij oefenen</summary>
    <fieldset className="cp-chapter-levels"><legend>Foto bij zelf woorden maken</legend>{([['always', 'Met foto'], ['request', 'Foto als hulp'], ['after', 'Foto na je antwoord']] as const).map(([id, label]) => <button type="button" key={id} className="secondary-button" aria-pressed={settings.pictures === id} onClick={() => change({ ...settings, pictures: id })}>{label}</button>)}</fieldset>
    <p>Voorbeelden en situatiebeelden blijven zichtbaar.</p>
  </details>;
}
