import { randomBytes } from 'node:crypto';
import { canonical, hash, ROUTES } from '../../lib/inzicht/rules.ts';
import { taalroutePackages } from '../../lib/taalroute-packages.ts';
import { groupExercises } from '../../lib/group-practice.ts';

export async function fixtures() {
  const sql = [];
  const quote = (v) =>
    v === null
      ? 'NULL'
      : typeof v === 'number'
        ? String(v)
        : `'${String(v).replaceAll("'", "''")}'`;
  const insert = (table, values) =>
    sql.push(`INSERT INTO ${table} VALUES (${values.map(quote).join(',')});`);
  const credentials = {};
  const people = [
    'docent',
    'collega',
    'registrar',
    'beheerder',
    'cursist',
    'support',
  ];
  const at = new Date().toISOString();
  for (const user of people) {
    insert('users', [user, `synthetic:${user}`, 'active']);
    const token = randomBytes(32).toString('hex');
    credentials[user] = token;
    insert('inzicht_sessions', [
      await hash(token),
      user,
      new Date(Date.now() + 8 * 3600000).toISOString(),
      0,
    ]);
  }
  for (const [org, name] of [
    ['school-a', 'Fictieve school A'],
    ['school-b', 'Fictieve school B'],
  ]) {
    insert('organizations', [org, name, 'active', canonical(ROUTES), 1]);
    for (const [user, role, create] of [
      ['docent', 'teacher', 1],
      ['collega', 'teacher', 1],
      ['registrar', 'registrar', 0],
      ['beheerder', 'school_admin', 0],
      ['cursist', 'learner', 0],
      ['support', 'support', 0],
    ])
      insert('memberships', [
        `${org}:${user}`,
        org,
        user,
        'active',
        role,
        create,
      ]);
    insert('groups', [
      `${org}:klas`,
      org,
      'Oefengroep',
      'Alfa A',
      'Synthetische proef',
      'active',
      1,
      at,
    ]);
    insert('group_teachers', [org, `${org}:klas`, `${org}:docent`]);
    insert('class_access_policies', [
      org,
      `${org}:klas`,
      '*',
      1,
      canonical(['Alfa A']),
      'free',
    ]);
    const names = [
      'Amina',
      'Daan',
      'Elif',
      'Farid',
      'Gita',
      'Hugo',
      'Ines',
      'Jamal',
      'Lotte',
      'Marek',
      'Noura',
      'Otis',
    ];
    for (const [i, name] of names.entries()) {
      const id = `${org}:leerling-${i + 1}`;
      insert('school_learners', [
        id,
        org,
        `${name} (fictief)`,
        `${org}:docent`,
        at,
      ]);
      insert('group_memberships', [org, `${org}:klas`, id, 'active', at, null]);
    }
  }
  for (const [id, label, domain] of [
    ['woordbeeld', 'Woordbeeld herkennen', 'woorden'],
    ['klank', 'Letter en klank verbinden', 'klanken'],
    ['woordlezen', 'Woordlezen', 'woorden'],
  ])
    insert('skill_definitions', [
      id,
      label,
      domain,
      'Alfa A',
      'draft-1',
      canonical({
        version: 'draft-1',
        minimum_items: 5,
        pass_ratio: 0.8,
        stale_days: null,
      }),
      0,
    ]);
  const pack = taalroutePackages.find((p) =>
    p.words.some((w) => w.id === 'klink-woord-mat'),
  );
  for (const word of ['mat', 'man', 'map']) {
    const exercise = groupExercises(pack, 'same-word').find(
      (e) => e.wordId === `klink-woord-${word}`,
    );
    if (
      !exercise ||
      exercise.componentId !== 'ALF-CMP-002' ||
      !Array.isArray(exercise.answer.correctOptionIds)
    )
      throw new Error('Source exercise contract changed');
    const version = await hash(exercise);
    const metadata = {
      pack: { ...pack, exercises: [], lessons: [] },
      exercise,
      source: 'lib/group-practice.ts:groupExercises',
      base_commit: '9b4e0937dcad82e14e25ebc97e8a4b08b244042f',
      duration_minutes: null,
      measurement_review: 'not-approved',
      synthetic_catalog: true,
    };
    insert('content_versions', [
      `word-${word}`,
      exercise.exerciseId,
      version,
      `Hetzelfde woord: ${word}`,
      'Alfa A',
      'klink',
      'published',
      'woordbeeld',
      'TRAIN',
      `/inzicht/oefenen?content=word-${word}`,
      canonical(metadata),
    ]);
  }
  return { sql: sql.join('\n') + '\n', credentials };
}
