import { groupActivities, groupExercises, type GroupActivity } from './group-practice.ts';
import { taalroutePackages } from './taalroute-packages.ts';

// Editorial navigation. A domain is never complete merely because a player exists.
export const learningAreas: { id: string; title: string; purpose: string; activities: GroupActivity[]; remaining: string }[] = [
  { id: 'start', title: 'Leesstart', purpose: 'Van beeld en klank naar woorden lezen en maken.', activities: ['meet', 'listen', 'read', 'build-model', 'build', 'missing'], remaining: 'Afzonderlijke goedgekeurde klankmodellen, klankonderscheiding en synthese verder aansluiten. De afgekeurde t blijft buiten gebruik.' },
  { id: 'reading-growth', title: 'Verder met lezen', purpose: 'Bekende woorden volgen in zinnen en korte verhalen.', activities: ['sentences', 'find-sentence', 'texts'], remaining: 'Zelfstandige leesvoorwaarden en inhoudsvragen per tekst. Luisteren en meelezen is geen zelfstandig lezen.' },
  { id: 'writing', title: 'Op papier en toetsenbord', purpose: 'Letters vormen, woorden en zinnen schrijven.', activities: ['write-letter', 'copy', 'dictation', 'write', 'paper-dictation', 'sentence-dictation'], remaining: 'De lettervorm wordt getoond, nog geen schrijftraject. Docentbeoordeling van handschrift blijft nodig; een bevestiging is geen schrijfbeoordeling.' },
  { id: 'reading', title: 'Lezen voor informatie', purpose: 'Informatie vinden en begrijpen in teksten en functionele bronnen.', activities: ['texts', 'text-question', 'text-evidence'], remaining: '180 bestaande tekstvragen en 156 bewijsopdrachten aangesloten. Vraag- en antwoordaudio en inhoudelijke combinatiebeoordeling blijven open; A2/B1 is geen volledig gerealiseerde niveaulijn.' },
  { id: 'sounds', title: 'Klank voor klank', purpose: 'Horen, vergelijken, segmenteren en samenvoegen.', activities: ['sound-compare'], remaining: 'Identieke woorden en eenklankcontrasten via bestaande woordaudio. Losse klankmodellen, klankpositie en synthese blijven open; de afgekeurde t blijft geparkeerd.' },
  { id: 'listening', title: 'Luister en begrijp', purpose: 'De bedoeling en belangrijke informatie horen.', activities: ['understand', 'text-question', 'dialogue-question'], remaining: '300 bronvragen aangesloten; tekst/gesprek is beluisterbaar. Vragen en antwoorden vragen nog lees- of docentsteun zolang hun audio ontbreekt.' },
  { id: 'speaking', title: 'Zeg het zelf', purpose: 'Uitspreken, vertellen en reageren.', activities: ['speak', 'sentence-speak', 'dialogues'], remaining: 'Eigen beeldbeschrijvingen, beurtwisseling en beoordelingspunten. Opnemen telt als oefenen, niet als bewezen uitspraakbeheersing.' },
  { id: 'daily-life', title: 'Taal in je dag', purpose: 'Thuis, onderweg, bij afspraken en op het werk.', activities: ['dialogues'], remaining: 'Situaties verbinden tot themaroutes en functionele handelingen, vanuit de bestaande broninhoud.' },
  { id: 'vocabulary', title: 'Woorden verbinden', purpose: 'Betekenis, woordfamilies en bruikbaar woordgebruik.', activities: ['meet', 'match', 'hear-word', 'read'], remaining: 'Betekenisrelaties, woordfamilies en transferopdrachten; fotoherkenning is niet de hele woordenschatlijn.' },
  { id: 'spelling', title: 'Zo schrijf je het', purpose: 'Spellingpatronen herkennen en toepassen.', activities: ['missing', 'dictation'], remaining: 'Expliciete spellingregels, toepassingsvoorbeelden en zelfstandige transfer.' },
  { id: 'grammar', title: 'Zo maak je een zin', purpose: 'Woordvolgorde, woordvormen en taalpatronen.', activities: ['sentence-build', 'verb-choice'], remaining: 'Gehoorde zinnen ordenen en 28 bronzinnen met ik-vormkeuze. Dit is nog geen volledige grammaticaleerlijn; vrijgave en verdere patronen blijven open.' },
  { id: 'functional-writing', title: 'Een bericht of formulier', purpose: 'Je gegevens invullen en een kort bericht schrijven.', activities: ['functional-message', 'functional-form'], remaining: '120 bestaande schrijfdoelen met criteria, voorbeeld en eenvoudige berichtkaart. Vrij schrijven vraagt zelf-/docentcontrole; de berichtkaart vervangt geen breed formulierenaanbod.' },
  { id: 'repeat', title: 'Nog een keer, anders', purpose: 'Dezelfde woorden gevarieerd terughalen.', activities: ['worksheet', 'worksheet-heard', 'word-bingo', 'image-bingo', 'memory', 'read-series'], remaining: 'Voorbereid herhalen over onderdelen heen behouden; gevarieerd oefenen is nog geen beheersingstoets.' },
  { id: 'support', title: 'Rustig beginnen', purpose: 'Voorbereiden, hulp gebruiken en opnieuw proberen.', activities: ['meet', 'build-model', 'copy'], remaining: 'Instapdiagnostiek, docentkeuzes en gerichte remediëring. Niet automatisch op leeftijd of profiel indelen.' },
];

export function learningAreaCoverage() {
  const counts = new Map(groupActivities.map(activity => [activity.id, taalroutePackages.map(pack => groupExercises(pack, activity.id).length)]));
  return learningAreas.map(area => ({ ...area, status: area.activities.length ? 'Gedeeltelijk' : 'Ontbreekt',
    sections: taalroutePackages.filter((_, index) => area.activities.some(activity => (counts.get(activity)?.[index] ?? 0) > 0)).length,
    connectedActivities: area.activities.filter(activity => counts.get(activity)?.some(Boolean)).map(id => groupActivities.find(activity => activity.id === id)!.label),
  }));
}
