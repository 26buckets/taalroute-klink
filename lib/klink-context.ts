// Existing Taalroute recordings, placed by meaning rather than the former package order.
// These are supported listening models, never evidence of independent sentence reading.
const sentence = (id: string, word: string, text: string, recording: string) => ({
  id, wordIds: [`klink-woord-${word}`], title: text, text, kind: 'sentence' as const,
  audio: `/package-audio/cp001/${recording}.mp3`, image: '', imageAlt: '',
});
const situation = (id: string, words: string[], title: string, text: string, recording: string, image: string, imageAlt: string) => ({
  id, wordIds: words.map(word => `klink-woord-${word}`), title, text, kind: 'situation' as const,
  audio: `/package-audio/cp001/${recording}.mp3`, image: `/package-media/cp001/${image}.webp`, imageAlt,
});

export const klinkContexts = [
  sentence('zin-man', 'man', 'Dit is een man.', 'aa-l01-aud-sent-002'),
  sentence('zin-pan', 'pan', 'Dit is een pan.', 'aa-l01-aud-sent-005'),
  sentence('zin-boom', 'boom', 'Ik zie een boom.', 'aa-l01-aud-sent-003'),
  sentence('zin-boot', 'boot', 'Ik zie een boot.', 'aa-l01-aud-sent-004'),
  sentence('zin-roos', 'roos', 'Ik zie een roos.', 'aa-l01-aud-sent-006'),
  sentence('zin-riem', 'riem', 'Dit is een riem.', 'aa-l01-aud-sent-007'),
  sentence('zin-biet', 'biet', 'De biet is vies.', 'aa-l01-aud-sent-008'),
  sentence('zin-kool', 'kool', 'Ik heb kool en biet.', 'aa-l01-aud-sent-009'),
  situation('situatie-pan', ['pan'], 'De pan', 'De pan is vies. Ik pak de pan. Ik maak de pan schoon.', 'aa-l01-aud-text-001', 'aa-cp001-scene-pan-dirty', 'Een vieze pan in de gootsteen, aan het begin van het verhaal.'),
  situation('situatie-map', ['map'], 'Naar de les', 'Ik pak een map. De map is voor de les. Ik neem de map mee.', 'aa-l01-aud-text-002', 'aa-cp001-scene-table-on', 'Een map, boek, pen en beker op een tafel in een leslokaal.'),
  situation('situatie-keuken', ['kool', 'biet'], 'In de keuken', 'Ik koop kool en een biet. Ik pak een pan. De kool en de biet gaan in de pan.', 'aa-l01-aud-text-004', 'aa-cp001-scene-kitchen', 'Een pan, kool en biet op het aanrecht, vóór het koken.'),
  situation('situatie-park', ['boom', 'bank'], 'Bij de bank', 'Mo en Sara lopen in het park. Onder een boom staat een bank. Er zit een kat op de bank. Naast de bank groeit een roos. Mo en Sara lopen naar een andere bank. Daar gaan ze zitten.', 'aa-aud-text-x-006', 'aa-cp001-scene-park', 'Een kat op een bank onder een boom. Twee volwassenen lopen samen over het pad.'),
].map(item => ({
  ...item,
  access: 'supported-listening' as const,
  preparation: 'Bespreek de betekenis van de hele zin mondeling. Het doelwoord is eerder in deze les getoond. De overige woorden hoeven nog niet zelfstandig leesbaar te zijn.',
  independentReading: false,
  humanReview: 'approved' as const,
}));
