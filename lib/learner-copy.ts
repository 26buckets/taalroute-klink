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

const shortReadingTitles: Record<string, string> = {
  'School, winkel en werk': 'School, winkel en werk',
  'Naar de markt, Een briefje bij de deur, Pauze op het werk': 'Markt, briefje en pauze',
  'Een verjaardag, De sleutel op tafel, Bericht voor de klas': 'Verjaardag, sleutel en les',
  'Een jas passen, Wandelen in het park, Drie taken': 'Jas, park en taken',
  'Een foto voor de les, Met de tram naar het centrum, Brood bestellen': 'Foto, tram en brood',
  'Kleding bij het raam, De nieuwe collega, Een brief van de gemeente': 'Kleren, collega en brief',
  'Bij de apotheek, Schoenen voor het werk, Een kaart voor oma': 'Apotheek, werk en post',
  'In het zwembad, De hond van de buur, Bij de kapper': 'Zwembad, buur en kapper',
  'Een nieuwe buur, De lijst voor de winkel, Een natte vloer': 'Buren, winkel en vloer',
  'Het formulier voor werk, Een nieuwe bril, De trein naar de stad': 'Werk, bril en trein',
  'Het bericht van de baas, Op bezoek bij opa, Een nieuw wachtwoord': 'Baas, opa en wachtwoord',
  'De klok in de keuken, Harde muziek buiten, De plant bij het raam': 'Klok, muziek en planten',
  'Een andere stoel, Een boterham van een collega, De lift in de flat': 'Stoel, lunch en lift',
  'Lunch voor school, De openingstijd bij de bakker, Waar mag de fiets staan?': 'Schoollunch, bakker en fiets',
  'Samen een kast verplaatsen, Een lege batterij, Een bericht van het zwembad': 'Kast, batterij en zwembad',
  'Koppen voor de bezoekers, Een natte jas, Een kaartje voor de film': 'Bezoek, jas en film',
  'Een briefje bij het lokaal, De soep voor het eten, De tas voor het sporten': 'Klas, soep en sport',
  'Een boek voor de vakantie, Water voor de bloemen, De fles in de koelkast': 'Boek, bloemen en fles',
  'De fiets in de garage, Een andere lunch, Het kaartje in de jas': 'Fiets, lunch en kaartje',
  'De natte trap, Briefje op de koelkast, De handdoek na het zwemmen': 'Trap, briefje en handdoek',
  'Een doos voor de boeken, Een afspraak bij het loket, Kleding voor het feest': 'Boeken, loket en feest',
  'Brood uit de oven, Bericht bij het schoolplein, De bril op het werk': 'Brood, school en bril',
  'Een zware doos bij de trap, Kaartjes voor het concert, De krant voor de buur': 'Doos, concert en krant',
  'Het licht in de keuken, Een kaartje in de bus, Bloemen voor de docent': 'Licht, bus en bloemen',
  'De sleutel voor een collega, Het raam tijdens de les, Geld bij de kassa': 'Sleutel, klas en kassa',
  'De rode en de blauwe map, Twee stoelen in de tuin, De verkeerde jas': 'Mappen, stoelen en jassen',
  'De wekker op zes uur, Een brief aan de school, De weg naar het museum': 'Wekker, school en museum',
  'Training op zaterdag, Drie dozen in de winkel, Een kaart met een nieuw adres': 'Sport, winkel en adres',
  'De muts bij het station, Het raam op het werk, Bericht over de sportles': 'Muts, raam en sportles',
  'Een plant bij de deur, Een bord bij de speeltuin, Een bericht voor de buren': 'Plant, speeltuin en buren',
  'Een jas bij de kapper, Een uitnodiging voor thee, De schone borden': 'Kapper, thee en borden',
  'Een gevonden portemonnee, Morgen geen les, Terugbellen bij de halte': 'Portemonnee, les en bellen',
  'Een schoen bij de sportzaal, De schooldeur gaat later open, Een jas voor de regen': 'Sport, school en regenjas',
  'Uitnodiging voor het ontbijt': 'Samen ontbijten',
  'Afspraken, reizen en boeken': 'Afspraken, reizen en boeken',
  'Een melding aan de gemeente, Een taalcursus kiezen, Een dienst ruilen': 'Gemeente, cursus en dienst',
  'Samen koken op vrijdag, De lamp in de gang, Een andere ingang': 'Koken, lamp en ingang',
  'Het werkblad voor de les, Een gevonden tas, Bericht van de sportclub': 'Lesblad, tas en sportclub',
  'Een broek terugbrengen, Een fout op de huurrekening, Samen eten in de flat': 'Ruilen, huur en samen eten',
  'Een doos voor het kantoor, De link naar de online les, Water in de buurtuin': 'Kantoor, online les en tuin',
  'Een afspraak over de kraan, Een bezoek aan het museum, Een gesprek over werk': 'Kraan, museum en werk',
  'Een andere sluitingstijd, Veilig werken in het magazijn, Een tafel ophalen': 'Sluittijd, werk en tafel',
  'De eerste dag als vrijwilliger, Een afspraak over lezen, Het buurtfeest op zaterdag': 'Helpen, lezen en buurtfeest',
  'Een afspraak bij de huisarts, Andere bakken in de kantine, Een fiets uit een advertentie': 'Huisarts, afval en fiets',
  'Een andere tijd in het theater, Twee dagen vrij vragen, Een pakket versturen': 'Theater, verlof en pakket',
  'De markt op een andere plek, De printer op kantoor, Een proefles bij de sportclub': 'Markt, printer en sportles',
  'De stand van de watermeter, Samen het plein opruimen, De datum op het formulier': 'Water, plein en formulier',
  'De dozen in de koelkast, De reis naar de bijeenkomst, Muziek in de gang': 'Koelkast, reis en muziek',
  'Een andere tijd voor het schoolgesprek, Een ander lokaal voor de les, Een verkeerde doos bij de levering': 'School, les en levering',
  'De wandeling langs een andere weg, Een toets op woensdag, Twee groepen in het buurthuis': 'Wandelen, toets en buurthuis',
  'Een verloren reiskaart, Een vacature bij de bakker, Een keuze voor het plein': 'Reiskaart, werk en plein',
  'Een apparaat in de werkruimte, Aanmelden voor een uitstapje, De kleine zaal in het buurthuis': 'Werk, uitstapje en zaal',
  'De bestelling komt later, Een proefles in het zwembad, De map op het werk': 'Bestelling, zwemles en werk',
  'Een andere route langs de weg, De opening van de tentoonstelling, Een lek bij het raam': 'Omleiding, kunst en lekkage',
  'Een stukje voor de buurtkrant, Een plaats voor de computerles, Een bus vertrekt eerder': 'Buurtkrant, computer en bus',
  'De koelkast in de kantine, Vrijwilligers helpen in de bibliotheek, Twee pakketten terugsturen': 'Koelkast, boeken en post',
  'Een zaal reserveren voor een bijeenkomst, Bericht over de wijkvergadering, Een middag vrij voor een afspraak': 'Zaal, buurt en afspraken',
  'Een workshop in de bibliotheek, Een onvolledige bestelling voor de lunch, Een andere plaats voor de afspraak': 'Workshop, lunch en afspraak',
  'Een werkblad voor een veiligheidsgesprek, Een fietscontrole op zaterdag, Vragen voor de energieavond': 'Veiligheid, fiets en energie',
  'Het rooster van het schoonmaakbedrijf, Sportles na de regen, De sleutel van de buurtkamer': 'Schoonmaak, sport en sleutel',
  'Een gewijzigd rooster in de bakkerij, Een boek met een kapotte bladzijde, Een formulier voor de computerles': 'Bakkerij, boek en cursus',
  'Samen schilderen op zaterdag, Afval scheiden in het gebouw, Twee prijzen op de markt': 'Schilderen, afval en prijzen',
  'De eerste uitleg in de werkplaats, Het adres op de waterrekening, Uitnodiging voor het taalcafé': 'Werk, rekening en taalcafé',
  'De trap tijdens het schilderen, Een tas gevonden in de bus, Een stoel lenen van de vereniging': 'Schilderen, tas en stoel',
  'De glasbak krijgt een andere plek, Uitnodiging voor een kookmiddag, Een vraag over de servicekosten': 'Glas, koken en huurkosten',
  'Een andere prijs op de kassabon, De lift bij de huisarts, Een informatieavond over huren': 'Kassabon, lift en huur',
  'De pauze tijdens de avonddienst, Een tijdelijke fietsroute in het park, Een melding over straatverlichting': 'Pauze, fiets en straatlicht',
  'Twee tijden voor de leesgroep': 'De leesgroep',
};

// Display labels only; authored titles, links and completion IDs remain source-bound.
export function learnerCollectionLabel(source: string) {
  let title = source.trim(), round: string | undefined, support: string | undefined;
  const selection = title.match(/^(Basis|Uitbreiding met je docent) · (.+)$/);
  if (selection) { support = selection[1]; title = selection[2]; }
  const reading = title.match(/^Leesronde\s+(\d+)(?:\s*·\s*(.+))?$/i);
  const sentences = title.match(/^Zinnenronde\s+(\d+)(?:\s*·\s*(.+))?$/i);
  if (reading || sentences) {
    round = (reading ?? sentences)![1];
    title = reading ? shortReadingTitles[reading[2]] ?? reading[2] ?? 'Lees een tekst' : sentences![2] ?? 'Zinnen oefenen';
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
