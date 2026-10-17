import audioPlan from '../data/klink-comprehension-audio.json' with { type: 'json' };
import bindings from '../data/klink-media.json' with { type: 'json' };
import type { PackageExercise } from './package-content';

const media = bindings as Record<string, { image?: string; audio?: string }>;
const audio = (id: string) => ({ audioId: id, src: audioPlan.items.find(item => item.id === id)!.src });
const photo = (contextId: string, target: string, distractor: string, correctFirst: boolean) => ({
  id: `begrip-${target}`, contextId, question: 'Wat hoort bij de zin?', questionAudio: audio('vraag-zin'),
  focus: 'referent', objective: 'De genoemde persoon of het genoemde voorwerp in een korte luisterzin herkennen. Dit bewijst nog geen begrip van complexere zinsbouw.',
  evidence: target, requiredWordIds: [target, distractor].map(word => `klink-woord-${word}`), oralPreparation: [],
  options: (correctFirst ? [target, distractor] : [distractor, target]).map(word => ({
    id: `klink-woord-${word}`, label: word, image: { src: media[`klink-woord-${word}`]?.image, altText: word },
  })),
  correctOptionId: `klink-woord-${target}`, feedback: 'Luister nog eens naar de zin. Welke foto hoort erbij?', feedbackAudio: audio('hulp-foto'),
  distractorReason: `Kies de betekenis van ${target}, niet die van ${distractor}. Beide woordbetekenissen en beide beelden moeten in deze leesstap voorbereid zijn.`,
});

export const sentenceQuestions = [
  photo('zin-man', 'man', 'pan', true),
  photo('zin-pan', 'pan', 'map', false),
  photo('zin-boom', 'boom', 'boot', false),
  photo('zin-boot', 'boot', 'boom', true),
  photo('zin-roos', 'roos', 'boom', false),
  photo('zin-riem', 'riem', 'been', true),
  {
    id: 'begrip-biet', contextId: 'zin-biet', question: 'Hoe is de biet?', questionAudio: audio('vraag-biet'),
    focus: 'property', objective: 'Begrijpen welke toestand over de biet wordt genoemd; niet alleen het woord biet herkennen.',
    evidence: 'De biet is vies.', requiredWordIds: ['klink-woord-biet'],
    oralPreparation: ['Bespreek en demonstreer vies tegenover schoon. Deze betekenissen worden niet bekend verondersteld en zijn hier geen nieuwe zelfstandige leesdoelen.'],
    options: [
      { id: 'schoon', label: 'Schoon', audio: { audioId: 'klink-woord-schoon', src: media['klink-woord-schoon'].audio } },
      { id: 'vies', label: 'Vies', audio: { audioId: 'klink-woord-vies', src: media['klink-woord-vies'].audio } },
    ], correctOptionId: 'vies', feedback: 'Luister nog eens. Hoe is de biet?', feedbackAudio: audio('hulp-biet'),
    distractorReason: 'Beide antwoorden beschrijven een toestand van dezelfde biet. Alleen de gehoorde eigenschap maakt het verschil; er staat geen verklappende foto of zin.',
  },
  {
    id: 'begrip-kool', contextId: 'zin-kool', question: 'Wat hoort bij de zin?', questionAudio: audio('vraag-zin'),
    focus: 'combination', objective: 'Begrijpen dat er twee groenten worden genoemd; kool herkennen alleen is onvoldoende.',
    evidence: 'Ik heb kool en biet.', requiredWordIds: ['klink-woord-kool'],
    oralPreparation: ['Bereid kool, biet, en en alleen mondeling voor met echte voorwerpen of bekende beelden. Biet en alleen zijn niet automatisch voorbereid doordat kool in deze leesstap staat.'],
    options: [
      { id: 'beide', label: 'Kool en biet', audio: audio('antwoord-kool-biet') },
      { id: 'alleen', label: 'Alleen kool', audio: audio('antwoord-alleen-kool') },
    ], correctOptionId: 'beide', feedback: 'Luister nog eens. Hoor je één groente, of twee?', feedbackAudio: audio('hulp-kool'),
    distractorReason: 'Beide antwoorden bevatten kool. Het verschil zit in en biet tegenover alleen; één sleutelwoord herkennen volstaat niet.',
  },
];

export function sentenceQuestionFor(contextId: string, preparedWordIds: string[]) {
  const question = sentenceQuestions.find(item => item.contextId === contextId);
  if (!question || !question.requiredWordIds.every(id => preparedWordIds.includes(id))) return;
  if (question.options.some(option => 'image' in option && !option.image.src)) return;
  return question;
}

export function questionFields(question: typeof sentenceQuestions[number]): Partial<PackageExercise> {
  return { questionId: question.id, questionAudio: question.questionAudio, feedbackAudio: question.feedbackAudio,
    options: question.options, answer: { correctOptionIds: [question.correctOptionId] },
    objective: question.objective, comprehensionFocus: question.focus, evidence: question.evidence,
    distractorReason: question.distractorReason, oralPreparation: question.oralPreparation,
    preparedWordIds: question.requiredWordIds, feedback: question.feedback,
    instructionAudio: audio('zinnen-begrijpen'), requiresAudio: true, assessment: 'answer',
    access: 'supported-listening', independentReading: false, humanReview: audioPlan.humanReview,
  };
}
