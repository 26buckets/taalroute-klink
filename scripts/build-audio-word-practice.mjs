import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { groupExercises } from '../lib/group-practice.ts';
import { productionPack } from '../lib/production-practice.ts';
import { isInstructionAudioEnabled, isWithdrawnAudio } from '../lib/audio-policy.ts';

// Reuse complete practical source lists; bridge words and advanced spelling banks stay separate.
const titles = {
  'alfa-c': ['Boodschappen', 'Eten en drinken', 'In huis', 'Kleding', 'Onderweg', 'Tijd en afspraken', 'In de les', 'Op het werk', 'Handelingen', 'Gezondheid', 'Contact', 'Geld', 'Persoonsgegevens', 'Digitaal', 'Familie', 'De weg vinden'],
  a1: ['Persoonsgegevens', 'Begroeten en reageren', 'Familie', 'In huis', 'In de winkel', 'Eten en drinken', 'Onderweg', 'Dagen en tijd', 'Gezondheid', 'Op het werk', 'In de les', 'Telefoon en computer'],
  a2: ['Afspraken maken', 'Werktijden', 'Wonen en onderhoud', 'Zorg', 'Reizen', 'Kopen en ruilen', 'Geldzaken', 'Opleiding'],
  b1: ['Solliciteren', 'Arbeidsvoorwaarden', 'Overleggen', 'Plannen en uitvoeren', 'Dienstverlening', 'Problemen oplossen', 'Zorg en verzekering', 'Gemeente en documenten', 'Inkomen en uitgaven', 'Digitale veiligheid', 'Leren en beoordelen', 'Wonen en omgeving'],
};
const prefix = 'audio-words:';
const index = JSON.parse(readFileSync('data/klink-production-index.json')).filter(row => !row.id.startsWith(prefix));
const instructions = JSON.parse(readFileSync('data/klink-production-instructions.json'));
const instruction = instructions.find(item => item.text === 'Luister. Tik op het woord dat je hoort.');
assert(instruction && isInstructionAudioEnabled(instruction.src) && !isWithdrawnAudio(instruction.src));
assert.equal(instruction.voiceId, 'h6uBOiAjLKklte8hdYio');
const lists = [];
for (const [level, names] of Object.entries(titles)) {
  for (const [offset, title] of names.entries()) {
    const number = String(offset + 1).padStart(2, '0');
    const sourceId = level === 'alfa-c' ? `HMM_C${number}` : `HMM_${level.toUpperCase()}_${number}`;
    const row = index.find(item => item.id === `production:worksheet-heard:${level}:${sourceId}`);
    assert(row, sourceId);
    const source = JSON.parse(readFileSync(`public${row.url}`)).exercises;
    assert.equal(source.length, 12);
    assert.equal(new Set(source.map(item => item.helpWord)).size, 12);
    for (const item of source) {
      assert.equal(item.contentLevel, level);
      assert(item.helpWord && item.wordId && item.meaning && item.prompt?.audio?.src);
      assert(existsSync(`public${item.prompt.audio.src}`));
      assert(!isWithdrawnAudio(item.prompt.audio.src));
    }
    const pack = { ...productionPack(row), id: `${prefix}${sourceId}`, practiceActivities: ['listen', 'hear-match'],
      words: source.map(item => ({ id: item.wordId, word: item.helpWord, meaning: item.meaning, audio: item.prompt.audio.src })) };
    for (const activity of pack.practiceActivities) {
      const id = `${prefix}${activity}:${level}:${sourceId}`;
      const exercises = groupExercises(pack, activity).map((item, position) => {
        const originals = source.filter(word => item.targetWordIds.includes(word.wordId));
        assert(originals.length);
        const exerciseId = `${id}:${String(position + 1).padStart(2, '0')}`;
        return { ...item, exerciseId, sourceExerciseId: exerciseId, contentLevel: level, vocabularyLevels: [level],
          sourceContentIds: originals.map(word => word.exerciseId), sourceDocumentId: originals[0].sourceDocumentId,
          sourceStatus: 'source-reviewed-20261029', combinationReview: 'local-checked-20261030',
          independentReading: false, reviewEligible: false, access: 'supported-listening',
          objective: `woordherkenning:${sourceId}`, instructionAudio: { src: instruction.src, audioId: 'KLINK-INS-f30ca4bc7abf' },
          instructionNeedId: undefined,
          feedback: 'Luister opnieuw. Vergelijk het begin en het einde van de woorden.',
          distractorReason: `Verschillende woorden uit dezelfde voorbereide lijst: ${title}. Bij woordkeuze voorkeur voor overeenkomst in spelling; geen dubbele woordvormen.`,
        };
      });
      assert.equal(exercises.length, activity === 'listen' ? 12 : 4);
      const bytes = JSON.stringify({ id, exercises });
      const hash = createHash('sha256').update(bytes).digest('hex').slice(0, 16);
      const url = `/practice-content/klink-20261029/audio-words-${activity}-${level}-${sourceId}-${hash}.json`;
      writeFileSync(`public${url}`, bytes);
      index.push({ activity, level, help: 'practice', image: null, id, title, url, count: exercises.length });
    }
    lists.push({ level, title, sourceCollection: row.id, sourceUrl: row.url,
      words: source.map(item => ({ word: item.helpWord, sourceId: item.exerciseId, wordId: item.wordId, audio: item.prompt.audio.src })) });
  }
}
assert.equal(lists.length, 48);
writeFileSync('data/klink-production-index.json', JSON.stringify(index));
mkdirSync('docs/audio-words-20261030', { recursive: true });
writeFileSync('docs/audio-words-20261030/lists.json', JSON.stringify({
  date: '2026-10-30', baseCommit: 'a3826557ca3af7c4935c0fd2969d9f8bbb2a8096', status: 'local-development-not-published',
  scope: 'Hoor en kies en Geluid en woord; bestaande woordaudio, spelers en bronlabels.',
  instructionVoiceId: instruction.voiceId,
  levelReview: 'Alfa C: woordbeeldherkenning met herhaalbare audio; A1: dagelijkse basiscontexten; A2: praktische afspraken en voorzieningen; B1: preciezere maatschappelijke en werkcontexten. Geen claim van behaald taal- of leesniveau.',
  excluded: 'A1-brugwoorden en A2/B1-spellingbanken buiten de geselecteerde praktische lijsten. Geen nieuwe media.',
  humanListeningReview: 'open; bestaande opnamen ongewijzigd hergebruikt', lists,
}, null, 2));
console.log(`${lists.length} source lists; 96 collections; 576 choices and 192 matching boards.`);
