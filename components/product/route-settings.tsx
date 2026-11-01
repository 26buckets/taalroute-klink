'use client';

import { createContext, useContext, useEffect, useId, useState, type ReactNode } from 'react';
import { ArrowRight, CircleDashed } from 'lucide-react';
import { availableContentLevels, contentLevels, contentHelp, type ContentSelection } from '@/lib/content-levels';
import { defaultRouteSettings, parseRouteSettings, routeSettingsKey, type RouteSettings } from '@/lib/learner-route';
import { stopMedia } from './shared';
import { defaultPracticePreferences, parsePracticePreferences, practicePreferencesKey, type PracticePreferences } from '@/lib/practice-navigation';

export type ExerciseViewPreferences = { photo: boolean; text: boolean };
export const exerciseViewKey = 'klink.exercise-view.v1';
const RouteContext = createContext({ settings: defaultRouteSettings, change: (_next: RouteSettings) => {}, practice: defaultPracticePreferences, changePractice: (_next: PracticePreferences) => {}, view: { photo: true, text: true }, changeView: (_next: ExerciseViewPreferences) => {}, stored: true });
export const useRouteSettings = () => useContext(RouteContext);

export function RouteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<RouteSettings>(defaultRouteSettings);
  const [practice, setPractice] = useState<PracticePreferences>(defaultPracticePreferences);
  const [stored, setStored] = useState(true);
  const [view, setView] = useState<ExerciseViewPreferences>({ photo: true, text: true });
  useEffect(() => {
    const read = () => { try { const next = parseRouteSettings(localStorage.getItem(routeSettingsKey)); setSettings(next); setPractice(parsePracticePreferences(localStorage.getItem(practicePreferencesKey), next));
      let saved: Partial<ExerciseViewPreferences> = {}; try { saved = JSON.parse(localStorage.getItem(exerciseViewKey) ?? '{}') ?? {}; } catch { /* Keep malformed view preferences separate from learning progress. */ }
      setView({ photo: typeof saved.photo === 'boolean' ? saved.photo : next.pictures === 'always', text: typeof saved.text === 'boolean' ? saved.text : true });
    } catch { setStored(false); } };
    read();
    const sync = (event: StorageEvent) => { if (event.key === routeSettingsKey || event.key === practicePreferencesKey || event.key === exerciseViewKey || event.key === null) read(); };
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
  function changeView(next: ExerciseViewPreferences) {
    setView(next);
    try { localStorage.setItem(exerciseViewKey, JSON.stringify(next)); } catch { setStored(false); }
  }
  return <RouteContext.Provider value={{ settings, change, practice, changePractice, view, changeView, stored }}>{children}</RouteContext.Provider>;
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
    {!direct && <div className="cp-route-actions"><AdditionalContent selection={selection} onSelectionChange={onSelectionChange} showPracticeChoice={showPracticeChoice} availableLevels={availableLevels} />
      {onBrowse && <button type="button" className="primary-button" onClick={onBrowse}>Bekijk mijn oefeningen<ArrowRight aria-hidden="true" /></button>}
    </div>}
    <p className="sr-only">Kies samen met je docent. Dit is je oefenkeuze, niet je behaalde niveau. Je keuze geldt op dit apparaat.</p>
    {!stored && <output>Je keuze werkt nu, maar kan hier niet worden bewaard.</output>}
  </section>;
}

export function AdditionalContent({ selection, onSelectionChange, showPracticeChoice = true, availableLevels }: RouteControls = {}) {
  if (!selection || !onSelectionChange) return null;
  return <div className="cp-additional-content">
      {showPracticeChoice && <fieldset className="cp-chapter-levels"><legend>Opdrachten tonen</legend>{contentHelp.map(item => <button type="button" key={item.id} className="secondary-button" aria-pressed={(selection.help ?? 'all') === item.id} onClick={() => onSelectionChange({ ...selection, help: selection.help === item.id ? 'all' : item.id })}>{item.label}</button>)}</fieldset>}
      {(!availableLevels || availableLevels.has('support') || selection.level === 'support') && <button type="button" className="secondary-button" aria-pressed={selection.level === 'support'} onClick={() => onSelectionChange({ ...selection, level: selection.level === 'support' ? 'all' : 'support' })}>Overige inhoud</button>}
  </div>;
}
