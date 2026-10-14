export type KlinkPhase = 'Kijken' | 'Luisteren' | 'Inoefenen' | 'Nazeggen' | 'Koppelen';
export type OpportunityStatus = 'direct' | 'audio' | 'metadata';

export type ExerciseOpportunity = {
  id: string;
  title: string;
  group: string;
  phase: KlinkPhase;
  level: string;
  response: string;
  renderer: string;
  status: OpportunityStatus;
};

export const opportunityStatusLabels: Record<OpportunityStatus, string> = {
  direct: 'Direct met bestaande data',
  audio: 'Na luister- en rechtencontrole',
  metadata: 'Extra redactionele gegevens nodig',
};

export const exerciseOpportunities: ExerciseOpportunity[] = [
  { id: 'KL-01', title: 'Kijk en luister naar klank of woord', group: 'Klank en luisteren', phase: 'Luisteren', level: 'Alfa A–C', response: 'luisteren en doorgaan', renderer: 'modelkaart', status: 'audio' },
  { id: 'KL-02', title: 'Hoor en kies de klank', group: 'Klank en luisteren', phase: 'Luisteren', level: 'Alfa A–B', response: 'klank kiezen', renderer: 'keuze', status: 'audio' },
  { id: 'KL-03', title: 'Hoor welk woord', group: 'Klank en luisteren', phase: 'Luisteren', level: 'Alfa A–C', response: 'woord of beeld kiezen', renderer: 'keuze', status: 'audio' },
  { id: 'KL-04', title: 'Zelfde of anders', group: 'Klank en luisteren', phase: 'Luisteren', level: 'Alfa A–B', response: 'zelfde of anders', renderer: 'keuze', status: 'audio' },
  { id: 'KL-05', title: 'Sorteer op beginklank', group: 'Klank en luisteren', phase: 'Luisteren', level: 'Alfa A–C', response: 'woord in klankgroep plaatsen', renderer: 'sorteren', status: 'audio' },
  { id: 'KL-06', title: 'Waar hoor je de klank?', group: 'Klank en luisteren', phase: 'Luisteren', level: 'Alfa B–C', response: 'begin, midden of eind kiezen', renderer: 'keuze', status: 'audio' },
  { id: 'KL-07', title: 'Luisterreeks in volgorde', group: 'Klank en luisteren', phase: 'Luisteren', level: 'Alfa B–C', response: 'audio-items ordenen', renderer: 'volgorde', status: 'audio' },
  { id: 'KL-08', title: 'Luisterbingo', group: 'Klank en luisteren', phase: 'Luisteren', level: 'Alfa A–C', response: 'vak aantikken', renderer: 'spelraster', status: 'audio' },
  { id: 'KL-09', title: 'Tempoluisteren', group: 'Klank en luisteren', phase: 'Luisteren', level: 'Alfa B–A1', response: 'doel snel aantikken', renderer: 'temporeeks', status: 'audio' },

  { id: 'WO-01', title: 'Kies de letter bij de klank', group: 'Letter en woord', phase: 'Inoefenen', level: 'Alfa A–B', response: 'letter kiezen', renderer: 'keuze', status: 'audio' },
  { id: 'WO-02', title: 'Zoek dezelfde letter of hetzelfde woord', group: 'Letter en woord', phase: 'Kijken', level: 'Alfa A–B', response: 'doel markeren', renderer: 'zoeken', status: 'direct' },
  { id: 'WO-03', title: 'Bouw het woord met letters', group: 'Letter en woord', phase: 'Inoefenen', level: 'Alfa A–C', response: 'lettertegels ordenen', renderer: 'bouwen', status: 'direct' },
  { id: 'WO-04', title: 'Zet woorddelen op volgorde', group: 'Letter en woord', phase: 'Inoefenen', level: 'Alfa B–C', response: 'woorddelen ordenen', renderer: 'bouwen', status: 'direct' },
  { id: 'WO-05', title: 'Vul de ontbrekende letter in', group: 'Letter en woord', phase: 'Inoefenen', level: 'Alfa B–C', response: 'kiezen of typen', renderer: 'invoer', status: 'direct' },
  { id: 'WO-06', title: 'Typ wat je hoort', group: 'Letter en woord', phase: 'Inoefenen', level: 'Alfa B–A1', response: 'woord typen', renderer: 'invoer', status: 'audio' },
  { id: 'WO-07', title: 'Markeer de doelletter in woorden', group: 'Letter en woord', phase: 'Kijken', level: 'Alfa B–C', response: 'letter aantikken', renderer: 'markeren', status: 'direct' },
  { id: 'WO-08', title: 'Sorteer woordfamilies', group: 'Letter en woord', phase: 'Inoefenen', level: 'Alfa B–A1', response: 'woorden groeperen', renderer: 'sorteren', status: 'direct' },
  { id: 'WO-09', title: 'Woordzoeker met beeldhint', group: 'Letter en woord', phase: 'Kijken', level: 'Alfa C–A1', response: 'woord in raster zoeken', renderer: 'zoeken', status: 'direct' },
  { id: 'WO-10', title: 'Kruiswoord met beeld of audio', group: 'Letter en woord', phase: 'Inoefenen', level: 'Alfa C–A1', response: 'letters invullen', renderer: 'raster', status: 'metadata' },

  { id: 'BB-01', title: 'Hoor het woord, kies het beeld', group: 'Woord en betekenis', phase: 'Koppelen', level: 'Alfa A–C', response: 'beeld kiezen', renderer: 'keuze', status: 'audio' },
  { id: 'BB-02', title: 'Lees het woord, kies het beeld', group: 'Woord en betekenis', phase: 'Koppelen', level: 'Alfa B–A1', response: 'beeld kiezen', renderer: 'keuze', status: 'direct' },
  { id: 'BB-03', title: 'Koppel woord en beeld', group: 'Woord en betekenis', phase: 'Koppelen', level: 'Alfa B–A1', response: 'paren maken', renderer: 'koppelen', status: 'direct' },
  { id: 'BB-04', title: 'Memory met woord, beeld of audio', group: 'Woord en betekenis', phase: 'Koppelen', level: 'Alfa A–A1', response: 'twee kaarten openen', renderer: 'memory', status: 'direct' },
  { id: 'BB-05', title: 'Flashcard: kijk, luister en draai om', group: 'Woord en betekenis', phase: 'Kijken', level: 'Alfa A–A1', response: 'kaart omdraaien', renderer: 'kaart', status: 'direct' },
  { id: 'BB-06', title: 'Zet beelden in tijdsvolgorde', group: 'Woord en betekenis', phase: 'Koppelen', level: 'Alfa B–A1', response: 'beelden ordenen', renderer: 'volgorde', status: 'metadata' },
  { id: 'BB-07', title: 'Vind de plek of het voorwerp', group: 'Woord en betekenis', phase: 'Kijken', level: 'Alfa A–A1', response: 'hotspot of lijstkeuze', renderer: 'hotspot', status: 'metadata' },

  { id: 'ZI-01', title: 'Kies de zin bij de foto', group: 'Zin en tekst', phase: 'Koppelen', level: 'Alfa C–A1', response: 'zin kiezen', renderer: 'keuze', status: 'direct' },
  { id: 'ZI-02', title: 'Maak de zin', group: 'Zin en tekst', phase: 'Koppelen', level: 'Alfa C–A1', response: 'woorden ordenen', renderer: 'bouwen', status: 'direct' },
  { id: 'ZI-03', title: 'Vul het woord in de zin in', group: 'Zin en tekst', phase: 'Koppelen', level: 'Alfa C–A1', response: 'kiezen of typen', renderer: 'invoer', status: 'direct' },
  { id: 'ZI-04', title: 'Markeer wie, wat, waar of wanneer', group: 'Zin en tekst', phase: 'Koppelen', level: 'Alfa C–A1', response: 'tekstdeel markeren', renderer: 'markeren', status: 'direct' },
  { id: 'ZI-05', title: 'Schrijf de korte zin op', group: 'Zin en tekst', phase: 'Inoefenen', level: 'Alfa C–A1', response: 'typen of op papier', renderer: 'invoer', status: 'audio' },
  { id: 'ZI-06', title: 'Klopt de zin bij de foto?', group: 'Zin en tekst', phase: 'Koppelen', level: 'Alfa B–A1', response: 'ja of nee', renderer: 'keuze', status: 'direct' },
  { id: 'TE-01', title: 'Meeluistertekst met woordmarkering', group: 'Zin en tekst', phase: 'Koppelen', level: 'Alfa C–A1', response: 'meeluisteren en volgen', renderer: 'leesstrook', status: 'metadata' },
  { id: 'TE-02', title: 'Zoek informatie in tekst of rooster', group: 'Zin en tekst', phase: 'Koppelen', level: 'Alfa C–A1', response: 'antwoord kiezen', renderer: 'lezen', status: 'direct' },
  { id: 'TE-03', title: 'Zet korte tekstregels op volgorde', group: 'Zin en tekst', phase: 'Koppelen', level: 'A1', response: 'regels ordenen', renderer: 'volgorde', status: 'direct' },
  { id: 'TE-04', title: 'Kies de beste samenvatting', group: 'Zin en tekst', phase: 'Koppelen', level: 'A1', response: 'kernzin kiezen', renderer: 'keuze', status: 'metadata' },

  { id: 'PR-01', title: 'Lees een brief, appje, bon of formulier', group: 'Praktijk', phase: 'Koppelen', level: 'Alfa C–A1', response: 'bewijsplek en antwoord', renderer: 'document', status: 'metadata' },
  { id: 'PR-02', title: 'Vul een eenvoudig formulier in', group: 'Praktijk', phase: 'Koppelen', level: 'Alfa C–A1', response: 'velden invullen', renderer: 'formulier', status: 'direct' },
  { id: 'PR-03', title: 'Kies een passende reactie', group: 'Praktijk', phase: 'Koppelen', level: 'Alfa B–A1', response: 'reactie kiezen', renderer: 'keuze', status: 'direct' },
  { id: 'PR-04', title: 'Bouw een kort gesprek', group: 'Praktijk', phase: 'Koppelen', level: 'Alfa C–A1', response: 'beurten ordenen', renderer: 'volgorde', status: 'direct' },
  { id: 'PR-05', title: 'Wat doe je nu?', group: 'Praktijk', phase: 'Koppelen', level: 'Alfa C–A1', response: 'keuze met vervolgstap', renderer: 'vertakking', status: 'metadata' },
  { id: 'PR-06', title: 'Volg een handeling in stappen', group: 'Praktijk', phase: 'Koppelen', level: 'Alfa B–A1', response: 'stappen ordenen', renderer: 'volgorde', status: 'metadata' },

  { id: 'SP-01', title: 'Luister, neem op en luister terug', group: 'Spreken en schrijven', phase: 'Nazeggen', level: 'Alfa A–A1', response: 'eigen opname', renderer: 'opnemen', status: 'audio' },
  { id: 'SP-02', title: 'Vergelijk twee eigen opnames', group: 'Spreken en schrijven', phase: 'Nazeggen', level: 'Alfa B–A1', response: 'zelfbeoordeling', renderer: 'opnemen', status: 'direct' },
  { id: 'SP-03', title: 'Beschrijf een foto met steunwoorden', group: 'Spreken en schrijven', phase: 'Nazeggen', level: 'Alfa C–A1', response: 'inspreken', renderer: 'opnemen', status: 'direct' },
  { id: 'SP-04', title: 'Spreek één rol in een dialoog', group: 'Spreken en schrijven', phase: 'Nazeggen', level: 'Alfa C–A1', response: 'rol opnemen', renderer: 'rollenspel', status: 'audio' },
  { id: 'SC-01', title: 'Schrijf woord of korte zin op papier', group: 'Spreken en schrijven', phase: 'Inoefenen', level: 'Alfa A–C', response: 'zelf- of docentcheck', renderer: 'handschrift', status: 'direct' },
  { id: 'SC-02', title: 'Typ een kort bericht', group: 'Spreken en schrijven', phase: 'Inoefenen', level: 'Alfa C–A1', response: 'tekst invoeren', renderer: 'invoer', status: 'direct' },

  { id: 'MX-01', title: 'Gemengde oefenset', group: 'Route en herhalen', phase: 'Koppelen', level: 'Alfa A–A1', response: 'meerdere korte opdrachten', renderer: 'route', status: 'direct' },
  { id: 'MX-02', title: 'Adaptieve herhaalronde', group: 'Route en herhalen', phase: 'Koppelen', level: 'Alfa A–A1', response: 'automatisch samengestelde set', renderer: 'route', status: 'metadata' },
  { id: 'MX-03', title: 'Interactieve les of boek', group: 'Route en herhalen', phase: 'Koppelen', level: 'Alfa B–A1', response: 'vaste of vrije route', renderer: 'route', status: 'direct' },
  { id: 'MX-04', title: 'Diagnostische voorronde', group: 'Route en herhalen', phase: 'Koppelen', level: 'Alfa A–A1', response: 'korte steekproef', renderer: 'diagnostiek', status: 'metadata' },
];

export const opportunityGroups = [...new Set(exerciseOpportunities.map((item) => item.group))];
