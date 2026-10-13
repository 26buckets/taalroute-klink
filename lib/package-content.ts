export const levelOrder = [
  'ALFA_A',
  'ALFA_B',
  'ALFA_C',
  'A1',
  'A1_PLUS',
  'A2',
  'B1',
] as const;

export type PackageLevel = (typeof levelOrder)[number];

export const levelLabels: Record<PackageLevel, string> = {
  ALFA_A: 'Alfa A',
  ALFA_B: 'Alfa B',
  ALFA_C: 'Alfa C',
  A1: 'A1',
  A1_PLUS: 'A1+',
  A2: 'A2',
  B1: 'B1',
};

export type PackageEntry = {
  id: string;
  packageId: '1' | '2';
  level: PackageLevel;
  title: string;
  path: string;
  feedbackPath?: string;
  pilot?: boolean;
};

export type PackageDefinition = {
  id: '1' | '2';
  title: string;
  subtitle: string;
  summary: string;
  entries: PackageEntry[];
};

const packageOneEntries: PackageEntry[] = [
  ['TRX-P001-AA', 'ALFA_A', 'Ik lees', 'TRX-P001-AA.json'],
  ['TRX-P001-AB', 'ALFA_B', 'Nora leest', 'TRX-P001-AB.json'],
  ['TRX-P001-AC', 'ALFA_C', 'Een boek voor thuis', 'TRX-P001-AC.json'],
  ['TRX-P001-A1', 'A1', 'Het boek ligt thuis', 'TRX-P001-A1.json'],
  ['TRX-P001-A1P', 'A1_PLUS', 'Eerst even vragen', 'TRX-P001-A1P.json'],
  ['TRX-P001-A2', 'A2', 'Een droge plek voor de boeken', 'TRX-P001-A2.json'],
  ['TRX-P001-B1', 'B1', 'De ruilkast blijft open', 'TRX-P001-B1.json'],
].map(([id, level, title, file]) => ({
  id,
  packageId: '1',
  level: level as PackageLevel,
  title,
  path: `/content/pakketten/1/${file}`,
}));

const packageTwoEntries: PackageEntry[] = [
  ['TRX-P001-AA', 'ALFA_A', 'Ik lees', 'TRX-P001-AA.json'],
  [
    'CP002-ALFA_A-TEXT-02',
    'ALFA_A',
    'Een kom soep',
    'CP002-ALFA_A-TEXT-02.json',
  ],
  ['CP002-ALFA_A-TEXT-03', 'ALFA_A', 'De kip', 'CP002-ALFA_A-TEXT-03.json'],
  ['CP002-ALFA_A-TEXT-04', 'ALFA_A', 'Mijn naam', 'CP002-ALFA_A-TEXT-04.json'],
  ['TRX-P001-AB', 'ALFA_B', 'Nora leest', 'TRX-P001-AB.json'],
  ['CP002-ALFA_B-TEXT-02', 'ALFA_B', 'De jas', 'CP002-ALFA_B-TEXT-02.json'],
  ['CP002-ALFA_B-TEXT-03', 'ALFA_B', 'Het boek', 'CP002-ALFA_B-TEXT-03.json'],
  [
    'CP002-ALFA_B-TEXT-04',
    'ALFA_B',
    'Samen soep eten',
    'CP002-ALFA_B-TEXT-04.json',
  ],
  ['TRX-P001-AC', 'ALFA_C', 'Een boek voor thuis', 'TRX-P001-AC.json'],
  [
    'CP002-ALFA_C-TEXT-02',
    'ALFA_C',
    'De eerste les',
    'CP002-ALFA_C-TEXT-02.json',
  ],
  [
    'CP002-ALFA_C-TEXT-03',
    'ALFA_C',
    'Een bloem voor thuis',
    'CP002-ALFA_C-TEXT-03.json',
  ],
  [
    'CP002-ALFA_C-TEXT-04',
    'ALFA_C',
    'De vis achter de plant',
    'CP002-ALFA_C-TEXT-04.json',
  ],
  ['TRX-P001-A1', 'A1', 'Het boek ligt thuis', 'TRX-P001-A1.json'],
  ['CP002-A1-TEXT-02', 'A1', 'Een halve koek', 'CP002-A1-TEXT-02.json'],
  ['CP002-A1-TEXT-03', 'A1', 'Een andere maat', 'CP002-A1-TEXT-03.json'],
  ['CP002-A1-TEXT-04', 'A1', 'Geen koek meer', 'CP002-A1-TEXT-04.json'],
  ['TRX-P001-A1P', 'A1_PLUS', 'Eerst even vragen', 'TRX-P001-A1P.json'],
  [
    'CP002-A1_PLUS-TEXT-02',
    'A1_PLUS',
    'De bloes voor het gesprek',
    'CP002-A1_PLUS-TEXT-02.json',
  ],
  [
    'CP002-A1_PLUS-TEXT-03',
    'A1_PLUS',
    'Kijken als het donker is',
    'CP002-A1_PLUS-TEXT-03.json',
  ],
  [
    'CP002-A1_PLUS-TEXT-04',
    'A1_PLUS',
    'Een andere plek voor de vaas',
    'CP002-A1_PLUS-TEXT-04.json',
  ],
  ['TRX-P001-A2', 'A2', 'Een droge plek voor de boeken', 'TRX-P001-A2.json'],
  [
    'CP002-A2-TEXT-02',
    'A2',
    'Het boek is nog uitgeleend',
    'CP002-A2-TEXT-02.json',
  ],
  [
    'CP002-A2-TEXT-03',
    'A2',
    'Een vraag over de verpakking',
    'CP002-A2-TEXT-03.json',
  ],
  [
    'CP002-A2-TEXT-04',
    'A2',
    'De laarzen blijven in de winkel',
    'CP002-A2-TEXT-04.json',
  ],
].map(([id, level, title, file]) => ({
  id,
  packageId: '2',
  level: level as PackageLevel,
  title,
  path: `/content/pakketten/2/${file}`,
  feedbackPath: '/content/pakketten/2/feedback.json',
}));

packageTwoEntries.push({
  id: 'TRX-P001-B1-PILOT',
  packageId: '2',
  level: 'B1',
  title: 'De ruilkast blijft open',
  path: '/content/pakketten/2-b1-pilot/TRX-P001-B1.json',
  pilot: true,
});

export const contentPackages: PackageDefinition[] = [
  {
    id: '1',
    title: 'Pakket 1',
    subtitle: 'Eén tekst per niveau',
    summary: '7 teksten · Alfa A tot en met B1 · 56 activiteiten',
    entries: packageOneEntries,
  },
  {
    id: '2',
    title: 'Pakket 2',
    subtitle: 'Vier teksten per route',
    summary: '24 teksten tot A2 · 192 activiteiten · aparte B1-pilot',
    entries: packageTwoEntries,
  },
];
