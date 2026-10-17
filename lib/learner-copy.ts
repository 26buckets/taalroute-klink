import type { PackageDefinition } from './package-content';

// Presentation only: the frozen curriculum titles and identifiers stay intact.
const listNames: Record<string, string> = {
  'groep-1': 'tas · mat', 'groep-2': 'map · man · pan · jas',
  'groep-3': 'e · i', 'groep-4': 'o · u', 'groep-5': 'aa · oo · ee',
  'groep-6': 'ie · oe · uu', 'groep-7': 'eu · ui',
  'groep-8': 'ei · ij · au · ou', 'groep-9': 'ng · nk · sch',
  'groep-10': 'sj · ch · c · x',
  'route-delen': 'huis · kamer · huiskamer',
  'route-zwakke-e': 'Woorden met e', 'route-dubbel': 'Twee dezelfde letters',
  'route-open': 'Lange klanken', 'route-verbinden': 'Lange woorden',
  voorbereiding: 'Nog meer woorden',
};
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
