'use client';

import { createContext, useContext, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, CircleDashed, SlidersHorizontal } from 'lucide-react';
import { availableContentLevels, contentLevels, contentHelp, levelLabel, type ContentSelection } from '@/lib/content-levels';
import { defaultRouteSettings, parseRouteSettings, routeSettingsKey, type RouteSettings } from '@/lib/learner-route';
import { stopMedia } from './shared';
import { defaultPracticePreferences, parsePracticePreferences, practicePreferencesKey, type PracticePreferences } from '@/lib/practice-navigation';

const RouteContext = createContext({ settings: defaultRouteSettings, change: (_next: RouteSettings) => {}, practice: defaultPracticePreferences, changePractice: (_next: PracticePreferences) => {}, stored: true });
export const useRouteSettings = () => useContext(RouteContext);

export function RouteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RouteSettings>(defaultRouteSettings);
  const [practice, setPractice] = useState<PracticePreferences>(defaultPracticePreferences);
  const [stored, setStored] = useState(true);
  useEffect(() => {
    const read = () => { try { const next = parseRouteSettings(localStorage.getItem(routeSettingsKey)); setSettings(next); setPractice(parsePracticePreferences(localStorage.getItem(practicePreferencesKey), next)); } catch { setStored(false); } };
    read();
    const sync = (event: StorageEvent) => { if (event.key === routeSettingsKey || event.key === practicePreferencesKey || event.key === null) read(); };
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);
  function change(next: RouteSettings) {
    stopMedia(); setSettings(next);
    try { localStorage.setItem(routeSettingsKey, JSON.stringify(next)); setStored(true); } catch { setStored(false); }
  }
  function changePractice(next: PracticePreferences) {
    if (practice.level === next.level && practice.help === next.help) return;
    stopMedia(); setPractice(next);
    try { localStorage.setItem(practicePreferencesKey, JSON.stringify(next)); } catch { setStored(false); }
  }
  return <RouteContext.Provider value={{ settings, change, practice, changePractice, stored }}>{children}</RouteContext.Provider>;
}

type RouteAxis = 'literacy' | 'language';
type RouteControls = { selection?: ContentSelection; onSelectionChange?: (next: ContentSelection) => void; showPracticeChoice?: boolean; availableLevels?: ReadonlySet<ContentSelection['level']> };

export function MyRoute({ onChange, onBrowse, axis, selection, onSelectionChange, showPracticeChoice = true, availableLevels, direct = false }: RouteControls & { onChange?: (settings: RouteSettings) => void; onBrowse?: () => void; axis?: RouteAxis; direct?: boolean } = {}) {
  const { settings, change, stored } = useRouteSettings();
  const labelId = useId();
  // A bookmarked content filter takes precedence on this page, without silently overwriting the other route.
  const selectedAxis = selection?.level.startsWith('alfa-') ? 'literacy' : selection && ['a1', 'a2', 'b1'].includes(selection.level) ? 'language' : axis;
  const axes: RouteAxis[] = axis ? [selectedAxis ?? axis] : ['literacy', 'language'];
  function choose(currentAxis: RouteAxis, level: ContentSelection['level']) {
    const active = selection?.level ?? settings[currentAxis];
    const value = direct ? level : active === level ? 'all' : level;
    const next = { ...settings, [currentAxis]: value };
    change(next); onChange?.(next);
    onSelectionChange?.({ ...selection, level: value });
  }
  return <section className={`cp-route-panel cp-route-toolbar${direct ? ' cp-direct-levels' : ''}`} data-my-route aria-label="Oefenroute">
    {onBrowse && <h2 className="sr-only">Kies je oefenroute</h2>}
    <div className="cp-route-axes">{axes.map(currentAxis => <fieldset key={currentAxis} className="cp-route-axis"><legend className={direct && currentAxis === 'language' ? 'sr-only' : undefined}>{direct ? 'Niveau' : currentAxis === 'literacy' ? 'Lezen' : 'Taal'}</legend>
      <div className="cp-route-levels">{contentLevels.filter(item => currentAxis === 'literacy' ? item.id.startsWith('alfa-') : ['a1', 'a2', 'b1'].includes(item.id)).map(item => {
        const present = (availableLevels ?? availableContentLevels).has(item.id), selected = (selection?.level ?? settings[currentAxis]) === item.id;
        return <button type="button" className="cp-route-level" key={item.id} disabled={!direct && !present} aria-label={item.label} aria-describedby={`${labelId}-${item.id}`} aria-pressed={selected} title={direct ? item.label : !present ? 'Nog niet beschikbaar' : selected ? 'Nogmaals tikken om uit te zetten' : item.label} onClick={() => choose(currentAxis, item.id)}>
          <strong>{item.label}</strong>{!direct && !present && <CircleDashed aria-hidden="true" />}<span className="sr-only" id={`${labelId}-${item.id}`}>{direct ? selected ? 'Gekozen.' : 'Kies dit niveau.' : !present ? 'Nog niet beschikbaar' : selected ? 'Gekozen. Nogmaals tikken om uit te zetten.' : currentAxis === 'literacy' ? 'Woorden oefenen' : 'Nederlands gebruiken'}</span>
        </button>;
      })}{direct ? currentAxis === 'language' && <button type="button" className="cp-route-level" disabled aria-hidden="true" style={{ visibility: 'hidden' }} aria-label="B2 — nog niet beschikbaar">B2</button> : <button type="button" className="cp-route-reset" aria-label={currentAxis === 'literacy' ? 'Alle leesniveaus' : 'Alle taalniveaus'} aria-pressed={(selection?.level ?? settings[currentAxis]) === 'all'} onClick={() => choose(currentAxis, 'all')}>Alles</button>}</div>
    </fieldset>)}</div>
    {!direct && <div className="cp-route-actions"><PictureHelp selection={selection} onSelectionChange={onSelectionChange} showPracticeChoice={showPracticeChoice} availableLevels={availableLevels} />
      {onBrowse && <button type="button" className="primary-button" onClick={onBrowse}>Bekijk mijn oefeningen<ArrowRight aria-hidden="true" /></button>}
    </div>}
    <p className="sr-only">Kies samen met je docent. Dit is je oefenkeuze, niet je behaalde niveau. Je keuze geldt op dit apparaat.</p>
    {!stored && <output>Je keuze werkt nu, maar kan hier niet worden bewaard.</output>}
  </section>;
}

export function PictureHelp({ selection, onSelectionChange, showPracticeChoice = true, availableLevels }: RouteControls = {}) {
  const { settings, change } = useRouteSettings();
  const disclosure = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const element = disclosure.current;
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && element) { element.open = false; element.querySelector('summary')?.focus(); } };
    element?.addEventListener('keydown', close);
    return () => element?.removeEventListener('keydown', close);
  }, []);
  const filter = selection?.level === 'support' ? levelLabel(selection.level) : showPracticeChoice && selection?.help && selection.help !== 'all' ? contentHelp.find(item => item.id === selection.help)?.label : undefined;
  return <details ref={disclosure} className="cp-level-picker cp-picture-settings" data-picture-settings><summary><SlidersHorizontal aria-hidden="true" />Hulp{filter && <span> · {filter}</span>}</summary>
    <div className="cp-route-options">
    <fieldset className="cp-chapter-levels"><legend>Foto bij zelf woorden maken</legend>{([['always', 'Met foto'], ['request', 'Foto als hulp'], ['after', 'Foto na je antwoord']] as const).map(([id, label]) => <button type="button" key={id} className="secondary-button" aria-pressed={settings.pictures === id} onClick={() => change({ ...settings, pictures: id })}>{label}</button>)}</fieldset>
    <p>Voorbeelden en situatiebeelden blijven zichtbaar.</p>
    {selection && onSelectionChange && <>
      {showPracticeChoice && <fieldset className="cp-chapter-levels"><legend>Opdrachten tonen</legend>{contentHelp.map(item => <button type="button" key={item.id} className="secondary-button" aria-pressed={(selection.help ?? 'all') === item.id} onClick={() => onSelectionChange({ ...selection, help: selection.help === item.id ? 'all' : item.id })}>{item.label}</button>)}</fieldset>}
      <button type="button" className="secondary-button" disabled={availableLevels ? !availableLevels.has('support') : false} aria-pressed={selection.level === 'support'} onClick={() => onSelectionChange({ ...selection, level: selection.level === 'support' ? 'all' : 'support' })}>Overige inhoud</button>
    </>}
    </div>
  </details>;
}
