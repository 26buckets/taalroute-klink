import type { PackageDefinition, PackageLesson } from './package-content';
import { hasFirstLetterGuide } from './lesson-plan.ts';

// A suggested practice block, not a scheduled lesson or a learner assessment.
export function teacherPracticePlan(pack: PackageDefinition, lesson: PackageLesson) {
  const wordIds = [...new Set([...(lesson.known ?? []), ...(lesson.newWords ?? []), ...(lesson.returning ?? []), ...pack.words.filter(word => lesson.words.includes(word.word)).map(word => word.id)])].filter(id => pack.words.some(word => word.id === id));
  const focusIds = (lesson.newWords?.length ? lesson.newWords : lesson.returning?.length ? lesson.returning : wordIds).filter(id => wordIds.includes(id));
  const focus = focusIds.map(id => pack.words.find(word => word.id === id)!.word).join(' · ');
  const firstLetterGuide = pack.exercises.some(exercise => exercise.lessonId === lesson.id && hasFirstLetterGuide(exercise, true));
  return {
    wordIds,
    focusIds,
    focus,
    lessonNumber: pack.lessons.findIndex(item => item.id === lesson.id) + 1,
    guidedExerciseIds: lesson.guidedExerciseIds ?? [],
    blocks: [
      { title: 'Betekenis en start', minutes: 2, action: `Bekijk ${focus || 'de woorden van deze stap'}. Vraag wat de cursist al kent; laat aanwijzen of uitleggen. Bereid de leesvoorwaarden van deze stap voor.`, observe: 'De cursist toont de betekenis. Mondeling kennen is nog niet zelfstandig lezen.', framework: '15.3, 15.7' },
      { title: 'Eén opdracht voordoen', minutes: 3, action: firstLetterGuide ? 'Open Maak. Bekijk samen hoe de eerste letter in het eerste vak komt. Kies Nu jij. Laat de cursist de aangewezen letter aantikken. De aanwijzing schuift mee naar iedere volgende letter en het bijbehorende vak. Gebruik Kijk nog eens om de huidige letter voor te doen; gekozen letters blijven staan. Lettercombinaties zoals aa, oo en ee tik je samen aan; ze blijven in één vak. Bij een nieuwe keuze- of koppeloefening bekijk je eerst het korte voorbeeld en kies je Nu jij. Bij koppelen: eerst het woord, daarna de foto. Een voorgedaan antwoord is geen zelfstandige leesprestatie. Geef zelf het klankvoorbeeld; de app laat alleen het hele woord horen.' : 'Doe één handeling voor met het bestaande beeld of woord. Zeg kort wat je doet. Laat de cursist de handeling aanwijzen of nadoen; vraag niet alleen of het duidelijk is.', observe: 'De cursist weet waar te tikken en wat de opdracht vraagt.', framework: '5.1–5.5, 5.8' },
      { title: 'Zelf proberen', minutes: 5, action: (firstLetterGuide ? 'De cursist kiest na iedere opdracht zelf Verder en aan het einde Les afronden. ' : '') + 'Open de kleine leesstap. Laat eerst zelf proberen. Bij een fout: geef één gerichte aanwijzing, laat opnieuw proberen en bouw de hulp af. Is de bediening lastig? Wijs samen; verlaag niet automatisch het taaldoel.', observe: 'Noteer of de cursist zelf leest, een voorbeeld nadoet of hulp nodig heeft.', framework: '4.8–4.9, 10.5–10.8' },
      { title: 'Gebruiken met een ander', minutes: 3, action: 'Laat een cursist een voorbereid woord of voorwerp aanwijzen en de ander de betekenis zeggen of tonen. Wissel de rollen. Een zin mag mondeling; zelfstandig lezen van een zin vraagt aparte voorbereiding.', observe: 'Beiden reageren op betekenis. Nadoen of nazeggen is geen bewijs van zelfstandig lezen.', framework: '6.3, 6.9, 7.2, 7.5, 15.8' },
      { title: 'Terughalen en kiezen wat volgt', minutes: 2, action: 'Laat een eerder geoefend woord zonder zichtbaar voorbeeld lezen of maken. Noteer zelf / met hulp / opnieuw voorbereiden. Haal het in een volgende bijeenkomst terug; kies daarna verder oefenen of de volgende kleine stap.', observe: 'Een goede klik is niet genoeg: controleer ook betekenis en lezen zonder voorbeeld.', framework: '15.6, 23.1, 23.3–23.5, 23.7' },
    ],
  };
}
