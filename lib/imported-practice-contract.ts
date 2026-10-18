export const importedDomains = ['klanken', 'spelling', 'grammatica', 'teksten', 'gesprekken', 'schrijven', 'herhaling', 'woordpakketten'] as const;
export type ImportedDomain = typeof importedDomains[number];
export const importedLevels = { 'Alfa A': 'alfa-a', 'Alfa B': 'alfa-b', 'Alfa C': 'alfa-c', A1: 'a1', A2: 'a2', B1: 'b1' } as const;
export type ImportedLevel = keyof typeof importedLevels;
export type TeacherPhase = {
  id: string; label: string; learnerText: string[]; instruction: string;
  response: 'oral' | 'paper' | 'text' | 'fields' | 'tiles'; fields: string[];
  interlude?: boolean; tiles?: string[]; correction?: { oldValue: string; activeValue: string };
};
export type TeacherWorkflow = {
  kind: string; phases: TeacherPhase[]; materials: string[]; criteria: string[];
  expected: string; help: string; targetWordIds: string[]; sourceLessonIds: string[];
  countCategory: string; sourceHash: string;
};
export type ContentTask = {
  mode: 'choice' | 'text' | 'teacher'; prompt: string; stimulus: string;
  options: { id: string; text: string }[]; correctOptionIds: string[]; acceptedAnswers: string[];
  feedback: { correct: string; retry: string }; teacherGuidance: string; prerequisites: string[];
  teacherReference?: { correctOptionIds: string[]; acceptedAnswers: string[]; evidence: { quote: string }[]; requiredSemanticSlots: string[]; meaningCheck: string; automaticCorrectness: false; showOnlyAfterInitialResponses: true };
  teacherWorkflow?: TeacherWorkflow;
  initialQuestions?: { id: string; prompt: string }[];
};
export type CandidateItem = ContentTask & {
  id: string; queueCellId: string; level: ImportedLevel; axis: 'literacy' | 'language'; title: string; objective: string;
  sourceIds: string[]; audioRequired: boolean; audioStatus: 'paused' | 'existing' | 'not-required';
  releaseMode: 'teacher-supported' | 'independent' | 'blocked'; blockers: string[]; reviewEvidence: string[];
};
export type ImportedItem = ContentTask & {
  id: string; domain: ImportedDomain; level: ImportedLevel; axis: 'literacy' | 'language'; title: string; objective: string; sourceIds: string[];
};
const object = (value: unknown): value is Record<string, unknown> => Boolean(value && typeof value === 'object' && !Array.isArray(value));
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const strings = (value: unknown): value is string[] => Array.isArray(value) && value.every(text);
const unique = (values: string[]) => new Set(values).size === values.length;

export function contentTaskIssues(value: unknown): string[] {
  if (!object(value)) return ['Taak is geen object.'];
  const issues: string[] = [];
  for (const field of ['prompt', 'stimulus', 'teacherGuidance']) if (!text(value[field])) issues.push(`${field} ontbreekt.`);
  if (!strings(value.prerequisites) || !value.prerequisites.length) issues.push('Concrete voorbereiding ontbreekt.');
  if (!object(value.feedback) || !text(value.feedback.correct) || !text(value.feedback.retry)) issues.push('Gerichte feedback ontbreekt.');
  if (!['choice', 'text', 'teacher'].includes(String(value.mode))) issues.push('Onbekende antwoordvorm.');
  if (!strings(value.correctOptionIds) || !strings(value.acceptedAnswers)) issues.push('Antwoordlijsten ontbreken.');
  if (!Array.isArray(value.options) || !value.options.every(option => object(option) && text(option.id) && text(option.text))) return [...issues, 'Ongeldige antwoordopties.'];
  const options = value.options as ContentTask['options'];
  if (!unique(options.map(option => option.id)) || !unique(options.map(option => option.text.normalize('NFC')))) issues.push('Dubbele antwoordopties.');
  if (value.mode === 'choice' && (!strings(value.correctOptionIds) || !value.correctOptionIds.length || !unique(value.correctOptionIds) || value.correctOptionIds.some(id => !options.some(option => option.id === id)) || options.length < 2)) issues.push('Keuzebeoordeling is onvolledig.');
  if (value.mode === 'text' && (!strings(value.acceptedAnswers) || !value.acceptedAnswers.length || !unique(value.acceptedAnswers.map(answer => answer.normalize('NFC'))))) issues.push('Exacte tekstbeoordeling is onvolledig.');
  if (value.mode !== 'choice' && ((value.mode !== 'teacher' && options.length) || (Array.isArray(value.correctOptionIds) && value.correctOptionIds.length))) issues.push('Keuzeantwoord bij een andere antwoordvorm.');
  if (value.mode === 'teacher' && options.length && !value.teacherReference) issues.push('Docentkeuzes missen een afzonderlijke beoordelingsreferentie.');
  if (value.teacherReference !== undefined) {
    const reference = value.teacherReference;
    if (value.mode !== 'teacher' || !object(reference) || reference.automaticCorrectness !== false || reference.showOnlyAfterInitialResponses !== true || !strings(reference.correctOptionIds) || reference.correctOptionIds.some(id => !options.some(option => option.id === id)) || !strings(reference.acceptedAnswers) || !reference.acceptedAnswers.length || !strings(reference.requiredSemanticSlots) || !text(reference.meaningCheck) || !Array.isArray(reference.evidence) || !reference.evidence.length || !reference.evidence.every(row => object(row) && text(row.quote) && typeof value.stimulus === 'string' && value.stimulus.includes(row.quote))) issues.push('Docentreferentie is onvolledig of wijkt af van de bron.');
  }
  if (value.mode !== 'text' && Array.isArray(value.acceptedAnswers) && value.acceptedAnswers.length) issues.push('Tekstantwoord bij een andere antwoordvorm.');
  if (value.teacherWorkflow !== undefined) {
    const flow = value.teacherWorkflow;
    if (value.mode !== 'teacher' || !object(flow) || !text(flow.kind) || !text(flow.expected) || !text(flow.sourceHash) || !/^[a-f0-9]{64}$/.test(flow.sourceHash) || !strings(flow.materials) || !strings(flow.criteria) || !flow.criteria.length || !strings(flow.targetWordIds) || !strings(flow.sourceLessonIds) || !Array.isArray(flow.phases) || !flow.phases.length || !unique(flow.phases.map(phase=>String(phase?.id))) || !flow.phases.every(phase => object(phase) && text(phase.id) && text(phase.label) && strings(phase.learnerText) && text(phase.instruction) && ['oral','paper','text','fields','tiles'].includes(String(phase.response)) && strings(phase.fields) && unique(phase.fields) && (phase.interlude === undefined || typeof phase.interlude === 'boolean') && (phase.response !== 'fields' || phase.fields.length > 0) && (phase.response !== 'tiles' || strings(phase.tiles) && phase.tiles.length > 0) && (phase.correction === undefined || object(phase.correction) && text(phase.correction.oldValue) && text(phase.correction.activeValue) && phase.correction.oldValue !== phase.correction.activeValue && phase.learnerText.includes(phase.correction.oldValue) && phase.learnerText.includes(phase.correction.activeValue)))) issues.push('Docentwerkvorm mist een uitvoerbare fase, respons of beoordelingsgrond.');
  }
  // This renderer has no media playback. A media placeholder cannot replace the actual source.
  if ([value.prompt, value.stimulus].some(part => typeof part === 'string' && /<\s*(?:img|audio|video)\b|!\[[^\]]*\]\(|\b(?:TODO|TBD)\b/u.test(part))) issues.push('Onuitvoerbare media of tijdelijke tekst.');
  return issues;
}
export function importedItemIssues(value: unknown): string[] {
  const issues = contentTaskIssues(value);
  if (!object(value)) return issues;
  for (const field of ['id', 'title', 'objective']) if (!text(value[field])) issues.push(`${field} ontbreekt.`);
  if (!importedDomains.includes(value.domain as ImportedDomain)) issues.push('Onbekende inhoudslijn.');
  if (!Object.hasOwn(importedLevels, String(value.level))) issues.push('Onbekend niveau.');
  if (value.axis !== (typeof value.level === 'string' && value.level.startsWith('Alfa ') ? 'literacy' : 'language')) issues.push('Verkeerde vaardigheidsas.');
  if (!strings(value.sourceIds) || !value.sourceIds.length) issues.push('Bronverwijzingen ontbreken.');
  return issues;
}

export function candidateItemIssues(value: unknown): string[] {
  const issues = contentTaskIssues(value);
  if (!object(value)) return issues;
  for (const field of ['id', 'queueCellId', 'title', 'objective']) if (!text(value[field])) issues.push(`${field} ontbreekt.`);
  if (!Object.hasOwn(importedLevels, String(value.level))) issues.push('Onbekend niveau.');
  const literacy = typeof value.level === 'string' && value.level.startsWith('Alfa ');
  if (value.axis !== (literacy ? 'literacy' : 'language')) issues.push('Niveau en vaardigheidsas komen niet overeen.');
  for (const field of ['sourceIds', 'reviewEvidence']) if (!strings(value[field]) || !value[field].length) issues.push(`${field} ontbreekt.`);
  if (['audio', 'audioSrc', 'audioId', 'sourceAudio', 'instructionAudio', 'image', 'images', 'media', 'imageRequired', 'requiresAudio', 'normalization', 'grading', 'presentationContract', 'materials'].some(field => Array.isArray(value[field]) ? (value[field] as unknown[]).length > 0 : Boolean(value[field]))) issues.push('Aanvullende media, presentatie of beoordelingsregels vereisen een eigen gecontroleerde aansluiting.');
  if (value.audioRequired !== false) issues.push('Benodigde audio kan niet worden aangesloten tijdens de audiopauze.');
  if (!['paused', 'existing', 'not-required'].includes(String(value.audioStatus))) issues.push('Audiostatus ontbreekt.');
  if (!['teacher-supported', 'independent'].includes(String(value.releaseMode))) issues.push('Uitvoering is niet vrijgegeven.');
  if (!strings(value.blockers) || value.blockers.length) issues.push('Uitvoeringsblokkade staat open.');
  return issues;
}

// Unicode-equivalent characters are identical spelling. Case, punctuation and whitespace remain significant.
export function gradeContentResponse(task: ContentTask, response: string | string[]) {
  if (contentTaskIssues(task).length) return { assessment: 'unavailable' as const, correct: null };
  if (task.mode === 'teacher') return { assessment: 'participation' as const, correct: null };
  if (task.mode === 'text') return { assessment: 'answer' as const, correct: typeof response === 'string' && task.acceptedAnswers.some(answer => answer.normalize('NFC') === response.normalize('NFC')) };
  return { assessment: 'answer' as const, correct: Array.isArray(response) && unique(response) && response.length === task.correctOptionIds.length && task.correctOptionIds.every(id => response.includes(id)) };
}

export function sanitizeImportedItem(item: CandidateItem, domain: ImportedDomain): ImportedItem {
  return { id: item.id, domain, level: item.level, axis: item.axis, title: item.title, objective: item.objective, sourceIds: [...item.sourceIds], mode: item.mode, prompt: item.prompt, stimulus: item.stimulus,
    options: item.options.map(option => ({ id: option.id, text: option.text })), correctOptionIds: [...item.correctOptionIds], acceptedAnswers: [...item.acceptedAnswers],
    feedback: { correct: item.feedback.correct, retry: item.feedback.retry }, teacherGuidance: item.teacherGuidance, prerequisites: [...item.prerequisites],
    ...(item.teacherWorkflow ? { teacherWorkflow: structuredClone(item.teacherWorkflow) } : {}),
    ...(item.teacherReference ? { teacherReference: { correctOptionIds: [...item.teacherReference.correctOptionIds], acceptedAnswers: [...item.teacherReference.acceptedAnswers], evidence: item.teacherReference.evidence.map(row => ({ quote: row.quote })), requiredSemanticSlots: [...item.teacherReference.requiredSemanticSlots], meaningCheck: item.teacherReference.meaningCheck, automaticCorrectness: false as const, showOnlyAfterInitialResponses: true as const } } : {}) };
}
