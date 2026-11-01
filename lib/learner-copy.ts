import type { PackageDefinition } from './package-content';
import sections from '../data/klink-sections.json' with { type: 'json' };

// Presentation only: the frozen curriculum titles and identifiers stay intact.
const listNames: Record<string, string> = Object.fromEntries(sections.sections.flatMap(section => [section.id, ...section.aliases].map(id => [id, section.title])));
export const learnerListName = (pack: PackageDefinition) => listNames[pack.id] ?? pack.title;

const shortCollectionTitles: Record<string, string> = {
  'Zeg de zin': 'Zinnen oefenen',
  'Veiligheid, praktische taken en problemen': 'Veiligheid en problemen',
  'Gezondheid en persoonlijke verzorging': 'Gezondheid en verzorging',
  'Vrije tijd, bewegen en algemene woorden': 'Vrije tijd en bewegen',
  'Communicatie en informatiehandelingen': 'Communicatie en informatie',
  'Werkwoorden met mogelijke scheidbaarheid': 'Werkwoorden: los of vast',
  'Voornaamwoorden en grammaticale woorden': 'Voornaamwoorden en grammatica',
  'Scheidbaarheid en voorvoegselcontrasten': 'Werkwoorden en voorvoegsels',
  'Veiligheid en noodsituaties · Hulpdiensten': 'De hulpdiensten',
};

// Display labels only; authored titles, links and completion IDs remain source-bound.
export function learnerCollectionLabel(source: string) {
  let title = source.trim(), round: string | undefined, support: string | undefined;
  const selection = title.match(/^(Basis|Uitbreiding met je docent) · (.+)$/);
  if (selection) { support = selection[1]; title = selection[2]; }
  const reading = title.match(/^Leesronde\s+(\d+)(?:\s*·\s*.+)?$/i);
  const sentences = title.match(/^Zinnenronde\s+(\d+)(?:\s*·\s*(.+))?$/i);
  if (reading || sentences) {
    round = (reading ?? sentences)![1];
    title = reading ? 'Korte teksten' : sentences![2] ?? 'Zinnen oefenen';
  } else {
    const numbered = title.match(/^(.*?)(?:\s*·\s*(?:Ronde\s*)?|\s+Ronde\s+)(\d+)$/i) ?? title.match(/^(Spelling)\s+(\d+)$/);
    if (numbered) { title = numbered[1].trim(); round = String(Number(numbered[2])); }
    title = title.replace(/\s*·\s*(?:Alfa [ABC]|[AB][12])$/i, '')
      .replace(/\s*·\s*(?:woorden|beelden|Controleer de spelling|Schrijf en bespreek|Gebruik het woord)$/i, '')
      .replace(/^Synoniemen · /, '');
    const words = title.match(/^Woorden\s+([ABC][12]?)?(\d+)$/);
    if (words) { round = [String(Number(words[2])), round].filter(Boolean).join('.'); title = 'Woorden oefenen'; }
  }
  return { title: shortCollectionTitles[title] ?? title, round, support };
}

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
