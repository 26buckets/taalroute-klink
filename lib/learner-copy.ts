import type { PackageDefinition } from './package-content';
import sections from '../data/klink-sections.json' with { type: 'json' };

// Presentation only: the frozen curriculum titles and identifiers stay intact.
const listNames: Record<string, string> = Object.fromEntries(sections.sections.flatMap(section => [section.id, ...section.aliases].map(id => [id, section.title])));
export const learnerListName = (pack: PackageDefinition) => listNames[pack.id] ?? pack.title;

export const learnerPhaseNames: Record<string, string> = {
  meet: 'Kijk en luister', recognize: 'Kies', make: 'Maak', use: 'Oefen', recall: 'Nog een keer',
};

export const learnerExerciseNames: Record<string, string> = {
  'ALF-CMP-001': 'Kijk en luister', 'ALF-CMP-002': 'Kies',
  'ALF-CMP-004': 'Wat hoort bij elkaar?', 'ALF-CMP-005': 'Leg het woord',
  'ALF-CMP-006': 'Typ', 'ALF-CMP-007': 'Luister naar de zin',
  'ALF-CMP-008': 'Luister en kies', 'ALF-CMP-009': 'Zeg na',
  'ALF-CMP-010': 'Typ', 'ALF-CMP-012': 'Schrijf',
  'ALF-CMP-015': 'Zoek twee dezelfde', 'ALF-CMP-016': 'Draai de kaart',
};
