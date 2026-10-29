import content from '../data/klink-alfa-c-docent.json' with { type: 'json' };
export type Stage = {
  prompt: string;
  model: string;
  display: string;
  audio: string[];
  audioRequired: boolean;
  criteria: string[];
  teacherCue?: string;
};
export type TeacherTask = {
  id: string;
  cell: string;
  title: string;
  kind: string;
  group: string;
  preparation: string[];
  materials: string;
  teacherNote: string;
  stages: Stage[];
  modelAudio?: string[];
  tokens: string[];
  order: number[];
  sourceId: string;
  preparationId: string;
};
export const teacherTasks = content.tasks as TeacherTask[];
export const teacherGroups = content.groups;
export const teacherStorageKey = 'klink.alfa-c.docent.v1';
export type Preparation = {
  learner: string;
  meeting: string;
  lesson: string;
  preparedMeeting: string;
  preparedAt: string;
  timezone: string;
  evidence: string;
  checks: boolean[];
  exposure: string;
  interveningActivity: string;
  paperPresent: boolean;
};
export type Observation = { value: string; evidence: string };
export type TeacherEvent = {
  type:
    | 'audio'
    | 'audio-error'
    | 'help'
    | 'model'
    | 'first'
    | 'retry'
    | 'review';
  at: string;
  stage: number;
  text?: string;
  src?: string;
  tokens?: number[];
  paperRef?: string;
  responseMedium?: 'digital' | 'paper';
  observations?: Record<string, Observation>;
  nextMeeting?: string;
};
export type TeacherSession = {
  id: string;
  taskId: string;
  preparation: Preparation;
  startedAt: string;
  events: TeacherEvent[];
  linkedSessionId?: string;
};
export type TeacherStore = { version: 1; sessions: TeacherSession[] };
export const emptyTeacherStore = (): TeacherStore => ({
  version: 1,
  sessions: [],
});
const present = (value: unknown): value is string =>
  typeof value === 'string' && value.trim().length > 0;
const dateValid = (value: unknown) =>
  typeof value === 'string' && Number.isFinite(Date.parse(value));
export function readTeacherStore(raw: string | null): TeacherStore {
  if (!raw) return emptyTeacherStore();
  const data = JSON.parse(raw);
  if (data?.version !== 1 || !Array.isArray(data.sessions))
    throw Error(
      'Onbekend registratiebestand. Bewaar een kopie voordat je verdergaat.',
    );
  const ids = new Set<string>();
  for (const s of data.sessions) {
    const task = teacherTasks.find((t) => t.id === s.taskId),
      p = s.preparation;
    if (
      !task ||
      !present(s.id) ||
      ids.has(s.id) ||
      !dateValid(s.startedAt) ||
      !p ||
      ![
        'learner',
        'meeting',
        'lesson',
        'preparedMeeting',
        'preparedAt',
        'timezone',
        'evidence',
        'exposure',
        'interveningActivity',
      ].every((k) => typeof p[k] === 'string') ||
      !Array.isArray(p.checks) ||
      p.checks.length !== task.preparation.length ||
      !p.checks.every((x: unknown) => typeof x === 'boolean') ||
      !Array.isArray(s.events)
    )
      throw Error(
        'Registratie kan niet veilig worden gelezen. De opgeslagen gegevens blijven intact.',
      );
    if (
      !dateValid(p.preparedAt) ||
      Date.parse(p.preparedAt) > Date.parse(s.startedAt) ||
      !p.checks.every(Boolean)
    )
      throw Error('Ongeldige voorbereiding; oorspronkelijke opslag behouden.');
    ids.add(s.id);
    const firsts = new Set<number>();
    for (const e of s.events) {
      if (
        ![
          'audio',
          'audio-error',
          'help',
          'model',
          'first',
          'retry',
          'review',
        ].includes(e.type) ||
        !dateValid(e.at) ||
        !Number.isInteger(e.stage) ||
        !task.stages[e.stage] ||
        (e.text !== undefined && typeof e.text !== 'string') ||
        (e.responseMedium !== undefined && !['digital', 'paper'].includes(e.responseMedium)) ||
        (e.tokens !== undefined &&
          (!Array.isArray(e.tokens) ||
            !e.tokens.every((n: unknown) => Number.isInteger(n))))
      )
        throw Error('Ongeldige observatie; oorspronkelijke opslag behouden.');
      if (e.type === 'first') {
        if (
          !present(e.text) ||
          (task.kind === 'recall' &&
            (!e.tokens ||
              e.tokens.length !== task.tokens.length ||
              new Set(e.tokens).size !== task.tokens.length ||
              e.tokens.some((n: number) => n < 0 || n >= task.tokens.length)))
        )
          throw Error(
            'Ongeldige eerste reactie; oorspronkelijke opslag behouden.',
          );
        if (firsts.has(e.stage))
          throw Error(
            'Dubbele eerste poging; oorspronkelijke opslag behouden.',
          );
        firsts.add(e.stage);
      }
      if (
        e.type === 'review' &&
        (!e.observations ||
          !Object.values(e.observations).every(
            (o) =>
              !!o &&
              typeof (o as Observation).value === 'string' &&
              typeof (o as Observation).evidence === 'string',
          ))
      )
        throw Error('Ongeldige beoordeling; oorspronkelijke opslag behouden.');
    }
  }
  return data;
}
export function sessionFor(
  store: TeacherStore,
  task: TeacherTask,
  p: Preparation,
) {
  return store.sessions.find(
    (s) =>
      s.taskId === task.id &&
      s.preparation.learner === p.learner.trim() &&
      s.preparation.meeting === p.meeting.trim(),
  );
}
export function firstResponse(s: TeacherSession, stage: number) {
  return s.events.find((e) => e.stage === stage && e.type === 'first');
}
export function reviewed(s: TeacherSession, stage: number) {
  return s.events.some((e) => e.stage === stage && e.type === 'review');
}
export function paperSource(store: TeacherStore, p: Preparation) {
  return store.sessions.find(
    (s) =>
      s.taskId === 'klink-offline-schrijf-05' &&
      s.preparation.learner === p.learner.trim() &&
      s.preparation.meeting === p.meeting.trim() &&
      (firstResponse(s, 0)?.paperRef || firstResponse(s, 0)?.responseMedium === 'digital'),
  );
}
export function startProblem(
  store: TeacherStore,
  task: TeacherTask,
  p: Preparation,
  now = Date.now(),
): string | undefined {
  if (![p.learner, p.meeting, p.lesson].every(present))
    return 'Vul cursistcode, echte bijeenkomst en lesdoel / lesplan in.';
  if (sessionFor(store, task, p)) return undefined;
  if (
    p.checks.length !== task.preparation.length ||
    !p.checks.every(Boolean) ||
    !present(p.evidence) ||
    !present(p.exposure)
  )
    return 'Bevestig de voorbereiding en beschrijf het bewijs en eerdere hulp / modelblootstelling.';
  if (
    !present(p.preparedMeeting) ||
    !dateValid(p.preparedAt) ||
    !present(p.timezone) ||
    Date.parse(p.preparedAt) > now
  )
    return 'Leg de echte voorbereidende bijeenkomst en een geldig tijdstip met tijdzone vast.';
  if (task.kind === 'combine' && !present(p.interveningActivity))
    return 'Leg het laatste helewoordmodel en de tussenactiviteit vast; onbekend mag, maar bewijst geen onafhankelijke synthese.';
  if (task.kind === 'recall') {
    if (
      p.preparedMeeting.trim() === p.meeting.trim() ||
      now - Date.parse(p.preparedAt) < 86400000
    )
      return 'Herhalen kan pas na minstens 24 uur, in een andere echte bijeenkomst.';
    if (
      store.sessions.filter(
        (s) =>
          s.preparation.learner === p.learner.trim() &&
          s.preparation.meeting === p.meeting.trim() &&
          teacherTasks.find((t) => t.id === s.taskId)?.kind === 'recall',
      ).length >= 4
    )
      return 'Vier herhaaltaken in deze bijeenkomst zijn genoeg. Plan de volgende voor een andere echte bijeenkomst.';
  }
  if (task.kind === 'check') {
    const source = paperSource(store, p);
    if (!source || (firstResponse(source, 0)?.responseMedium !== 'digital' && !p.paperPresent))
      return 'Bewaar eerst het eigen dictee uit dezelfde cursist- en afnamesessie. Bij een papieren dictee moet ook het origineel klaar liggen.';
  }
}
export function startSession(
  store: TeacherStore,
  task: TeacherTask,
  p: Preparation,
  now = new Date().toISOString(),
): TeacherStore {
  const problem = startProblem(store, task, p, Date.parse(now));
  if (problem) throw Error(problem);
  if (sessionFor(store, task, p)) return store;
  return {
    ...store,
    sessions: [
      ...store.sessions,
      {
        id: JSON.stringify([p.learner.trim(), p.meeting.trim(), task.id]),
        taskId: task.id,
        preparation: {
          ...p,
          learner: p.learner.trim(),
          meeting: p.meeting.trim(),
        },
        startedAt: now,
        events:
          task.kind === 'check'
            ? [
                {
                  type: 'model',
                  at: now,
                  stage: 0,
                  text: 'Modelondersteund nakijken van eigen oorspronkelijke antwoord',
                },
              ]
            : [],
        ...(task.kind === 'check'
          ? { linkedSessionId: paperSource(store, p)!.id }
          : {}),
      },
    ],
  };
}
export function appendEvent(
  store: TeacherStore,
  id: string,
  e: TeacherEvent,
): TeacherStore {
  const s = store.sessions.find((s) => s.id === id);
  if (!s) throw Error('Sessie ontbreekt.');
  const task = teacherTasks.find((t) => t.id === s.taskId)!,
    stage = task.stages[e.stage];
  if (!stage || !dateValid(e.at)) throw Error('Ongeldige observatie.');
  if (e.stage > 0 && !reviewed(s, e.stage - 1))
    throw Error('Leg de vorige fase eerst vast.');
  const first = firstResponse(s, e.stage);
  if (e.type === 'model' && !first && task.kind !== 'check')
    throw Error('Bewaar eerst de eigen reactie.');
  if (
    e.type === 'audio' &&
    !stage.audio.includes(e.src ?? '') &&
    !task.modelAudio?.includes(e.src ?? '')
  )
    throw Error('Verkeerde audiokoppeling.');
  if (e.type === 'audio' && !stage.audioRequired && !first)
    throw Error('Modelaudio pas na de eerste reactie.');
  if (e.type === 'first') {
    if (first) throw Error('De eerste reactie blijft ongewijzigd.');
    if (!present(e.text)) throw Error('Leg de werkelijke reactie vast.');
    if (
      stage.audioRequired &&
      !stage.audio.every((src) =>
        s.events.some(
          (x) => x.stage === e.stage && x.type === 'audio' && x.src === src,
        ),
      )
    )
      throw Error('Luister eerst naar de volledige opname.');
    if (
      ['correct', 'word', 'dictation', 'check'].includes(task.kind) &&
      e.responseMedium !== 'digital' && !present(e.paperRef)
    )
      throw Error(
        'Bewaar het oorspronkelijke papier en leg de verwijzing vast.',
      );
    if (
      task.kind === 'recall' &&
      (!e.tokens ||
        e.tokens.length !== task.tokens.length ||
        new Set(e.tokens).size !== task.tokens.length ||
        e.tokens.some(
          (n) => !Number.isInteger(n) || n < 0 || n >= task.tokens.length,
        ))
    )
      throw Error('Gebruik iedere oorspronkelijke tegel precies eenmaal.');
  }
  if (e.type === 'retry' && (!first || !present(e.text)))
    throw Error(
      'Bewaar eerst de eerste reactie en leg daarna de nieuwe reactie vast.',
    );
  if (
    e.type === 'review' &&
    (!first ||
      !e.observations ||
      stage.criteria.some(
        (c) =>
          !['zichtbaar', 'deels', 'nog niet', 'niet beoordeelbaar'].includes(
            e.observations![c]?.value,
          ) || !present(e.observations![c]?.evidence),
      ) ||
      !present(e.nextMeeting))
  )
    throw Error(
      'Noteer per criterium de waarneming (of waarom onbekend) en een vervolgbesluit.',
    );
  return {
    ...store,
    sessions: store.sessions.map((x) =>
      x.id === id ? { ...x, events: [...x.events, e] } : x,
    ),
  };
}
export const normalizeWord = (text: string) =>
  text.normalize('NFC').trim().toLocaleLowerCase('nl');
export function assistance(s: TeacherSession, stage: number) {
  const events = s.events.filter((e) => e.stage === stage),
    sources = events.filter((e) => e.type === 'audio').map((e) => e.src);
  return {
    modelEverShown: events.some((e) => e.type === 'model'),
    helpEverUsed:
      events.some((e) => e.type === 'help' || e.type === 'model') ||
      new Set(sources).size < sources.length,
    replayCount: sources.length - new Set(sources).size,
  };
}
