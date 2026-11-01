// Paraphrases for orientation; no numeric cutoffs or automatic learner classification.
export const descriptorSources = {
  alfa: {
    title: 'ITTA — Streefdoelen alfabetisering ISK (2018)',
    url: 'https://www.lowan.nl/wp-content/uploads/2020/02/Streefdoelen-alfabetisering-ISK-ITTA-2018.pdf',
    scope:
      'Gepubliceerde ITTA-uitwerking voor ISK. Deze doelgroep verschilt van volwassen cursisten. Gebruik als bronoriëntatie; geen gevalideerde volwassenennorm.',
    pages: '28–44',
  },
  erk: {
    title:
      'Raad van Europa / Taalunie — ERK aangevulde uitgave (Nederlandse vertaling 2022)',
    url: 'https://www.taalunie.org/files/Kennisbank-items/Publicaties/Gemeenschappelijk-Europees-Referentiekader-voor-Talen_-Leren-Onderwijzen-Beoordelen-2022.pdf',
    scope:
      'Illustratieve ERK-descriptoren voor communicatieve taalactiviteiten. Geen bevolkingsgemiddelde of tijdnorm.',
    pages: '53–54, 59, 67, 72',
  },
};
export const descriptors: Record<
  string,
  { source: 'alfa' | 'erk'; items: [string, string][] }
> = {
  'Alfa A': {
    source: 'alfa',
    items: [
      [
        'Technisch lezen',
        'Bekende korte klankzuivere woorden ontcijferen, zo nodig met hulp of voorbeeld.',
      ],
      [
        'Functioneel lezen',
        'Eigen gegevens en eenvoudige tijd- of prijsinformatie herkennen.',
      ],
      [
        'Technisch schrijven',
        'Geoefende letters en korte woorden vormen; voorbeelden kunnen nodig zijn.',
      ],
      [
        'Functioneel schrijven',
        'Naam, adres en data noteren, eventueel met een voorbeeld.',
      ],
    ],
  },
  'Alfa B': {
    source: 'alfa',
    items: [
      [
        'Technisch lezen',
        'Korte woorden en vertrouwde langere woorden zelfstandig lezen; clusters kunnen nog spellend worden gelezen.',
      ],
      [
        'Functioneel lezen',
        'In korte vertrouwde teksten bruikbare informatie vinden.',
      ],
      [
        'Technisch schrijven',
        'Vertrouwde woorden en korte zinnen schrijven, soms nog spellend.',
      ],
      [
        'Functioneel schrijven',
        'Een eenvoudige boodschap, lijstje of afspraak noteren.',
      ],
    ],
  },
  'Alfa C': {
    source: 'alfa',
    items: [
      [
        'Technisch lezen',
        'Bekende woorden direct herkennen; vooral lange onbekende woorden vragen nog analyse.',
      ],
      [
        'Functioneel lezen',
        'Eenvoudige dagelijkse teksten begrijpen en informatie gebruiken.',
      ],
      [
        'Technisch schrijven',
        'Veel woorden als geheel schrijven en eenvoudige leestekens toepassen.',
      ],
      [
        'Functioneel schrijven',
        'Eenvoudige formulieren invullen en korte persoonlijke berichten schrijven.',
      ],
    ],
  },
  A1: {
    source: 'erk',
    items: [
      [
        'Luisteren',
        'Vertrouwde concrete informatie begrijpen bij zeer langzaam en zorgvuldig aangeboden taal.',
      ],
      [
        'Lezen',
        'Zeer korte teksten begrijpen via herkenbare woorden en herlezen.',
      ],
      [
        'Spreken',
        'Losse eenvoudige uitingen over mensen en plaatsen produceren.',
      ],
      [
        'Schrijven',
        'Eenvoudige losse zinnen over persoonlijke zaken formuleren.',
      ],
    ],
  },
  A2: {
    source: 'erk',
    items: [
      [
        'Luisteren',
        'Veelgebruikte taal rond dagelijkse behoeften begrijpen bij rustig en duidelijk spreken.',
      ],
      [
        'Lezen',
        'Korte eenvoudige teksten met veel voorkomende woorden begrijpen.',
      ],
      [
        'Spreken',
        'Dagelijkse situaties in een korte reeks eenvoudige uitingen beschrijven.',
      ],
      [
        'Schrijven',
        'Eenvoudige zinnen verbinden, bijvoorbeeld met en, maar of omdat.',
      ],
    ],
  },
  B1: {
    source: 'erk',
    items: [
      [
        'Luisteren',
        'Hoofdzaken en concrete informatie volgen over vertrouwde dagelijkse onderwerpen, bij heldere taal.',
      ],
      [
        'Lezen',
        'Duidelijke feitelijke teksten binnen het eigen interessegebied begrijpen.',
      ],
      [
        'Spreken',
        'Vertrouwde onderwerpen redelijk vloeiend in een samenhangende reeks beschrijven.',
      ],
      [
        'Schrijven',
        'Een begrijpelijke samenhangende tekst over vertrouwde onderwerpen maken.',
      ],
    ],
  },
};
