import { mkdirSync, writeFileSync } from 'node:fs';
import { chapterCollections } from '../lib/practice-chapters.ts';
import { groupActivities } from '../lib/group-practice.ts';
import { recordingForWord } from '../lib/word-listening.ts';
import { spokenWords } from '../lib/word-listening-text.ts';
import { writingFormLiteralRanges } from '../lib/writing-form.ts';
import assert from 'node:assert/strict';
import { readProductionBank } from './read-production-bank.mjs';

const fields = new Set(['text', 'label', 'title', 'prompt', 'question', 'before', 'after', 'cue', 'model', 'help', 'feedback', 'word', 'example', 'exampleWord', 'sourceModel', 'rule', 'primary', 'correct', 'retry', 'answer', 'teacherGuidance', 'criteria', 'description', 'meaning']);
const words = new Map(), seen = new Set(), loaded = new Map(), formLiteralData = [];
function read(value, field, source, spellingUnits) {
  if (Array.isArray(value)) { for (const item of value) read(item, field, source, spellingUnits); return; }
  if (value && typeof value === 'object') { for (const [key, item] of Object.entries(value)) read(item, key, source, spellingUnits); return; }
  if (typeof value !== 'string' || !fields.has(field) || value.startsWith('/') || /https?:\/\//.test(value)) return;
  const literalRanges = source.sourceForm ? writingFormLiteralRanges(value) : [];
  for (const token of spokenWords(value)) {
    if (field === 'meaning' && spellingUnits?.includes(token.start)) continue;
    if (literalRanges.some(range => token.start >= range.start && token.end <= range.end)) { formLiteralData.push({ ...source, field, token: token.text, start: token.start, end: token.end, text: value }); continue; }
    const entry = words.get(token.key) ?? { word: token.key, source: recordingForWord(token.text) ?? null, occurrences: 0, examples: [] };
    entry.occurrences++;
    if (entry.examples.length < 3 && !entry.examples.some(example => example.text === value)) entry.examples.push({ ...source, field, text: value });
    words.set(token.key, entry);
  }
}
let instances = 0;
const writingPositions = new Set();
for (const activity of groupActivities) for (const collection of chapterCollections(activity.id)) {
  if (collection.contentUrl && !loaded.has(collection.contentUrl)) loaded.set(collection.contentUrl, readProductionBank({ url: collection.contentUrl, id: collection.id, count: collection.exerciseCount }).exercises);
  for (const exercise of collection.contentUrl ? loaded.get(collection.contentUrl) : collection.exercises) {
    instances++;
    if (seen.has(exercise.exerciseId) && !exercise.writingSourceId) continue;
    seen.add(exercise.exerciseId);
    const source = { activity: activity.id, collection: collection.id, exerciseId: exercise.exerciseId, ...(exercise.sourceForm === true ? { sourceForm: true } : {}) };
    const units = exercise.writingSourceId ? exercise.writingHintUnits : undefined;
    read(exercise, '', source, units);
    if (exercise.sourceFreeWriting === true) {
      read(exercise.sourceWritingContext, 'text', source);
      read(exercise.sourceWritingSupport, 'text', source);
      read(exercise.sourceWritingCriteria, 'text', source);
      read(exercise.sourceWritingLabel, 'label', source);
      for (const example of exercise.sourceWritingExamples ?? []) read(example.explanation, 'feedback', source);
    }
    if (exercise.writingSourceId) {
      writingPositions.add(exercise.writingSourceId);
      read(exercise.correctFeedback, 'feedback', source);
      read(exercise.meaningCue, 'cue', source);
      read(exercise.helpWord, 'word', source);
    }
  }
}
const sorted = [...words.values()].sort((a, b) => b.occurrences - a.occurrences || a.word.localeCompare(b.word, 'nl'));
// Exact internal field names and source IDs, retained for editorial provenance rather than learner copy.
const internal = new Set('semanticfollowup false automaticmastery scoreunit independentreadingscoreallowed targettext guessingboundary primaryvssecondary acceptedmeaningvariants acceptedvariants freespellingclaim missing not communicationseparatefromtarget observationlimit oralalternatives requiresteachertargetuseconfirmation supportregressioninvalidatesfadedobservation choiceoractionaloneprovesreading communicationseparatefromtargetword expectedfunctionalevidence expectedrecallword recallconfirmationscope teachersetup assessmentauthority independentreadingobservationpossible readingevidencerequiresobservedunaidedresponse teacher-only-after-attempt writtenenddmaysoundt b1-kern f01 f23 g01 g38 lokaal2 alternativeforms answerfeedbackbeforeresponseinvalidatesobservation dimensionevidencerequired dimensionevidencerule firstfinalresponseonly klink-woord-jas klink-woord-man b1-08 b1-12 excludedclaims g54 notassessed optionalunscoredmeaningconversation teacherconfirmationscope unscoreddiagnostic'.split(' '));
const nativeSoundUnits = sorted.filter(word => !word.source && word.word === 'sj' && word.examples.every(example => example.text === 'sj'));
const missing = sorted.filter(word => !word.source && !internal.has(word.word) && !nativeSoundUnits.includes(word));
const report = { scope: 'All current exercise text fields, including help, feedback and model answers; exact internal source IDs/field names are listed separately. Native sound controls and explicitly marked writing-hint spelling units retain their own function. Source-form numbers, mail addresses, postcodes and group codes stay exact literal data; every excluded occurrence is recorded.', instances, exerciseIds: seen.size, writingSourcePositions: writingPositions.size, uniqueTokens: sorted.length, recordedTokens: sorted.filter(word => word.source).length, sourceOnlyMetadata: sorted.filter(word => !word.source && internal.has(word.word)), nativeSoundUnits, formLiteralData, missing, words: sorted };
const out = process.env.KLINK_WORD_LISTENING_OUTPUT ?? 'work/word-listening';
mkdirSync(out, { recursive: true });
writeFileSync(out + '/source-coverage.json', JSON.stringify(report, null, 2) + '\n');
writeFileSync(out + '/missing-source-words.tsv', 'word\toccurrences\texample\texercise\n' + report.missing.map(row => [row.word, row.occurrences, row.examples[0]?.text, row.examples[0]?.exerciseId].map(value => String(value ?? '').replace(/[\t\n]/g, ' ')).join('\t')).join('\n') + '\n');
console.log(JSON.stringify({ instances, exerciseIds: seen.size, uniqueTokens: sorted.length, recordedTokens: report.recordedTokens, missingCandidates: report.missing.length }));
if (process.argv.includes('--check')) assert.deepEqual(report.missing.map(row => row.word), [], 'Visible source words need exact recordings before publication.');
