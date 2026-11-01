import { taalroutePackages as packs } from './taalroute-packages.ts';
import { connectedContent } from './connected-content.ts';
import { extendedActivities, extendedExercises } from './extended-practice.ts';
const extendedModes = new Map(packs.map(pack => [pack.id, extendedActivities.filter(activity => extendedExercises(pack, activity.id).length).map(activity => activity.id as string)]));

// This is implementation coverage, not a new curriculum or an assessment of learners.
export const contentCoverage = [
  {
    id: 'words',
    title: 'Woorden en technisch lezen',
    status: 'Gedeeltelijk',
    modes: ['model', 'word-build', 'heard-word', 'word-image'],
    designed:
      'Eigen woordroute, klank-tekenkoppeling, herkennen en zelfstandig opbouwen.',
    next: 'Groepsreeksen, slepen/tikken en een meerwoordenwerkblad zijn aangesloten. Klanksynthese en afzonderlijke klankmodellen blijven open; zichtbaar nabouwen is geen zelfstandig lezen.',
  },
  {
    id: 'sounds',
    title: 'Klanken',
    status: 'Gedeeltelijk',
    modes: ['missing-grapheme', 'sound-compare'],
    designed: 'Klanken vergelijken, positie horen, segmenteren en samenvoegen.',
    next: 'Woordparen met één klankverschil zijn gekoppeld. Losse klankmodellen, positie en synthese blijven open; hele woordaudio vervangt die niet.',
  },
  {
    id: 'technical-writing',
    title: 'Letters en woorden schrijven',
    status: 'Gedeeltelijk',
    modes: ['copy-word', 'word-dictation', 'write-word'],
    designed: 'Lettervorming, overschrijven en zonder model schrijven.',
    next: 'Woord- en zinsdictee zijn aangesloten. Papieropdrachten hebben nog geen inhoudelijke schrijfbeoordeling; lettertrajecten ontbreken.',
  },
  {
    id: 'listening',
    title: 'Luisteren en begrijpen',
    status: 'Gedeeltelijk',
    modes: ['heard-image', 'sentence-question', 'listen-situation', 'text-question', 'dialogue-question'],
    designed:
      'Woorden, routines en hoofdinformatie in alledaagse situaties begrijpen.',
    next: 'Bestaande tekst- en gespreksvragen zijn aangesloten. Vraag- en antwoordaudio staat in de matrix; voorlopig is lees- of docentsteun nodig.',
  },
  {
    id: 'reading',
    title: 'Zinnen, teksten en functioneel lezen',
    status: 'Gedeeltelijk',
    modes: ['connected-sentence', 'connected-text', 'text-question', 'text-evidence'],
    designed:
      'Van korte zinnen naar informatie vinden in berichten, afspraken, formulieren en teksten.',
    next: 'Bronvragen en bewijszinnen zijn aangesloten. Zelfstandig lezen blijft onderscheiden van luisteren; A1/A2-bronteksten zijn niet automatisch zelfstandig leesbaar.',
  },
  {
    id: 'functional-writing',
    title: 'Berichten en formulieren schrijven',
    status: 'Gedeeltelijk',
    modes: ['functional-message', 'functional-form'],
    designed:
      'Naamvelden, lijstjes, korte berichten, afmeldingen en formulieren.',
    next: '120 bestaande berichten met criteria en voorbeeld zijn gekoppeld, ook als eenvoudige berichtkaart. Uitgebreide formulieren en inhoudelijke vrijgave blijven open.',
  },
  {
    id: 'interaction',
    title: 'Gesprekken voeren',
    status: 'Gedeeltelijk',
    modes: ['connected-dialogue', 'dialogue-role'],
    designed: 'Reageren, hulp vragen en alledaagse gesprekken voeren.',
    next: 'Zelf antwoorden na een bestaande gespreksbeurt is aangesloten. Vrije antwoorden worden niet automatisch als inhoudelijk correct beoordeeld.',
  },
  {
    id: 'speaking',
    title: 'Zelf vertellen en uitspreken',
    status: 'Gedeeltelijk',
    modes: ['repeat-word'],
    designed:
      'Van woorden en vaste zinnen naar een korte beschrijving of toelichting.',
    next: 'Woorden en bestaande zinnen nazeggen zijn aangesloten. Beeldbeschrijving en eigen zinnen ontbreken; opnemen of afronden is geen uitspraakgoedkeuring.',
  },
  {
    id: 'themes',
    title: 'Dagelijks leven en werk',
    status: 'Gedeeltelijk',
    modes: ['listen-situation', 'connected-dialogue'],
    designed:
      'Betekenisvolle situaties verbinden met boekdoelen en docentlesplan.',
    next: 'De bestaande situaties zijn nog geen complete themaroute met een functionele handeling. Behoud de huidige woordenindeling.',
  },
  {
    id: 'language-patterns',
    title: 'Zinsbouw en taalregels',
    status: 'Gedeeltelijk',
    modes: ['sentence-build', 'verb-choice'],
    designed:
      'Zinnen in de goede volgorde zetten, aanvullen en natuurlijke formuleringen vergelijken.',
    next: 'Gehoorde zinsvolgorde en ik-vormkeuze zijn aangesloten. Andere taalpatronen en een volledige grammaticaleerlijn blijven open.',
  },
  {
    id: 'variation',
    title: 'Spellen en samen herhalen',
    status: 'Gedeeltelijk',
    modes: ['memory', 'word-card', 'word-image-match'],
    designed:
      'Memory, bingo, zoeken, domino, sorteren, luisterspel, volgorde en lotto.',
    next: 'Groepsmemory, woord-/fotobingo en koppelen zijn aangesloten. Andere spelvormen en inhoudelijke combinatiebeoordeling blijven open; nog geen volledige spelbibliotheek.',
  },
  {
    id: 'strategies',
    title: 'Hulp, leerstrategieën en zelfvertrouwen',
    status: 'Gedeeltelijk',
    modes: ['recall-word'],
    designed:
      'Hulp vragen, vergelijken, gericht herhalen en taal durven gebruiken.',
    next: 'Hulpgebruik en herhaling zijn aanwezig maar geen volledige beheersingsmeting. Houd docentobservatie en echte praktijktoetsing apart.',
  },
].map((domain) => ({
  ...domain,
  connectedModes: domain.modes.filter((mode) =>
    packs.some((pack) =>
      pack.exercises.some((exercise) => exercise.mode === mode) || extendedModes.get(pack.id)?.includes(mode),
    ),
  ),
  sectionIds: packs
    .filter((pack) =>
      pack.exercises.some((exercise) => domain.modes.includes(exercise.mode)) || extendedModes.get(pack.id)?.some(mode => domain.modes.includes(mode)),
    )
    .map((pack) => pack.id),
}));

export const connectedContentCounts = {
  sentences: connectedContent.filter((item) => item.kind === 'sentence').length,
  texts: connectedContent.filter((item) => item.kind === 'text').length,
  dialogues: connectedContent.filter((item) => item.kind === 'dialogue').length,
};
