// Inventory only: no audio production, curriculum import, approval or publication.
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { taalroutePackages as packs } from '../lib/taalroute-packages.ts';
import { connectedContent } from '../lib/connected-content.ts';
import { klinkContexts } from '../lib/klink-context.ts';
import { resolveRegisteredAudio } from '../lib/audio-register.ts';
import { groupInstructionNeeds } from '../lib/group-practice.ts';
import { extendedInstructionNeeds } from '../lib/extended-practice.ts';
import { isWithdrawnAudio } from '../lib/audio-policy.ts';

const root = resolve(import.meta.dirname, '..');
const json = (file) => JSON.parse(readFileSync(join(root, file), 'utf8'));
const unique = (values) =>
  [...new Set(values)].sort((a, b) => a.localeCompare(b));
const normalized = (text) => text.trim().normalize('NFC');
export const plannedAudioId = (role, text) =>
  `klink-audio-${createHash('sha256')
    .update(`${role}\n${normalized(text)}`)
    .digest('hex')
    .slice(0, 24)}`;

export function buildAudioRegister(inventory) {
  const curriculum = json('data/klink-curriculum.json');
  const media = json('data/klink-media.json');
  const instructions = json('data/klink-instructions.json');
  const comprehension = json('data/klink-comprehension-audio.json');
  const candidates = existsSync(join(root, 'data/klink-audio-candidates.json')) ? json('data/klink-audio-candidates.json').items : [];
  const active = new Map();
  const references = new Map();
  const add = (row) => {
    const prior = active.get(row.id);
    if (prior) {
      assert.equal(
        normalized(prior.text),
        normalized(row.text),
        `Conflicting transcript: ${row.id}`,
      );
      assert.equal(prior.role, row.role, `Conflicting voice role: ${row.id}`);
      assert.equal(prior.src, row.src, `Conflicting file: ${row.id}`);
      for (const key of ['wordIds', 'lessonIds', 'sectionIds'])
        prior[key] = unique([...prior[key], ...(row[key] ?? [])]);
      return;
    }
    const src = resolveRegisteredAudio(row.id, row.text, row.role, row.src);
    const fileExists = src && existsSync(join(root, 'public', src));
    active.set(row.id, {
      wordIds: [],
      lessonIds: [],
      sectionIds: [],
      review: 'Niet opnieuw beoordeeld',
      placement: 'active',
      ...row,
      src: fileExists ? src : undefined,
      status:
        row.status === 'parked'
          ? 'parked'
          : fileExists
            ? 'connected'
            : 'missing',
      ...(src && !fileExists
        ? {
            note: 'De bestandskoppeling bestaat, maar het afleverbestand ontbreekt.',
          }
        : {}),
    });
  };
  const place = (ids) => {
    const found = packs.flatMap((pack) =>
      pack.lessons
        .filter((lesson) =>
          [
            ...(lesson.known ?? []),
            ...(lesson.newWords ?? []),
            ...(lesson.returning ?? []),
          ].some((id) => ids.includes(id)),
        )
        .map((lesson) => ({ pack: pack.id, lesson: lesson.id })),
    );
    return {
      wordIds: ids,
      lessonIds: unique(found.map((item) => item.lesson)),
      sectionIds: unique(found.map((item) => item.pack)),
    };
  };
  for (const item of [...groupInstructionNeeds, ...extendedInstructionNeeds]) add({
    id: item.id, kind: 'instruction', role: 'instruction', text: item.text,
    sectionIds: packs.map(pack => pack.id),
    note: resolveRegisteredAudio(item.id, item.text, 'instruction') ? `Gekoppeld op gebruiksopdracht van Nico: ${item.activities.join(', ')}. Afzonderlijke menselijke luistercontrole niet bevestigd.` : `Nieuwe groepsopdracht: ${item.activities.join(', ')}. Inspreken met de instructiestem; inhoudelijk en metadata controleren vóór koppeling.`,
  });
  for (const item of connectedContent) if (item.discussion) {
    add({ id: `${item.id}:question`, kind: 'instruction', role: 'instruction', text: item.discussion.question, ...place(item.wordIds) });
    for (const [index, text] of [item.discussion.answer, ...item.discussion.distractors].entries()) add({
      id: `${item.id}:answer:${index}`, kind: 'answer', role: 'target', text, ...place(item.wordIds),
    });
  }
  for (const task of json('data/klink-functional-writing.json').items) add({
    id: `${task.id}:prompt`, kind: 'instruction', role: 'instruction', text: task.prompt,
    ...place(connectedContent.find(item => item.id === task.contentId).wordIds),
  });
  for (const word of curriculum.words)
    add({
      id: word.id,
      kind: 'word',
      role: 'target',
      text: word.word,
      src: media[word.id]?.audio,
      ...place([word.id]),
    });
  for (const item of instructions.items)
    add({
      id: item.id,
      kind: 'instruction',
      role: 'instruction',
      text: item.text,
      src: item.src,
      voiceId: instructions.voiceId,
      lessonIds: unique(
        packs.flatMap((pack) =>
          pack.exercises
            .filter((exercise) => item.modes.includes(exercise.mode))
            .map((exercise) => exercise.lessonId)
            .filter(Boolean),
        ),
      ),
      sectionIds: packs
        .filter((pack) =>
          pack.exercises.some((exercise) => item.modes.includes(exercise.mode)),
        )
        .map((pack) => pack.id),
    });
  for (const item of comprehension.items)
    add({
      id: item.id,
      kind: item.role === 'instruction' ? 'instruction' : 'answer',
      role: item.role,
      text: item.text,
      src: item.src,
      voiceId:
        item.role === 'instruction'
          ? comprehension.instructionVoiceId
          : comprehension.targetVoiceId,
    });
  for (const item of connectedContent)
    for (const block of item.blocks) {
      const linked = packs.flatMap((pack) =>
        pack.exercises
          .filter((exercise) => exercise.contextId === item.id)
          .map((exercise) => ({ pack: pack.id, lesson: exercise.lessonId })),
      );
      add({
        id: block.audio.audioId,
        kind: item.kind,
        role: 'target',
        text: block.text,
        src: block.audio.src,
        wordIds: item.wordIds,
        lessonIds: unique(linked.map((item) => item.lesson).filter(Boolean)),
        sectionIds: unique(linked.map((item) => item.pack)),
        note: block.speaker
          ? `Spreker: ${block.speaker}. Bestaande rolverdeling behouden.`
          : undefined,
      });
    }
  for (const item of klinkContexts)
    add({
      id: item.id,
      kind: item.kind,
      role: 'target',
      text: item.text,
      src: item.audio,
      ...place(item.wordIds),
    });
  // These are preparation requirements, not claims that every spelling unit is a separate phoneme.
  for (const unit of unique(
    curriculum.words.flatMap((word) => word.reading.requirements),
  )) {
    const ids = curriculum.words
      .filter((word) => word.reading.requirements.includes(unit))
      .map((word) => word.id);
    add({
      id: `klink-klank-${encodeURIComponent(unit)}`,
      kind: 'sound',
      role: 'sound-model',
      text: unit,
      placement: 'preparation',
      status: unit === 't' ? 'parked' : 'missing',
      ...place(ids),
      note:
        unit === 't'
          ? 'Korte t: rechtstreekse opname gevraagd; eerdere uitspraak afgewezen. Niet automatisch genereren.'
          : 'Uitspraakfunctie en opnameaanwijzing eerst vastleggen. Lees dit label niet letterlijk voor; klank is geen letternaam.',
    });
  }
  // Derive actual use from audio IDs, including question, answer and feedback recordings.
  for (const unit of ['a', 'oo', 'ie']) {
    const candidateSrc = `/package-audio/cp001/aa-l01-aud-sound-${unit}.mp3`;
    const row = active.get(`klink-klank-${unit}`);
    if (row?.status === 'missing' && existsSync(join(root, 'public', candidateSrc))) {
      row.status = 'archive'; row.candidateSrc = candidateSrc;
      row.review = 'Bestaande CP001-klankkandidaat. Uitspraakfunctie en stemherkomst nog controleren; niet vrijgegeven voor de nieuwe klankroute.';
      row.note = 'Het bestand bestaat. Dit bewijst niet dat een zuivere losse klank is ingesproken. De afgekeurde t wordt niet vervangen.';
    }
  }
  const audioIds = (value) => {
    if (!value || typeof value !== 'object') return [];
    return [...(typeof value.audioId === 'string' ? [value.audioId] : []), ...Object.values(value).flatMap(audioIds)];
  };
  const uses = new Map();
  for (const pack of packs) for (const exercise of pack.exercises) for (const id of unique(audioIds(exercise))) {
    assert(active.has(id), `Unregistered audio reference: ${id}`);
    if (!uses.has(id)) uses.set(id, { lessons: new Set(), sections: new Set() });
    if (exercise.lessonId) uses.get(id).lessons.add(exercise.lessonId);
    uses.get(id).sections.add(pack.id);
  }
  for (const row of active.values()) if (row.placement !== 'preparation') {
    row.lessonIds = unique([...row.lessonIds, ...(uses.get(row.id)?.lessons ?? [])]);
    row.sectionIds = unique([...row.sectionIds, ...(uses.get(row.id)?.sections ?? [])]);
    const candidate = candidates.find(item => item.id === row.id && item.text === row.text && item.role === row.role);
    if (row.status === 'missing' && candidate && existsSync(join(root, 'public', candidate.src))) {
      row.status = 'review'; row.candidateSrc = candidate.src; row.voiceId = candidate.voiceId;
      row.review = 'Gegenereerd; technische en metadatacontrole geslaagd; menselijke luisterbeoordeling open.';
    }
    if (isWithdrawnAudio(row.src) || isWithdrawnAudio(row.candidateSrc)) {
      row.status = 'parked'; delete row.src; delete row.candidateSrc;
      row.review = 'Gesproken uitleg uitgezet op opdracht van Nico.';
      row.note = 'Bronopname bewaard voor herstel; niet afspeelbaar of publiek aangeboden. De opdrachtinhoud blijft behouden.';
    }
  }
  const drafts = new Map();
  for (const source of inventory.reviewedAudio) {
    const role =
      source.role === 'instruction_support' ? 'instruction' : 'target';
    const id = plannedAudioId(role, source.script);
    if (!references.has(id)) references.set(id, []);
    references
      .get(id)
      .push({
        package: source.sourcePackage,
        preparedId: source.preparedId,
        archive: source.archive,
        entry: source.entry,
      });
    const prior = drafts.get(id);
    if (prior) {
      if (source.present) prior.status = 'archive';
      continue;
    }
    drafts.set(id, {
      id,
      kind: role === 'instruction' ? 'instruction' : 'prepared-script',
      role,
      text: normalized(source.script),
      status: source.present ? 'archive' : 'missing',
      placement: 'unplaced',
      wordIds: [],
      lessonIds: [],
      sectionIds: [],
      review: 'Selectie, plaatsing en uitspraak nog te beoordelen',
      note: source.present
        ? 'Exacte tekst heeft een archiefkandidaat; stemrol, inhoud en metadata niet hiermee goedgekeurd.'
        : 'Bestaande spreektekst, nog geen generatieopdracht. Eerst selecteren en aan de eigen leesstap koppelen.',
    });
  }
  // If exact text AND role are already connected, reuse that stable recording ID.
  const current = new Map(
    [...active.values()]
      .filter((row) => row.status === 'connected')
      .map((row) => [plannedAudioId(row.role, row.text), row]),
  );
  for (const [id, draft] of drafts) {
    const match = current.get(id);
    if (match) {
      draft.src = match.src;
      draft.status = 'connected';
      draft.existingAudioId = match.id;
      draft.note =
        'Dezelfde tekst en rol zijn al gekoppeld. Hergebruik beoordelen; geen nieuwe opname bestellen.';
    }
  }
  const rows = [...active.values()].sort((a, b) => a.id.localeCompare(b.id));
  const planned = [...drafts.values()].sort((a, b) => a.id.localeCompare(b.id));
  const count = (items) =>
    Object.fromEntries(
      ['connected', 'missing', 'archive', 'parked', 'review'].map((status) => [
        status,
        items.filter((row) => row.status === status).length,
      ]),
    );
  return {
    active: rows,
    planned,
    references: Object.fromEntries(references),
    summary: {
      schemaVersion: 1,
      active: { total: rows.length, ...count(rows) },
      planned: { total: planned.length, ...count(planned) },
      sourceReferences: inventory.reviewedAudio.length,
      sections: packs.map((pack) => ({ id: pack.id, title: pack.title })),
      boundary:
        'Bestand gekoppeld is geen nieuwe luistergoedkeuring. Voorraadspreekteksten zijn nog niet aan de huidige leerroute toegewezen. De voorraad en actieve opnamen overlappen; tel ze niet op als unieke lessen of generatieopdracht.',
    },
  };
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const registry = buildAudioRegister(
    json('outputs/content-inventory-20261017/inventory.json'),
  );
  const target = join(root, 'public/content-register');
  const privateTarget = join(root, 'outputs/content-audio-register-20261017');
  mkdirSync(target, { recursive: true });
  mkdirSync(privateTarget, { recursive: true });
  for (const key of ['active', 'planned', 'summary'])
    writeFileSync(join(target, `${key}.json`), JSON.stringify(registry[key]));
  writeFileSync(
    join(privateTarget, 'source-map.json'),
    JSON.stringify(registry.references),
  );
  console.log(JSON.stringify(registry.summary));
}
