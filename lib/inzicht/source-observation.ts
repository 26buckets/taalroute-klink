// Derived from the user-supplied observatie.html, 31 October 2026.
// Source of truth: the original unchanged HTML in the Klink Inzicht Drive folder.
export const SOURCE_VERSION = 2;
export const SOURCE_KEY = 'KLINK_OBSERVATIE_HTML_20261031';
export const sourceWordCriteria = [
  'Betekenis tonen',
  'Nazeggen',
  'Klanken aanwijzen',
  'Letters leggen',
  'Lezen',
  'Mondeling gebruiken',
] as const;
export const sourceMaterials = [
  {
    id: 'mat',
    word: 'mat',
    title: 'De mat',
    sentence: {
      content: 'De mat ligt bij de deur.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Op papier',
        'Nog een keer',
      ],
    },
    text: {
      content:
        'De mat ligt bij de deur.\nIk kom binnen.\nIk veeg mijn voeten op de mat.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Zelf maken',
        'Nog een keer',
      ],
    },
  },
  {
    id: 'tas',
    word: 'tas',
    title: 'De tas',
    sentence: {
      content: 'De tas staat bij de deur.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Op papier',
        'Nog een keer',
      ],
    },
    text: {
      content:
        'De tas staat bij de deur.\nIk doe mijn lunch in de tas.\nIk neem de tas mee naar mijn werk.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Zelf maken',
        'Nog een keer',
      ],
    },
  },
  {
    id: 'map',
    word: 'map',
    title: 'De map',
    sentence: {
      content: 'De map ligt op de tafel.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Op papier',
        'Nog een keer',
      ],
    },
    text: {
      content:
        'De map ligt op de tafel.\nIk zoek een brief.\nIk doe de brief in de map.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Zelf maken',
        'Nog een keer',
      ],
    },
  },
  {
    id: 'man',
    word: 'man',
    title: 'De man',
    sentence: {
      content: 'De man staat bij de deur.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Op papier',
        'Nog een keer',
      ],
    },
    text: {
      content:
        'De man staat bij de deur.\nHij pakt zijn tas en zijn jas.\nDan gaat hij naar het werk.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Zelf maken',
        'Nog een keer',
      ],
    },
  },
  {
    id: 'pan',
    word: 'pan',
    title: 'De pan',
    sentence: {
      content: 'De pan staat op het fornuis.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Op papier',
        'Nog een keer',
      ],
    },
    text: {
      content:
        'De pan staat op het fornuis.\nIk doe wat water in de pan.\nHet water wordt warm.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Zelf maken',
        'Nog een keer',
      ],
    },
  },
  {
    id: 'jas',
    word: 'jas',
    title: 'De jas',
    sentence: {
      content: 'De jas hangt aan de kapstok.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Op papier',
        'Nog een keer',
      ],
    },
    text: {
      content:
        'De jas hangt aan de kapstok.\nIk trek de jas aan.\nBuiten is het koud.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Zelf maken',
        'Nog een keer',
      ],
    },
  },
  {
    id: 'pen',
    word: 'pen',
    title: 'De pen',
    sentence: {
      content: 'De pen ligt op de tafel.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Op papier',
        'Nog een keer',
      ],
    },
    text: {
      content:
        'De pen ligt op de tafel.\nIk pak de pen.\nIk schrijf mijn naam op papier.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Zelf maken',
        'Nog een keer',
      ],
    },
  },
  {
    id: 'pet',
    word: 'pet',
    title: 'De pet',
    sentence: {
      content: 'De pet ligt op de stoel.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Op papier',
        'Nog een keer',
      ],
    },
    text: {
      content:
        'De pet ligt op de stoel.\nIk zet de pet op mijn hoofd.\nDan ga ik naar buiten.',
      criteria: [
        'Kijken',
        'Bouwen',
        'Lezen',
        'Gebruiken',
        'Zelf maken',
        'Nog een keer',
      ],
    },
  },
] as const;
export type SourceMode = 'word' | 'sentence' | 'text';
export type SourceMark = 0 | 1 | 2 | null;
export const sourceModes: Record<SourceMode, string> = {
  word: 'Woord',
  sentence: 'Zin',
  text: 'Tekst',
};
// IMPORTANT: 2 does NOT mean failure; null does NOT mean 'not observed'.
export const sourceMarks = [
  { value: 0, symbol: '✓', label: 'Zonder directe hulp' },
  { value: 1, symbol: '△', label: 'Met hulp of model' },
  { value: 2, symbol: '—', label: 'Niet waargenomen' },
] as const;
export function sourceMaterial(id: string) {
  return sourceMaterials.find((m) => m.id === id);
}
export function sourceCriteria(
  mode: SourceMode,
  materialId: string,
): readonly string[] {
  const material = sourceMaterial(materialId);
  if (!material) return [];
  return mode === 'word' ? sourceWordCriteria : material[mode].criteria;
}
